-- Resultado y presentismo: desde la hora de inicio, cada capitán carga el
-- resultado ("Nosotros / Ellos") o reporta "No vinieron". La fase la calcula
-- `match_phase` con los plazos de 48 h. Ver "Después del partido" en
-- docs/decisiones-casos-de-uso.md. Cada test corre en una transacción que se
-- descarta al final, así que `now()` es el mismo en todo el archivo: los plazos
-- se prueban pasando `p_now`.

begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

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
-- la tabla: la propuesta ya se probó.
create function pg_temp.match(p_id uuid, p_ago interval) returns void
language sql as $$
  insert into public.matches (id, range) values (p_id, tstzrange(now() - p_ago, now() - p_ago + interval '2 hours', '[)'));
  insert into public.match_sides (match_id, team_id) values
    (p_id, 'aaaaaaaa-0000-0000-0000-000000000000'),
    (p_id, 'eeeeeeee-0000-0000-0000-000000000000');
$$;

create function pg_temp.phase(p_id uuid, p_at timestamptz) returns text
language sql as $$
  select public.match_phase(m, p_at) from public.matches m where m.id = p_id
$$;

grant execute on all functions in schema pg_temp to authenticated;

-- M1: los dos cargan el mismo resultado, espejado.
select pg_temp.match('11111111-0000-0000-0000-000000000000', interval '3 hours');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.report_result('11111111-0000-0000-0000-000000000000', 3, 1);
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.report_result('11111111-0000-0000-0000-000000000000', 1, 3);

reset role;
select is(pg_temp.phase('11111111-0000-0000-0000-000000000000', now()), 'jugado',
  'los dos cargan el mismo resultado espejado: Jugado en el acto');

select results_eq(
  $$ select n.user_id, n.params ->> 'team_a', n.params ->> 'goals_a', n.params ->> 'goals_b', n.params ->> 'team_b'
       from public.notices n where kind = 'match_played' order by n.user_id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Los Rivales', '1', '3', 'Real Floresta'),
            ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Los Rivales', '1', '3', 'Real Floresta') $$,
  'avisa "Jugado" con el resultado a los dos planteles, sin quien cargó último'
);
select results_eq(
  $$ select n.user_id, n.params ->> 'rival_name', n.params ->> 'goals_for', n.params ->> 'goals_against', (n.params ->> 'deadline')::timestamptz
       from public.notices n where kind = 'result_to_confirm' $$,
  $$ values ('00000000-0000-0000-0000-0000000000e1'::uuid, 'Real Floresta', '1', '3', now() + interval '48 hours') $$,
  'la primera carga le avisa al capitán rival "confirmá o corregí", con los goles desde su lado y el vencimiento'
);

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select results_eq(
  $$ select phase, score_for, score_against, deadline from public.match_details where id = '11111111-0000-0000-0000-000000000000' $$,
  $$ values ('jugado', 3::smallint, 1::smallint, null::timestamptz) $$,
  'el plantel ve el partido Jugado con el resultado desde su lado y sin plazo'
);
select throws_ok(
  $$ select public.report_result('11111111-0000-0000-0000-000000000000', 1, 1) $$,
  'P0001', 'No encontramos el partido', 'el plantel no carga el resultado: solo el capitán');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.report_result('11111111-0000-0000-0000-000000000000', 1, 1) $$,
  'P0001', 'El resultado del partido ya está cerrado', 'un partido Jugado ya no se corrige');

-- Uno solo carga, resultados distintos, nadie carga --------------------------

reset role;
delete from public.notices;
-- M2: solo Caro carga. M3: cargan distinto. M4: nadie carga (el rango
-- terminó hace 1 h).
select pg_temp.match('22222222-0000-0000-0000-000000000000', interval '3 hours');
select pg_temp.match('33333333-0000-0000-0000-000000000000', interval '3 hours');
select pg_temp.match('44444444-0000-0000-0000-000000000000', interval '3 hours');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.report_result('22222222-0000-0000-0000-000000000000', 100, 0) $$,
  'P0001', 'Los goles van de 0 a 99', 'los goles van de 0 a 99');
select throws_ok(
  $$ select public.report_result('22222222-0000-0000-0000-000000000000', -1, 0) $$,
  'P0001', 'Los goles van de 0 a 99', 'y no son negativos');
select public.report_result('22222222-0000-0000-0000-000000000000', 2, 0);
select public.report_result('33333333-0000-0000-0000-000000000000', 1, 0);
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.report_result('33333333-0000-0000-0000-000000000000', 2, 2);

reset role;
select results_eq(
  $$ select n.user_id, n.params ->> 'goals_for', n.params ->> 'goals_against', coalesce((n.params ->> 'mismatch')::boolean, false)
       from public.notices n where kind = 'result_to_confirm' order by n.user_id, n.params ->> 'goals_for', n.params ->> 'goals_against' $$,
  $$ values ('00000000-0000-0000-0000-0000000000c1'::uuid, '2', '2', true),
            ('00000000-0000-0000-0000-0000000000e1'::uuid, '0', '1', false),
            ('00000000-0000-0000-0000-0000000000e1'::uuid, '0', '2', false) $$,
  'el aviso dice si el resultado no coincide con el que ya cargó quien lo recibe'
);
set local role authenticated;

select is(pg_temp.phase('22222222-0000-0000-0000-000000000000', now() + interval '48 hours' - interval '1 second'),
  'esperando_resultado', 'uno solo cargó: espera hasta 1 s antes de las 48 h');
select is(pg_temp.phase('22222222-0000-0000-0000-000000000000', now() + interval '48 hours'),
  'jugado', 'a las 48 h justas queda Jugado');
select is(pg_temp.phase('33333333-0000-0000-0000-000000000000', now() + interval '48 hours' - interval '1 second'),
  'esperando_resultado', 'cargaron distinto: hay 48 h para corregir');
select is(pg_temp.phase('33333333-0000-0000-0000-000000000000', now() + interval '48 hours'),
  'jugado', 'si siguen distintos a las 48 h, queda Jugado');
select is(pg_temp.phase('44444444-0000-0000-0000-000000000000', now() + interval '47 hours' - interval '1 second'),
  'esperando_resultado', 'nadie cargó: el plazo corre desde el fin del rango');
select is(pg_temp.phase('44444444-0000-0000-0000-000000000000', now() + interval '47 hours'),
  'jugado', 'a las 48 h del fin del rango queda Jugado');

select results_eq(
  $$ select id, phase, goals_for, goals_against, rival_goals_for, rival_goals_against, deadline
       from public.match_details where id in ('22222222-0000-0000-0000-000000000000', '33333333-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000000')
      order by id $$,
  $$ values ('22222222-0000-0000-0000-000000000000'::uuid, 'esperando_resultado', null::smallint, null::smallint, 2::smallint, 0::smallint, now() + interval '48 hours'),
            ('33333333-0000-0000-0000-000000000000'::uuid, 'esperando_resultado', 2::smallint, 2::smallint, 1::smallint, 0::smallint, now() + interval '48 hours'),
            ('44444444-0000-0000-0000-000000000000'::uuid, 'esperando_resultado', null, null, null, null, now() + interval '47 hours') $$,
  'el rival ve lo que cargó cada lado, desde el lado de cada uno, y cuándo vence el plazo'
);

-- Vencido el plazo: se mira con los hechos llevados 49 h para atrás.
reset role;
update public.matches set range = tstzrange(lower(range) - interval '49 hours', upper(range) - interval '49 hours', '[)'),
                          last_action_at = last_action_at - interval '49 hours'
 where id in ('22222222-0000-0000-0000-000000000000', '33333333-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000000');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select results_eq(
  $$ select id, phase, score_for, score_against
       from public.match_details where id in ('22222222-0000-0000-0000-000000000000', '33333333-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000000')
      order by id $$,
  $$ values ('22222222-0000-0000-0000-000000000000'::uuid, 'jugado', 0::smallint, 2::smallint),
            ('33333333-0000-0000-0000-000000000000'::uuid, 'jugado', null, null),
            ('44444444-0000-0000-0000-000000000000'::uuid, 'jugado', null, null) $$,
  'vencido el plazo: Jugado con el único resultado cargado, o sin resultado si no coincidían o nadie cargó'
);

reset role;
select is((select count(*)::int from public.notices where kind = 'match_played'), 0,
  'quedar Jugado por el tiempo no avisa');

-- Cada carga reinicia el plazo ----------------------------------------------

-- M5: Caro cargó hace 47 h; Rafa corrige ahora y le da 48 h enteras.
select pg_temp.match('55555555-0000-0000-0000-000000000000', interval '50 hours');
update public.match_sides set goals_for = 1, goals_against = 0, result_at = now() - interval '47 hours'
 where match_id = '55555555-0000-0000-0000-000000000000' and team_id = 'aaaaaaaa-0000-0000-0000-000000000000';
update public.matches set last_action_at = now() - interval '47 hours' where id = '55555555-0000-0000-0000-000000000000';

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.report_result('55555555-0000-0000-0000-000000000000', 1, 1);
select is(pg_temp.phase('55555555-0000-0000-0000-000000000000', now() + interval '48 hours' - interval '1 second'),
  'esperando_resultado', 'la corrección le da al otro 48 h enteras desde ahí');

-- Disolver con un partido esperando resultado --------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.dissolve_team('aaaaaaaa-0000-0000-0000-000000000000') $$,
  'P0001', 'Tenés un partido pendiente: tiralo o cerrá el resultado antes de disolver',
  'no se disuelve un equipo con un partido esperando resultado');

-- Antes de la hora de inicio --------------------------------------------------

reset role;
-- M6: empieza en 1 min.
insert into public.matches (id, range) values
  ('66666666-0000-0000-0000-000000000000', tstzrange(now() + interval '1 minute', now() + interval '2 hours', '[)'));
insert into public.match_sides (match_id, team_id) values
  ('66666666-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000'),
  ('66666666-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000000');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.report_result('66666666-0000-0000-0000-000000000000', 1, 0) $$,
  'P0001', 'El resultado se carga desde la hora de inicio', 'antes de la hora de inicio no se carga el resultado');
reset role;
select is(pg_temp.phase('66666666-0000-0000-0000-000000000000', now() + interval '1 minute'),
  'esperando_resultado', 'desde la hora de inicio, el partido espera el resultado');

-- "No vinieron" ---------------------------------------------------------------

select throws_ok(
  $$ select public.report_no_show('66666666-0000-0000-0000-000000000000') $$,
  'P0001', 'El resultado se carga desde la hora de inicio', 'antes de la hora de inicio no se reporta "no vinieron"');

reset role;
delete from public.notices;
-- M7: Caro reporta "no vinieron" y Rafa no responde. M8: Rafa responde
-- "fuimos". M9: los dos reportan "no vinieron".
select pg_temp.match('77777777-0000-0000-0000-000000000000', interval '3 hours');
select pg_temp.match('88888888-0000-0000-0000-000000000000', interval '3 hours');
select pg_temp.match('99999999-0000-0000-0000-000000000000', interval '3 hours');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select throws_ok(
  $$ select public.reply_went('77777777-0000-0000-0000-000000000000') $$,
  'P0001', 'Nadie dijo que no fueron', 'sin "no vinieron" no hay nada que responder');

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.report_no_show('77777777-0000-0000-0000-000000000000');
select public.report_no_show('88888888-0000-0000-0000-000000000000');
select public.report_no_show('99999999-0000-0000-0000-000000000000');
select throws_ok(
  $$ select public.report_result('77777777-0000-0000-0000-000000000000', 3, 0) $$,
  'P0001', 'Reportaste que no vinieron: no podés cargar el resultado', 'quien reportó "no vinieron" no carga el resultado');
select throws_ok(
  $$ select public.report_no_show('77777777-0000-0000-0000-000000000000') $$,
  'P0001', 'Ya reportaste que no vinieron', '"no vinieron" se reporta una vez');

reset role;
select results_eq(
  $$ select n.user_id, n.params ->> 'rival_name', (n.params ->> 'deadline')::timestamptz
       from public.notices n where kind = 'no_show_reported' and n.created_at = now() order by n.user_id limit 1 $$,
  $$ values ('00000000-0000-0000-0000-0000000000e1'::uuid, 'Real Floresta', now() + interval '48 hours') $$,
  'avisa "Dicen que no fueron: respondé" al capitán acusado, con el vencimiento'
);
select is((select count(distinct user_id)::int from public.notices where kind = 'no_show_reported'), 1,
  'el aviso va solo al capitán acusado');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.reply_went('88888888-0000-0000-0000-000000000000');
select public.report_no_show('99999999-0000-0000-0000-000000000000');
select throws_ok(
  $$ select public.reply_went('88888888-0000-0000-0000-000000000000') $$,
  'P0001', 'El resultado del partido ya está cerrado', 'un partido en conflicto ya no se toca');

reset role;
select is(pg_temp.phase('77777777-0000-0000-0000-000000000000', now() + interval '48 hours' - interval '1 second'),
  'esperando_resultado', '"no vinieron" sin respuesta: el acusado tiene hasta 1 s antes de las 48 h');
select is(pg_temp.phase('77777777-0000-0000-0000-000000000000', now() + interval '48 hours'),
  'no_presentado', 'a las 48 h justas sin respuesta, el acusado no se presentó');
select is(pg_temp.phase('88888888-0000-0000-0000-000000000000', now()),
  'en_conflicto', '"no vinieron" y "fuimos": en conflicto en el acto');
select is(pg_temp.phase('99999999-0000-0000-0000-000000000000', now()),
  'en_conflicto', 'los dos reportan "no vinieron": en conflicto, igual que con "fuimos"');
select results_eq(
  $$ select n.user_id, n.params ->> 'team_a', n.params ->> 'team_b'
       from public.notices n where kind = 'match_in_conflict' order by n.params ->> 'team_a', n.user_id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Los Rivales', 'Real Floresta'),
            ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Los Rivales', 'Real Floresta'),
            ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Los Rivales', 'Real Floresta'),
            ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Los Rivales', 'Real Floresta') $$,
  'cada conflicto avisa "Partido en conflicto" a los dos planteles (sin quien lo provocó)'
);

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select results_eq(
  $$ select id, phase, no_show_at is not null, rival_no_show_at is not null, went_at is not null, rival_went_at is not null
       from public.match_details where id in ('88888888-0000-0000-0000-000000000000', '99999999-0000-0000-0000-000000000000') order by id $$,
  $$ values ('88888888-0000-0000-0000-000000000000'::uuid, 'en_conflicto', true, false, false, true),
            ('99999999-0000-0000-0000-000000000000'::uuid, 'en_conflicto', true, true, false, false) $$,
  'el plantel ve las dos versiones del conflicto'
);

-- La falta por no presentarse --------------------------------------------------

reset role;
select is((select count(*)::int from public.team_faults(now()) where match_id = '77777777-0000-0000-0000-000000000000'), 0,
  'mientras el acusado puede responder, no hay falta');
-- M7 con los hechos llevados 49 h para atrás: venció hace 1 h.
update public.matches set range = tstzrange(lower(range) - interval '49 hours', upper(range) - interval '49 hours', '[)'),
                          last_action_at = last_action_at - interval '49 hours'
 where id = '77777777-0000-0000-0000-000000000000';
select results_eq(
  $$ select team_id, occurred_at from public.team_faults(now()) where match_id = '77777777-0000-0000-0000-000000000000' $$,
  $$ values ('eeeeeeee-0000-0000-0000-000000000000'::uuid, now() - interval '1 hour') $$,
  'vencidas las 48 h, la falta es del ausente y cuenta desde que vencieron'
);
select is((select count(*)::int from public.team_faults(now()) where match_id in ('88888888-0000-0000-0000-000000000000', '99999999-0000-0000-0000-000000000000')), 0,
  'un conflicto no suma falta a nadie');
select is(public.team_recent_faults('eeeeeeee-0000-0000-0000-000000000000', now()), 1,
  'la falta por no presentarse entra en las faltas de 90 días');

select * from finish();
rollback;
