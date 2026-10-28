-- Partido caído y faltas: cualquier capitán tira el partido antes de la hora de
-- inicio, con un motivo. Con menos de 24 h suma una falta al equipo que lo
-- tiró, salvo que el rival acepte tirarlo de común acuerdo. Cada test corre en
-- una transacción que se descarta al final, así que `now()` es el mismo en
-- todo el archivo.

begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

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

-- Un partido entre A y R que empieza dentro de `p_in` y dura 2 h. Nace directo
-- en la tabla: la propuesta ya se probó.
create function pg_temp.match(p_id uuid, p_in interval) returns void
language sql as $$
  insert into public.matches (id, range) values (p_id, tstzrange(now() + p_in, now() + p_in + interval '2 hours', '[)'));
  insert into public.match_sides (match_id, team_id) values
    (p_id, 'aaaaaaaa-0000-0000-0000-000000000000'),
    (p_id, 'eeeeeeee-0000-0000-0000-000000000000');
$$;

create function pg_temp.phase(p_id uuid) returns text
language sql as $$
  select public.match_phase(m, now()) from public.matches m where m.id = p_id
$$;

-- M1: en 3 días. M2: en 24 h justas. M3: en 23 h 59 min.
select pg_temp.match('11111111-0000-0000-0000-000000000000', interval '3 days');
select pg_temp.match('22222222-0000-0000-0000-000000000000', interval '24 hours');
select pg_temp.match('33333333-0000-0000-0000-000000000000', interval '23 hours 59 minutes');

-- M0: empezó hace 1 h.
select pg_temp.match('00000000-1111-0000-0000-000000000000', interval '-1 hour');

-- Rechazos -------------------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.drop_match('11111111-0000-0000-0000-000000000000', 'lluvia') $$,
  'P0001', 'No encontramos el partido', 'el plantel no tira el partido: solo el capitán');
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select throws_ok(
  $$ select public.drop_match('11111111-0000-0000-0000-000000000000', 'lluvia') $$,
  'P0001', 'No encontramos el partido', 'a un ajeno no se le confirma que existe');

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.drop_match('11111111-0000-0000-0000-000000000000', '   ') $$,
  'P0001', 'El motivo va de 1 a 140 caracteres', 'el motivo es obligatorio');
select throws_ok(
  $$ select public.drop_match('11111111-0000-0000-0000-000000000000', repeat('x', 141)) $$,
  'P0001', 'El motivo va de 1 a 140 caracteres', 'y de hasta 140 caracteres');
select throws_ok(
  $$ select public.drop_match('00000000-1111-0000-0000-000000000000', 'lluvia') $$,
  'P0001', 'El partido ya empezó', 'desde la hora de inicio ya no se tira');

-- Tirar con más de 24 h ------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.drop_match('11111111-0000-0000-0000-000000000000', '  nos faltan dos  ');

reset role;
select is(pg_temp.phase('11111111-0000-0000-0000-000000000000'), 'caido',
  'tirar el partido lo deja caído');
select results_eq(
  $$ select n.user_id, n.params ->> 'team_a', n.params ->> 'team_b', n.params ->> 'reason', n.params ? 'fault_team_name'
       from public.notices n where kind = 'match_dropped' order by n.user_id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Real Floresta', 'Los Rivales', 'nos faltan dos', false),
            ('00000000-0000-0000-0000-0000000000e1'::uuid, 'Real Floresta', 'Los Rivales', 'nos faltan dos', false) $$,
  'avisa "Se cayó el partido" a los dos planteles sin quien lo tiró, con el motivo y sin falta'
);

-- La frontera de las 24 h ----------------------------------------------------

delete from public.notices;
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.drop_match('22222222-0000-0000-0000-000000000000', 'lluvia');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.drop_match('33333333-0000-0000-0000-000000000000', 'no llegamos');

reset role;
select results_eq(
  $$ select team_id, match_id, occurred_at from public.team_faults order by match_id $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid, '33333333-0000-0000-0000-000000000000'::uuid, now()) $$,
  'con 24 h justas no suma falta; con 23:59 h suma una al equipo que lo tiró, fechada cuando lo tiró'
);
select results_eq(
  $$ select distinct n.params ->> 'fault_team_name' from public.notices n
      where kind = 'match_dropped' and n.params ->> 'reason' = 'no llegamos' $$,
  $$ values ('Real Floresta') $$,
  'el aviso dice a quién le suma la falta'
);

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select results_eq(
  $$ select phase, drop_reason, dropped_by_own, drop_mutual, drop_fault
       from public.match_details where id = '33333333-0000-0000-0000-000000000000' $$,
  $$ values ('caido', 'no llegamos', true, false, true) $$,
  'el plantel ve el partido caído con el motivo, que lo tiró su equipo y que suma falta'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.drop_match('33333333-0000-0000-0000-000000000000', 'otra vez') $$,
  'P0001', 'El partido ya se cayó', 'un partido caído no se vuelve a tirar');

-- Disolver con el partido caído ----------------------------------------------

-- R tiene M0 por jugarse (empezó, pero todavía no hay fase de resultado):
-- se borra para probar solo los caídos.
reset role;
delete from public.matches where id = '00000000-1111-0000-0000-000000000000';
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select lives_ok(
  $$ select public.dissolve_team('eeeeeeee-0000-0000-0000-000000000000') $$,
  'un equipo cuyos partidos se cayeron se puede disolver');

-- Común acuerdo ---------------------------------------------------------------

-- M4: en 3 días. M5 y M6: en 10 h. M7: empezó hace 1 h, con un pedido de Caro
-- sin responder (escrito directo: antes de la hora de inicio ya se probó).
-- Nico: capitán nuevo de R; Rafa queda en el plantel.
reset role;
delete from public.notices;
select pg_temp.match('44444444-0000-0000-0000-000000000000', interval '3 days');
select pg_temp.match('55555555-0000-0000-0000-000000000000', interval '10 hours');
select pg_temp.match('66666666-0000-0000-0000-000000000000', interval '10 hours');
select pg_temp.match('77777777-0000-0000-0000-000000000000', interval '-1 hour');
update public.matches
   set mutual_drop_team_id = 'aaaaaaaa-0000-0000-0000-000000000000', mutual_drop_reason = 'lluvia', mutual_drop_at = now() - interval '2 hours'
 where id = '77777777-0000-0000-0000-000000000000';
-- Para reusar R, que quedó disuelto más arriba.
update public.teams set dissolved_at = null where id = 'eeeeeeee-0000-0000-0000-000000000000';

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.request_mutual_drop('44444444-0000-0000-0000-000000000000', 'lluvia') $$,
  'P0001', 'Con más de 24 h se tira sin falta: no hace falta pedirlo de común acuerdo',
  'con más de 24 h no se pide de común acuerdo');
select throws_ok(
  $$ select public.request_mutual_drop('55555555-0000-0000-0000-000000000000', '') $$,
  'P0001', 'El motivo va de 1 a 140 caracteres', 'el pedido lleva motivo');

select public.request_mutual_drop('55555555-0000-0000-0000-000000000000', ' lluvia ');
reset role;
select results_eq(
  $$ select n.user_id, n.params ->> 'rival_name', n.params ->> 'reason', (n.params ->> 'deadline')::timestamptz
       from public.notices n where kind = 'mutual_drop_requested' $$,
  $$ values ('00000000-0000-0000-0000-0000000000e1'::uuid, 'Real Floresta', 'lluvia', now() + interval '10 hours') $$,
  'pedir tirarlo de común acuerdo le avisa al capitán rival, con el motivo y el vencimiento (la hora de inicio)'
);
select is(pg_temp.phase('55555555-0000-0000-0000-000000000000'), 'por_jugarse',
  'mientras nadie responde, el partido sigue en pie');
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select results_eq(
  $$ select mutual_drop_reason, mutual_drop_by_own, mutual_drop_answered_at
       from public.match_details where id = '55555555-0000-0000-0000-000000000000' $$,
  $$ values ('lluvia', false, null::timestamptz) $$,
  'el rival ve el pedido sin responder, con el motivo, en la fila'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
reset role;

set local role authenticated;
select throws_ok(
  $$ select public.request_mutual_drop('55555555-0000-0000-0000-000000000000', 'lluvia') $$,
  'P0001', 'Ya hay un pedido de común acuerdo sin responder', 'no se pide dos veces');
select throws_ok(
  $$ select public.answer_mutual_drop('55555555-0000-0000-0000-000000000000', true) $$,
  'P0001', 'No hay un pedido de común acuerdo para responder', 'quien lo pidió no se lo responde');

-- Cambio de capitán en R: el nuevo responde el pedido que quedó pendiente.
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e2', 'nico@test.local', '{"display_name": "Nico"}');
update public.team_members set is_captain = false where team_id = 'eeeeeeee-0000-0000-0000-000000000000';
insert into public.team_members (team_id, user_id, is_captain) values
  ('eeeeeeee-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000e2', true);

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select throws_ok(
  $$ select public.answer_mutual_drop('55555555-0000-0000-0000-000000000000', true) $$,
  'P0001', 'No encontramos el partido', 'el capitán anterior ya no responde');

select pg_temp.login('00000000-0000-0000-0000-0000000000e2');
select public.answer_mutual_drop('55555555-0000-0000-0000-000000000000', true);

reset role;
select is(pg_temp.phase('55555555-0000-0000-0000-000000000000'), 'caido',
  'si el rival acepta antes de la hora de inicio, se cae');
select is((select count(*)::int from public.team_faults where match_id = '55555555-0000-0000-0000-000000000000'), 0,
  'de común acuerdo no suma falta a nadie');
select results_eq(
  $$ select n.user_id, n.params ->> 'team_a', n.params ->> 'team_b'
       from public.notices n where kind = 'mutual_drop_accepted' order by n.user_id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Real Floresta', 'Los Rivales'),
            ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Real Floresta', 'Los Rivales'),
            ('00000000-0000-0000-0000-0000000000e1'::uuid, 'Real Floresta', 'Los Rivales') $$,
  'avisa "Se cayó de común acuerdo" a los dos planteles, sin quien aceptó'
);

-- Rechazar: Nico pide en M6, Caro rechaza, y Nico lo tira solo con falta.
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e2');
select public.request_mutual_drop('66666666-0000-0000-0000-000000000000', 'nos faltan dos');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.answer_mutual_drop('66666666-0000-0000-0000-000000000000', false);

reset role;
select results_eq(
  $$ select n.user_id, n.params ->> 'rival_name' from public.notices n where kind = 'mutual_drop_rejected' $$,
  $$ values ('00000000-0000-0000-0000-0000000000e2'::uuid, 'Real Floresta') $$,
  'avisa "Rechazaron tirarlo de común acuerdo" al capitán que lo pidió'
);
select is(pg_temp.phase('66666666-0000-0000-0000-000000000000'), 'por_jugarse',
  'si lo rechaza, el partido sigue en pie');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e2');
select throws_ok(
  $$ select public.request_mutual_drop('66666666-0000-0000-0000-000000000000', 'otra vez') $$,
  'P0001', 'Ya se pidió tirarlo de común acuerdo: se puede tirar solo, con la falta',
  'el pedido es uno solo por partido');
select public.drop_match('66666666-0000-0000-0000-000000000000', 'nos faltan dos');

reset role;
select results_eq(
  $$ select team_id from public.team_faults where match_id = '66666666-0000-0000-0000-000000000000' $$,
  $$ values ('eeeeeeee-0000-0000-0000-000000000000'::uuid) $$,
  'después del rechazo, el que lo pidió lo tira solo y suma la falta'
);

-- Aceptar después de la hora de inicio.
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e2');
select throws_ok(
  $$ select public.answer_mutual_drop('77777777-0000-0000-0000-000000000000', true) $$,
  'P0001', 'El partido ya empezó', 'desde la hora de inicio el pedido ya no se acepta');

select * from finish();
rollback;
