-- Historial en la página del equipo (etapa 7 de Partidos). Ver "Historial en
-- la página del equipo" en docs/decisiones-casos-de-uso.md y la tabla de
-- Visibilidad.
--
-- Los partidos solo los lee el plantel (RLS), pero el historial es público:
-- lo arman dos funciones `security definer` que devuelven solo lo que se
-- puede mostrar (nunca cancha ni hora), y dos vistas encima, una fila por
-- equipo, para que la página filtre por `team_id`.

-- Los partidos cerrados de un equipo (jugado, caído, en conflicto o con falta),
-- vistos desde su lado. `recency` es el orden por hora de inicio, del más
-- nuevo (1) al más viejo, sin exponer la hora. Los nombres y la zona son los
-- actuales.
create function public.team_match_history_rows(p_team_id uuid)
returns table (
  team_id            uuid,
  team_name          text,
  match_id           uuid,
  recency            bigint,
  played_on          date,
  phase              text,
  rival_team_id      uuid,
  rival_team_name    text,
  rival_zone_name    text,
  goals_for          smallint,
  goals_against      smallint,
  drop_reason        text,
  dropped_by_own     boolean,
  drop_mutual        boolean,
  drop_fault         boolean,
  own_said_no_show   boolean,
  rival_said_no_show boolean,
  absent_own         boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select own.team_id,
         ot.name,
         m.id,
         row_number() over (order by public.match_start_at(m) desc, m.id),
         (public.match_start_at(m) at time zone 'America/Argentina/Buenos_Aires')::date,
         p.phase,
         rival.team_id,
         rt.name,
         rz.name,
         -- El resultado con el que quedó Jugado, desde el lado del dueño.
         score.goals_for,
         score.goals_against,
         m.drop_reason,
         m.dropped_by_team_id = own.team_id,
         m.drop_mutual,
         public.match_drop_fault(m),
         -- Las dos versiones de un conflicto: quién dijo "no vinieron".
         own.no_show_at is not null,
         rival.no_show_at is not null,
         case when p.phase = 'no_presentado' then public.match_no_show_team(m) = own.team_id end
    from public.matches m
    join public.match_sides own   on own.match_id = m.id and own.team_id = p_team_id
    join public.match_sides rival on rival.match_id = m.id and rival.team_id <> own.team_id
    join public.teams ot on ot.id = own.team_id
    join public.teams rt on rt.id = rival.team_id
    join public.zones rz on rz.id = rt.zone_id
    cross join lateral (select public.match_phase(m, now()) as phase) p
    left join lateral public.match_score(m, own.team_id) score on p.phase = 'jugado'
   where p.phase in ('jugado', 'caido', 'en_conflicto', 'no_presentado');
$$;

grant execute on function public.team_match_history_rows(uuid) to anon, authenticated;

-- El contador de todo el historial (no de 90 días) y las estrellas: solo las
-- calificaciones que le pusieron al equipo y ya se revelaron.
create function public.team_record_row(p_team_id uuid)
returns table (
  team_id         uuid,
  played          bigint,
  faults          bigint,
  conflicts       bigint,
  conflict_rivals bigint,
  rating_avg      numeric,
  rating_count    bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p_team_id,
         (select count(*) from public.team_match_history_rows(p_team_id) h where h.phase = 'jugado'),
         (select count(*) from public.team_faults f where f.team_id = p_team_id),
         (select count(*) from public.team_match_history_rows(p_team_id) h where h.phase = 'en_conflicto'),
         (select count(distinct h.rival_team_id) from public.team_match_history_rows(p_team_id) h where h.phase = 'en_conflicto'),
         r.rating_avg,
         r.rating_count
    from (
      select avg(rt.stars) as rating_avg, count(*) as rating_count
        from public.match_sides own
        join public.matches m on m.id = own.match_id
        join public.ratings rt on rt.match_id = m.id and rt.team_id <> own.team_id
       where own.team_id = p_team_id
         and public.match_ratings_revealed(m, now())
    ) r;
$$;

grant execute on function public.team_record_row(uuid) to anon, authenticated;

-- Las vistas públicas: una fila de historial por partido cerrado y equipo, y
-- un contador por equipo. Los equipos ya son públicos; el resto lo filtran las
-- funciones de arriba.
create view public.team_match_history
with (security_invoker = true)
as
  select h.* from public.teams t cross join lateral public.team_match_history_rows(t.id) h;

create view public.team_record
with (security_invoker = true)
as
  select r.* from public.teams t cross join lateral public.team_record_row(t.id) r;

grant select on public.team_match_history, public.team_record to anon, authenticated;
