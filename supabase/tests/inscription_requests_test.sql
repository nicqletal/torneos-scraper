-- Solicitudes de inscripción: el capitán pide entrar a un torneo, el
-- organizador la acepta (se vuelve una Inscripción vinculada) o la rechaza.
-- Ver "Solicitudes de inscripción" en
-- docs/especificaciones-y-requerimientos/decisiones-casos-de-uso.md.
-- Todo corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(55);

-- Ana organiza. Beto es capitán de Los Pibes y Caro juega ahí. Dani es
-- capitana de Real Floresta. Eli es capitán de Suspendidos FC y está suspendido.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}'),
  ('00000000-0000-0000-0000-00000000000c', 'caro@test.local', '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dani@test.local', '{"display_name": "Dani"}'),
  ('00000000-0000-0000-0000-00000000000e', 'eli@test.local',  '{"display_name": "Eli"}');

update public.profile_contacts set whatsapp = '5491100000002' where user_id = '00000000-0000-0000-0000-00000000000b';
update public.profile_contacts set whatsapp = '5491100000003' where user_id = '00000000-0000-0000-0000-00000000000c';
update public.profile_contacts set whatsapp = '5491100000004' where user_id = '00000000-0000-0000-0000-00000000000d';

set local timezone = 'America/Argentina/Buenos_Aires';

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, capacity, user_id)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa abierta', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, 1, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '22222222-2222-2222-2222-222222222222', 'Copa cerrada', 'futbol_5', 'palermo',
   current_date - 1, current_date + 5, current_date + 30, null, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '44444444-4444-4444-4444-444444444444', 'Copa finalizada', 'futbol_5', 'palermo',
   current_date - 60, current_date - 50, current_date - 1, null, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '55555555-5555-5555-5555-555555555555', 'Copa sin solicitudes', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, null, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '66666666-6666-6666-6666-666666666666', 'Copa grande', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, null, '00000000-0000-0000-0000-00000000000a');

insert into public.teams (id, name, zone_id, modality, level, dissolved_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Real Floresta',   'palermo', 'futbol_5', 'intermedio', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Los Pibes',       'palermo', 'futbol_5', 'recreativo', null),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Disueltos FC',    'palermo', 'futbol_5', 'recreativo', now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Suspendidos FC',  'palermo', 'futbol_5', 'recreativo', null),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Nuevos FC',       'palermo', 'futbol_5', 'recreativo', null),
  ('99999999-0000-0000-0000-000000000000', 'Los Otros',       'palermo', 'futbol_5', 'recreativo', null);

insert into public.team_members (team_id, user_id, is_captain) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-00000000000b', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-00000000000c', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-00000000000d', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-00000000000d', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-00000000000e', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-00000000000b', true),
  ('99999999-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000000d', true);

-- La suspensión de Eli llega después de que es capitán (como en la vida real).
insert into public.account_suspensions (user_id, ends_at, reason, created_by)
values ('00000000-0000-0000-0000-00000000000e', now() + interval '7 days', 'Prueba', '00000000-0000-0000-0000-00000000000a');

update public.tournaments set accepts_requests = false
 where id = '55555555-5555-5555-5555-555555555555';

-- Helpers para actuar como cada uno.
create function pg_temp.as_user(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- 1. Solicitar --------------------------------------------------------------

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');

select lives_ok(
  $$ select public.request_inscription('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  'el capitán solicita inscripción en un torneo Abierto'
);

-- El aviso al organizador se ve como Ana (cada uno lee los suyos).
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select kind::text, params->>'team_name', params->>'tournament_name', params->>'tournament_id'
       from public.notices $$,
  $$ values ('inscription_request_received', 'Los Pibes', 'Copa abierta', '11111111-1111-1111-1111-111111111111') $$,
  'al organizador le llega un aviso por la solicitud nueva'
);

-- Reglas de solicitar.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select throws_ok(
  $$ select public.request_inscription('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '42501', 'Solo el capitán puede solicitar la inscripción de su equipo',
  'un jugador que no es capitán no solicita'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select throws_ok(
  $$ select public.request_inscription('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '23505', 'Tu equipo ya tiene una solicitud pendiente en este torneo',
  'no se solicita dos veces en el mismo torneo'
);
select throws_ok(
  $$ select public.request_inscription('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '55000', 'Este torneo ya no recibe solicitudes: no está abierto',
  'un torneo Cerrado no recibe solicitudes'
);
select throws_ok(
  $$ select public.request_inscription('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '55000', 'Este torneo ya no recibe solicitudes: no está abierto',
  'un torneo Finalizado no recibe solicitudes'
);
select throws_ok(
  $$ select public.request_inscription('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '55000', 'El organizador no recibe solicitudes desde la app: escribile por WhatsApp o Instagram',
  'un torneo con las solicitudes apagadas no recibe solicitudes'
);
select throws_ok(
  $$ select public.request_inscription('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  'P0002', 'El torneo no existe',
  'un torneo que no existe da error'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select throws_ok(
  $$ select public.request_inscription('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd') $$,
  '55000', 'Un equipo disuelto no recibe inscripciones',
  'un equipo disuelto no solicita'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select throws_ok(
  $$ select public.request_inscription('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') $$,
  '42501', 'Tu cuenta está suspendida: no podés solicitar inscripciones',
  'un capitán suspendido no solicita'
);

-- Ya anotado: Ana carga a Real Floresta a mano y Dani no puede solicitar.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
-- Con eso el cupo (1) se completa y el torneo queda Cerrado, pero "ya está
-- anotado" le sirve más al capitán, así que va primero.
select throws_ok(
  $$ select public.request_inscription('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  '23505', 'Tu equipo ya está anotado en este torneo',
  'un equipo ya anotado no solicita'
);

-- 2. Quién ve las solicitudes y retirar -------------------------------------

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select lives_ok(
  $$ select public.request_inscription('66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  'el mismo equipo solicita en otro torneo'
);
select is((select count(*)::int from public.inscription_requests), 2,
  'el capitán ve las solicitudes de su equipo');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.inscription_requests), 0,
  'un jugador que no es capitán no ve las solicitudes de su equipo');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select is((select count(*)::int from public.inscription_requests), 0,
  'otro capitán no ve solicitudes ajenas');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.inscription_requests), 2,
  'el organizador ve las solicitudes de sus torneos');

-- Caro no la puede retirar: no es capitán, y ni siquiera la ve.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select throws_ok(
  $$ select public.withdraw_inscription_request(
       (select id from public.inscription_requests where tournament_id = '66666666-6666-6666-6666-666666666666')) $$,
  '42501', 'La solicitud no existe o no es de tu equipo',
  'un jugador que no es capitán no retira la solicitud'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select lives_ok(
  $$ select public.withdraw_inscription_request(
       (select id from public.inscription_requests where tournament_id = '66666666-6666-6666-6666-666666666666')) $$,
  'el capitán retira su solicitud pendiente'
);
select is((select count(*)::int from public.inscription_requests where tournament_id = '66666666-6666-6666-6666-666666666666'), 0,
  'la solicitud retirada desaparece');
select lives_ok(
  $$ select public.request_inscription('66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  'después de retirarla puede volver a solicitar'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select is(
  (select count(*)::int from public.notices where kind = 'inscription_request_received'
      and params->>'tournament_id' = '66666666-6666-6666-6666-666666666666'),
  2, 'retirar no avisa; volver a solicitar sí'
);

-- 3. Aceptar ----------------------------------------------------------------

-- Una pendiente en un torneo que ya finalizó (se carga directo, como postgres:
-- así pasa cuando nadie la respondió a tiempo).
reset role;
insert into public.inscription_requests (tournament_id, team_id)
values ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
set local role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select throws_ok(
  $$ select public.accept_inscription_request(
       (select id from public.inscription_requests where tournament_id = '66666666-6666-6666-6666-666666666666')) $$,
  '42501', 'La solicitud no existe o no es de tu torneo',
  'solo el organizador del torneo acepta'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.accept_inscription_request(
       (select id from public.inscription_requests where tournament_id = '11111111-1111-1111-1111-111111111111')) $$,
  '23514', 'El cupo está completo: subí el cupo para anotar más equipos',
  'con el cupo completo no se acepta, igual que la carga a mano'
);
select throws_ok(
  $$ select public.accept_inscription_request(
       (select id from public.inscription_requests where tournament_id = '44444444-4444-4444-4444-444444444444')) $$,
  '22023', 'Un torneo finalizado no cambia sus inscripciones',
  'en un torneo Finalizado no se acepta'
);
select lives_ok(
  $$ select public.accept_inscription_request(
       (select id from public.inscription_requests where tournament_id = '66666666-6666-6666-6666-666666666666')) $$,
  'el organizador acepta la solicitud'
);
select results_eq(
  $$ select team_id from public.inscriptions where tournament_id = '66666666-6666-6666-6666-666666666666' $$,
  $$ values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid) $$,
  'aceptarla crea una Inscripción vinculada'
);
select is(
  (select count(*)::int from public.inscription_requests where tournament_id = '66666666-6666-6666-6666-666666666666'), 0,
  'la solicitud aceptada deja de estar pendiente'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select results_eq(
  $$ select kind::text, params->>'team_name', params->>'tournament_name' from public.notices $$,
  $$ values ('inscription_request_accepted', 'Los Pibes', 'Copa grande') $$,
  'el capitán recibe un aviso de que su equipo quedó inscripto'
);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.notices), 0, 'el resto del plantel no recibe aviso');

-- 4. Rechazar ---------------------------------------------------------------

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select throws_ok(
  $$ select public.reject_inscription_request(
       (select id from public.inscription_requests where tournament_id = '11111111-1111-1111-1111-111111111111')) $$,
  '42501', 'La solicitud no existe o no es de tu torneo',
  'solo el organizador del torneo rechaza'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select lives_ok(
  $$ select public.reject_inscription_request(
       (select id from public.inscription_requests where tournament_id = '11111111-1111-1111-1111-111111111111')) $$,
  'el organizador rechaza la solicitud'
);
select throws_ok(
  $$ select public.reject_inscription_request(
       (select id from public.inscription_requests where tournament_id = '11111111-1111-1111-1111-111111111111')) $$,
  '42501', 'La solicitud no existe o no es de tu torneo',
  'una solicitud ya rechazada no se vuelve a rechazar'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select results_eq(
  $$ select kind::text, params->>'team_name', params->>'tournament_name'
       from public.notices where kind = 'inscription_request_rejected' $$,
  $$ values ('inscription_request_rejected', 'Los Pibes', 'Copa abierta') $$,
  'el capitán recibe un aviso del rechazo'
);
select results_eq(
  $$ select status from public.inscription_requests where tournament_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('rechazada') $$,
  'el capitán ve que fue rechazada'
);
select throws_ok(
  $$ select public.request_inscription('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '55000', 'El organizador no aceptó la solicitud de tu equipo en este torneo',
  'después de un rechazo no se vuelve a solicitar en ese torneo'
);
select throws_ok(
  $$ select public.withdraw_inscription_request(
       (select id from public.inscription_requests where tournament_id = '11111111-1111-1111-1111-111111111111')) $$,
  '42501', 'La solicitud no existe o no es de tu equipo',
  'una solicitud rechazada no se retira'
);

-- El organizador igual lo puede cargar a mano (subiendo el cupo).
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update public.tournaments set capacity = 2 where id = '11111111-1111-1111-1111-111111111111';
select lives_ok(
  $$ select public.add_linked_inscription('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  'después de rechazarlo, el organizador lo puede cargar a mano'
);

-- 5. WhatsApp del capitán para el organizador -------------------------------
-- Lo ve mientras el equipo tiene una solicitud pendiente o una Inscripción
-- vinculada en su torneo, y el torneo no está Finalizado.

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select lives_ok(
  $$ select public.request_inscription('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  'Real Floresta solicita en Copa grande'
);
select is_empty(
  $$ select * from public.tournament_captain_whatsapps('66666666-6666-6666-6666-666666666666') $$,
  'quien no es el organizador no ve ningún WhatsApp'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select team_id, whatsapp from public.tournament_captain_whatsapps('66666666-6666-6666-6666-666666666666') order by whatsapp $$,
  $$ values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '5491100000002'),
            ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '5491100000004') $$,
  'el organizador ve el WhatsApp del capitán de los inscriptos y de las solicitudes pendientes'
);
select is_empty(
  $$ select * from public.tournament_captain_whatsapps('44444444-4444-4444-4444-444444444444') $$,
  'en un torneo Finalizado ya no ve ningún WhatsApp'
);

reset role;
insert into public.inscription_requests (tournament_id, team_id, status)
values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rechazada');
-- Beto le pasa la capitanía a Caro.
update public.team_members set is_captain = false
 where team_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and user_id = '00000000-0000-0000-0000-00000000000b';
update public.team_members set is_captain = true
 where team_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and user_id = '00000000-0000-0000-0000-00000000000c';
set local role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select is_empty(
  $$ select * from public.tournament_captain_whatsapps('22222222-2222-2222-2222-222222222222') $$,
  'una solicitud rechazada no da acceso al WhatsApp'
);
select results_eq(
  $$ select whatsapp from public.tournament_captain_whatsapps('66666666-6666-6666-6666-666666666666')
      where team_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  $$ values ('5491100000003') $$,
  'siempre es el WhatsApp del capitán actual'
);

-- 6. Disolver el equipo -----------------------------------------------------
-- Real Floresta tiene una solicitud pendiente en Copa grande y está inscripta
-- en Copa abierta.

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select lives_ok($$ select public.dissolve_team('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$, 'Dani disuelve Real Floresta');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select is(
  (select count(*)::int from public.inscription_requests
    where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and status = 'pendiente'), 0,
  'disolver retira las solicitudes pendientes del equipo'
);
select is(
  (select count(*)::int from public.inscriptions
    where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 1,
  'disolver no toca las inscripciones ya aceptadas'
);

-- 7. Baja del torneo con solicitudes pendientes ------------------------------
-- En Copa grande está inscripto Los Pibes (Beto y Caro). Solicitan Nuevos FC
-- (capitán Beto, que ya recibe el aviso por Los Pibes) y Los Otros (capitana Dani).

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select public.request_inscription('66666666-6666-6666-6666-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select public.request_inscription('66666666-6666-6666-6666-666666666666', '99999999-0000-0000-0000-000000000000');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ select public.withdraw_tournament('66666666-6666-6666-6666-666666666666') $$, 'Ana da de baja Copa grande');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select results_eq(
  $$ select kind::text, params->>'team_name', params->>'tournament_name', params->>'team_id'
       from public.notices where kind in ('tournament_withdrawn', 'inscription_request_withdrawn') $$,
  $$ values ('inscription_request_withdrawn', 'Los Otros', 'Copa grande', '99999999-0000-0000-0000-000000000000') $$,
  'el capitán de un equipo con una solicitud pendiente recibe un aviso de la baja'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select results_eq(
  $$ select kind::text from public.notices where kind in ('tournament_withdrawn', 'inscription_request_withdrawn') $$,
  $$ values ('tournament_withdrawn') $$,
  'quien ya recibe el aviso por un equipo inscripto no recibe otro por la solicitud'
);

-- 8. Contador e interruptor --------------------------------------------------

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select t.id, public.pending_requests_count(t) from public.tournaments t
      where t.id in ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444')
      order by t.id $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, 0),
            ('44444444-4444-4444-4444-444444444444'::uuid, 1) $$,
  'el organizador ve cuántas solicitudes pendientes tiene cada torneo (las rechazadas no cuentan)'
);

update public.tournaments set accepts_requests = false where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select accepts_requests from public.tournaments where id = '11111111-1111-1111-1111-111111111111'), false,
  'el organizador apaga las solicitudes de su torneo'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select is(
  (select public.pending_requests_count(t) from public.tournaments t where t.id = '44444444-4444-4444-4444-444444444444'), 0,
  'otro usuario no cuenta solicitudes ajenas'
);
update public.tournaments set accepts_requests = true where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select accepts_requests from public.tournaments where id = '11111111-1111-1111-1111-111111111111'), false,
  'nadie más que el organizador cambia el interruptor'
);

-- 9. Carga a mano de un equipo con una solicitud pendiente --------------------

reset role;
insert into public.inscription_requests (tournament_id, team_id)
values ('22222222-2222-2222-2222-222222222222', '99999999-0000-0000-0000-000000000000');
set local role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select lives_ok(
  $$ select public.add_linked_inscription('22222222-2222-2222-2222-222222222222', '99999999-0000-0000-0000-000000000000') $$,
  'el organizador carga a mano un equipo que tenía una solicitud pendiente'
);
select is(
  (select count(*)::int from public.inscription_requests
    where tournament_id = '22222222-2222-2222-2222-222222222222' and team_id = '99999999-0000-0000-0000-000000000000'), 0,
  'cargarlo a mano resuelve su solicitud pendiente'
);

select * from finish();
rollback;
