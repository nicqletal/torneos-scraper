-- Link de invitación al equipo. Ver "Equipos > Invitar" en docs/decisiones-casos-de-uso.md.

-- Una fila por equipo: la clave primaria hace que haya un solo link vigente,
-- y regenerarlo pisa la fila, con lo que el anterior deja de valer.
create table if not exists public.team_invites (
  team_id    uuid primary key references public.teams (id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null
);

-- Sin policies: nadie lee ni escribe la tabla directo. El token es la
-- credencial para entrar al plantel, así que solo se toca desde las funciones.
alter table public.team_invites enable row level security;

-- Genera (o reemplaza) el link del equipo. Solo el capitán de un equipo activo.
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

-- Devuelve el link vigente, para que el capitán lo vea al volver a la página.
-- Sin fila o vencido no devuelve nada.
create or replace function public.get_team_invite(p_team_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede ver el link de invitación';
  end if;

  return query
    select i.token, i.expires_at
    from public.team_invites i
    join public.teams t on t.id = i.team_id
    where i.team_id = p_team_id
      and i.expires_at > now()
      and t.dissolved_at is null;
end;
$$;

-- Unirse con el link. Devuelve el id del equipo para redirigir a su página.
-- Un link inexistente, vencido o de un equipo disuelto da el mismo error.
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
    and t.dissolved_at is null;

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

revoke execute on function public.regenerate_team_invite(uuid) from public, anon;
revoke execute on function public.get_team_invite(uuid)        from public, anon;
revoke execute on function public.join_team(text)              from public, anon;
grant execute on function public.regenerate_team_invite(uuid) to authenticated;
grant execute on function public.get_team_invite(uuid)        to authenticated;
grant execute on function public.join_team(text)              to authenticated;
