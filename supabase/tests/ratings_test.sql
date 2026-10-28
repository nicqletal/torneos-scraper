-- Calificación: cuando el partido queda Jugado, cada capitán califica al rival
-- una sola vez, durante 7 días. La que le pusieron se revela cuando califican
-- los dos o vence el plazo. Ver "Calificación" en
-- docs/decisiones-casos-de-uso.md. Cada test corre en una transacción que se
-- descarta al final, así que `now()` es el mismo en todo el archivo: los
-- plazos se prueban armando partidos más o menos viejos.

begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- Caro: capitana de A. Juli: plantel de A. Rafa: capitán de R. Oscar: ajeno.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local',  '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'juli@test.local',  '{"display_name": "Juli"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'rafa@test.local',  '{"display_name": "Rafa"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'oscar@test.local', '{"display_name": "Oscar"}');

insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Real Floresta', 'palermo', 'futbol_5', 'recreativo'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Los Rivales',   'palermo', 'futbol_5', 'recreativo');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', false),
  ('eeeeeeee-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000e1', true);

create function pg_temp.login(p_user uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true)
$$;

-- Un partido entre A y R que empezó hace `p_ago` y dura 2 h. Nace directo en
-- la tabla. Sin cargas, queda Jugado sin resultado a las 48 h del fin del
-- rango: con `p_ago` de 52 h, quedó Jugado hace 2 h.
create function pg_temp.match(p_id uuid, p_ago interval) returns void
language sql as $$
  insert into public.matches (id, range) values (p_id, tstzrange(now() - p_ago, now() - p_ago + interval '2 hours', '[)'));
  insert into public.match_sides (match_id, team_id) values
    (p_id, 'aaaaaaaa-0000-0000-0000-000000000000'),
    (p_id, 'eeeeeeee-0000-0000-0000-000000000000');
$$;

grant execute on all functions in schema pg_temp to authenticated;

-- M1: Jugado sin resultado hace 2 h. Califican los dos.
select pg_temp.match('11111111-0000-0000-0000-000000000000', interval '52 hours');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.rate_rival('11111111-0000-0000-0000-000000000000', 4, '  buena onda  ');
select is(public.received_rating('11111111-0000-0000-0000-000000000000'), null::smallint,
  'Caro calificó primero: no ve nada hasta que califique el rival');

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.rate_rival('11111111-0000-0000-0000-000000000000', 2, null);
select is(public.received_rating('11111111-0000-0000-0000-000000000000'), 4::smallint,
  'califican los dos: Rafa ve la que le pusieron');

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is(public.received_rating('11111111-0000-0000-0000-000000000000'), 2::smallint,
  'y Caro también');

reset role;
select results_eq(
  $$ select n.user_id, n.params ->> 'rival_name' from public.notices n where kind = 'rating_revealed' $$,
  $$ values ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Los Rivales') $$,
  'la segunda calificación le avisa "Ya podés ver tu calificación" solo a la capitana que calificó primero'
);

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.rate_rival('11111111-0000-0000-0000-000000000000', 5, null) $$,
  'P0001', 'Ya calificaste este partido', 'se califica una sola vez, sin editar');

-- Lo que no se califica ------------------------------------------------------

reset role;
-- M2: por jugarse. M3: esperando resultado. M4: caído. M5: en conflicto.
-- M6: no presentado (R no respondió el "no vinieron" de A).
select pg_temp.match('22222222-0000-0000-0000-000000000000', interval '-1 day');
select pg_temp.match('33333333-0000-0000-0000-000000000000', interval '3 hours');
select pg_temp.match('44444444-0000-0000-0000-000000000000', interval '52 hours');
update public.matches set dropped_at = now() - interval '3 days', drop_reason = 'lluvia', dropped_by_team_id = 'eeeeeeee-0000-0000-0000-000000000000'
 where id = '44444444-0000-0000-0000-000000000000';
select pg_temp.match('55555555-0000-0000-0000-000000000000', interval '52 hours');
update public.match_sides set no_show_at = now() - interval '50 hours'
 where match_id = '55555555-0000-0000-0000-000000000000' and team_id = 'aaaaaaaa-0000-0000-0000-000000000000';
update public.match_sides set went_at = now() - interval '49 hours'
 where match_id = '55555555-0000-0000-0000-000000000000' and team_id = 'eeeeeeee-0000-0000-0000-000000000000';
update public.matches set last_action_at = now() - interval '49 hours' where id = '55555555-0000-0000-0000-000000000000';
select pg_temp.match('66666666-0000-0000-0000-000000000000', interval '52 hours');
update public.match_sides set no_show_at = now() - interval '50 hours'
 where match_id = '66666666-0000-0000-0000-000000000000' and team_id = 'aaaaaaaa-0000-0000-0000-000000000000';
update public.matches set last_action_at = now() - interval '50 hours' where id = '66666666-0000-0000-0000-000000000000';

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.rate_rival('22222222-0000-0000-0000-000000000000', 4, null) $$,
  'P0001', 'Se califica cuando el partido queda Jugado', 'no se califica un partido por jugarse');
select throws_ok(
  $$ select public.rate_rival('33333333-0000-0000-0000-000000000000', 4, null) $$,
  'P0001', 'Se califica cuando el partido queda Jugado', 'ni uno que espera el resultado');
select throws_ok(
  $$ select public.rate_rival('44444444-0000-0000-0000-000000000000', 4, null) $$,
  'P0001', 'Solo se califica un partido Jugado', 'ni uno caído');
select throws_ok(
  $$ select public.rate_rival('55555555-0000-0000-0000-000000000000', 4, null) $$,
  'P0001', 'Solo se califica un partido Jugado', 'ni uno en conflicto');
select throws_ok(
  $$ select public.rate_rival('66666666-0000-0000-0000-000000000000', 4, null) $$,
  'P0001', 'Solo se califica un partido Jugado', 'ni uno con falta por no presentarse');

-- Estrellas, comentario y quién califica -------------------------------------

reset role;
-- M7: Jugado hace 2 h.
select pg_temp.match('77777777-0000-0000-0000-000000000000', interval '52 hours');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.rate_rival('77777777-0000-0000-0000-000000000000', 0, null) $$,
  'P0001', 'Las estrellas van de 1 a 5', 'las estrellas van de 1 a 5');
select throws_ok(
  $$ select public.rate_rival('77777777-0000-0000-0000-000000000000', 6, null) $$,
  'P0001', 'Las estrellas van de 1 a 5', 'y no más de 5');
select throws_ok(
  $$ select public.rate_rival('77777777-0000-0000-0000-000000000000', 3, repeat('x', 501)) $$,
  'P0001', 'El comentario va hasta 500 caracteres', 'el comentario va hasta 500 caracteres');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.rate_rival('77777777-0000-0000-0000-000000000000', 3, null) $$,
  'P0001', 'No encontramos el partido', 'el plantel no califica: solo el capitán');
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select throws_ok(
  $$ select public.rate_rival('77777777-0000-0000-0000-000000000000', 3, null) $$,
  'P0001', 'No encontramos el partido', 'un ajeno tampoco');

reset role;
update public.teams set dissolved_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000000';
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select lives_ok(
  $$ select public.rate_rival('77777777-0000-0000-0000-000000000000', 3, repeat('x', 500)) $$,
  'disolver el equipo después de jugar no impide calificar; el comentario llega a 500');
reset role;
update public.teams set dissolved_at = null where id = 'aaaaaaaa-0000-0000-0000-000000000000';

-- Los 7 días -----------------------------------------------------------------

-- M8: quedó Jugado sin resultado hace 7 días justos. M9: hace 7 días menos 1
-- minuto, y solo calificó Rafa. M10: quedó Jugado en el acto hace 8 días,
-- cuando cargó el segundo, y solo calificó Rafa.
select pg_temp.match('88888888-0000-0000-0000-000000000000', interval '9 days 2 hours');
select pg_temp.match('99999999-0000-0000-0000-000000000000', interval '9 days 2 hours' - interval '1 minute');
select pg_temp.match('10101010-0000-0000-0000-000000000000', interval '8 days 3 hours');
update public.match_sides set goals_for = 1, goals_against = 0, result_at = now() - interval '8 days'
 where match_id = '10101010-0000-0000-0000-000000000000' and team_id = 'aaaaaaaa-0000-0000-0000-000000000000';
update public.match_sides set goals_for = 0, goals_against = 1, result_at = now() - interval '8 days 30 minutes'
 where match_id = '10101010-0000-0000-0000-000000000000' and team_id = 'eeeeeeee-0000-0000-0000-000000000000';
update public.matches set last_action_at = now() - interval '8 days' where id = '10101010-0000-0000-0000-000000000000';
insert into public.ratings (match_id, team_id, stars) values
  ('99999999-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000', 5),
  ('10101010-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000', 1);

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.rate_rival('88888888-0000-0000-0000-000000000000', 4, null) $$,
  'P0001', 'Ya venció el plazo para calificar', 'a los 7 días de quedar Jugado ya no se califica');
select is(public.received_rating('99999999-0000-0000-0000-000000000000'), null::smallint,
  'con una sola calificación y el plazo abierto, no se revela');
select is(public.received_rating('10101010-0000-0000-0000-000000000000'), 1::smallint,
  'vencidos los 7 días se revela aunque califique uno solo (cuentan desde que quedó Jugado)');
select lives_ok(
  $$ select public.rate_rival('99999999-0000-0000-0000-000000000000', 4, null) $$,
  'un minuto antes de los 7 días todavía se califica');

-- Quién ve qué ----------------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is(public.received_rating('11111111-0000-0000-0000-000000000000'), null::smallint,
  'el plantel no ve la calificación recibida: solo el capitán');
select throws_ok($$ select * from public.ratings $$, '42501', null, 'el plantel no lee `ratings`');
reset role;
set local role anon;
select throws_ok($$ select * from public.ratings $$, '42501', null, '`anon` no lee `ratings`');
select throws_ok($$ select public.received_rating('11111111-0000-0000-0000-000000000000') $$,
  '42501', null, '`anon` no llama a received_rating');
reset role;

-- La fila de "Tus partidos" ---------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select id, rating_deadline, rated_by_own, received_stars from public.match_details
      where id in ('11111111-0000-0000-0000-000000000000', '77777777-0000-0000-0000-000000000000', '99999999-0000-0000-0000-000000000000',
                   '22222222-0000-0000-0000-000000000000') order by id $$,
  $$ values ('11111111-0000-0000-0000-000000000000'::uuid, now() - interval '2 hours' + interval '7 days', true, 2::smallint),
            ('22222222-0000-0000-0000-000000000000'::uuid, null::timestamptz, false, null::smallint),
            ('77777777-0000-0000-0000-000000000000'::uuid, now() - interval '2 hours' + interval '7 days', true, null::smallint),
            ('99999999-0000-0000-0000-000000000000'::uuid, now() + interval '1 minute', true, 5::smallint) $$,
  'la capitana ve en la fila hasta cuándo califica, si ya calificó y la recibida cuando se revela'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select results_eq(
  $$ select rated_by_own, received_stars from public.match_details where id = '77777777-0000-0000-0000-000000000000' $$,
  $$ values (false, null::smallint) $$,
  'el rival todavía no calificó y no ve la que le pusieron'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select results_eq(
  $$ select rating_deadline is not null, rated_by_own, received_stars from public.match_details where id = '11111111-0000-0000-0000-000000000000' $$,
  $$ values (true, null::boolean, null::smallint) $$,
  'el plantel ve el plazo, pero no si calificaron ni la recibida'
);
reset role;

select * from finish();
rollback;
