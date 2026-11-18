-- Acceso administrativo: AAL2 y rol se comprueban también en cada RPC y policy.
create table public.site_settings (
  id boolean primary key default true check(id),
  support_email text not null default '',
  help_title text not null default 'Ayuda y contacto' check(char_length(help_title) between 1 and 100),
  help_text text not null default '' check(char_length(help_text)<=2000),
  help_url text not null default '' check(help_url='' or help_url ~ '^https://[^[:space:]]+$'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
insert into public.site_settings(id) values(true);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon,authenticated;
grant select on public.site_settings to authenticated;
create policy "site_settings: administración verificada" on public.site_settings for select to authenticated
using ((select public.is_verified_admin()));

-- Se exponen solamente los datos de ayuda públicos, nunca el actor de edición.
create function public.public_site_settings()
returns table(support_email text,help_title text,help_text text,help_url text)
language sql stable security definer set search_path='' as $$
select support_email,help_title,help_text,help_url from public.site_settings where id;
$$;
revoke execute on function public.public_site_settings() from public;
grant execute on function public.public_site_settings() to anon,authenticated;

create function public.update_site_settings(p_email text,p_title text,p_text text,p_url text,p_updated_at timestamptz)
returns void language plpgsql security definer set search_path='' as $$
declare v_old public.site_settings;
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 if p_email is null or char_length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 or char_length(btrim(coalesce(p_title,''))) not between 1 and 100 or char_length(coalesce(p_text,''))>2000
 or p_url is null or char_length(p_url)>2048 or (p_url<>'' and p_url !~ '^https://[^[:space:]]+$') then
 raise exception 'Revisá el correo, el título y el enlace HTTPS de ayuda' using errcode='22023'; end if;
 select * into v_old from public.site_settings where id for update;
 if v_old.updated_at is distinct from p_updated_at then raise exception 'Otra persona cambió la configuración. Recargá antes de guardar' using errcode='40001'; end if;
 update public.site_settings set support_email=btrim(p_email),help_title=btrim(p_title),help_text=btrim(p_text),help_url=btrim(p_url),updated_at=clock_timestamp(),updated_by=auth.uid() where id;
 insert into public.admin_actions(actor_id,action,resource_type,resource_label,metadata)
 values(auth.uid(),'configuracion_actualizada','configuracion','Ayuda y contacto',jsonb_build_object('before',jsonb_build_object('email',v_old.support_email,'title',v_old.help_title,'text',v_old.help_text,'url',v_old.help_url),'after',jsonb_build_object('email',btrim(p_email),'title',btrim(p_title),'text',btrim(p_text),'url',btrim(p_url))));
end; $$;

create table public.account_suspensions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id),
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 reason text not null check(char_length(reason) between 3 and 500),
 created_by uuid not null references public.profiles(id),
 lifted_at timestamptz,
 lifted_by uuid references public.profiles(id),
 lift_reason text check(char_length(lift_reason) between 3 and 500),
 check(ends_at is null or ends_at>starts_at),
 check((lifted_at is null and lifted_by is null and lift_reason is null) or (lifted_at is not null and lifted_by is not null and lift_reason is not null))
);
create index on public.account_suspensions(user_id,starts_at desc);
alter table public.account_suspensions enable row level security;
revoke all on public.account_suspensions from anon,authenticated;
grant select on public.account_suspensions to authenticated;
create policy "suspensions: titular o administración verificada" on public.account_suspensions for select to authenticated
using(user_id=(select auth.uid()) or (select public.is_verified_admin()));

-- Helper interno: no permite consultar sanciones de cuentas ajenas desde la API.
create function public.account_is_suspended(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.account_suspensions where user_id=p_user and lifted_at is null and starts_at<=now() and (ends_at is null or ends_at>now()));
$$;
revoke execute on function public.account_is_suspended(uuid) from public,anon,authenticated;

create table public.team_reports (
 id uuid primary key default gen_random_uuid(),
 team_id uuid references public.teams(id) on delete set null,
 team_name text not null,
 reporter_id uuid not null references public.profiles(id),
 reason text not null check(reason in('violencia','cuenta_falsa','abuso_calificaciones')),
 detail text check(char_length(detail)<=500),
 created_at timestamptz not null default now(),
 resolution text check(resolution in('descartado','suspension')),
 resolved_at timestamptz,
 resolved_by uuid references public.profiles(id),
 responsible_user_id uuid references public.profiles(id),
 suspension_id uuid references public.account_suspensions(id),
 check((resolution is null and resolved_at is null and resolved_by is null) or (resolution is not null and resolved_at is not null and resolved_by is not null))
);
create unique index team_reports_pending_once on public.team_reports(reporter_id,team_id) where resolution is null;
create index on public.team_reports(created_at desc,id);
alter table public.team_reports enable row level security;
revoke all on public.team_reports from anon,authenticated;
grant select on public.team_reports to authenticated;
create policy "team_reports: autor o administración verificada" on public.team_reports for select to authenticated
using(reporter_id=(select auth.uid()) or (select public.is_verified_admin()));

create function public.can_report_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.match_sides own_side
 join public.team_members member on member.team_id=own_side.team_id and member.user_id=auth.uid()
 join public.match_sides rival_side on rival_side.match_id=own_side.match_id and rival_side.team_id<>own_side.team_id
 join public.matches m on m.id=own_side.match_id
 where rival_side.team_id=p_team_id and public.match_phase(m,now())='jugado');
$$;
revoke execute on function public.can_report_team(uuid) from public,anon;
grant execute on function public.can_report_team(uuid) to authenticated;

create function public.report_team(p_team_id uuid,p_reason text,p_detail text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.can_report_team(p_team_id) then raise exception 'Para reportar, tenés que integrar un Equipo con un Partido Jugado contra este rival' using errcode='42501'; end if;
 if p_reason is null or p_reason not in('violencia','cuenta_falsa','abuso_calificaciones') or char_length(coalesce(p_detail,''))>500 then raise exception 'Reporte inválido' using errcode='22023'; end if;
 insert into public.team_reports(team_id,team_name,reporter_id,reason,detail)
 select id,name,auth.uid(),p_reason,nullif(btrim(p_detail),'') from public.teams where id=p_team_id returning id into v_id;
 if v_id is null then raise exception 'Equipo no disponible'; end if;
 return v_id;
end; $$;

-- Caídas administrativas no generan Faltas, aunque falten menos de 24 horas.
alter table public.matches add column administrative_drop boolean not null default false;
create or replace function public.match_drop_fault(m public.matches)
returns boolean language sql immutable set search_path='' as $$
 select m.dropped_at is not null and not m.drop_mutual and not m.administrative_drop
 and m.dropped_at>public.match_start_at(m)-interval '24 hours';
$$;

create function public.suspend_account(p_user_id uuid,p_days integer,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_teams uuid[]; v_match public.matches; v_team uuid; v_search uuid[]; v_email text; v_name text;
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 if p_days is not null and p_days not in(7,30) or char_length(btrim(coalesce(p_reason,''))) not between 3 and 500 then raise exception 'Indicá duración válida y un motivo de 3 a 500 caracteres' using errcode='22023'; end if;
 -- Mismo orden que las RPC de Partidos: primero Equipos, luego perfiles.
 perform 1 from public.teams where id in(select team_id from public.team_members where user_id=p_user_id and is_captain) order by id for update;
 select display_name into v_name from public.profiles where id=p_user_id for no key update;
 if v_name is null then raise exception 'Cuenta no disponible'; end if;
 if exists(select 1 from public.admins where user_id=p_user_id) then raise exception 'Las cuentas administrativas no se suspenden desde el panel' using errcode='42501'; end if;
 if public.account_is_suspended(p_user_id) then raise exception 'Levantá la Suspensión vigente antes de aplicar una nueva'; end if;
 select support_email into v_email from public.site_settings where id;
 if coalesce(v_email,'')='' then raise exception 'Configurá el correo de contacto antes de suspender una cuenta'; end if;
 insert into public.account_suspensions(user_id,ends_at,reason,created_by)
 values(p_user_id,case when p_days is null then null else now()+make_interval(days=>p_days) end,btrim(p_reason),auth.uid()) returning id into v_id;
 select coalesce(array_agg(team_id),'{}'::uuid[]) into v_teams from public.team_members where user_id=p_user_id and is_captain;
 with cancelled as(update public.rival_searches set cancelled_at=now() where team_id=any(v_teams) and cancelled_at is null returning id)
 select array_agg(id) into v_search from cancelled;
 if v_search is not null then perform public.cancel_proposals(array(select id from public.search_slots where search_id=any(v_search)),'busqueda_cancelada'); end if;
 for v_match in select m.* from public.matches m where exists(select 1 from public.match_sides s where s.match_id=m.id and s.team_id=any(v_teams))
 and public.match_phase(m,now())='por_jugarse' and public.match_start_at(m)>now() order by m.id for update loop
 select team_id into v_team from public.match_sides where match_id=v_match.id and team_id=any(v_teams) order by team_id limit 1;
 update public.matches set dropped_at=now(),drop_reason='Equipo suspendido',dropped_by_team_id=v_team,administrative_drop=true where id=v_match.id;
 perform public.notify('match_dropped',jsonb_build_object('team_a',(select name from public.teams where id=v_team),'team_b',(select t.name from public.match_sides s join public.teams t on t.id=s.team_id where s.match_id=v_match.id and s.team_id<>v_team limit 1),'reason','Equipo suspendido'),array(select team_id from public.match_sides where match_id=v_match.id));
 end loop;
 insert into public.notices(user_id,kind,params) values(p_user_id,'admin_message',jsonb_build_object('body','Tu cuenta recibió una Suspensión '||case when p_days is null then 'indefinida' else 'de '||p_days||' días' end||'. Motivo: '||btrim(p_reason)||'. Contacto: '||v_email,'href','/perfil'));
 insert into public.admin_actions(actor_id,action,resource_type,resource_id,resource_label,note,metadata)
 values(auth.uid(),'suspender_cuenta','cuenta',p_user_id,v_name,btrim(p_reason),jsonb_build_object('suspension_id',v_id,'days',p_days));
 return v_id;
end; $$;

create function public.lift_suspension(p_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_row public.account_suspensions;
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 if char_length(btrim(coalesce(p_reason,''))) not between 3 and 500 then raise exception 'Indicá un motivo de 3 a 500 caracteres'; end if;
 select user_id into v_user from public.account_suspensions where id=p_id;
 perform 1 from public.profiles where id=v_user for no key update;
 select * into v_row from public.account_suspensions where id=p_id for update;
 if v_row.id is null or v_row.lifted_at is not null or (v_row.ends_at is not null and v_row.ends_at<=now()) then raise exception 'La Suspensión ya no está vigente'; end if;
 update public.account_suspensions set lifted_at=now(),lifted_by=auth.uid(),lift_reason=btrim(p_reason) where id=p_id;
 insert into public.admin_actions(actor_id,action,resource_type,resource_id,resource_label,note)
 values(auth.uid(),'levantar_suspension','cuenta',v_user,(select display_name from public.profiles where id=v_user),btrim(p_reason));
 insert into public.notices(user_id,kind,params) values(v_user,'admin_message',jsonb_build_object('body','Se levantó la Suspensión de tu cuenta. Motivo: '||btrim(p_reason),'href','/perfil'));
end; $$;

create function public.resolve_team_report(p_report_id uuid,p_action text,p_responsible uuid default null,p_days integer default null,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_report public.team_reports; v_suspension uuid;
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 if p_action is null or p_action not in('descartado','suspension') then raise exception 'Resolución inválida'; end if;
 -- Se bloquea el reporte sin bloquear al nuevo Capitán: la responsabilidad es explícita.
 select * into v_report from public.team_reports where id=p_report_id for update;
 if v_report.id is null or v_report.resolution is not null then raise exception 'Reporte ya resuelto o no disponible'; end if;
 if p_action='suspension' then
 if p_responsible is null then raise exception 'Identificá la cuenta responsable'; end if;
 v_suspension:=public.suspend_account(p_responsible,p_days,p_reason);
 end if;
 update public.team_reports set resolution=p_action,resolved_at=now(),resolved_by=auth.uid(),responsible_user_id=case when p_action='suspension' then p_responsible end,suspension_id=v_suspension where id=p_report_id;
 insert into public.admin_actions(actor_id,action,resource_type,resource_id,resource_label,note,metadata)
 values(auth.uid(),'resolver_reporte_equipo','equipo',v_report.team_id,v_report.team_name,p_reason,jsonb_build_object('report_id',p_report_id,'resolution',p_action,'responsible_user',p_responsible));
end; $$;

-- Triggers protegen también las RPC y escrituras directas; no dependen de la UI.
create function public.check_account_restrictions()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_previous uuid;
begin
 if tg_table_name='tournaments' then v_user:=new.user_id;
 elsif tg_table_name='teams' then v_user:=auth.uid();
 elsif tg_table_name='team_members' then
   if not new.is_captain then return new; end if;
   select user_id into v_previous from public.team_members where team_id=new.team_id and is_captain and user_id<>new.user_id;
   -- Transferencias quitan primero la marca: el trigger de UPDATE verifica al anterior.
   v_user:=new.user_id;
 elsif tg_table_name='rival_searches' then
   if new.cancelled_at is not null then return new; end if;
   select user_id into v_user from public.team_members where team_id=new.team_id and is_captain;
 end if;
 perform 1 from public.profiles where id in(v_user,v_previous) order by id for no key update;
 if public.account_is_suspended(v_user) or public.account_is_suspended(v_previous) then raise exception 'La cuenta está suspendida: no puede crear, publicar, buscar rival ni recibir o transferir capitanía' using errcode='42501'; end if;
 return new;
end; $$;
create trigger tournament_suspension before insert on public.tournaments for each row execute function public.check_account_restrictions();
create trigger team_suspension before insert on public.teams for each row execute function public.check_account_restrictions();
create trigger captain_suspension before insert on public.team_members for each row execute function public.check_account_restrictions();
create trigger search_suspension before insert or update on public.rival_searches for each row execute function public.check_account_restrictions();

create function public.check_captain_transfer_suspension()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.is_captain is distinct from new.is_captain and public.account_is_suspended(new.user_id) then raise exception 'Una cuenta suspendida no puede recibir ni transferir la capitanía' using errcode='42501'; end if;
 return new;
end; $$;
create trigger captain_transfer_suspension before update of is_captain on public.team_members for each row execute function public.check_captain_transfer_suspension();

create function public.check_match_suspension()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_teams uuid[];
begin
 if tg_table_name='proposals' then v_teams:=array[public.slot_team_id(new.from_slot_id),public.slot_team_id(new.to_slot_id)];
 else v_teams:=array[new.team_id]; end if;
 if exists(select 1 from public.team_members where team_id=any(v_teams) and is_captain and public.account_is_suspended(user_id)) then raise exception 'El Equipo tiene su Capitán suspendido' using errcode='42501'; end if;
 return new;
end; $$;
create trigger proposal_suspension before insert on public.proposals for each row execute function public.check_match_suspension();
create trigger match_side_suspension before insert on public.match_sides for each row execute function public.check_match_suspension();

-- Registrar hechos de seguridad con un vocabulario cerrado, sin valores sensibles.
create function public.record_admin_security_action(p_action text,p_result text default 'completed')
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode='42501'; end if;
 if p_action is null or p_action not in('mfa_verificado','contrasena_actualizada','cierre_sesion_solicitado','cierre_global_solicitado') or p_result not in('completed','requested','failed') then raise exception 'Evento inválido'; end if;
 insert into public.admin_actions(actor_id,action,resource_type,resource_id,resource_label,result)
 values(auth.uid(),p_action,'seguridad',auth.uid(),'Cuenta propia',p_result);
end; $$;

revoke execute on function public.update_site_settings(text,text,text,text,timestamptz),public.suspend_account(uuid,integer,text),public.lift_suspension(uuid,text),public.resolve_team_report(uuid,text,uuid,integer,text),public.record_admin_security_action(text,text) from public,anon;
grant execute on function public.update_site_settings(text,text,text,text,timestamptz),public.suspend_account(uuid,integer,text),public.lift_suspension(uuid,text),public.resolve_team_report(uuid,text,uuid,integer,text),public.record_admin_security_action(text,text) to authenticated;
revoke execute on function public.report_team(uuid,text,text) from public,anon;
grant execute on function public.report_team(uuid,text,text) to authenticated;
revoke execute on function public.check_account_restrictions(),public.check_captain_transfer_suspension(),public.check_match_suspension() from public,anon,authenticated;
