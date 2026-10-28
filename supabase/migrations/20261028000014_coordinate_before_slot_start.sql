-- Cancha y hora se cargan, confirman o corrigen solo antes del inicio del
-- horario del partido (ver "Coordinación" en docs/decisiones-casos-de-uso.md).
-- Antes se miraba la hora coordinada, y corregir borra `coordinated_at`: en un
-- partido de 20 a 22 coordinado a las 21, corregir a las 20:30 lo dejaba
-- esperando el resultado (la hora de inicio volvía a ser las 20).

create or replace function public.coordinate_match(p_match_id uuid, p_venue text, p_start_at timestamptz)
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

  if now() >= lower(v_match.range) then
    raise exception 'Ya empezó el horario del partido: la cancha y la hora no se cambian';
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
