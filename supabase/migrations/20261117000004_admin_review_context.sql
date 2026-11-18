-- Solo Administración con segundo factor consulta identidades y comentarios privados.
create function public.admin_account_protected(p_user_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 return exists(select 1 from public.admins where user_id=p_user_id);
end; $$;
create function public.admin_team_review(p_team_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_captain jsonb; v_comments jsonb;
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 select jsonb_build_object('user_id',m.user_id,'name',p.display_name) into v_captain
 from public.team_members m join public.profiles p on p.id=m.user_id where m.team_id=p_team_id and m.is_captain;
 select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) into v_comments from(
 select r.match_id,r.stars,r.comment,r.created_at from public.ratings r
 join public.match_sides s on s.match_id=r.match_id and s.team_id=p_team_id
 where r.team_id<>p_team_id and r.comment is not null order by r.created_at desc limit 50) x;
 return jsonb_build_object('captain',v_captain,'comments',v_comments);
end; $$;
revoke execute on function public.admin_account_protected(uuid),public.admin_team_review(uuid) from public,anon;
grant execute on function public.admin_account_protected(uuid),public.admin_team_review(uuid) to authenticated;

create function public.suspension_active(s public.account_suspensions)
returns boolean language sql stable set search_path='' as $$
 select s.lifted_at is null and s.starts_at<=now() and (s.ends_at is null or s.ends_at>now());
$$;
revoke execute on function public.suspension_active(public.account_suspensions) from public,anon;
grant execute on function public.suspension_active(public.account_suspensions) to authenticated;

-- Contexto acotado de la cuenta elegida para revisar una decisión. No expone
-- contactos, otros integrantes del Plantel ni detalles privados de Partidos.
create function public.admin_user_context(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_teams jsonb; v_tournaments jsonb; v_reports jsonb;
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_teams from(
  select t.id,t.name,m.is_captain,t.dissolved_at from public.team_members m
  join public.teams t on t.id=m.team_id where m.user_id=p_user_id
  order by t.created_at desc,t.id limit 50) x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_tournaments from(
  select id,name from public.tournaments where user_id=p_user_id order by created_at desc,id limit 50) x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_reports from(
  select * from(
   select id,'torneo' as kind,tournament_name as name,created_at,resolution from public.tournament_reports where reporter_id=p_user_id
   union all
   select id,'equipo' as kind,team_name as name,created_at,resolution from public.team_reports where reporter_id=p_user_id
  ) r order by created_at desc,id limit 50) x;
 return jsonb_build_object('teams',v_teams,'tournaments',v_tournaments,'reports',v_reports);
end; $$;
revoke execute on function public.admin_user_context(uuid) from public,anon;
grant execute on function public.admin_user_context(uuid) to authenticated;
