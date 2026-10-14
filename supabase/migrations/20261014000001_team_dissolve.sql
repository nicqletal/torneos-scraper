-- Disolución del módulo actual de equipos. Conserva equipo, plantel y escudo.
-- Cuando existan partidos/propuestas, sumar aquí el bloqueo por partido
-- acordado pendiente y la cancelación de propuestas; ver decisiones-casos-de-uso.
create function public.dissolve_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dissolved_at timestamptz;
begin
  if (select auth.uid()) is null then raise exception 'Tenés que iniciar sesión'; end if;

  select dissolved_at into v_dissolved_at
    from public.teams where id = p_team_id for update;
  if not found then raise exception 'No se encontró el equipo'; end if;
  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede disolver el equipo';
  end if;
  if v_dissolved_at is not null then raise exception 'El equipo ya está disuelto'; end if;

  update public.teams set dissolved_at = now() where id = p_team_id;
  delete from public.team_invites where team_id = p_team_id;
end;
$$;
revoke execute on function public.dissolve_team(uuid) from public, anon;
grant execute on function public.dissolve_team(uuid) to authenticated;
