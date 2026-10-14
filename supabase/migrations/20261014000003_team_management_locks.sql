-- Las operaciones existentes toman el mismo bloqueo que dissolve_team:
-- una invitación o transferencia concurrente no puede modificar un equipo
-- después de que otra transacción lo disolvió. Se mantienen sus permisos.

create or replace function public.leave_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_captain boolean;
begin
  -- Serializa gestión y disolución del mismo equipo.
  perform 1 from public.teams where id = p_team_id for update;

  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  if exists (select 1 from public.teams where id = p_team_id and dissolved_at is not null) then
    raise exception 'El equipo está disuelto';
  end if;

  select is_captain into v_is_captain
  from public.team_members
  where team_id = p_team_id and user_id = v_user_id;

  if not found then
    raise exception 'No sos parte de este equipo';
  end if;

  if v_is_captain then
    raise exception 'Pasá la capitanía antes de salir del equipo';
  end if;

  delete from public.team_members
  where team_id = p_team_id and user_id = v_user_id;
end;
$$;

create or replace function public.remove_team_member(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Serializa gestión y disolución del mismo equipo.
  perform 1 from public.teams where id = p_team_id for update;

  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede sacar jugadores';
  end if;

  if exists (select 1 from public.teams where id = p_team_id and dissolved_at is not null) then
    raise exception 'El equipo está disuelto';
  end if;

  if p_user_id = (select auth.uid()) then
    raise exception 'El capitán no puede sacarse a sí mismo: pasá la capitanía primero';
  end if;

  delete from public.team_members
  where team_id = p_team_id and user_id = p_user_id;

  if not found then
    raise exception 'Ese jugador no está en el equipo';
  end if;
end;
$$;

create or replace function public.transfer_captaincy(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  -- Serializa gestión y disolución del mismo equipo.
  perform 1 from public.teams where id = p_team_id for update;

  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede pasar la capitanía';
  end if;

  if exists (select 1 from public.teams where id = p_team_id and dissolved_at is not null) then
    raise exception 'El equipo está disuelto';
  end if;

  if p_user_id = v_user_id then
    raise exception 'Ya sos el capitán';
  end if;

  if not exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_user_id
  ) then
    raise exception 'Ese jugador no está en el equipo';
  end if;

  -- Bloquea el perfil del destino hasta el final de la transacción: si en ese
  -- momento crea un equipo (create_team lo bloquea igual), uno espera al otro
  -- y el límite de 3 capitanías se cuenta bien.
  perform 1 from public.profiles where id = p_user_id for update;

  if not exists (
    select 1 from public.profile_contacts
    where user_id = p_user_id and whatsapp is not null
  ) then
    raise exception 'Ese jugador tiene que cargar su WhatsApp en el perfil para ser capitán';
  end if;

  -- Pendiente cuando exista la suspensión (módulo de administración):
  -- un usuario suspendido no puede recibir la capitanía.

  if (
    select count(*)
    from public.team_members m
    join public.teams t on t.id = m.team_id
    where m.user_id = p_user_id and m.is_captain and t.dissolved_at is null
  ) >= 3 then
    raise exception 'Ese jugador ya es capitán de 3 equipos, que es el máximo';
  end if;

  -- El orden importa: el índice único de "un capitán por equipo" se evalúa
  -- en cada sentencia, así que primero se le quita la marca al actual.
  update public.team_members set is_captain = false
  where team_id = p_team_id and user_id = v_user_id;

  update public.team_members set is_captain = true
  where team_id = p_team_id and user_id = p_user_id;
end;
$$;

create or replace function public.regenerate_team_invite(p_team_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token   text := encode(extensions.gen_random_bytes(16), 'hex');
  v_expires timestamptz := now() + interval '7 days';
begin
  perform 1 from public.teams where id = p_team_id for update;

  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede invitar jugadores';
  end if;

  if exists (select 1 from public.teams where id = p_team_id and dissolved_at is not null) then
    raise exception 'El equipo está disuelto';
  end if;

  insert into public.team_invites as i (team_id, token, expires_at)
  values (p_team_id, v_token, v_expires)
  on conflict (team_id) do update
    set token = excluded.token, expires_at = excluded.expires_at;

  return query select v_token, v_expires;
end;
$$;

create or replace function public.join_team(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_team_id uuid;
begin
  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  select i.team_id into v_team_id
  from public.team_invites i
  join public.teams t on t.id = i.team_id
  where i.token = p_token
    and i.expires_at > now()
    and t.dissolved_at is null
  for update of t;

  if v_team_id is null then
    raise exception 'El link de invitación no es válido o venció';
  end if;

  -- Si ya está en el plantel no es un error: solo se lo lleva al equipo.
  insert into public.team_members (team_id, user_id)
  values (v_team_id, v_user_id)
  on conflict (team_id, user_id) do nothing;

  return v_team_id;
end;
$$;

