-- El historial público muestra solo los últimos 5 partidos cerrados (ver
-- "Historial en la página del equipo" en docs/decisiones-casos-de-uso.md). El
-- corte estaba solo en la página: la vista devolvía todo. Ahora lo hace la
-- base, y el historial completo queda interno (lo usa `team_record_row`, que
-- corre como dueño).

revoke execute on function public.team_match_history_rows(uuid) from public, anon, authenticated;

create function public.team_recent_history_rows(p_team_id uuid)
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
  select * from public.team_match_history_rows(p_team_id) h where h.recency <= 5;
$$;

grant execute on function public.team_recent_history_rows(uuid) to anon, authenticated;

create or replace view public.team_match_history
with (security_invoker = true)
as
  select h.* from public.teams t cross join lateral public.team_recent_history_rows(t.id) h;
