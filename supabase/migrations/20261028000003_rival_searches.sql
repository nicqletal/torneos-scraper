-- Búsqueda de rival y compatibles (etapa 1 de Partidos). Ver "Búsqueda de
-- rival" en docs/decisiones-casos-de-uso.md y docs/diseno-partidos.md.
--
-- Se guardan hechos, no estados: una búsqueda está **activa** si no se canceló,
-- le queda alguna franja que todavía no empezó y su equipo no está disuelto.
-- Nadie la marca como vencida: deja de estar activa sola cuando pasa su última
-- franja. Ninguna de las dos tablas se escribe desde la API: todo pasa por
-- `save_rival_search`.

-- gist sobre (uuid, tstzrange) para el EXCLUDE de franjas: `=` sobre uuid en un
-- índice gist lo da btree_gist.
create extension if not exists btree_gist with schema extensions;

create table public.rival_searches (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams (id),
  -- No cambia al editar: para otra modalidad se publica otra búsqueda.
  modality     public.sport_modality not null,
  created_at   timestamptz not null default now(),
  cancelled_at timestamptz
);

create index on public.rival_searches (team_id);

-- Una franja es un rango [desde, hasta) armado en la RPC desde una fecha y dos
-- horas enteras de Buenos Aires.
--
-- Sacar una franja no borra la fila: marca `removed_at`. Las propuestas de la
-- etapa 2 apuntan a franjas, y una propuesta cancelada porque se sacó su franja
-- tiene que seguir sabiendo de qué horario era.
create table public.search_slots (
  id         uuid primary key default gen_random_uuid(),
  search_id  uuid not null references public.rival_searches (id),
  range      tstzrange not null check (not isempty(range) and lower_inc(range) and not upper_inc(range)),
  removed_at timestamptz,
  -- Dentro de una búsqueda las franjas vigentes no se pisan. Entre búsquedas
  -- de distinta modalidad del mismo equipo sí se puede.
  constraint search_slots_no_overlap
    exclude using gist (search_id with =, range with &&) where (removed_at is null)
);

-- RLS: solo el capitán del equipo dueño (tabla de visibilidad). Sin policies
-- ni privilegios de escritura.
alter table public.rival_searches enable row level security;
alter table public.search_slots   enable row level security;

revoke all on public.rival_searches from anon, authenticated;
revoke all on public.search_slots   from anon, authenticated;
grant select on public.rival_searches to authenticated;
grant select on public.search_slots   to authenticated;

create policy "rival_searches: solo el capitán del equipo"
  on public.rival_searches for select
  to authenticated
  using (public.is_team_captain(team_id));

create policy "search_slots: solo el capitán del equipo"
  on public.search_slots for select
  to authenticated
  using (exists (
    select 1 from public.rival_searches s
     where s.id = search_id and public.is_team_captain(s.team_id)
  ));

-- La búsqueda activa de un equipo en una modalidad, o null. Activa = no
-- cancelada, con alguna franja vigente que todavía no empezó, equipo no
-- disuelto. Recibe `p_now` como `tournament_status`: el estado se calcula al
-- leer. La usa también la pantalla: es `security invoker`, así que por RLS
-- solo le contesta al capitán del equipo (a cualquier otro, null).
create function public.active_rival_search(
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
     and exists (
       select 1 from public.search_slots sl
        where sl.search_id = s.id and sl.removed_at is null and lower(sl.range) > p_now
     )
   order by s.created_at desc
   limit 1;
$$;

revoke execute on function public.active_rival_search(uuid, public.sport_modality, timestamptz) from public, anon;
grant execute on function public.active_rival_search(uuid, public.sport_modality, timestamptz) to authenticated;

-- save_rival_search: crea o edita la búsqueda activa de una modalidad.
--
--   p_slots: el conjunto completo de franjas que quedan, como
--            [{"date": "2026-10-30", "from": 20, "to": 23}, ...], con la fecha
--            y las horas de Buenos Aires. Las que ya estaban se conservan, las
--            nuevas se agregan y las que faltan se sacan. Vacío = cancelar.
--
-- Solo se tocan las franjas que todavía no empezaron: una que ya está en curso
-- no se puede proponer, así que da lo mismo dejarla como está.
--
-- Devuelve el id de la búsqueda, o null si quedó cancelada (o no había nada
-- que cancelar). Las mismas reglas del formulario están en
-- `src/utils/rival-search-form.ts`; acá se repiten porque esta es la que manda.
create function public.save_rival_search(
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

  -- Conjunto vacío: se cancela la búsqueda. Sus franjas quedan como estaban.
  -- (Etapa 2: acá se cancelan sus propuestas pendientes, con aviso.)
  if cardinality(v_ranges) = 0 then
    update public.rival_searches set cancelled_at = now() where id = v_search_id;
    return null;
  end if;

  if v_search_id is null then
    insert into public.rival_searches (team_id, modality)
    values (p_team_id, p_modality)
    returning id into v_search_id;
  end if;

  -- Se sacan las franjas que no vinieron y todavía no empezaron.
  -- (Etapa 2: acá se cancelan sus propuestas pendientes, con aviso.)
  update public.search_slots
     set removed_at = now()
   where search_id = v_search_id
     and removed_at is null
     and lower(range) > now()
     and range <> all (v_ranges);

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

revoke execute on function public.save_rival_search(uuid, public.sport_modality, jsonb) from public, anon;
grant execute on function public.save_rival_search(uuid, public.sport_modality, jsonb) to authenticated;

-- compatible_rivals: los equipos con los que la búsqueda tiene al menos 1 h en
-- común. Una fila por par de franjas (la propia y la del rival) con el horario
-- en común, que es lo que mandaría la propuesta de la etapa 2.
--
-- `security definer` porque lee búsquedas ajenas, que por RLS nadie ve. Por eso
-- solo responde al capitán actual del equipo de una búsqueda activa; a
-- cualquier otro le devuelve vacío, sin confirmar que la búsqueda existe.
--
-- Filtros: misma modalidad, búsqueda del rival activa, franjas vigentes que
-- todavía no empezaron, nada de recreativo contra competitivo (dos escalones
-- de diferencia) y ningún equipo cuyo capitán actual sea el mismo. Como las
-- franjas son de un solo día, pisarse ya es "el mismo día".
--
-- Orden: cercanía (zona, corredor, región, el resto), nivel (el más parecido
-- primero) y presentismo. Las faltas todavía no existen: hasta la etapa 4
-- todos cuentan con 0 y el presentismo no cambia el orden.
create function public.compatible_rivals(p_search_id uuid)
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
    join public.rival_searches rs
      on rs.modality = mine.modality and rs.team_id <> mine.team_id
     and rs.id = public.active_rival_search(rs.team_id, rs.modality, now())
    join public.search_slots rs_slot
      on rs_slot.search_id = rs.id and rs_slot.removed_at is null and lower(rs_slot.range) > now()
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

revoke execute on function public.compatible_rivals(uuid) from public, anon;
grant execute on function public.compatible_rivals(uuid) to authenticated;
