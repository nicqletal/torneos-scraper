-- Baja de torneos: solo por la función `withdraw_tournament`.
--
-- Hasta ahora el dueño podía borrar su torneo con un `delete` directo (policy
-- "el organizador da de baja los suyos"). Eso no alcanza para las reglas de la
-- Baja (ver docs/decisiones-casos-de-uso.md):
--   - un Finalizado no se da de baja, y el estado es calculado: una policy
--     podría llamar a `status()`, pero no puede devolver un mensaje que diga
--     por qué no (RLS solo filtra filas: el delete afectaría 0 filas en silencio);
--   - la baja tiene que generar un Aviso a cada capitán con Inscripción
--     vinculada, y eso es un paso más dentro de la misma transacción.
--
-- Por eso se saca la policy de delete y el privilegio de delete, igual que se
-- hizo con `verified_at`: la única puerta es la función.

drop policy "tournaments: el organizador da de baja los suyos" on public.tournaments;

revoke delete on public.tournaments from anon, authenticated;

-- `security definer` y `set search_path = ''`: igual que `verify_tournament`
-- (ver 20260930000005). La función corre como su dueño, que sí puede borrar,
-- así que el control de quién es el dueño lo hace ella en el `where`.
--
-- Un torneo ajeno, uno que no existe y uno ya dado de baja dan el mismo error,
-- para no confirmar que existe un torneo con ese id. Los torneos copiados (sin
-- organizador) los va a dar de baja el administrador cuando exista ese rol.

create function public.withdraw_tournament(tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  -- `for update` bloquea la fila hasta el final de la transacción: nadie la
  -- cambia entre que se mira el estado y se borra.
  select public.status(t) into current_status
    from public.tournaments t
   where t.id = tournament_id
     and t.user_id = auth.uid()
     for update;

  if not found then
    raise exception 'El torneo no existe o no es tuyo'
      using errcode = '42501';
  end if;

  if current_status = 'finalizado' then
    raise exception 'Un torneo finalizado no se da de baja'
      using errcode = '22023';
  end if;

  -- TODO(avisos): cuando existan las inscripciones y los avisos, acá se crea
  -- un Aviso para cada capitán con Inscripción vinculada en este torneo, antes
  -- de borrarlo (después ya no quedan las inscripciones para saber a quién).

  delete from public.tournaments where id = tournament_id;
end;
$$;

-- Postgres le da `execute` a todos (public) en toda función nueva, y Supabase
-- además se lo da a anon por default. Solo la llaman usuarios con sesión.
revoke execute on function public.withdraw_tournament(uuid) from public, anon;
grant execute on function public.withdraw_tournament(uuid) to authenticated;
