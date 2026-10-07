-- Inscripción vinculada: solo el organizador anota un Equipo de la app por
-- función, con las reglas de `add_inscription` más: el equipo existe, no está
-- disuelto y tiene como mucho una inscripción por torneo. La vista pública
-- muestra el nombre actual del equipo. Cada test corre en una transacción que
-- se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

set local timezone = 'America/Argentina/Buenos_Aires';

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, capacity, user_id, organizer_name)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa abierta', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, 2, '00000000-0000-0000-0000-00000000000a', null),
  ('copa.test', '22222222-2222-2222-2222-222222222222', 'Copa cerrada', 'futbol_5', 'palermo',
   current_date - 1, current_date + 5, current_date + 30, null, '00000000-0000-0000-0000-00000000000a', null),
  ('copa.test', '33333333-3333-3333-3333-333333333333', 'Copa en curso', 'futbol_5', 'palermo',
   current_date - 20, current_date - 10, current_date + 10, null, '00000000-0000-0000-0000-00000000000a', null),
  ('copa.test', '44444444-4444-4444-4444-444444444444', 'Copa finalizada', 'futbol_5', 'palermo',
   current_date - 60, current_date - 50, current_date - 1, null, '00000000-0000-0000-0000-00000000000a', null),
  ('copa.test', '55555555-5555-5555-5555-555555555555', 'Copa copiada', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, null, null, 'Liga del Sur');

-- Equipos: tres activos y uno disuelto (insertados directo, como postgres).
insert into public.teams (id, name, zone_id, modality, level, dissolved_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Real Floresta', 'palermo', 'futbol_5', 'intermedio', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Los Pibes',     'palermo', 'futbol_5', 'recreativo', null),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'El Tercero',    'palermo', 'futbol_5', 'recreativo', null),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Disueltos FC',  'palermo', 'futbol_5', 'recreativo', now());

-- Ana, con sesión: anota equipos en sus torneos.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select lives_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  'el organizador anota un equipo de la app en un torneo Abierto'
);
select lives_ok(
  $$ select public.add_linked_inscription('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  'en un torneo Cerrado también se anota, y el mismo equipo puede estar en dos torneos'
);
select lives_ok(
  $$ select public.add_linked_inscription('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  'en un torneo En curso también se anota'
);

-- La fila queda vinculada: `team_id` y sin nombre.
select results_eq(
  $$ select team_id, team_name from public.inscriptions where tournament_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, null::text) $$,
  'una inscripción vinculada guarda el equipo y no el nombre'
);

-- Reglas del torneo, iguales a las de la inscripción por nombre.
select throws_ok(
  $$ select public.add_linked_inscription('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  '22023', 'Un torneo finalizado no cambia sus inscripciones',
  'en un torneo Finalizado no se anota'
);
select throws_ok(
  $$ select public.add_linked_inscription('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'un torneo copiado no admite inscripciones vinculadas'
);
select throws_ok(
  $$ select public.add_linked_inscription('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'un torneo que no existe da el mismo error que uno ajeno'
);

-- Reglas del equipo.
select throws_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999') $$,
  'P0002', 'El equipo no existe',
  'un equipo que no existe no se anota'
);
select throws_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd') $$,
  '55000', 'Un equipo disuelto no recibe inscripciones',
  'un equipo disuelto no recibe inscripciones'
);
select throws_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  '23505', 'Ese equipo ya está anotado en este torneo',
  'un equipo tiene como mucho una inscripción por torneo, con un mensaje claro'
);

-- Cupo: con 2 lugares, el segundo lo completa; el tercero no entra, y el que
-- ya está anotado recibe "ya está anotado" aunque el cupo esté completo.
select lives_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  'la inscripción vinculada que completa el cupo entra'
);
select is(
  (select t.status from public.tournaments t where t.id = '11111111-1111-1111-1111-111111111111'),
  'cerrado', 'las vinculadas cuentan para el cupo igual que las por nombre'
);
select throws_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc') $$,
  '23514', 'El cupo está completo: subí el cupo para anotar más equipos',
  'con el cupo completo no se anota otro equipo'
);
select throws_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '23505', 'Ese equipo ya está anotado en este torneo',
  'con el cupo completo, un equipo ya anotado recibe "ya está anotado" y no "cupo completo"'
);

-- Las dos formas conviven en el mismo torneo.
select lives_ok(
  $$ select public.add_inscription('22222222-2222-2222-2222-222222222222', 'Deportivo Lugano') $$,
  'en un torneo con vinculadas también se carga por nombre'
);

-- Borrar una vinculada va por `remove_inscription`, como cualquier otra.
select lives_ok(
  $$ select public.remove_inscription((select id from public.inscriptions
       where tournament_id = '33333333-3333-3333-3333-333333333333' and team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')) $$,
  'el organizador borra una inscripción vinculada'
);
select lives_ok(
  $$ select public.add_linked_inscription('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  'borrada la inscripción, el equipo se puede volver a anotar'
);

-- Beto, con sesión: no anota en torneos ajenos.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select throws_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'otro usuario no anota equipos en un torneo ajeno'
);

-- Vista pública: el nombre sale del equipo, y lo sigue si se renombra.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select set_eq(
  $$ select team_name, team_id from public.tournament_inscriptions
     where tournament_id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values ('Real Floresta', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid), ('Deportivo Lugano', null::uuid) $$,
  'anon lee el nombre del equipo vinculado por la vista, con su id para enlazar a su página'
);
select set_eq(
  $$ select tournament_id from public.tournament_inscriptions
     where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid), ('22222222-2222-2222-2222-222222222222'::uuid), ('33333333-3333-3333-3333-333333333333'::uuid) $$,
  'la historia del equipo sale de la vista: sus inscripciones vinculadas'
);
select throws_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc') $$,
  '42501', null, 'anon no puede anotar equipos'
);

reset role;
update public.teams set name = 'Real Floresta 2026' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
-- `set_eq` y no `results_eq`: dentro de una transacción `now()` no cambia,
-- así que `created_at` empata y el orden no está definido.
select set_eq(
  $$ select team_name from public.tournament_inscriptions
     where tournament_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Real Floresta 2026'), ('Los Pibes') $$,
  'si el equipo se renombra, la ficha muestra el nombre nuevo'
);

-- La función no abrió ninguna puerta nueva sobre las tablas.
select policies_are(
  'public', 'inscriptions',
  array['inscriptions: el organizador ve las de sus torneos'],
  'inscriptions sigue con la única policy de lectura del organizador'
);
select policies_are(
  'public', 'team_members',
  array['team_members: solo los integrantes ven el plantel'],
  'la visibilidad del plantel no cambia'
);

select * from finish();
rollback;
