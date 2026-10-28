-- Propuestas (etapa 2a de Partidos): mandar, rechazar, cancelar y vencer. Ver
-- "Propuesta → partido" en docs/decisiones-casos-de-uso.md y
-- docs/diseno-partidos.md. Aceptar (y el partido que nace) llega en la etapa
-- siguiente.
--
-- Se guardan hechos, no estados: una propuesta guarda cuándo se mandó y, si se
-- cerró por una acción, cuándo y por qué. Que esté pendiente o vencida lo
-- calcula `proposal_status` al leer: nadie la marca como vencida.

-- Lo que cierra una propuesta. Solo lo que provoca una acción: vencer no se
-- guarda, se calcula.
create type public.proposal_close_reason as enum (
  'aceptada',
  'rechazada',          -- el receptor
  'cancelada',          -- el emisor
  'franja_sacada',      -- alguno de los dos sacó su franja
  'busqueda_cancelada', -- alguno de los dos canceló su búsqueda
  'anulada'             -- se superpone con un partido que nació
);

-- Los equipos salen de las franjas: `from_slot_id` es la del que propone y
-- `to_slot_id` la del que recibe. `range` es la parte en común de las dos,
-- fija desde que se manda.
create table public.proposals (
  id           uuid primary key default gen_random_uuid(),
  from_slot_id uuid not null references public.search_slots (id),
  to_slot_id   uuid not null references public.search_slots (id),
  range        tstzrange not null check (not isempty(range) and lower_inc(range) and not upper_inc(range)),
  created_at   timestamptz not null default now(),
  closed_at    timestamptz,
  close_reason public.proposal_close_reason,
  -- El partido que nació al aceptarla. La tabla `matches` llega en la etapa
  -- siguiente, que agrega la clave foránea.
  match_id     uuid,
  constraint proposals_closed_with_reason check ((closed_at is null) = (close_reason is null))
);

create index on public.proposals (from_slot_id);
create index on public.proposals (to_slot_id);

-- Cuándo vence: a las 72 h o cuando empieza su rango, lo que llegue primero.
-- El aviso "Te propusieron un partido" dice esta fecha.
create function public.proposal_expires_at(p public.proposals)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select least(p.created_at + interval '72 hours', lower(p.range));
$$;

-- El estado de una propuesta en un momento: lo guardado si se cerró por una
-- acción; si no, `vencida` desde las 72 h o desde que empieza su rango (lo
-- que llegue primero), y `pendiente` antes. Recibe la fila entera y `p_now`,
-- igual que `tournament_status`. (`equipo_bloqueado` llega con las faltas.)
create function public.proposal_status(p public.proposals, p_now timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p.close_reason is not null then p.close_reason::text
    when p_now >= public.proposal_expires_at(p) then 'vencida'
    else 'pendiente'
  end;
$$;

-- El equipo dueño de una franja. `security definer` porque las franjas ajenas
-- no se ven por RLS, y la policy y la vista de propuestas necesitan los dos
-- equipos.
create function public.slot_team_id(p_slot_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.team_id
    from public.search_slots sl
    join public.rival_searches s on s.id = sl.search_id
   where sl.id = p_slot_id;
$$;

revoke execute on function public.slot_team_id(uuid) from public, anon;
grant execute on function public.slot_team_id(uuid) to authenticated;

-- RLS: solo los capitanes de los dos equipos (tabla de visibilidad). Sin
-- policies ni privilegios de escritura: todo pasa por `send_proposal`,
-- `respond_proposal` y `save_rival_search`.
alter table public.proposals enable row level security;

revoke all on public.proposals from anon, authenticated;
grant select on public.proposals to authenticated;

create policy "proposals: los capitanes de los dos equipos"
  on public.proposals for select
  to authenticated
  using (public.is_team_captain(public.slot_team_id(from_slot_id))
      or public.is_team_captain(public.slot_team_id(to_slot_id)));

-- Lo que muestra la pantalla: cada propuesta con sus dos equipos, su estado
-- ahora y cuándo vence. `security_invoker`: respeta la RLS de `proposals`, así
-- que cada capitán ve solo las de sus equipos.
create view public.proposal_details
with (security_invoker = true)
as
  select p.id,
         p.from_slot_id,
         p.to_slot_id,
         p.range,
         p.created_at,
         ft.id        as from_team_id,
         ft.name      as from_team_name,
         ft.crest_url as from_crest_url,
         tt.id        as to_team_id,
         tt.name      as to_team_name,
         tt.crest_url as to_crest_url,
         public.proposal_status(p, now())  as status,
         public.proposal_expires_at(p)     as expires_at
    from public.proposals p
    join public.teams ft on ft.id = public.slot_team_id(p.from_slot_id)
    join public.teams tt on tt.id = public.slot_team_id(p.to_slot_id);

revoke all on public.proposal_details from anon, authenticated;
grant select on public.proposal_details to authenticated;

-- send_proposal: el capitán le propone un partido a un compatible, por la
-- parte en común de su franja y la del rival. Sin rango elegido ni mensaje.
--
-- Rechaza: no ser el capitán, búsqueda propia o del rival que ya no está
-- activa (o franja sacada o empezada), un equipo del mismo capitán, menos de
-- 1 h en común, un equipo que no es compatible y otra propuesta pendiente al
-- mismo rival por el mismo horario. Avisa "Te propusieron un partido" al
-- capitán rival, con el vencimiento.
create function public.send_proposal(p_slot_id uuid, p_rival_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id     uuid := (select auth.uid());
  v_slot        record;
  v_rival_slot  record;
  v_common      tstzrange;
  v_proposal    public.proposals;
begin
  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  select sl.id, sl.range, sl.removed_at, s.id as search_id, s.team_id, s.modality
    into v_slot
    from public.search_slots sl join public.rival_searches s on s.id = sl.search_id
   where sl.id = p_slot_id;

  select sl.id, sl.range, sl.removed_at, s.id as search_id, s.team_id, s.modality
    into v_rival_slot
    from public.search_slots sl join public.rival_searches s on s.id = sl.search_id
   where sl.id = p_rival_slot_id;

  if v_slot.id is null or not public.is_team_captain(v_slot.team_id) then
    raise exception 'Solo el capitán puede proponer partidos';
  end if;

  if v_rival_slot.id is null then
    raise exception 'Ese equipo ya no busca rival en ese horario';
  end if;

  -- Serializa con otro envío, con la edición de las búsquedas y con la
  -- gestión de los dos equipos. Por id, para no trabarse entre dos envíos
  -- cruzados.
  perform 1 from public.teams
   where id in (v_slot.team_id, v_rival_slot.team_id)
   order by id
     for update;

  if exists (select 1 from public.teams where id = v_slot.team_id and dissolved_at is not null)
     or v_slot.removed_at is not null
     or lower(v_slot.range) <= now()
     or public.active_rival_search(v_slot.team_id, v_slot.modality, now()) is distinct from v_slot.search_id then
    raise exception 'Tu búsqueda ya no está activa';
  end if;

  if v_rival_slot.removed_at is not null
     or lower(v_rival_slot.range) <= now()
     or public.active_rival_search(v_rival_slot.team_id, v_rival_slot.modality, now())
          is distinct from v_rival_slot.search_id then
    raise exception 'Ese equipo ya no busca rival en ese horario';
  end if;

  if public.is_team_captain(v_rival_slot.team_id) then
    raise exception 'No podés proponerle un partido a un equipo que capitaneás';
  end if;

  v_common := v_slot.range * v_rival_slot.range;
  if isempty(v_common) or upper(v_common) - lower(v_common) < interval '1 hour' then
    raise exception 'Esas franjas no tienen al menos 1 h en común';
  end if;

  -- El resto de las reglas (modalidad, nivel) son las de los compatibles: se
  -- valida contra la misma función que lee la pantalla.
  if not exists (
    select 1 from public.compatible_rivals(v_slot.search_id) c
     where c.slot_id = p_slot_id and c.rival_slot_id = p_rival_slot_id
  ) then
    raise exception 'Ese equipo no es compatible con tu búsqueda';
  end if;

  if exists (
    select 1 from public.proposals p
     where p.from_slot_id = p_slot_id and p.to_slot_id = p_rival_slot_id
       and public.proposal_status(p, now()) = 'pendiente'
  ) then
    raise exception 'Ya le mandaste una propuesta a ese equipo por ese horario';
  end if;

  insert into public.proposals (from_slot_id, to_slot_id, range)
  values (p_slot_id, p_rival_slot_id, v_common)
  returning * into v_proposal;

  perform public.notify(
    'proposal_received',
    jsonb_build_object(
      'rival_name',  (select name from public.teams where id = v_slot.team_id),
      'range_start', lower(v_common),
      'range_end',   upper(v_common),
      'deadline',    public.proposal_expires_at(v_proposal)),
    array[v_rival_slot.team_id],
    true);

  return v_proposal.id;
end;
$$;

revoke execute on function public.send_proposal(uuid, uuid) from public, anon;
grant execute on function public.send_proposal(uuid, uuid) to authenticated;

-- respond_proposal: la respuesta a una propuesta pendiente.
--
--   - el capitán que la recibe la rechaza (`p_accept` false): aviso
--     "Rechazaron tu propuesta" al capitán que la mandó;
--   - el capitán que la mandó la cancela (`p_accept` false), sin aviso: el
--     otro lado la deja de ver al entrar;
--   - aceptar llega en la etapa siguiente, con el partido.
create function public.respond_proposal(p_proposal_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposal  public.proposals;
  v_from_team uuid;
  v_to_team   uuid;
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

  -- Serializa con el envío, la edición de las búsquedas y la gestión de los
  -- dos equipos; después se relee la propuesta, por si cambió mientras tanto.
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
      raise exception 'Todavía no se pueden aceptar propuestas';
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

revoke execute on function public.respond_proposal(uuid, boolean) from public, anon;
grant execute on function public.respond_proposal(uuid, boolean) to authenticated;

-- cancel_proposals: cierra las propuestas pendientes (enviadas y recibidas)
-- de unas franjas, porque se sacaron o porque se canceló su búsqueda. Avisa
-- "Se canceló tu propuesta" al capitán del otro lado de cada una. Las vencidas
-- o ya cerradas no se tocan. Helper interno: lo llaman `save_rival_search` y,
-- en la etapa siguiente, `dissolve_team`.
create function public.cancel_proposals(
  p_slot_ids uuid[],
  p_reason   public.proposal_close_reason
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_proposal public.proposals;
  v_own_team uuid;
  v_other    uuid;
begin
  for v_proposal in
    select * from public.proposals p
     where (p.from_slot_id = any (p_slot_ids) or p.to_slot_id = any (p_slot_ids))
       and public.proposal_status(p, now()) = 'pendiente'
       for update
  loop
    update public.proposals
       set closed_at = now(), close_reason = p_reason
     where id = v_proposal.id;

    -- El lado cuya franja cae es el que cancela; avisa al otro.
    if v_proposal.from_slot_id = any (p_slot_ids) then
      v_own_team := public.slot_team_id(v_proposal.from_slot_id);
      v_other    := public.slot_team_id(v_proposal.to_slot_id);
    else
      v_own_team := public.slot_team_id(v_proposal.to_slot_id);
      v_other    := public.slot_team_id(v_proposal.from_slot_id);
    end if;

    perform public.notify(
      'proposal_cancelled',
      jsonb_build_object(
        'rival_name',  (select name from public.teams where id = v_own_team),
        'range_start', lower(v_proposal.range),
        'range_end',   upper(v_proposal.range)),
      array[v_other],
      true);
  end loop;
end;
$$;

-- Helper interno: sin `execute` para nadie de la API.
revoke execute on function public.cancel_proposals(uuid[], public.proposal_close_reason)
  from public, anon, authenticated;

-- save_rival_search, ahora con las propuestas: sacar una franja cancela sus
-- propuestas pendientes (`franja_sacada`) y cancelar la búsqueda, las de todas
-- sus franjas (`busqueda_cancelada`). El resto queda igual que en
-- 20261028000003_rival_searches.sql.
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

