-- Zona del torneo desde la lista cerrada (ver "Zonas" en docs/decisiones-casos-de-uso.md).
--
-- Hasta ahora `zone` era texto libre ("Palermo", "palermo", "Zona Norte"...),
-- y con eso no se puede agrupar por corredor ni filtrar un corredor completo.
-- Pasa a ser `zone_id`, una FK a `zones` (20260928000001): la base rechaza
-- cualquier zona que no esté en la lista, venga del formulario o de la API.

-- 1. Los torneos que ya existen son de prueba: van todos a Palermo, sin
--    intentar adivinar la zona desde el texto. 'palermo' está en los datos
--    de prueba de 20260928000001; si la planilla real no la tuviera, la FK
--    frena la migración en vez de dejar torneos con una zona inexistente.

alter table public.tournaments add column if not exists zone_id text references public.zones (id);

update public.tournaments set zone_id = 'palermo' where zone_id is null;

alter table public.tournaments alter column zone_id set not null;

-- Postgres no indexa solo las FK; el catálogo va a filtrar por zona.
create index if not exists tournaments_zone_id_idx on public.tournaments (zone_id);

-- 2. Fuera el texto libre. Borrar la columna borra también sus grants de
--    insert y update (20260930000004 y 20260930000005).

alter table public.tournaments drop column if exists zone;

-- 3. `zone_id` entra al formulario, así que se suma a los dos grants por
--    columna (las de `TournamentInput` en src/utils/tournament-form.ts). Qué
--    filas puede tocar el organizador no cambia: lo siguen decidiendo las
--    policies de insert y update (solo las suyas). Qué zona puede poner, lo
--    decide la FK.

grant insert (zone_id), update (zone_id) on public.tournaments to authenticated;
