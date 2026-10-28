-- report_result, ahora el aviso "Cargaron el resultado" dice si no coincide
-- con el que ya cargó quien lo recibe: en ese caso, si siguen distintos, queda
-- Jugado sin resultado (no "queda ese resultado"). El resto queda igual que en
-- 20261028000009_match_results.sql.
create or replace function public.report_result(p_match_id uuid, p_goals_for int, p_goals_against int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_own   uuid;
  v_rival uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  -- Serializa con la gestión de los dos equipos y con la carga del rival.
  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  perform public.match_check_result_open(v_match);

  if p_goals_for is null or p_goals_against is null
     or p_goals_for not between 0 and 99 or p_goals_against not between 0 and 99 then
    raise exception 'Los goles van de 0 a 99';
  end if;

  if exists (select 1 from public.match_sides where match_id = p_match_id and team_id = v_own and no_show_at is not null) then
    raise exception 'Reportaste que no vinieron: no podés cargar el resultado';
  end if;

  update public.match_sides
     set goals_for = p_goals_for, goals_against = p_goals_against, result_at = now()
   where match_id = p_match_id and team_id = v_own;
  update public.matches set last_action_at = now() where id = p_match_id
  returning * into v_match;

  if public.match_in_conflict(v_match) then
    perform public.match_notify_conflict(v_own, v_rival);
    return;
  end if;

  if public.match_results_agree(v_match) then
    perform public.notify(
      'match_played',
      jsonb_build_object(
        'team_a',  (select name from public.teams where id = v_own),
        'goals_a', p_goals_for,
        'goals_b', p_goals_against,
        'team_b',  (select name from public.teams where id = v_rival)),
      array[v_own, v_rival]);
    return;
  end if;

  -- Los goles, vistos desde quien recibe el aviso, y si no coinciden con los
  -- que ya cargó.
  perform public.notify(
    'result_to_confirm',
    jsonb_strip_nulls(jsonb_build_object(
      'rival_name',    (select name from public.teams where id = v_own),
      'goals_for',     p_goals_against,
      'goals_against', p_goals_for,
      'deadline',      public.match_result_deadline(v_match),
      'mismatch',      case when exists (
                         select 1 from public.match_sides
                          where match_id = p_match_id and team_id = v_rival and result_at is not null
                       ) then true end)),
    array[v_rival],
    true);
end;
$$;
