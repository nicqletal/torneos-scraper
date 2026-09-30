-- Cantidad de jugadores de un equipo: es pública (página del equipo),
-- aunque el plantel no lo sea.
--
-- Recibe una fila de teams, así que PostgREST la expone como una columna
-- calculada: supabase.from('teams').select('id, name, player_count').
-- security definer porque cuenta filas de team_members que quien consulta
-- no puede ver; solo devuelve el número, nunca quiénes son.
create function public.player_count(public.teams)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.team_members
  where team_id = $1.id;
$$;
