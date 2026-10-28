-- Las faltas de cada equipo en un momento. Era una vista que fijaba el
-- `no_presentado` en `now()`, así que `team_recent_faults` y
-- `team_blocked_until` con un `p_now` futuro (o pasado) no contaban la falta
-- por no presentarse que ya habría sido firme en ese momento. Ahora es una
-- función de `p_now` y las que reciben `p_now` se lo pasan.

-- Faltas firmes en `p_now`: tirar el partido con menos de 24 h, desde que lo
-- tiró, y no presentarse, desde que vencieron las 48 h. Corre con los permisos
-- de quien la llama (no es `security definer`), pero nadie de la API puede
-- llamarla: la protege el `revoke`. La usan solo funciones `security definer`
-- (bloqueo, presentismo y el contador del historial), que ven todos los
-- partidos.
create function public.team_faults(p_now timestamptz)
returns table (team_id uuid, match_id uuid, occurred_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select m.dropped_by_team_id, m.id, m.dropped_at
    from public.matches m
   where public.match_drop_fault(m)
  union all
  select public.match_no_show_team(m), m.id, public.match_result_deadline(m)
    from public.matches m
   where public.match_phase(m, p_now) = 'no_presentado';
$$;

revoke execute on function public.team_faults(timestamptz) from public, anon, authenticated;

-- Iguales que en 20261028000008_match_drops.sql, salvo que leen las faltas en
-- `p_now`.
create or replace function public.team_recent_faults(p_team_id uuid, p_now timestamptz)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.team_faults(p_now) f
   where f.team_id = p_team_id
     and f.occurred_at <= p_now
     and f.occurred_at > p_now - interval '90 days';
$$;

create or replace function public.team_blocked_until(p_team_id uuid, p_now timestamptz)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select max(f.occurred_at + interval '30 days')
    from public.team_faults(p_now) f
   where f.team_id = p_team_id
     and f.occurred_at <= p_now
     and f.occurred_at + interval '30 days' > p_now
     and public.team_recent_faults(p_team_id, f.occurred_at) >= 3;
$$;

-- Igual que en 20261028000012_team_history.sql: el contador de faltas es de
-- hoy.
create or replace function public.team_record_row(p_team_id uuid)
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
         (select count(*) from public.team_faults(now()) f where f.team_id = p_team_id),
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

drop view public.team_faults;
