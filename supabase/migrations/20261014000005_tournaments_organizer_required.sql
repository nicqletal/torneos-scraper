-- Todo torneo tiene exactamente un organizador.
-- Ver "Quién publica" en docs/decisiones-casos-de-uso.md.
--
-- El "torneo copiado" (un torneo sin organizador, con el nombre del organizador
-- real como texto) se descartó el 07/10/2026: la carga manual inicial se hace
-- con una cuenta de organizador común. Esta migración lo saca del esquema:
-- se van `organizer_name` y la restricción `tournaments_organizer_xor_copied`
-- (20260930000002), y `user_id` pasa a ser obligatorio.
--
-- No cambia ninguna policy de RLS ni ningún privilegio: todas ya comparan
-- `user_id` con `auth.uid()`, y una fila sin organizador nunca pasaba ese filtro.

-- 1. Filas sin organizador. La migración no decide por nadie: no las borra
--    (se perdería el torneo y sus datos de contacto) ni les inventa un dueño
--    (asignar un torneo a una cuenta es darle a esa cuenta el poder de
--    editarlo y darlo de baja). Si queda alguna, frena con un mensaje claro y
--    no toca nada: el equipo las reasigna a la cuenta que las cargó o las da
--    de baja, y vuelve a correr la migración.
--
--    En la base local no hay ninguna. En la compartida pueden quedar los
--    torneos de prueba que 20260930000002 marcó con 'Organizador de prueba':
--
--      select id, name, organizer_name from public.tournaments where user_id is null;
--      update public.tournaments set user_id = '<id de la cuenta>' where user_id is null;
--      -- o: delete from public.tournaments where user_id is null;
--
--    (Mientras exista la restricción vieja, el `update` tiene que poner
--    también `organizer_name = null` en la misma sentencia.)

do $$
declare
  without_organizer integer;
begin
  select count(*) into without_organizer
    from public.tournaments
   where user_id is null;

  if without_organizer > 0 then
    raise exception 'Hay % torneo(s) sin organizador: reasignalos a una cuenta o dalos de baja antes de aplicar esta migración',
      without_organizer
      using errcode = '23502'; -- not_null_violation
  end if;
end;
$$;

-- 2. Fuera la restricción y la columna; el organizador es obligatorio.
--    La restricción se saca primero porque depende de la columna.

alter table public.tournaments
  drop constraint tournaments_organizer_xor_copied,
  drop column organizer_name,
  alter column user_id set not null;
