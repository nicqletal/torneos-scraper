-- Coordinación y confirmación previa (etapa 3 de Partidos). Ver "Propuesta →
-- partido" en docs/decisiones-casos-de-uso.md y docs/diseno-partidos.md.
--
-- Se guardan hechos, no estados: la cancha y la hora que cargó un equipo, cuándo
-- las confirmó el otro y cuándo dijo "Vamos" cada lado. **Coordinado** y
-- **Confirmado** no son fases: son datos de `por_jugarse`, leídos de estos
-- hechos.

-- La última cancha y hora cargadas, qué equipo las cargó y cuándo las confirmó
-- el otro. Corregir pisa los tres primeros y borra la confirmación.
alter table public.matches
  add column venue          text check (char_length(venue) between 1 and 120),
  add column venue_start_at timestamptz,
  add column venue_team_id  uuid references public.teams (id),
  add column coordinated_at timestamptz;

-- Hora de inicio: la hora exacta coordinada o, si nunca se coordinó, el inicio
-- del rango. Una hora cargada que el otro todavía no confirmó no cuenta.
create function public.match_start_at(m public.matches)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select case when m.coordinated_at is not null then m.venue_start_at else lower(m.range) end;
$$;

-- El lado del partido que capitanea el usuario, o null. Si un cambio de
-- capitán lo dejó en los dos lados (no se impide, ver "Sin partidos contra uno
-- mismo"), se toma uno fijo. Helper interno de `coordinate_match` y
-- `confirm_going`.
create function public.match_own_side(p_match_id uuid)
returns uuid
language sql
stable
set search_path = ''
as $$
  select s.team_id from public.match_sides s
   where s.match_id = p_match_id and public.is_team_captain(s.team_id)
   order by s.team_id
   limit 1;
$$;

revoke execute on function public.match_own_side(uuid) from public, anon, authenticated;

-- coordinate_match: carga, corrige o confirma la cancha y la hora exacta.
-- Cualquiera de los dos capitanes carga; el otro confirma mandando los mismos
-- valores (el partido queda Coordinado) o corrige mandando otros (y le toca
-- confirmar al primero).
create function public.coordinate_match(p_match_id uuid, p_venue text, p_start_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match    public.matches;
  v_own      uuid;
  v_rival    uuid;
  v_venue    text := btrim(p_venue);
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  -- Serializa con la gestión de los dos equipos (un cambio de capitán), con
  -- la otra coordinación y con el "Vamos" del mismo partido.
  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  -- A quien no es capitán de ninguno de los dos no se le confirma que existe.
  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  if public.match_phase(v_match, now()) <> 'por_jugarse' or now() >= public.match_start_at(v_match) then
    raise exception 'El partido ya empezó';
  end if;

  if v_venue is null or char_length(v_venue) not between 1 and 120 then
    raise exception 'La cancha va de 1 a 120 caracteres';
  end if;

  -- De a 15 minutos, desde el inicio del rango (incluido) hasta su fin
  -- (excluido): en un rango de 20 a 22, de 20:00 a 21:45.
  if p_start_at is null
     or not (v_match.range @> p_start_at)
     or extract(epoch from p_start_at - lower(v_match.range))::numeric % 900 <> 0 then
    raise exception 'La hora va de a 15 minutos, dentro del horario del partido';
  end if;

  if v_match.venue is not distinct from v_venue and v_match.venue_start_at = p_start_at then
    if v_match.coordinated_at is not null then
      raise exception 'El partido ya está coordinado con esa cancha y hora';
    end if;

    if v_match.venue_team_id = v_own then
      raise exception 'Ya cargaste esa cancha y hora: falta que confirme el rival';
    end if;

    -- Los mismos valores que cargó el otro: Coordinado.
    update public.matches set coordinated_at = now() where id = p_match_id;

    perform public.notify(
      'match_coordinated',
      jsonb_build_object(
        'team_a',   (select name from public.teams where id = v_own),
        'team_b',   (select name from public.teams where id = v_rival),
        'venue',    v_venue,
        'start_at', p_start_at),
      array[v_own, v_rival]);
    return;
  end if;

  -- Cargar o corregir (también un partido ya coordinado): le toca confirmar
  -- al otro.
  update public.matches
     set venue = v_venue, venue_start_at = p_start_at, venue_team_id = v_own, coordinated_at = null
   where id = p_match_id;

  perform public.notify(
    'venue_to_confirm',
    jsonb_build_object(
      'rival_name', (select name from public.teams where id = v_own),
      'venue',      v_venue,
      'start_at',   p_start_at),
    array[v_rival],
    true);
end;
$$;

revoke execute on function public.coordinate_match(uuid, text, timestamptz) from public, anon;
grant execute on function public.coordinate_match(uuid, text, timestamptz) to authenticated;

-- Cuándo dijo "Vamos" cada lado. Si los dos lo dijeron, el partido está
-- Confirmado.
alter table public.match_sides add column going_at timestamptz;

-- Cuándo vence el plazo abierto del partido en ese momento, o null. Primera
-- versión: la confirmación previa, abierta desde 24 h antes de la hora de
-- inicio hasta esa hora. Las etapas siguientes suman sus plazos (caída de común
-- acuerdo, resultado) en una versión nueva.
create function public.match_deadline(m public.matches, p_now timestamptz)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select public.match_start_at(m)
   where public.match_phase(m, p_now) = 'por_jugarse'
     and p_now >= public.match_start_at(m) - interval '24 hours'
     and p_now <  public.match_start_at(m);
$$;

-- confirm_going: "Vamos". Solo mientras está abierta la confirmación previa.
-- Sin aviso, a propósito. "No vamos" es tirar el partido (etapa de caídas).
create function public.confirm_going(p_match_id uuid)
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

  -- Serializa con la gestión de los dos equipos y con la coordinación.
  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;

  if public.match_phase(v_match, now()) <> 'por_jugarse' or now() >= public.match_start_at(v_match) then
    raise exception 'El partido ya empezó';
  end if;

  if public.match_deadline(v_match, now()) is null then
    raise exception 'Se confirma desde 24 h antes del partido';
  end if;

  update public.match_sides
     set going_at = coalesce(going_at, now())
   where match_id = p_match_id and team_id = v_own;
end;
$$;

revoke execute on function public.confirm_going(uuid) from public, anon;
grant execute on function public.confirm_going(uuid) to authenticated;

-- match_details, ahora con la coordinación y la confirmación previa. La hora
-- de inicio pasa a ser la coordinada, si la hay. Las columnas nuevas van al
-- final (`create or replace view` no deja cambiar el orden). El resto queda
-- igual que en 20261028000006_matches.sql.
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
         public.match_deadline(m, now()) as deadline
    from public.matches m
    join public.match_sides own   on own.match_id = m.id and public.is_team_member(own.team_id)
    join public.match_sides rival on rival.match_id = m.id and rival.team_id <> own.team_id
    join public.teams ot on ot.id = own.team_id
    join public.teams rt on rt.id = rival.team_id
   order by m.id, public.is_team_captain(own.team_id) desc, own.team_id;
