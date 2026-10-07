-- Estado del torneo calculado (Abierto, Cerrado, En curso, Finalizado) y
-- restricciones de fechas y de organizador obligatorio.
-- Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Torneo de referencia: cierre 10/11, inicio 15/11, fin 30/11.
-- tournament_status(cierre, inicio, fin, cupo, inscripciones, hoy)

-- Frontera del cierre de inscripción: el día del cierre todavía se inscribe.
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', null, 0, '2026-11-09'),
  'abierto', 'antes del cierre: abierto');
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', null, 0, '2026-11-10'),
  'abierto', 'el día del cierre: abierto');
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', null, 0, '2026-11-11'),
  'cerrado', 'el día después del cierre: cerrado');

-- Frontera del inicio: el día de inicio ya está en curso.
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', null, 0, '2026-11-14'),
  'cerrado', 'el día antes del inicio: cerrado');
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', null, 0, '2026-11-15'),
  'en_curso', 'el día de inicio: en curso');

-- Frontera del fin: el día de fin todavía está en curso.
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', null, 0, '2026-11-30'),
  'en_curso', 'el día de fin: en curso');
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', null, 0, '2026-12-01'),
  'finalizado', 'el día después del fin: finalizado');

-- Todo el mismo día: cierre = inicio = fin.
select is(public.tournament_status('2026-11-15', '2026-11-15', '2026-11-15', null, 0, '2026-11-15'),
  'en_curso', 'cierre, inicio y fin el mismo día: ese día está en curso');

-- Cupo.
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', 8, 7, '2026-11-01'),
  'abierto', 'con lugar en el cupo: abierto');
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', 8, 8, '2026-11-01'),
  'cerrado', 'cupo completo antes del cierre: cerrado');
select is(public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', 8, 8, '2026-11-20'),
  'en_curso', 'cupo completo no pisa En curso');

-- Columna calculada sobre la fila: hoy en Buenos Aires y 0 inscripciones.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name": "Ana"}');

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, capacity, user_id)
values
  ('copa.test', '22222222-2222-2222-2222-222222222222', 'Copa futura', 'futbol_5', 'palermo',
   current_date + 30, current_date + 40, current_date + 50, 8,
   '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '33333333-3333-3333-3333-333333333333', 'Copa vieja', 'futbol_5', 'palermo',
   current_date - 50, current_date - 40, current_date - 30, null,
   '00000000-0000-0000-0000-00000000000a');

select results_eq(
  $$ select t.name, public.status(t) from public.tournaments t
     where t.id in ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
     order by t.name $$,
  $$ values ('Copa futura', 'abierto'), ('Copa vieja', 'finalizado') $$,
  'status(tournaments) calcula el estado de cada fila'
);

select hasnt_column('public', 'tournaments', 'status', 'ya no se guarda el estado en una columna');

-- Restricción de fechas: cierre ≤ inicio ≤ fin.
select throws_ok(
  $$ insert into public.tournaments
       (contact_instagram, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, user_id)
     values ('copa.test', 'Cierre tarde', 'futbol_5', 'palermo', '2026-11-16', '2026-11-15', '2026-11-30',
             '00000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'el cierre no puede ser después del inicio'
);
select throws_ok(
  $$ insert into public.tournaments
       (contact_instagram, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, user_id)
     values ('copa.test', 'Fin antes', 'futbol_5', 'palermo', '2026-11-10', '2026-11-15', '2026-11-14',
             '00000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'el fin no puede ser antes del inicio'
);
select throws_ok(
  $$ insert into public.tournaments
       (contact_instagram, name, sport_modality, zone_id, start_date, end_date, user_id)
     values ('copa.test', 'Sin cierre', 'futbol_5', 'palermo', '2026-11-15', '2026-11-30',
             '00000000-0000-0000-0000-00000000000a') $$,
  '23502', null, 'el cierre de inscripción es obligatorio'
);

select throws_ok(
  $$ insert into public.tournaments
       (contact_instagram, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, capacity, user_id)
     values ('copa.test', 'Cupo cero', 'futbol_5', 'palermo', '2026-11-10', '2026-11-15', '2026-11-30', 0,
             '00000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'el cupo, si está, es de al menos 1'
);

-- Todo torneo tiene exactamente un organizador: `user_id` es obligatorio y ya
-- no existe el nombre de organizador en texto ni su restricción.
select throws_ok(
  $$ insert into public.tournaments
       (contact_instagram, name, sport_modality, zone_id, inscription_deadline, start_date, end_date)
     values ('copa.test', 'Copa de nadie', 'futbol_5', 'palermo', '2026-11-10', '2026-11-15', '2026-11-30') $$,
  '23502', null, 'un torneo sin organizador no se guarda'
);
select hasnt_column('public', 'tournaments', 'organizer_name',
  'ya no se guarda el nombre del organizador como texto');
select is_empty(
  $$ select 1 from pg_constraint
      where conrelid = 'public.tournaments'::regclass
        and conname = 'tournaments_organizer_xor_copied' $$,
  'ya no existe la restricción "organizador o copiado"'
);

select * from finish();
rollback;
