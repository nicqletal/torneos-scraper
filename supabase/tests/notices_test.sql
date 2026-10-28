-- Avisos (la campanita): cada uno lee solo los suyos y nadie los escribe por
-- la API. `notify` reparte un aviso entre el capitán o el plantel del momento,
-- sin el autor y sin duplicados; `mark_notices_read` marca solo los propios;
-- la baja de un torneo avisa al plantel de cada equipo con inscripción
-- vinculada. Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Caro: capitana de A. Juli: plantel de A y de B. Beto: capitán de B.
-- Oscar: ajeno. Ana: organizadora.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local',  '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'juli@test.local',  '{"display_name": "Juli"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'beto@test.local',  '{"display_name": "Beto"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'oscar@test.local', '{"display_name": "Oscar"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'ana@test.local',   '{"display_name": "Ana"}');

insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Real Floresta', 'palermo', 'futbol_5', 'intermedio'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Los Pibes',     'palermo', 'futbol_5', 'intermedio');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-0000000000c1', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-0000000000a1', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-0000000000b1', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-0000000000a1', false);

-- Un aviso para Caro y otro para Oscar, escritos como postgres.
insert into public.notices (id, user_id, kind, params) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'proposal_rejected', '{"rival_name": "Los Pibes"}'),
  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000f1', 'proposal_rejected', '{"rival_name": "Los Pibes"}');

-- Visibilidad ---------------------------------------------------------------

set local role anon;
select throws_ok(
  $$ select 1 from public.notices $$,
  '42501', null,
  'anon no ve ningún aviso: ni siquiera puede leer la tabla'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);

select results_eq(
  $$ select id from public.notices $$,
  $$ values ('11111111-0000-0000-0000-000000000001'::uuid) $$,
  'cada uno ve solo sus avisos'
);

select throws_ok(
  $$ insert into public.notices (user_id, kind, params)
     values ('00000000-0000-0000-0000-0000000000c1', 'proposal_rejected', '{}') $$,
  '42501', null,
  'nadie escribe avisos por la API'
);

select throws_ok(
  $$ update public.notices set read_at = now() $$,
  '42501', null,
  'nadie actualiza avisos directo: se marcan leídos con mark_notices_read'
);

select throws_ok(
  $$ select public.notify('proposal_rejected', '{}', array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::uuid[]) $$,
  '42501', null,
  'notify es interno: un usuario no lo puede llamar'
);

-- notify ----------------------------------------------------------------------
-- Se llama como postgres (como lo harían las funciones de cada acción), con la
-- sesión de quien hace la acción en los claims.

reset role;

-- Caro hace algo que avisa a los dos planteles: Juli está en los dos y recibe
-- uno solo; Caro, la autora, ninguno; Oscar, ajeno, ninguno.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);
select public.notify('match_agreed', '{"team_a": "Real Floresta", "team_b": "Los Pibes"}',
  array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[]);

select results_eq(
  $$ select user_id from public.notices where kind = 'match_agreed' order by user_id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'::uuid), ('00000000-0000-0000-0000-0000000000b1'::uuid) $$,
  'notify a los dos planteles: uno por usuario distinto, sin la autora ni ajenos'
);

select is(
  (select params from public.notices where kind = 'match_agreed' limit 1),
  '{"team_a": "Real Floresta", "team_b": "Los Pibes"}'::jsonb,
  'el aviso guarda la foto de los datos del momento'
);

-- Un aviso que pide una acción va solo al capitán.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);
select public.notify('proposal_received', '{"rival_name": "Real Floresta"}',
  array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], true);

select results_eq(
  $$ select user_id from public.notices where kind = 'proposal_received' $$,
  $$ values ('00000000-0000-0000-0000-0000000000b1'::uuid) $$,
  'notify solo al capitán: el resto del plantel no lo recibe'
);

-- Si quien hace la acción es el capitán destinatario, no se avisa a sí mismo.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000b1", "role": "authenticated"}', true);
select public.notify('proposal_cancelled', '{"rival_name": "Real Floresta"}',
  array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], true);

select is_empty(
  $$ select 1 from public.notices where kind = 'proposal_cancelled' $$,
  'notify nunca le avisa al autor de la acción'
);

-- El plantel es el del momento: quien entra después no recibe avisos viejos.
insert into public.team_members (team_id, user_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-0000000000f1');

select is(
  (select count(*)::int from public.notices
    where user_id = '00000000-0000-0000-0000-0000000000f1' and kind = 'match_agreed'),
  0,
  'quien se suma al plantel después no recibe avisos de hechos anteriores'
);

-- mark_notices_read -------------------------------------------------------------

-- Caro abre la campanita y manda sus ids y, de paso, el de un aviso de Oscar.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);
select public.mark_notices_read(array[
  '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002'
]::uuid[]);

select is(
  (select count(*)::int from public.notices where read_at is null),
  0,
  'mark_notices_read marca leídos los avisos propios que se vieron'
);

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000f1", "role": "authenticated"}', true);
select is(
  (select read_at from public.notices where id = '11111111-0000-0000-0000-000000000002'),
  null,
  'mark_notices_read no toca avisos ajenos'
);

set local role anon;
select throws_ok(
  $$ select public.mark_notices_read(array['11111111-0000-0000-0000-000000000002']::uuid[]) $$,
  '42501', null,
  'anon no puede marcar avisos'
);

-- Baja de torneo --------------------------------------------------------------

reset role;
set local timezone = 'America/Argentina/Buenos_Aires';

-- Oscar se va de A: quien se fue no recibe más avisos.
delete from public.team_members
 where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
   and user_id = '00000000-0000-0000-0000-0000000000f1';

-- Copa de Ana con A y B anotados por vínculo y otro equipo anotado por
-- nombre. Juli está en A y en B.
insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, capacity, user_id)
values
  ('copa.test', '22222222-2222-2222-2222-222222222222', 'Copa Palermo', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, null, '00000000-0000-0000-0000-0000000000e1');

insert into public.inscriptions (tournament_id, team_id, team_name) values
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null),
  ('22222222-2222-2222-2222-222222222222', null, 'Deportivo Lugano');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated"}', true);
select public.withdraw_tournament('22222222-2222-2222-2222-222222222222');

reset role;
select results_eq(
  $$ select user_id, params from public.notices where kind = 'tournament_withdrawn' order by user_id $$,
  $$ values
       ('00000000-0000-0000-0000-0000000000a1'::uuid,
        '{"tournament_name": "Copa Palermo", "team_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "team_name": "Real Floresta"}'::jsonb),
       ('00000000-0000-0000-0000-0000000000b1'::uuid,
        '{"tournament_name": "Copa Palermo", "team_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "team_name": "Los Pibes"}'::jsonb),
       ('00000000-0000-0000-0000-0000000000c1'::uuid,
        '{"tournament_name": "Copa Palermo", "team_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "team_name": "Real Floresta"}'::jsonb) $$,
  'la baja avisa una sola vez a cada jugador del plantel del momento de los equipos con inscripción vinculada (a Juli, que está en dos, con el primero), y a nadie más'
);

select * from finish();
rollback;
