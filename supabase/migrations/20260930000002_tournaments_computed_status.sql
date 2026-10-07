-- El estado del torneo se calcula; nadie lo elige.
--
-- Abierto, Cerrado, En curso y Finalizado salen de las tres fechas y del cupo
-- (ver "Estado" en docs/decisiones-casos-de-uso.md). Por eso se borra la
-- columna `status` y su enum, y se reemplazan por una función que PostgREST
-- expone como columna calculada: `select('*, status')` y `?status=eq.abierto`
-- funcionan igual que con una columna de verdad.
--
-- Además, el esquema contempla el torneo copiado (ADR 0001): o tiene
-- organizador (`user_id`) o guarda el nombre del organizador real como texto
-- (`organizer_name`), nunca las dos cosas ni ninguna.
-- (El torneo copiado se descartó el 07/10/2026: `organizer_name` y su
-- restricción se eliminan en 20261007000002.)

-- 1. Torneos de prueba con fechas coherentes, antes de agregar los `check`.
--    Los de la base compartida no tienen cierre de inscripción y alguno podría
--    no tener fin: el fin se completa a 90 días del inicio y el cierre, una
--    semana antes del inicio. Todos se cargaron sin organizador, así que pasan
--    a ser torneos copiados.

alter table public.tournaments add column organizer_name text;

update public.tournaments
   set end_date = start_date + 90
 where end_date is null or end_date < start_date;

update public.tournaments
   set inscription_deadline = start_date - 7
 where inscription_deadline is null or inscription_deadline > start_date;

update public.tournaments
   set organizer_name = 'Organizador de prueba'
 where user_id is null;

-- 2. Fechas obligatorias, cupo opcional y las restricciones.

alter table public.tournaments
  alter column inscription_deadline set not null,
  alter column end_date set not null,
  add column capacity integer,
  add constraint tournaments_dates_order
    check (inscription_deadline <= start_date and start_date <= end_date),
  add constraint tournaments_capacity_positive
    check (capacity > 0),
  add constraint tournaments_organizer_xor_copied
    check ((user_id is null) <> (organizer_name is null));

-- 3. Fuera la columna guardada.

alter table public.tournaments drop column status;
drop type public.tournament_status;

-- 4. El cálculo, como función pura: recibe "hoy" y la cantidad de
--    inscripciones para poder testear cada frontera sin depender del reloj.
--    El orden de los `when` importa: Finalizado y En curso pisan al cupo.
--    Las fronteras son inclusivas: el día del cierre todavía se inscribe, y
--    el día de inicio y el de fin el torneo está en curso.

create function public.tournament_status(
  inscription_deadline date,
  start_date           date,
  end_date             date,
  capacity             integer,
  inscriptions         integer,
  today                date
) returns text
language sql
immutable
as $$
  select case
    when today > end_date                    then 'finalizado'
    when today >= start_date                 then 'en_curso'
    when today > inscription_deadline        then 'cerrado'
    when inscriptions >= capacity            then 'cerrado'
    else                                          'abierto'
  end
$$;

-- 5. La columna calculada. PostgREST la reconoce porque recibe la fila de
--    `tournaments` y está en el esquema expuesto. "Hoy" es el día en Buenos
--    Aires, no en UTC: a las 22 h del cierre, todavía es el día del cierre.
--    Hasta que exista la tabla de inscripciones, cuenta 0.

create function public.status(t public.tournaments)
returns text
language sql
stable
as $$
  select public.tournament_status(
    t.inscription_deadline,
    t.start_date,
    t.end_date,
    t.capacity,
    0,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date
  )
$$;
