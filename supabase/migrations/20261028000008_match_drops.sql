-- Partido caído y faltas (etapa 4 de Partidos). Ver "Partido caído" y
-- "Presentismo" en docs/decisiones-casos-de-uso.md y docs/diseno-partidos.md.
--
-- Se guardan hechos, no estados: cuándo se tiró el partido, quién, con qué
-- motivo y si fue de común acuerdo, y el pedido de común acuerdo con su
-- respuesta. Que el partido esté caído, que sume una falta y que un equipo
-- esté bloqueado se calcula al leer.

-- La caída: cuándo, con qué motivo, qué equipo lo tiró (o pidió tirarlo, si
-- fue de común acuerdo) y si fue de común acuerdo.
alter table public.matches
  add column dropped_at         timestamptz,
  add column drop_reason        text check (char_length(drop_reason) between 1 and 140),
  add column dropped_by_team_id uuid references public.teams (id),
  add column drop_mutual        boolean not null default false;

-- El pedido de caída de común acuerdo: quién lo pidió, cuándo, con qué motivo,
-- y cuándo y qué respondió el rival. Uno solo por partido.
alter table public.matches
  add column mutual_drop_team_id     uuid references public.teams (id),
  add column mutual_drop_reason      text check (char_length(mutual_drop_reason) between 1 and 140),
  add column mutual_drop_at          timestamptz,
  add column mutual_drop_answered_at timestamptz,
  add column mutual_drop_accepted    boolean;

-- La fase de un partido en un momento, ahora con `caido`: desde que alguien
-- lo tiró. Las demás fases llegan con la etapa del resultado.
create or replace function public.match_phase(m public.matches, p_now timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when m.dropped_at <= p_now then 'caido' else 'por_jugarse' end;
$$;

-- ¿La caída suma una falta al equipo que lo tiró? Sí, si lo tiró solo con
-- menos de 24 h para la hora de inicio. Con 24 h justas, no. De común
-- acuerdo, nunca.
create function public.match_drop_fault(m public.matches)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select m.dropped_at is not null
     and not m.drop_mutual
     and m.dropped_at > public.match_start_at(m) - interval '24 hours';
$$;

-- Las faltas de cada equipo, con la fecha desde la que cuentan para los 90
-- días y el bloqueo. Por ahora, la de tirar el partido con menos de 24 h,
-- desde que lo tiró; la de no presentarse llega con la etapa del resultado.
-- Interna: la leen las funciones de bloqueo y presentismo, no la API.
create view public.team_faults as
  select m.dropped_by_team_id as team_id, m.id as match_id, m.dropped_at as occurred_at
    from public.matches m
   where public.match_drop_fault(m);

revoke all on public.team_faults from anon, authenticated;

-- Lo que comparten tirar, pedir y responder la caída: el partido sigue en pie
-- y todavía no llegó la hora de inicio. Helper interno.
create function public.match_check_before_start(m public.matches)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if public.match_phase(m, now()) = 'caido' then
    raise exception 'El partido ya se cayó';
  end if;
  if public.match_phase(m, now()) <> 'por_jugarse' or now() >= public.match_start_at(m) then
    raise exception 'El partido ya empezó';
  end if;
end;
$$;

revoke execute on function public.match_check_before_start(public.matches) from public, anon, authenticated;

-- drop_match: el capitán tira el partido antes de la hora de inicio, con un
-- motivo. "No vamos" también es esto. Con menos de 24 h para la hora de
-- inicio suma una falta a su equipo (la calcula `match_drop_fault`). Aviso
-- "Se cayó el partido" a los dos planteles, con el motivo y, si suma falta, a
-- quién.
create function public.drop_match(p_match_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match  public.matches;
  v_own    uuid;
  v_rival  uuid;
  v_reason text := btrim(p_reason);
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  -- Serializa con la gestión de los dos equipos y con las demás acciones del
  -- mismo partido.
  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  perform public.match_check_before_start(v_match);

  if v_reason is null or char_length(v_reason) not between 1 and 140 then
    raise exception 'El motivo va de 1 a 140 caracteres';
  end if;

  update public.matches
     set dropped_at = now(), drop_reason = v_reason, dropped_by_team_id = v_own, drop_mutual = false
   where id = p_match_id
  returning * into v_match;

  perform public.notify(
    'match_dropped',
    jsonb_strip_nulls(jsonb_build_object(
      'team_a',          (select name from public.teams where id = v_own),
      'team_b',          (select name from public.teams where id = v_rival),
      'reason',          v_reason,
      'fault_team_name', case when public.match_drop_fault(v_match)
                              then (select name from public.teams where id = v_own) end)),
    array[v_own, v_rival]);
end;
$$;

revoke execute on function public.drop_match(uuid, text) from public, anon;
grant execute on function public.drop_match(uuid, text) to authenticated;

-- request_mutual_drop: con menos de 24 h para la hora de inicio, el capitán
-- pide tirar el partido de común acuerdo, con su motivo. El partido sigue en
-- pie hasta que el rival responda; si nadie responde antes de la hora de
-- inicio, no cambia nada. Un solo pedido por partido: si lo rechazan, el que
-- lo pidió lo puede tirar solo, con la falta. Aviso "Piden tirar el partido de
-- común acuerdo" al capitán rival, con el vencimiento (la hora de inicio).
create function public.request_mutual_drop(p_match_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match  public.matches;
  v_own    uuid;
  v_rival  uuid;
  v_reason text := btrim(p_reason);
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  perform public.match_check_before_start(v_match);

  if now() <= public.match_start_at(v_match) - interval '24 hours' then
    raise exception 'Con más de 24 h se tira sin falta: no hace falta pedirlo de común acuerdo';
  end if;

  if v_match.mutual_drop_at is not null and v_match.mutual_drop_answered_at is null then
    raise exception 'Ya hay un pedido de común acuerdo sin responder';
  end if;
  if v_match.mutual_drop_at is not null then
    raise exception 'Ya se pidió tirarlo de común acuerdo: se puede tirar solo, con la falta';
  end if;

  if v_reason is null or char_length(v_reason) not between 1 and 140 then
    raise exception 'El motivo va de 1 a 140 caracteres';
  end if;

  update public.matches
     set mutual_drop_team_id = v_own, mutual_drop_reason = v_reason, mutual_drop_at = now()
   where id = p_match_id;

  perform public.notify(
    'mutual_drop_requested',
    jsonb_build_object(
      'rival_name', (select name from public.teams where id = v_own),
      'reason',     v_reason,
      'deadline',   public.match_start_at(v_match)),
    array[v_rival],
    true);
end;
$$;

revoke execute on function public.request_mutual_drop(uuid, text) from public, anon;
grant execute on function public.request_mutual_drop(uuid, text) to authenticated;

-- answer_mutual_drop: el capitán rival (el actual, aunque haya cambiado desde
-- el pedido) acepta o rechaza, antes de la hora de inicio. Aceptar tira el
-- partido sin falta para nadie, con el motivo del pedido: aviso "Se cayó de
-- común acuerdo" a los dos planteles. Rechazar lo deja en pie: aviso
-- "Rechazaron tirarlo de común acuerdo" al capitán que lo pidió.
create function public.answer_mutual_drop(p_match_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_own   uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;

  perform public.match_check_before_start(v_match);

  if v_match.mutual_drop_at is null
     or v_match.mutual_drop_answered_at is not null
     or v_match.mutual_drop_team_id = v_own then
    raise exception 'No hay un pedido de común acuerdo para responder';
  end if;

  if p_accept then
    update public.matches
       set mutual_drop_answered_at = now(), mutual_drop_accepted = true,
           dropped_at = now(), drop_reason = v_match.mutual_drop_reason,
           dropped_by_team_id = v_match.mutual_drop_team_id, drop_mutual = true
     where id = p_match_id;

    perform public.notify(
      'mutual_drop_accepted',
      jsonb_build_object(
        'team_a', (select name from public.teams where id = v_match.mutual_drop_team_id),
        'team_b', (select name from public.teams where id = v_own)),
      array[v_match.mutual_drop_team_id, v_own]);
    return;
  end if;

  update public.matches
     set mutual_drop_answered_at = now(), mutual_drop_accepted = false
   where id = p_match_id;

  perform public.notify(
    'mutual_drop_rejected',
    jsonb_build_object('rival_name', (select name from public.teams where id = v_own)),
    array[v_match.mutual_drop_team_id],
    true);
end;
$$;

revoke execute on function public.answer_mutual_drop(uuid, boolean) from public, anon;
grant execute on function public.answer_mutual_drop(uuid, boolean) to authenticated;

-- Faltas en 90 días ----------------------------------------------------------

-- Cuántas faltas tiene el equipo en los 90 días anteriores a `p_now`: el
-- presentismo con el que se ordenan los compatibles. `security definer`
-- porque `team_faults` es interna; la cantidad de faltas es pública.
create function public.team_recent_faults(p_team_id uuid, p_now timestamptz)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.team_faults f
   where f.team_id = p_team_id
     and f.occurred_at <= p_now
     and f.occurred_at > p_now - interval '90 days';
$$;

revoke execute on function public.team_recent_faults(uuid, timestamptz) from public, anon;
grant execute on function public.team_recent_faults(uuid, timestamptz) to authenticated;

-- Hasta cuándo está bloqueado el equipo en `p_now`, o null si no lo está. Cada
-- falta que es la tercera (o más) de los 90 días que terminan en ella bloquea
-- 30 días desde esa falta. Nadie lo marca: se calcula al leer, por eso el
-- bloqueo no avisa.
create function public.team_blocked_until(p_team_id uuid, p_now timestamptz)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select max(f.occurred_at + interval '30 days')
    from public.team_faults f
   where f.team_id = p_team_id
     and f.occurred_at <= p_now
     and f.occurred_at + interval '30 days' > p_now
     and public.team_recent_faults(p_team_id, f.occurred_at) >= 3;
$$;

revoke execute on function public.team_blocked_until(uuid, timestamptz) from public, anon;
grant execute on function public.team_blocked_until(uuid, timestamptz) to authenticated;

-- Rechaza si el equipo está bloqueado por faltas, diciendo hasta cuándo.
-- Helper interno de `save_rival_search` y `send_proposal`.
create function public.check_not_blocked(p_team_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_until timestamptz := public.team_blocked_until(p_team_id, now());
begin
  if v_until is not null then
    raise exception 'El equipo está bloqueado por faltas hasta el %',
      to_char(v_until at time zone 'America/Argentina/Buenos_Aires', 'FMDD/FMMM');
  end if;
end;
$$;

revoke execute on function public.check_not_blocked(uuid) from public, anon, authenticated;

-- proposal_status, ahora con `equipo_bloqueado`: una pendiente se ve cancelada
-- si alguno de los dos equipos está bloqueado por faltas. Deja de ser
-- `immutable` porque lee las faltas. El resto queda igual que en
-- 20261028000004_proposals.sql.
create or replace function public.proposal_status(p public.proposals, p_now timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p.close_reason is not null then p.close_reason::text
    when p_now >= public.proposal_expires_at(p) then 'vencida'
    when public.team_blocked_until(public.slot_team_id(p.from_slot_id), p_now) is not null
      or public.team_blocked_until(public.slot_team_id(p.to_slot_id), p_now) is not null then 'equipo_bloqueado'
    else 'pendiente'
  end;
$$;

-- active_rival_search, ahora sin los equipos bloqueados por faltas: sus
-- búsquedas dejan de estar activas (y vuelven a estarlo al terminar el
-- bloqueo, si les quedan franjas futuras). El resto queda igual que en
-- 20261028000003_rival_searches.sql.
create or replace function public.active_rival_search(
  p_team_id  uuid,
  p_modality public.sport_modality,
  p_now      timestamptz
)
returns uuid
language sql
stable
set search_path = ''
as $$
  select s.id
    from public.rival_searches s
    join public.teams t on t.id = s.team_id
   where s.team_id = p_team_id
     and s.modality = p_modality
     and s.cancelled_at is null
     and t.dissolved_at is null
     and public.team_blocked_until(s.team_id, p_now) is null
     and exists (
       select 1 from public.search_slots sl
        where sl.search_id = s.id and sl.removed_at is null and lower(sl.range) > p_now
     )
   order by s.created_at desc
   limit 1;
$$;

-- save_rival_search, ahora rechaza a un equipo bloqueado por faltas. El resto
-- queda igual que en 20261028000006_matches.sql.
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

  perform public.check_not_blocked(p_team_id);

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

-- send_proposal, ahora rechaza a un equipo bloqueado por faltas (antes de
-- mirar si su búsqueda sigue activa, para decir el motivo). El resto queda
-- igual que en 20261028000004_proposals.sql.
create or replace function public.send_proposal(p_slot_id uuid, p_rival_slot_id uuid)
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

  perform public.check_not_blocked(v_slot.team_id);

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

-- compatible_rivals, ahora con el presentismo: los de 2 faltas en 90 días al
-- final, y después de la cercanía y el nivel, menos faltas primero. El resto
-- queda igual que en 20261028000006_matches.sql.
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
   -- Los de 2 faltas en 90 días van al final; los de 3, bloqueados, ya no
   -- tienen búsqueda activa.
   order by public.team_recent_faults(rt.id, now()) >= 2,
            case when rz.id = mine.zone_id then 0
                 when rc.id = mine.corridor_id then 1
                 when rc.region_id = mine.region_id then 2
                 else 3 end,
            abs(array_position(enum_range(null::public.team_level), rt.level)
              - array_position(enum_range(null::public.team_level), mine.level)),
            -- Presentismo: menos faltas en 90 días primero.
            public.team_recent_faults(rt.id, now()),
            lower(ms.range * rs_slot.range),
            rt.name;
$$;

-- match_details, ahora con la caída y el pedido de común acuerdo. Las columnas
-- nuevas van al final. El resto queda igual que en
-- 20261028000007_match_coordination.sql.
create or replace view public.match_details
with (security_invoker = true)
as
  select distinct on (m.id)
         m.id,
         m.range,
         public.match_start_at(m)     as start_at,
         public.match_phase(m, now()) as phase,
         own.team_id                  as team_id,
         ot.name                      as team_name,
         public.is_team_captain(own.team_id) as is_captain,
         rival.team_id                as rival_team_id,
         rt.name                      as rival_team_name,
         rt.crest_url                 as rival_crest_url,
         -- La última cancha y hora cargadas, y si las cargó el equipo propio
         -- (entonces le toca confirmar al rival) o el rival.
         m.venue,
         m.venue_start_at,
         m.venue_team_id = own.team_id as venue_by_own,
         m.coordinated_at,
         own.going_at,
         rival.going_at               as rival_going_at,
         public.match_deadline(m, now()) as deadline,
         -- La caída: el motivo, si la tiró (o la pidió, de común acuerdo) el
         -- equipo propio, si fue de común acuerdo y si suma falta.
         m.drop_reason,
         m.dropped_by_team_id = own.team_id as dropped_by_own,
         m.drop_mutual,
         public.match_drop_fault(m)   as drop_fault,
         -- El pedido de común acuerdo: el motivo, si lo pidió el equipo propio
         -- y cuándo y qué respondió el otro.
         m.mutual_drop_reason,
         m.mutual_drop_team_id = own.team_id as mutual_drop_by_own,
         m.mutual_drop_answered_at,
         m.mutual_drop_accepted
    from public.matches m
    join public.match_sides own   on own.match_id = m.id and public.is_team_member(own.team_id)
    join public.match_sides rival on rival.match_id = m.id and rival.team_id <> own.team_id
    join public.teams ot on ot.id = own.team_id
    join public.teams rt on rt.id = rival.team_id
   order by m.id, public.is_team_captain(own.team_id) desc, own.team_id;
