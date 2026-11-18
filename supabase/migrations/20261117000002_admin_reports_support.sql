-- Administración completa: rol y segundo factor exigidos en la base.
create function public.is_verified_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_admin() and coalesce((select auth.jwt())->>'aal', '') = 'aal2';
$$;
revoke execute on function public.is_verified_admin() from public, anon;
grant execute on function public.is_verified_admin() to authenticated;

-- Consulta acotada de cuentas para el Panel de administración (#29).
-- El dueño de estas funciones puede leer auth.users; el solicitante debe
-- tener una sesión válida y el rol confirmado por is_admin().

create function public.admin_search_users(p_query text)
returns table (user_id uuid, display_name text, avatar_url text, zone_name text, email text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_query text := btrim(p_query);
begin
  if not public.is_verified_admin() then
    raise exception 'Acceso denegado' using errcode = '42501';
  end if;
  if v_query is null or char_length(v_query) < 2 then return; end if;

  return query
  select p.id, p.display_name, p.avatar_url, z.name, u.email::text, u.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.zones z on z.id = p.zone_id
  where position(lower(v_query) in lower(p.display_name)) > 0
     or position(lower(v_query) in lower(u.email)) > 0
  order by p.display_name, p.id
  limit 20;
end;
$$;

create function public.admin_get_user(p_user_id uuid)
returns table (user_id uuid, display_name text, avatar_url text, zone_name text, email text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_verified_admin() then
    raise exception 'Acceso denegado' using errcode = '42501';
  end if;

  return query
  select p.id, p.display_name, p.avatar_url, z.name, u.email::text, u.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.zones z on z.id = p.zone_id
  where p.id = p_user_id;
end;
$$;

revoke execute on function public.admin_search_users(text) from public, anon;
revoke execute on function public.admin_get_user(uuid) from public, anon;
grant execute on function public.admin_search_users(text) to authenticated;
grant execute on function public.admin_get_user(uuid) to authenticated;

-- Reportes de torneos, resoluciones y Avisos por Baja (#31).
alter table public.tournaments add column observed_at timestamptz;

create table public.tournament_reports (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete set null,
  tournament_name text not null,
  reporter_id uuid not null references public.profiles(id),
  reason text not null check (reason in ('ya_no_existe', 'datos_incorrectos', 'no_es_torneo')),
  detail text check (char_length(detail) <= 500),
  created_at timestamptz not null default now(),
  resolution text check (resolution in ('descartado', 'observado', 'baja', 'baja_organizador')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  check ((resolution is null and resolved_by is null and resolved_at is null)
      or (resolution is not null and resolved_by is not null and resolved_at is not null))
);
create unique index tournament_reports_once on public.tournament_reports(reporter_id, tournament_id) where tournament_id is not null;
create index on public.tournament_reports(resolved_at, created_at);
create index on public.tournament_reports(tournament_id);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  action text not null,
  tournament_id uuid references public.tournaments(id) on delete set null,
  tournament_name text not null default '',
  resource_type text not null default 'torneo',
  resource_id uuid,
  resource_label text,
  result text not null default 'completed',
  metadata jsonb not null default '{}',
  note text,
  created_at timestamptz not null default now()
);



alter table public.tournament_reports enable row level security;
alter table public.admin_actions enable row level security;

revoke all on public.tournament_reports, public.admin_actions from anon, authenticated;
grant select on public.tournament_reports, public.admin_actions to authenticated;

-- SELECT: la fila pertenece al usuario actual o el rol administrador está
-- confirmado por is_admin(). Nadie recibe escritura directa sobre la tabla.
create policy "tournament_reports: autor o administrador lee"
  on public.tournament_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_verified_admin()));
-- SELECT: únicamente el administrador puede consultar resoluciones.
create policy "admin_actions: solo administrador lee"
  on public.admin_actions for select to authenticated
  using ((select public.is_verified_admin()));
-- SELECT: el destinatario es el usuario actual; no se leen Avisos ajenos.


create function public.report_tournament(p_tournament_id uuid, p_reason text, p_detail text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Iniciá sesión para reportar' using errcode = '42501'; end if;
  if p_reason is null or p_reason not in ('ya_no_existe', 'datos_incorrectos', 'no_es_torneo')
     or char_length(coalesce(p_detail, '')) > 500 then
    raise exception 'Reporte inválido' using errcode = '22023';
  end if;
  insert into public.tournament_reports(tournament_id, tournament_name, reporter_id, reason, detail)
  select t.id, t.name, v_user, p_reason, nullif(btrim(p_detail), '')
    from public.tournaments t where t.id = p_tournament_id
  returning id into v_id;
  if v_id is null then raise exception 'Torneo no disponible' using errcode = '22023'; end if;
  return v_id;
end; $$;

-- Solo las funciones de Baja llaman a este helper. La clave del torneo sigue
-- disponible antes del DELETE, por lo que podemos encontrar capitanes.
create function public.create_withdrawal_notices(p_tournament_id uuid, p_name text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notices (user_id, kind, params)
  select distinct on (m.user_id)
         m.user_id,
         'tournament_withdrawn',
         jsonb_build_object('tournament_name', p_name, 'team_id', tm.id, 'team_name', tm.name)
    from public.inscriptions i
    join public.teams tm on tm.id = i.team_id
    join public.team_members m on m.team_id = tm.id
   where i.tournament_id = p_tournament_id
     and m.user_id is distinct from (select auth.uid())
   order by m.user_id, tm.id;
$$;

create function public.resolve_tournament_report(p_report_id uuid, p_action text, p_expected_count integer default null, p_confirm_name text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tournament_id uuid; v_name text; v_pending boolean; v_status text;
begin
  if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode = '42501'; end if;
  if p_action is null or p_action not in ('descartado', 'observado', 'baja') then raise exception 'Resolución inválida' using errcode = '22023'; end if;
  select tournament_id into v_tournament_id from public.tournament_reports where id = p_report_id;
  if v_tournament_id is null then raise exception 'Reporte no disponible' using errcode = '22023'; end if;
  select name into v_name from public.tournaments where id = v_tournament_id for update;
  if v_name is null then raise exception 'Torneo no disponible' using errcode = '22023'; end if;
  select resolution is null into v_pending from public.tournament_reports where id = p_report_id for update;
  if not coalesce(v_pending, false) then raise exception 'Reporte ya resuelto' using errcode = '22023'; end if;

  if p_action = 'baja' and (p_confirm_name is distinct from v_name or p_expected_count is distinct from
    (select count(*)::integer from public.inscriptions where tournament_id = v_tournament_id)) then
    raise exception 'Cambió la cantidad de inscriptos o el nombre: revisá la confirmación' using errcode = '22023';
  end if;
  if p_action = 'descartado' then
    update public.tournament_reports set resolution = p_action, resolved_by = auth.uid(), resolved_at = now() where id = p_report_id;
  else
    select public.status(t) into v_status from public.tournaments t where t.id = v_tournament_id;
    if p_action = 'baja' and v_status = 'finalizado' then
      raise exception 'Un torneo finalizado no se da de baja' using errcode = '22023';
    end if;
    update public.tournament_reports set resolution = p_action, resolved_by = auth.uid(), resolved_at = now()
      where tournament_id = v_tournament_id and resolution is null;
    if p_action = 'observado' then
      update public.tournaments set observed_at = now() where id = v_tournament_id;
    else
      perform public.create_withdrawal_notices(v_tournament_id, v_name);
      delete from public.tournaments where id = v_tournament_id;
    end if;
  end if;
  insert into public.admin_actions(actor_id, action, tournament_id, tournament_name)
  values (auth.uid(), case p_action when 'descartado' then 'descartar_reporte' when 'observado' then 'observar_torneo' else 'baja_torneo' end,
          case when p_action = 'baja' then null else v_tournament_id end, v_name);
end; $$;

create function public.unobserve_tournament(p_tournament_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if not public.is_verified_admin() then raise exception 'Acceso denegado' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 3 and 500 then raise exception 'Indicá un motivo de hasta 500 caracteres' using errcode = '22023'; end if;
  select name into v_name from public.tournaments where id = p_tournament_id and observed_at is not null for update;
  if v_name is null then raise exception 'Torneo no observado' using errcode = '22023'; end if;
  update public.tournaments set observed_at = null where id = p_tournament_id;
  insert into public.admin_actions(actor_id, action, tournament_id, tournament_name, note)
    values (auth.uid(), 'quitar_observado', p_tournament_id, v_name, btrim(p_reason));
end; $$;



-- La Baja del organizador también crea Avisos antes de borrar.
create or replace function public.withdraw_tournament(tournament_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_status text; v_name text;
begin
  select public.status(t), t.name into current_status, v_name from public.tournaments t
   where t.id = tournament_id and t.user_id = auth.uid() for update;
  if not found then raise exception 'El torneo no existe o no es tuyo' using errcode = '42501'; end if;
  if current_status = 'finalizado' then raise exception 'Un torneo finalizado no se da de baja' using errcode = '22023'; end if;
  update public.tournament_reports set resolution = 'baja_organizador', resolved_by = auth.uid(), resolved_at = now()
    where tournament_id = withdraw_tournament.tournament_id and resolution is null;
  perform public.create_withdrawal_notices(tournament_id, v_name);
  delete from public.tournaments where id = tournament_id;
end; $$;

revoke execute on function public.report_tournament(uuid,text,text), public.resolve_tournament_report(uuid,text,integer,text), public.unobserve_tournament(uuid,text), public.create_withdrawal_notices(uuid,text) from public, anon, authenticated;
grant execute on function public.report_tournament(uuid,text,text), public.resolve_tournament_report(uuid,text,integer,text), public.unobserve_tournament(uuid,text) to authenticated;

-- Tras la Baja, la fila del torneo ya no existe. Solo el Administrador puede
-- encontrar y retirar el flyer huérfano por la API de Storage. La policy de
-- lectura es necesaria para que Storage encuentre la fila antes del borrado.
-- SELECT: solo el bucket flyers, solo Administrador y solo tras desaparecer
-- el torneo. Sin esta fila visible, la API de Storage no puede retirarla.
create policy "flyers: administrador ve huérfanos"
  on storage.objects for select to authenticated
  using (bucket_id = 'flyers' and (select public.is_verified_admin())
    and not exists (select 1 from public.tournaments t where t.id::text = storage.objects.name));
-- DELETE: repite exactamente las tres condiciones de SELECT; no concede
-- permiso de subida ni reemplazo de archivos.
create policy "flyers: administrador retira huérfanos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'flyers' and (select public.is_verified_admin())
    and not exists (select 1 from public.tournaments t where t.id::text = storage.objects.name));

-- Soporte (#33) y consulta administrativa de Avisos (#34).
create table public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  subject text not null check (char_length(subject) between 3 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index on public.support_threads(updated_at desc);
create index on public.support_threads(user_id, updated_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.support_messages(thread_id, created_at);



alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.support_threads, public.support_messages from anon, authenticated;
grant select on public.support_threads, public.support_messages to authenticated;

-- SELECT: el autor ve su consulta y el Administrador ve todas.
create policy "support_threads: autor o administrador lee"
  on public.support_threads for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_verified_admin()));

-- SELECT: solo se leen mensajes de una consulta visible para el autor o el
-- Administrador. La consulta a support_threads también atraviesa su RLS.
create policy "support_messages: participantes leen"
  on public.support_messages for select to authenticated
  using (exists (select 1 from public.support_threads t
    where t.id = thread_id
      and (t.user_id = (select auth.uid()) or (select public.is_verified_admin()))));

-- SELECT adicional: el Administrador consulta la entrega de Avisos. La policy
-- existente de destinatario permanece y sigue limitando a usuarios comunes.
create policy "notices: administrador consulta"
  on public.notices for select to authenticated
  using ((select public.is_verified_admin()));

create function public.create_support_thread(p_subject text, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid; v_subject text := btrim(p_subject); v_body text := btrim(p_body);
begin
  if v_user is null then raise exception 'Iniciá sesión' using errcode = '42501'; end if;
  if char_length(coalesce(v_subject, '')) not between 3 and 100
     or char_length(coalesce(v_body, '')) not between 1 and 2000 then
    raise exception 'Consulta inválida' using errcode = '22023';
  end if;
  insert into public.support_threads(user_id, subject) values (v_user, v_subject) returning id into v_id;
  insert into public.support_messages(thread_id, author_id, body) values (v_id, v_user, v_body);
  return v_id;
end; $$;

create function public.send_support_message(p_thread_id uuid, p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_owner uuid; v_closed timestamptz; v_body text := btrim(p_body);
begin
  if v_user is null then raise exception 'Iniciá sesión' using errcode = '42501'; end if;
  if char_length(coalesce(v_body, '')) not between 1 and 2000 then raise exception 'Mensaje inválido' using errcode = '22023'; end if;
  select user_id, closed_at into v_owner, v_closed from public.support_threads where id = p_thread_id for update;
  if v_owner is null or (v_user <> v_owner and not public.is_verified_admin()) then
    raise exception 'Consulta no disponible' using errcode = '42501';
  end if;
  if v_user <> v_owner and v_closed is not null then
    raise exception 'La consulta está cerrada' using errcode = '22023';
  end if;
  insert into public.support_messages(thread_id, author_id, body) values (p_thread_id, v_user, v_body);
  update public.support_threads set updated_at = now(), closed_at = case when v_user = v_owner then null else closed_at end
    where id = p_thread_id;
  if public.is_verified_admin() then
    insert into public.admin_actions(actor_id,action,resource_type,resource_id,resource_label)
    values(v_user,'respuesta_soporte','soporte',p_thread_id,(select subject from public.support_threads where id=p_thread_id));
  end if;
  if v_user <> v_owner then
    insert into public.notices(user_id, kind, params)
      values (v_owner, 'admin_message', jsonb_build_object('body', 'Tenés una respuesta nueva en Soporte.', 'href', '/soporte/' || p_thread_id::text));
  end if;
end; $$;

create function public.close_support_thread(p_thread_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_owner uuid;
begin
  if v_user is null then raise exception 'Iniciá sesión' using errcode = '42501'; end if;
  select user_id into v_owner from public.support_threads where id = p_thread_id for update;
  if v_owner is null or (v_user <> v_owner and not public.is_verified_admin()) then
    raise exception 'Consulta no disponible' using errcode = '42501';
  end if;
  if public.is_verified_admin() and exists(select 1 from public.support_threads where id=p_thread_id and closed_at is null) then
    insert into public.admin_actions(actor_id,action,resource_type,resource_id,resource_label)
    values(v_user,'cierre_soporte','soporte',p_thread_id,(select subject from public.support_threads where id=p_thread_id));
  end if;
  update public.support_threads set closed_at = coalesce(closed_at, now()), updated_at = now() where id = p_thread_id;
end; $$;

revoke execute on function public.create_support_thread(text,text), public.send_support_message(uuid,text), public.close_support_thread(uuid) from public, anon, authenticated;
grant execute on function public.create_support_thread(text,text), public.send_support_message(uuid,text), public.close_support_thread(uuid) to authenticated;
