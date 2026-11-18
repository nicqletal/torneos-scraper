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
