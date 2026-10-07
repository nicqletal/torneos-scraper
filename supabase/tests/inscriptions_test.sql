-- Inscripciones: solo el organizador carga y borra (por función), la lectura
-- pública es solo del nombre (vista), el cupo completo rechaza el alta y
-- borrar una antes del cierre reabre un torneo cerrado por cupo. Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

-- Un torneo de Ana en cada estado (fechas relativas a hoy, en la zona horaria
-- de Buenos Aires, que es el "hoy" de `status`).
set local timezone = 'America/Argentina/Buenos_Aires';

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, capacity, user_id)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa abierta', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, 2, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '22222222-2222-2222-2222-222222222222', 'Copa cerrada', 'futbol_5', 'palermo',
   current_date - 1, current_date + 5, current_date + 30, null, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '33333333-3333-3333-3333-333333333333', 'Copa en curso', 'futbol_5', 'palermo',
   current_date - 20, current_date - 10, current_date + 10, null, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '44444444-4444-4444-4444-444444444444', 'Copa finalizada', 'futbol_5', 'palermo',
   current_date - 60, current_date - 50, current_date - 1, null, '00000000-0000-0000-0000-00000000000a');

select results_eq(
  $$ select t.status from public.tournaments t where t.user_id = '00000000-0000-0000-0000-00000000000a' order by t.name $$,
  $$ values ('abierto'), ('cerrado'), ('en_curso'), ('finalizado') $$,
  'los torneos de prueba cubren los cuatro estados'
);

-- Un equipo de la app, para la restricción de la vinculada (el alta vinculada
-- entra en #5: acá se inserta directo, como postgres).
insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Real Floresta', 'palermo', 'futbol_5', 'intermedio');

-- Restricciones de la tabla: por nombre o vinculada, nunca las dos ni ninguna.
select throws_ok(
  $$ insert into public.inscriptions (tournament_id) values ('22222222-2222-2222-2222-222222222222') $$,
  '23514', null, 'una inscripción sin equipo ni nombre no se guarda'
);
select throws_ok(
  $$ insert into public.inscriptions (tournament_id, team_id, team_name)
     values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Real Floresta') $$,
  '23514', null, 'una inscripción no es vinculada y por nombre a la vez'
);
select throws_ok(
  $$ insert into public.inscriptions (tournament_id, team_name) values ('22222222-2222-2222-2222-222222222222', 'X') $$,
  '23514', null, 'el nombre tiene al menos 2 caracteres'
);
select lives_ok(
  $$ insert into public.inscriptions (tournament_id, team_id)
     values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  'una inscripción vinculada apunta a un equipo de la app'
);
select throws_ok(
  $$ insert into public.inscriptions (tournament_id, team_id)
     values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  '23505', null, 'un equipo tiene como mucho una inscripción vinculada por torneo'
);

-- Una inscripción en el Finalizado, para probar que no se borra.
insert into public.inscriptions (id, tournament_id, team_name)
values ('ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', 'Los de siempre');

-- Ana, con sesión: carga y borra en sus torneos.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select lives_ok(
  $$ select public.add_inscription('11111111-1111-1111-1111-111111111111', '  Los Pibes ') $$,
  'el organizador carga una inscripción por nombre en un torneo Abierto'
);
select lives_ok(
  $$ select public.add_inscription('22222222-2222-2222-2222-222222222222', 'Deportivo Lugano') $$,
  'en un torneo Cerrado también se carga'
);
select lives_ok(
  $$ select public.add_inscription('33333333-3333-3333-3333-333333333333', 'Atlético Boedo') $$,
  'en un torneo En curso también se carga'
);
select throws_ok(
  $$ select public.add_inscription('44444444-4444-4444-4444-444444444444', 'Los tardíos') $$,
  '22023', 'Un torneo finalizado no cambia sus inscripciones',
  'en un torneo Finalizado no se carga'
);
select throws_ok(
  $$ select public.add_inscription('99999999-9999-9999-9999-999999999999', 'Los de nadie') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'un torneo que no existe da el mismo error que uno ajeno'
);
select throws_ok(
  $$ select public.add_inscription('11111111-1111-1111-1111-111111111111', 'X') $$,
  '23514', null, 'la función también respeta el largo mínimo del nombre'
);

-- El nombre se guarda sin espacios alrededor; el organizador lo ve en su panel.
select results_eq(
  $$ select team_name from public.inscriptions where tournament_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Los Pibes') $$,
  'el organizador ve las inscripciones de su torneo, con el nombre sin espacios alrededor'
);

-- Cupo: con 2 lugares, la segunda inscripción lo completa y cierra el torneo.
select lives_ok(
  $$ select public.add_inscription('11111111-1111-1111-1111-111111111111', 'Juventud Unida') $$,
  'la inscripción que completa el cupo entra'
);
select is(
  (select t.status from public.tournaments t where t.id = '11111111-1111-1111-1111-111111111111'),
  'cerrado', 'con el cupo completo el torneo queda Cerrado'
);
select is(
  (select t.inscriptions_count from public.tournaments t where t.id = '11111111-1111-1111-1111-111111111111'),
  2, 'inscriptions_count cuenta las inscripciones del torneo'
);
select throws_ok(
  $$ select public.add_inscription('11111111-1111-1111-1111-111111111111', 'El tercero') $$,
  '23514', 'El cupo está completo: subí el cupo para anotar más equipos',
  'con el cupo completo no se carga otra inscripción'
);

-- Borrar una antes del cierre reabre el torneo.
select lives_ok(
  $$ select public.remove_inscription((select id from public.inscriptions where team_name = 'Juventud Unida')) $$,
  'el organizador borra una inscripción'
);
select is(
  (select t.status from public.tournaments t where t.id = '11111111-1111-1111-1111-111111111111'),
  'abierto', 'borrar una inscripción antes del cierre reabre un torneo cerrado por cupo'
);
-- Pasado el cierre, el cupo libre no reabre nada (función pura, sin reloj).
select is(
  public.tournament_status('2026-11-10', '2026-11-15', '2026-11-30', 8, 2, '2026-11-11'),
  'cerrado', 'pasado el cierre, borrar una inscripción no reabre el torneo'
);

select throws_ok(
  $$ select public.remove_inscription('ffffffff-ffff-ffff-ffff-ffffffffffff') $$,
  '22023', 'Un torneo finalizado no cambia sus inscripciones',
  'en un torneo Finalizado no se borra'
);
select throws_ok(
  $$ select public.remove_inscription('99999999-9999-9999-9999-999999999999') $$,
  '42501', 'La inscripción no existe o no es tuya',
  'una inscripción que no existe da el error de siempre'
);

-- Sin puertas de atrás: ni insert ni delete directos, ni para el dueño.
select throws_ok(
  $$ insert into public.inscriptions (tournament_id, team_name)
     values ('11111111-1111-1111-1111-111111111111', 'Por la ventana') $$,
  '42501', null, 'el dueño no inserta directo en la tabla'
);
select throws_ok(
  $$ delete from public.inscriptions where team_name = 'Los Pibes' $$,
  '42501', null, 'el dueño no borra directo en la tabla'
);
select throws_ok(
  $$ update public.inscriptions set team_name = 'Otro' where team_name = 'Los Pibes' $$,
  '42501', null, 'una inscripción no se edita'
);

-- Beto, con sesión: no ve ni toca las inscripciones de Ana.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select is_empty(
  $$ select id from public.inscriptions where tournament_id = '11111111-1111-1111-1111-111111111111' $$,
  'otro usuario no ve las inscripciones de un torneo ajeno'
);
select throws_ok(
  $$ select public.add_inscription('11111111-1111-1111-1111-111111111111', 'Los colados') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'otro usuario no carga inscripciones en un torneo ajeno'
);
select throws_ok(
  $$ select public.remove_inscription((select id from public.tournament_inscriptions where team_name = 'Los Pibes')) $$,
  '42501', 'La inscripción no existe o no es tuya',
  'otro usuario no borra inscripciones de un torneo ajeno'
);
select results_eq(
  $$ select team_name from public.tournament_inscriptions
     where tournament_id = '22222222-2222-2222-2222-222222222222' order by created_at $$,
  $$ values ('Real Floresta'), ('Deportivo Lugano') $$,
  'con sesión se leen los nombres por la vista, incluido el de una vinculada'
);

-- anon: solo la vista.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select throws_ok(
  $$ select id from public.inscriptions $$,
  '42501', null, 'anon no lee la tabla'
);
select results_eq(
  $$ select team_name from public.tournament_inscriptions
     where tournament_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Los Pibes') $$,
  'anon lee los nombres de los inscriptos por la vista'
);
select is(
  (select t.status from public.tournaments t where t.id = '11111111-1111-1111-1111-111111111111'),
  'abierto', 'anon lee el estado calculado con las inscripciones reales'
);
select throws_ok(
  $$ select public.add_inscription('11111111-1111-1111-1111-111111111111', 'Anónimos FC') $$,
  '42501', null, 'anon no puede cargar inscripciones'
);

-- La vista expone solo esas columnas, y la tabla solo tiene la policy de lectura del dueño.
reset role;

select columns_are(
  'public', 'tournament_inscriptions',
  array['id', 'tournament_id', 'team_id', 'team_name', 'created_at'],
  'la vista pública expone el nombre del equipo y nada más de la tabla'
);
select policies_are(
  'public', 'inscriptions',
  array['inscriptions: el organizador ve las de sus torneos'],
  'inscriptions solo tiene la lectura del organizador (cargar y borrar van por función)'
);

-- La baja del torneo se lleva sus inscripciones.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select lives_ok(
  $$ select public.withdraw_tournament('33333333-3333-3333-3333-333333333333') $$,
  'la baja de un torneo con inscripciones sale'
);
reset role;
select is_empty(
  $$ select id from public.inscriptions where tournament_id = '33333333-3333-3333-3333-333333333333' $$,
  'la baja del torneo se lleva sus inscripciones'
);

select * from finish();
rollback;
