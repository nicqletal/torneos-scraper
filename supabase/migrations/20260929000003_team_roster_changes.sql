-- Cambios en el plantel: salir, sacar jugador y pasar capitanía.
-- Ver "Equipos" en docs/decisiones-casos-de-uso.md. Junto con create_team y
-- join_team, son la única forma de modificar team_members.

-- Salir del equipo. El capitán primero tiene que pasar la capitanía.
create function public.leave_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_captain boolean;
begin
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

-- Sacar a un jugador. Solo el capitán, y no a sí mismo.
create function public.remove_team_member(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
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

-- Pasar la capitanía a otro integrante. El capitán anterior queda como jugador.
create function public.transfer_captaincy(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
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

revoke execute on function public.leave_team(uuid)                 from public, anon;
revoke execute on function public.remove_team_member(uuid, uuid)   from public, anon;
revoke execute on function public.transfer_captaincy(uuid, uuid)   from public, anon;
grant execute on function public.leave_team(uuid)                 to authenticated;
grant execute on function public.remove_team_member(uuid, uuid)   to authenticated;
grant execute on function public.transfer_captaincy(uuid, uuid)   to authenticated;
