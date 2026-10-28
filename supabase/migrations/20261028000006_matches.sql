-- Partido acordado (etapa 2b de Partidos): el receptor acepta una propuesta y
-- nace el partido. Ver "Propuesta → partido" en docs/decisiones-casos-de-uso.md
-- y docs/diseno-partidos.md.
--
-- Igual que las propuestas, se guardan hechos y no estados: el partido guarda
-- su rango y cuándo nació, y la fase la calcula `match_phase` al leer. Las
-- etapas siguientes suman los hechos de la coordinación, la caída y el
-- resultado (columnas nuevas) y las demás fases (una versión nueva de
-- `match_phase`).

-- El partido ocupa siempre el rango de la propuesta aceptada: para la
-- superposición con otros partidos y para el choque de franjas.
create table public.matches (
  id         uuid primary key default gen_random_uuid(),
  range      tstzrange not null check (not isempty(range) and lower_inc(range) and not upper_inc(range)),
  created_at timestamptz not null default now()
);

-- Una fila por equipo y partido. Las etapas siguientes le suman lo que hace
-- cada lado ("Vamos", goles, "no vinieron", "fuimos").
create table public.match_sides (
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id  uuid not null references public.teams (id),
  primary key (match_id, team_id)
);

create index on public.match_sides (team_id);

-- La propuesta aceptada apunta al partido que nació de ella.
alter table public.proposals
  add constraint proposals_match_id_fkey foreign key (match_id) references public.matches (id);

-- La fase de un partido en un momento. Por ahora todo partido está
-- `por_jugarse`: `esperando_resultado`, `jugado`, `caido`, `en_conflicto` y
-- `no_presentado` llegan con sus etapas, en migraciones nuevas. Recibe la fila
-- entera y `p_now`, igual que `proposal_status`.
create function public.match_phase(m public.matches, p_now timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'por_jugarse';
$$;

-- ¿El equipo tiene un partido no caído que se superpone con ese rango? Es lo
-- que define una franja ocupada y lo que impide un partido superpuesto.
-- Helper interno: lo llaman `respond_proposal`, `save_rival_search` y
-- `compatible_rivals`.
create function public.team_has_match_in(p_team_id uuid, p_range tstzrange)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.match_sides s
      join public.matches m on m.id = s.match_id
     where s.team_id = p_team_id
       and m.range && p_range
       and public.match_phase(m, now()) <> 'caido'
  );
$$;

revoke execute on function public.team_has_match_in(uuid, tstzrange) from public, anon, authenticated;

-- ¿El usuario está en el plantel actual de alguno de los dos equipos?
-- `security definer` para que la policy de `match_sides` no se lea a sí misma.
create function public.is_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.match_sides s
      join public.team_members m on m.team_id = s.team_id
     where s.match_id = p_match_id and m.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_match_member(uuid) from public, anon;
grant execute on function public.is_match_member(uuid) to authenticated;

-- RLS: el plantel actual de los dos equipos (tabla de visibilidad). Quien sale
-- del plantel deja de verlo. Sin policies ni privilegios de escritura: el
-- partido nace en `respond_proposal`.
alter table public.matches     enable row level security;
alter table public.match_sides enable row level security;

revoke all on public.matches, public.match_sides from anon, authenticated;
grant select on public.matches, public.match_sides to authenticated;

create policy "matches: el plantel de los dos equipos"
  on public.matches for select
  to authenticated
  using (public.is_match_member(id));

create policy "match_sides: el plantel de los dos equipos"
  on public.match_sides for select
  to authenticated
  using (public.is_match_member(match_id));

-- Lo que muestra la pantalla: cada partido visto desde el equipo propio, con
-- el rival y la fase ahora. Si el usuario está en los dos planteles, una sola
-- fila: la del equipo que capitanea, o si no, cualquiera de los dos.
-- `security_invoker`: respeta la RLS de `matches` y `match_sides`.
create view public.match_details
with (security_invoker = true)
as
  select distinct on (m.id)
         m.id,
         m.range,
         -- Hora de inicio: por ahora, el inicio del rango. Con la coordinación
         -- pasa a ser la hora exacta, si se cargó.
         lower(m.range)               as start_at,
         public.match_phase(m, now()) as phase,
         own.team_id                  as team_id,
         ot.name                      as team_name,
         public.is_team_captain(own.team_id) as is_captain,
         rival.team_id                as rival_team_id,
         rt.name                      as rival_team_name,
         rt.crest_url                 as rival_crest_url
    from public.matches m
    join public.match_sides own   on own.match_id = m.id and public.is_team_member(own.team_id)
    join public.match_sides rival on rival.match_id = m.id and rival.team_id <> own.team_id
    join public.teams ot on ot.id = own.team_id
    join public.teams rt on rt.id = rival.team_id
   order by m.id, public.is_team_captain(own.team_id) desc, own.team_id;

revoke all on public.match_details from anon, authenticated;
grant select on public.match_details to authenticated;

-- respond_proposal, ahora con aceptar: el capitán que la recibe acepta y nace
-- el partido, por el rango de la propuesta. El resto queda igual que en
-- 20261028000004_proposals.sql.
create or replace function public.respond_proposal(p_proposal_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposal  public.proposals;
  v_from_team uuid;
  v_to_team   uuid;
  v_match_id  uuid;
  v_other     public.proposals;
  v_side_a    uuid;
  v_side_b    uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  select * into v_proposal from public.proposals where id = p_proposal_id;
  v_from_team := public.slot_team_id(v_proposal.from_slot_id);
  v_to_team   := public.slot_team_id(v_proposal.to_slot_id);

  -- A quien no es capitán de ninguno de los dos no se le confirma que existe.
  if v_proposal.id is null
     or not (public.is_team_captain(v_from_team) or public.is_team_captain(v_to_team)) then
    raise exception 'No encontramos la propuesta';
  end if;

  -- Serializa con el envío, la edición de las búsquedas, otra aceptación y la
  -- gestión de los dos equipos; después se relee la propuesta, por si cambió
  -- mientras tanto (por ejemplo, la anuló otra aceptación).
  perform 1 from public.teams where id in (v_from_team, v_to_team) order by id for update;
  select * into v_proposal from public.proposals where id = p_proposal_id;

  if public.proposal_status(v_proposal, now()) <> 'pendiente' then
    raise exception 'La propuesta ya no está pendiente';
  end if;

  if public.is_team_captain(v_to_team) then
    if exists (select 1 from public.teams where id = v_to_team and dissolved_at is not null) then
      raise exception 'El equipo está disuelto';
    end if;

    if p_accept then
      if public.team_has_match_in(v_from_team, v_proposal.range)
         or public.team_has_match_in(v_to_team, v_proposal.range) then
        raise exception 'Alguno de los dos equipos ya tiene un partido en ese horario';
      end if;

      insert into public.matches (range) values (v_proposal.range) returning id into v_match_id;
      insert into public.match_sides (match_id, team_id)
      values (v_match_id, v_from_team), (v_match_id, v_to_team);

      update public.proposals
         set closed_at = now(), close_reason = 'aceptada', match_id = v_match_id
       where id = p_proposal_id;

      -- Nunca dos partidos superpuestos: se anulan las propuestas pendientes
      -- de los dos equipos (enviadas y recibidas, de cualquier modalidad) que
      -- se superponen con el partido.
      for v_other in
        select * from public.proposals p
         where p.range && v_proposal.range
           and public.proposal_status(p, now()) = 'pendiente'
           and (public.slot_team_id(p.from_slot_id) in (v_from_team, v_to_team)
                or public.slot_team_id(p.to_slot_id) in (v_from_team, v_to_team))
           for update
      loop
        update public.proposals
           set closed_at = now(), close_reason = 'anulada'
         where id = v_other.id;

        -- Avisa al lado que no juega este partido, nombrando al que sí. Si
        -- los dos lados juegan este partido, no hay aviso: ya les llega
        -- "Partido acordado".
        v_side_a := public.slot_team_id(v_other.from_slot_id);
        v_side_b := public.slot_team_id(v_other.to_slot_id);
        if v_side_a in (v_from_team, v_to_team) and v_side_b in (v_from_team, v_to_team) then
          continue;
        elsif v_side_b in (v_from_team, v_to_team) then
          v_side_a := v_side_b;
          v_side_b := public.slot_team_id(v_other.from_slot_id);
        end if;

        perform public.notify(
          'proposal_annulled',
          jsonb_build_object(
            'rival_name',  (select name from public.teams where id = v_side_a),
            'range_start', lower(v_other.range),
            'range_end',   upper(v_other.range)),
          array[v_side_b],
          true);
      end loop;

      perform public.notify(
        'match_agreed',
        jsonb_build_object(
          'team_a',      (select name from public.teams where id = v_from_team),
          'team_b',      (select name from public.teams where id = v_to_team),
          'range_start', lower(v_proposal.range),
          'range_end',   upper(v_proposal.range)),
        array[v_from_team, v_to_team]);
      return;
    end if;

    update public.proposals
       set closed_at = now(), close_reason = 'rechazada'
     where id = p_proposal_id;

    perform public.notify(
      'proposal_rejected',
      jsonb_build_object(
        'rival_name',  (select name from public.teams where id = v_to_team),
        'range_start', lower(v_proposal.range),
        'range_end',   upper(v_proposal.range)),
      array[v_from_team],
      true);
  else
    if p_accept then
      raise exception 'Solo el equipo que la recibe puede aceptarla';
    end if;

    update public.proposals
       set closed_at = now(), close_reason = 'cancelada'
     where id = p_proposal_id;
  end if;
end;
$$;

-- compatible_rivals, ahora sin franjas ocupadas: las que se superponen con un
-- partido no caído del equipo, propias o del rival, no dan compatibles. Como
-- `send_proposal` valida contra esta función, tampoco reciben propuestas. El
-- resto queda igual que en 20261028000003_rival_searches.sql.
create or replace function public.compatible_rivals(p_search_id uuid)
returns table (
  team_id          uuid,
  team_name        text,
  crest_url        text,
  zone_name        text,
  level            public.team_level,
  slot_id          uuid,
  slot_range       tstzrange,
  rival_slot_id    uuid,
  rival_slot_range tstzrange,
  common_range     tstzrange
)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select s.id, s.team_id, s.modality, t.level, z.id as zone_id, c.id as corridor_id, c.region_id
      from public.rival_searches s
      join public.teams t on t.id = s.team_id
      join public.zones z on z.id = t.zone_id
      join public.corridors c on c.id = z.corridor_id
     where s.id = p_search_id
       and public.is_team_captain(s.team_id)
       and s.id = public.active_rival_search(s.team_id, s.modality, now())
  )
  select rt.id, rt.name, rt.crest_url, rz.name, rt.level,
         ms.id, ms.range, rs_slot.id, rs_slot.range,
         ms.range * rs_slot.range
    from mine
    join public.search_slots ms
      on ms.search_id = mine.id and ms.removed_at is null and lower(ms.range) > now()
     and not public.team_has_match_in(mine.team_id, ms.range)
    join public.rival_searches rs
      on rs.modality = mine.modality and rs.team_id <> mine.team_id
     and rs.id = public.active_rival_search(rs.team_id, rs.modality, now())
    join public.search_slots rs_slot
      on rs_slot.search_id = rs.id and rs_slot.removed_at is null and lower(rs_slot.range) > now()
     and not public.team_has_match_in(rs.team_id, rs_slot.range)
     and upper(ms.range * rs_slot.range) - lower(ms.range * rs_slot.range) >= interval '1 hour'
    join public.teams rt on rt.id = rs.team_id
    join public.zones rz on rz.id = rt.zone_id
    join public.corridors rc on rc.id = rz.corridor_id
   where abs(array_position(enum_range(null::public.team_level), rt.level)
           - array_position(enum_range(null::public.team_level), mine.level)) < 2
     -- Sin partidos contra uno mismo: fuera los equipos que capitanea quien busca.
     and not exists (
       select 1 from public.team_members m
        where m.team_id = rt.id and m.is_captain and m.user_id = (select auth.uid())
     )
   order by case when rz.id = mine.zone_id then 0
                 when rc.id = mine.corridor_id then 1
                 when rc.region_id = mine.region_id then 2
                 else 3 end,
            abs(array_position(enum_range(null::public.team_level), rt.level)
              - array_position(enum_range(null::public.team_level), mine.level)),
            lower(ms.range * rs_slot.range),
            rt.name;
$$;

-- save_rival_search, ahora con los partidos: rechaza una franja nueva que se
-- superpone con un partido acordado del equipo. El bloqueo de `teams` que ya
-- toma la serializa con `respond_proposal`. El resto queda igual que en
-- 20261028000004_proposals.sql.
create or replace function public.save_rival_search(
  p_team_id  uuid,
  p_modality public.sport_modality,
  p_slots    jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id   uuid := (select auth.uid());
  v_today     date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_search_id uuid;
  v_slot      jsonb;
  v_date      date;
  v_from      int;
  v_to        int;
  v_ranges    tstzrange[] := '{}';
  v_removed   uuid[];
begin
  -- Serializa con la gestión y la disolución del equipo, y con otro guardado
  -- del mismo equipo: así no nacen dos búsquedas activas de la misma modalidad.
  perform 1 from public.teams where id = p_team_id for update;

  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede buscar rival';
  end if;

  if exists (select 1 from public.teams where id = p_team_id and dissolved_at is not null) then
    raise exception 'El equipo está disuelto';
  end if;

  if not exists (
    select 1 from public.profile_contacts
     where user_id = v_user_id and whatsapp is not null
  ) then
    raise exception 'Cargá tu WhatsApp en el perfil para buscar rival';
  end if;

  if jsonb_typeof(p_slots) is distinct from 'array' then
    raise exception 'Las franjas no tienen el formato esperado';
  end if;

  -- Arma cada franja y la valida, con los mismos textos que el formulario.
  for v_slot in select * from jsonb_array_elements(p_slots) loop
    begin
      v_date := (v_slot ->> 'date')::date;
      v_from := (v_slot ->> 'from')::int;
      v_to   := (v_slot ->> 'to')::int;
    exception when others then
      raise exception 'Las franjas no tienen el formato esperado';
    end;

    if v_date is null or v_date < v_today or v_date > v_today + 13 then
      raise exception 'Las franjas tienen que ser de los próximos 14 días';
    end if;

    if v_from is null or v_to is null or v_from < 8 or v_to > 24 or v_to - v_from < 1 then
      raise exception 'Cada franja va de 8 a 24, en horas enteras, y dura al menos 1 h';
    end if;

    v_ranges := v_ranges || tstzrange(
      (v_date + make_interval(hours => v_from)) at time zone 'America/Argentina/Buenos_Aires',
      (v_date + make_interval(hours => v_to))   at time zone 'America/Argentina/Buenos_Aires',
      '[)');

    if lower(v_ranges[cardinality(v_ranges)]) <= now() then
      raise exception 'Una franja de hoy tiene que empezar en una hora que todavía no pasó';
    end if;
  end loop;

  v_search_id := public.active_rival_search(p_team_id, p_modality, now());

  -- Conjunto vacío: se cancela la búsqueda. Sus franjas quedan como estaban,
  -- y caen sus propuestas pendientes, con aviso al otro lado.
  if cardinality(v_ranges) = 0 then
    update public.rival_searches set cancelled_at = now() where id = v_search_id;
    perform public.cancel_proposals(
      array(select id from public.search_slots where search_id = v_search_id),
      'busqueda_cancelada');
    return null;
  end if;

  if v_search_id is null then
    insert into public.rival_searches (team_id, modality)
    values (p_team_id, p_modality)
    returning id into v_search_id;
  end if;

  -- Se sacan las franjas que no vinieron y todavía no empezaron, y caen sus
  -- propuestas pendientes, con aviso al otro lado.
  with removed as (
    update public.search_slots
       set removed_at = now()
     where search_id = v_search_id
       and removed_at is null
       and lower(range) > now()
       and range <> all (v_ranges)
    returning id
  )
  select array_agg(id) into v_removed from removed;

  if v_removed is not null then
    perform public.cancel_proposals(v_removed, 'franja_sacada');
  end if;

  -- Una franja nueva no puede pisarse con un partido del equipo, de ninguna
  -- modalidad. Las que ya estaban y quedaron ocupadas se conservan: siguen
  -- viniendo en el conjunto completo.
  if exists (
    select 1 from unnest(v_ranges) as r
     where public.team_has_match_in(p_team_id, r)
       and not exists (
         select 1 from public.search_slots sl
          where sl.search_id = v_search_id and sl.removed_at is null and sl.range = r
       )
  ) then
    raise exception 'Esa franja se pisa con un partido de tu equipo';
  end if;

  -- Se agregan las nuevas; las que ya estaban se conservan con su id.
  begin
    insert into public.search_slots (search_id, range)
    select v_search_id, r
      from unnest(v_ranges) as r
     where not exists (
       select 1 from public.search_slots sl
        where sl.search_id = v_search_id and sl.removed_at is null and sl.range = r
     );
  exception when exclusion_violation or unique_violation then
    raise exception 'Hay franjas que se pisan: cada horario va una sola vez';
  end;

  return v_search_id;
end;
$$;

-- El WhatsApp del capitán actual del rival, para arreglar cancha y hora por
-- fuera. Solo lo pide el capitán actual de uno de los dos equipos, mientras el
-- partido está por jugarse; a cualquier otro le devuelve null, sin confirmar
-- que el partido existe. `security definer` porque los contactos ajenos no se
-- ven por RLS. Siempre el del capitán de ahora: si el rival cambia de
-- capitán, se ve el del nuevo.
create function public.rival_captain_whatsapp(p_match_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select c.whatsapp
    from public.matches m
    join public.match_sides own
      on own.match_id = m.id and public.is_team_captain(own.team_id)
    join public.match_sides rival
      on rival.match_id = m.id and rival.team_id <> own.team_id
    join public.team_members cap
      on cap.team_id = rival.team_id and cap.is_captain
    join public.profile_contacts c on c.user_id = cap.user_id
   where m.id = p_match_id
     and public.match_phase(m, now()) = 'por_jugarse'
   limit 1;
$$;

revoke execute on function public.rival_captain_whatsapp(uuid) from public, anon;
grant execute on function public.rival_captain_whatsapp(uuid) to authenticated;

-- dissolve_team, ahora con los partidos: no se disuelve un equipo con un
-- partido sin terminar, y disolverlo cancela sus búsquedas activas con sus
-- propuestas pendientes (aviso al otro lado, igual que cancelar la búsqueda).
-- El resto queda igual que en 20261014000001_team_dissolve.sql.
create or replace function public.dissolve_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dissolved_at timestamptz;
  v_search_ids   uuid[];
begin
  if (select auth.uid()) is null then raise exception 'Tenés que iniciar sesión'; end if;

  select dissolved_at into v_dissolved_at
    from public.teams where id = p_team_id for update;
  if not found then raise exception 'No se encontró el equipo'; end if;
  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede disolver el equipo';
  end if;
  if v_dissolved_at is not null then raise exception 'El equipo ya está disuelto'; end if;

  -- `esperando_resultado` llega con la etapa del resultado; ya queda escrita.
  if exists (
    select 1 from public.match_sides s join public.matches m on m.id = s.match_id
     where s.team_id = p_team_id
       and public.match_phase(m, now()) in ('por_jugarse', 'esperando_resultado')
  ) then
    raise exception 'Tenés un partido pendiente: tiralo o cerrá el resultado antes de disolver';
  end if;

  update public.teams set dissolved_at = now() where id = p_team_id;
  delete from public.team_invites where team_id = p_team_id;

  with cancelled as (
    update public.rival_searches
       set cancelled_at = now()
     where team_id = p_team_id and cancelled_at is null
    returning id
  )
  select array_agg(id) into v_search_ids from cancelled;

  if v_search_ids is not null then
    perform public.cancel_proposals(
      array(select id from public.search_slots where search_id = any (v_search_ids)),
      'busqueda_cancelada');
  end if;
end;
$$;
