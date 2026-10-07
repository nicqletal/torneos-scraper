-- Inscripción vinculada: el organizador anota un Equipo de la app.
-- Ver "Inscripciones" y "Equipos" en docs/decisiones-casos-de-uso.md.
--
-- La tabla ya tiene `team_id`, el XOR con `team_name` y el índice único por
-- (torneo, equipo) (ver 20261007000000). Falta la función de alta. No cambia
-- ningún privilegio sobre tablas ni hay policies nuevas: la función solo lee
-- `teams` (que ya es de lectura pública) y nunca `team_members`.
--
-- Mismas reglas que `add_inscription` (dueño del torneo, no Finalizado, cupo),
-- más: el equipo existe, no está disuelto y todavía no está anotado. El
-- capitán no confirma la vinculación. Los avisos al capitán entran en #6.

create function public.add_linked_inscription(p_tournament_id uuid, p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t    public.tournaments;
  team public.teams;
  v_id uuid;
begin
  -- 1. Mismo control de dueño que `add_inscription`: un torneo ajeno, uno que
  --    no existe y uno copiado (sin organizador) dan el mismo error, para no
  --    confirmar que existe un torneo con ese id. `for update` bloquea el
  --    torneo: el cupo y el "ya está anotado" se evalúan con la fila
  --    bloqueada, así dos altas a la vez se serializan.
  select * into t
    from public.tournaments
   where id = p_tournament_id
     and user_id = auth.uid()
     for update;

  if not found then
    raise exception 'El torneo no existe o no es tuyo'
      using errcode = '42501';
  end if;

  -- 2. Un Finalizado no cambia sus inscripciones.
  if public.status(t) = 'finalizado' then
    raise exception 'Un torneo finalizado no cambia sus inscripciones'
      using errcode = '22023';
  end if;

  -- 3. El equipo existe. `teams` es público, así que acá no se esconde nada.
  select * into team from public.teams where id = p_team_id;

  if not found then
    raise exception 'El equipo no existe'
      using errcode = 'P0002'; -- no_data_found
  end if;

  -- 4. Un Equipo disuelto no recibe inscripciones.
  if team.dissolved_at is not null then
    raise exception 'Un equipo disuelto no recibe inscripciones'
      using errcode = '55000'; -- object_not_in_prerequisite_state
  end if;

  -- 5. Ya anotado: un mensaje claro antes de chocar con el índice único
  --    `inscriptions_one_per_team`, que queda como red de seguridad. Va antes
  --    del cupo a propósito: si el equipo ya está, "ya está anotado" le sirve
  --    más al organizador que "cupo completo".
  if exists (
    select 1 from public.inscriptions
     where tournament_id = t.id and team_id = p_team_id
  ) then
    raise exception 'Ese equipo ya está anotado en este torneo'
      using errcode = '23505'; -- unique_violation
  end if;

  -- 6. Cupo, igual que `add_inscription`.
  if t.capacity is not null and public.inscriptions_count(t) >= t.capacity then
    raise exception 'El cupo está completo: subí el cupo para anotar más equipos'
      using errcode = '23514';
  end if;

  insert into public.inscriptions (tournament_id, team_id)
  values (t.id, p_team_id)
  returning id into v_id;

  return v_id;
end;
$$;

-- Postgres le da `execute` a todos (public) en toda función nueva, y Supabase
-- además se lo da a anon por default. Solo la llaman usuarios con sesión.
revoke execute on function public.add_linked_inscription(uuid, uuid) from public, anon;
grant execute on function public.add_linked_inscription(uuid, uuid) to authenticated;
