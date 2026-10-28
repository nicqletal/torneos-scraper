-- La base compartida tiene una tabla `matches` del prototipo de agosto
-- (`tournament_id`, `home_team_id`, `away_team_id`, `home_goals`,
-- `away_goals`, `match_date`, `status`), que nunca se versionó, está vacía y
-- ningún código usa. Ocupa el nombre de la tabla de Partidos de la migración
-- siguiente. Se borra solo si está vacía: si tuviera datos, la migración falla
-- y no toca nada. En una base nueva no existe y no hace nada.
do $$
begin
  if to_regclass('public.matches') is not null then
    if exists (select 1 from public.matches) then
      raise exception 'La tabla vieja public.matches tiene datos: revisarla antes de borrarla';
    end if;
    drop table public.matches;
  end if;
end;
$$;
