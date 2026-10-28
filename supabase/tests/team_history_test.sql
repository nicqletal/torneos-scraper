-- Historial en la página del equipo: las vistas `team_match_history` y
-- `team_record` son públicas (anon y authenticated), solo con partidos
-- cerrados y nunca con cancha ni hora. Ver "Historial en la página del equipo"
-- en docs/decisiones-casos-de-uso.md. Cada test corre en una transacción que se
-- descarta al final, así que `now()` es el mismo en todo el archivo.

begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Caro: capitana de A. Rafa: capitán de R. Xavi: capitán de X. Oscar: ajeno.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local',  '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'rafa@test.local',  '{"display_name": "Rafa"}'),
  ('00000000-0000-0000-0000-0000000000d1', 'xavi@test.local',  '{"display_name": "Xavi"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'oscar@test.local', '{"display_name": "Oscar"}');

insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Real Floresta', 'palermo',  'futbol_5', 'recreativo'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Los Rivales',   'belgrano', 'futbol_5', 'recreativo'),
  ('dddddddd-0000-0000-0000-000000000000', 'Deportivo X',   'moron',    'futbol_5', 'recreativo'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'Sin Partidos',  'moron',    'futbol_5', 'recreativo');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
  ('eeeeeeee-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000e1', true),
  ('dddddddd-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', true);

create function pg_temp.login(p_user uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true)
$$;

-- Un partido de A contra `p_rival` que empezó hace `p_ago` (negativo: en el
-- futuro) y dura 2 h. Nace directo en la tabla.
create function pg_temp.match(p_id uuid, p_ago interval, p_rival uuid) returns void
language sql as $$
  insert into public.matches (id, range) values (p_id, tstzrange(now() - p_ago, now() - p_ago + interval '2 hours', '[)'));
  insert into public.match_sides (match_id, team_id) values
    (p_id, 'aaaaaaaa-0000-0000-0000-000000000000'),
    (p_id, p_rival);
$$;

-- Un lado del partido dijo "no vinieron" hace `p_ago`.
create function pg_temp.no_show(p_id uuid, p_team uuid, p_ago interval) returns void
language sql as $$
  update public.match_sides set no_show_at = now() - p_ago where match_id = p_id and team_id = p_team;
  update public.matches set last_action_at = now() - p_ago where id = p_id;
$$;

-- La fecha (sin hora) en Buenos Aires de algo que pasó hace `p_ago`.
create function pg_temp.day(p_ago interval) returns date
language sql as $$
  select ((now() - p_ago) at time zone 'America/Argentina/Buenos_Aires')::date
$$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- M1: Jugado 3–1 para A, cargado igual por los dos. Calificaron los dos.
select pg_temp.match('11111111-0000-0000-0000-000000000000', interval '10 days', 'eeeeeeee-0000-0000-0000-000000000000');
update public.match_sides set goals_for = 3, goals_against = 1, result_at = now() - interval '10 days'
 where match_id = '11111111-0000-0000-0000-000000000000' and team_id = 'aaaaaaaa-0000-0000-0000-000000000000';
update public.match_sides set goals_for = 1, goals_against = 3, result_at = now() - interval '10 days'
 where match_id = '11111111-0000-0000-0000-000000000000' and team_id = 'eeeeeeee-0000-0000-0000-000000000000';
insert into public.ratings (match_id, team_id, stars) values
  ('11111111-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000', 4),
  ('11111111-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 2);

-- M2: Jugado sin resultado hace unos 3 días. R le puso 1 a A: no se reveló.
select pg_temp.match('22222222-0000-0000-0000-000000000000', interval '5 days', 'eeeeeeee-0000-0000-0000-000000000000');
insert into public.ratings (match_id, team_id, stars) values
  ('22222222-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000', 1);

-- M3: R lo tiró 2 h antes de la hora de inicio: falta para R.
select pg_temp.match('33333333-0000-0000-0000-000000000000', interval '4 days', 'eeeeeeee-0000-0000-0000-000000000000');
update public.matches set dropped_at = now() - interval '4 days 2 hours', drop_reason = 'nos faltan dos',
       dropped_by_team_id = 'eeeeeeee-0000-0000-0000-000000000000'
 where id = '33333333-0000-0000-0000-000000000000';

-- M4: pasado mañana, ya caído de común acuerdo.
select pg_temp.match('44444444-0000-0000-0000-000000000000', interval '-2 days', 'eeeeeeee-0000-0000-0000-000000000000');
update public.matches set dropped_at = now() - interval '1 hour', drop_reason = 'lluvia', drop_mutual = true,
       dropped_by_team_id = 'aaaaaaaa-0000-0000-0000-000000000000'
 where id = '44444444-0000-0000-0000-000000000000';

-- M5: A dijo "no vinieron" y X respondió "fuimos": en conflicto.
select pg_temp.match('55555555-0000-0000-0000-000000000000', interval '6 days', 'dddddddd-0000-0000-0000-000000000000');
select pg_temp.no_show('55555555-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', interval '5 days');
update public.match_sides set went_at = now() - interval '5 days'
 where match_id = '55555555-0000-0000-0000-000000000000' and team_id = 'dddddddd-0000-0000-0000-000000000000';

-- M6: A dijo "no vinieron" y R no respondió en 48 h: R no se presentó.
select pg_temp.match('66666666-0000-0000-0000-000000000000', interval '7 days', 'eeeeeeee-0000-0000-0000-000000000000');
select pg_temp.no_show('66666666-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', interval '6 days');

-- M7: A lo tiró con más de 24 h: sin falta.
select pg_temp.match('77777777-0000-0000-0000-000000000000', interval '8 days', 'eeeeeeee-0000-0000-0000-000000000000');
update public.matches set dropped_at = now() - interval '9 days', drop_reason = 'cambio de planes',
       dropped_by_team_id = 'aaaaaaaa-0000-0000-0000-000000000000'
 where id = '77777777-0000-0000-0000-000000000000';

-- M8: por jugarse, con cancha y hora cargadas. M9: esperando el resultado.
select pg_temp.match('88888888-0000-0000-0000-000000000000', interval '-1 day', 'eeeeeeee-0000-0000-0000-000000000000');
update public.matches set venue = 'Club Norte', venue_start_at = now() + interval '1 day', venue_team_id = 'aaaaaaaa-0000-0000-0000-000000000000'
 where id = '88888888-0000-0000-0000-000000000000';
select pg_temp.match('99999999-0000-0000-0000-000000000000', interval '3 hours', 'eeeeeeee-0000-0000-0000-000000000000');

-- M10: X dijo "no vinieron" y A cargó un resultado: otro conflicto con X.
select pg_temp.match('10101010-0000-0000-0000-000000000000', interval '9 days', 'dddddddd-0000-0000-0000-000000000000');
select pg_temp.no_show('10101010-0000-0000-0000-000000000000', 'dddddddd-0000-0000-0000-000000000000', interval '9 days');
update public.match_sides set goals_for = 2, goals_against = 0, result_at = now() - interval '9 days'
 where match_id = '10101010-0000-0000-0000-000000000000' and team_id = 'aaaaaaaa-0000-0000-0000-000000000000';

-- M11: R dijo "no vinieron" y A no respondió: A no se presentó.
select pg_temp.match('12121212-0000-0000-0000-000000000000', interval '11 days', 'eeeeeeee-0000-0000-0000-000000000000');
select pg_temp.no_show('12121212-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000', interval '11 days');

-- M12: Jugado sin resultado hace 10 días. R le puso 5 a A y venció el plazo:
-- se reveló aunque A no calificó.
select pg_temp.match('13131313-0000-0000-0000-000000000000', interval '12 days', 'eeeeeeee-0000-0000-0000-000000000000');
insert into public.ratings (match_id, team_id, stars) values
  ('13131313-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000', 5);

-- El historial de A, visto por un anónimo ---------------------------------------

set local role anon;
select results_eq(
  $$ select recency, match_id, played_on, phase, rival_team_name from public.team_match_history
      where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' order by recency $$,
  $$ values (1::bigint, '44444444-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '-2 days'), 'caido', 'Los Rivales'),
            (2, '33333333-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '4 days'),  'caido',         'Los Rivales'),
            (3, '22222222-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '5 days'),  'jugado',        'Los Rivales'),
            (4, '55555555-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '6 days'),  'en_conflicto',  'Deportivo X'),
            (5, '66666666-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '7 days'),  'no_presentado', 'Los Rivales'),
            (6, '77777777-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '8 days'),  'caido',         'Los Rivales'),
            (7, '10101010-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '9 days'),  'en_conflicto',  'Deportivo X'),
            (8, '11111111-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '10 days'), 'jugado',        'Los Rivales'),
            (9, '12121212-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '11 days'), 'no_presentado', 'Los Rivales'),
            (10, '13131313-0000-0000-0000-000000000000'::uuid, pg_temp.day(interval '12 days'), 'jugado',       'Los Rivales') $$,
  'un anónimo ve solo los partidos cerrados de A, del más nuevo al más viejo, sin los por jugarse ni los que esperan resultado'
);

select results_eq(
  $$ select match_id, goals_for, goals_against from public.team_match_history
      where match_id in ('11111111-0000-0000-0000-000000000000', '13131313-0000-0000-0000-000000000000')
      order by team_id, match_id $$,
  $$ values ('11111111-0000-0000-0000-000000000000'::uuid, 3::smallint, 1::smallint),
            ('13131313-0000-0000-0000-000000000000'::uuid, null, null),
            ('11111111-0000-0000-0000-000000000000'::uuid, 1::smallint, 3::smallint),
            ('13131313-0000-0000-0000-000000000000'::uuid, null, null) $$,
  'los goles de un Jugado, desde el lado del dueño de cada historial; sin resultado, null'
);

select results_eq(
  $$ select match_id, drop_reason, dropped_by_own, drop_mutual, drop_fault from public.team_match_history
      where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' and phase = 'caido' order by recency $$,
  $$ values ('44444444-0000-0000-0000-000000000000'::uuid, 'lluvia', true, true, false),
            ('33333333-0000-0000-0000-000000000000'::uuid, 'nos faltan dos', false, false, true),
            ('77777777-0000-0000-0000-000000000000'::uuid, 'cambio de planes', true, false, false) $$,
  'un caído trae el motivo, quién lo tiró, si fue de común acuerdo y si sumó falta'
);

select results_eq(
  $$ select match_id, own_said_no_show, rival_said_no_show from public.team_match_history
      where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' and phase = 'en_conflicto' order by recency $$,
  $$ values ('55555555-0000-0000-0000-000000000000'::uuid, true, false),
            ('10101010-0000-0000-0000-000000000000'::uuid, false, true) $$,
  'un conflicto trae las dos versiones: quién dijo "no vinieron"'
);

select results_eq(
  $$ select match_id, absent_own from public.team_match_history
      where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' and phase = 'no_presentado' order by recency $$,
  $$ values ('66666666-0000-0000-0000-000000000000'::uuid, false),
            ('12121212-0000-0000-0000-000000000000'::uuid, true) $$,
  'una falta por no presentarse dice quién fue el ausente'
);

select is(
  (select count(*) from public.team_match_history where team_id = 'eeeeeeee-0000-0000-0000-000000000000'),
  8::bigint,
  'el rival tiene su propio historial con los mismos partidos'
);

reset role;

-- Nunca cancha ni hora -----------------------------------------------------------

select hasnt_column('public', 'team_match_history', 'venue', 'el historial no tiene la cancha');
select hasnt_column('public', 'team_match_history', 'venue_start_at', 'ni la hora coordinada');
select hasnt_column('public', 'team_match_history', 'range', 'ni el rango');
select hasnt_column('public', 'team_match_history', 'start_at', 'ni la hora de inicio');
select col_type_is('public', 'team_match_history', 'played_on', 'date', 'la fecha va sin hora');

-- El nombre y la zona actuales -----------------------------------------------------

update public.teams set name = 'Los Rivales FC', zone_id = 'san-isidro' where id = 'eeeeeeee-0000-0000-0000-000000000000';
set local role anon;
select results_eq(
  $$ select distinct rival_team_id, rival_team_name, rival_zone_name from public.team_match_history
      where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' and rival_team_id = 'eeeeeeee-0000-0000-0000-000000000000' $$,
  $$ values ('eeeeeeee-0000-0000-0000-000000000000'::uuid, 'Los Rivales FC', 'San Isidro') $$,
  'el rival aparece con su nombre y su zona actuales'
);

-- El contador y las estrellas --------------------------------------------------------

select results_eq(
  $$ select team_id, played, faults, conflicts, conflict_rivals, rating_avg, rating_count from public.team_record
      where team_id in ('aaaaaaaa-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000',
                        'dddddddd-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000')
      order by team_id $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid, 3::bigint, 1::bigint, 2::bigint, 1::bigint, 4.5::numeric, 2::bigint),
            ('bbbbbbbb-0000-0000-0000-000000000000'::uuid, 0, 0, 0, 0, null, 0),
            ('dddddddd-0000-0000-0000-000000000000'::uuid, 0, 0, 2, 1, null, 0),
            ('eeeeeeee-0000-0000-0000-000000000000'::uuid, 3, 2, 0, 0, 2.0, 1) $$,
  'jugados, faltas, conflictos con rivales distintos y estrellas reveladas (la de 1 sin revelar no cuenta)'
);

select is(
  (select count(*) from public.team_record),
  (select count(*) from public.teams),
  'hay un contador por equipo, aunque no haya jugado'
);

reset role;

-- Con sesión también, y sin ver nada más por las tablas -------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select is(
  (select count(*) from public.team_match_history where team_id = 'aaaaaaaa-0000-0000-0000-000000000000'),
  10::bigint,
  'un usuario ajeno con sesión lee el historial'
);
select is(
  (select played from public.team_record where team_id = 'aaaaaaaa-0000-0000-0000-000000000000'),
  3::bigint,
  'y el contador'
);
select is_empty($$ select 1 from public.matches $$, 'pero sigue sin ver los partidos por la tabla');
reset role;

set local role anon;
select throws_ok($$ select * from public.ratings $$, '42501', null, '`anon` sigue sin leer `ratings`');
reset role;

select * from finish();
rollback;
