-- Coordinación y confirmación previa: un capitán carga cancha y hora, el otro
-- confirma (Coordinado) o corrige (le toca confirmar al primero). Desde 24 h
-- antes de la hora de inicio, cada capitán dice "Vamos"; si los dos lo dicen,
-- el partido queda Confirmado. Cada test corre en una transacción que se
-- descarta al final, así que `now()` es el mismo en todo el archivo.

begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

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

-- Una hora de Buenos Aires dentro de `p_days` días: "20:15" → timestamptz.
create function pg_temp.at(p_days int, p_time text) returns timestamptz
language sql as $$
  select ((now() at time zone 'America/Argentina/Buenos_Aires')::date + p_days + p_time::time)
         at time zone 'America/Argentina/Buenos_Aires'
$$;

-- Un partido entre A y R. Nace directo en la tabla: la propuesta ya se probó.
create function pg_temp.match(p_id uuid, p_range tstzrange) returns void
language sql as $$
  insert into public.matches (id, range) values (p_id, p_range);
  insert into public.match_sides (match_id, team_id) values
    (p_id, 'aaaaaaaa-0000-0000-0000-000000000000'),
    (p_id, 'eeeeeeee-0000-0000-0000-000000000000');
$$;

-- M1: en 3 días, de 20 a 22.
select pg_temp.match('11111111-0000-0000-0000-000000000000', tstzrange(pg_temp.at(3, '20:00'), pg_temp.at(3, '22:00'), '[)'));

-- M0: empezó hace 1 h (no se coordinó): ya pasó la hora de inicio.
select pg_temp.match('00000000-1111-0000-0000-000000000000',
  tstzrange(date_trunc('hour', now()) - interval '1 hour', date_trunc('hour', now()) + interval '1 hour', '[)'));

-- M2: empieza dentro de 24 h y 1 min. M3: dentro de 23 h 59 min.
select pg_temp.match('22222222-0000-0000-0000-000000000000',
  tstzrange(now() + interval '24 hours 1 minute', now() + interval '26 hours 1 minute', '[)'));
select pg_temp.match('33333333-0000-0000-0000-000000000000',
  tstzrange(now() + interval '23 hours 59 minutes', now() + interval '25 hours 59 minutes', '[)'));

-- Rechazos -------------------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');

select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', '   ', pg_temp.at(3, '20:15')) $$,
  'P0001', 'La cancha va de 1 a 120 caracteres', 'la cancha no puede quedar vacía');
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', repeat('x', 121), pg_temp.at(3, '20:15')) $$,
  'P0001', 'La cancha va de 1 a 120 caracteres', 'ni pasar de 120 caracteres');
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Parque', pg_temp.at(3, '20:10')) $$,
  'P0001', 'La hora va de a 15 minutos, dentro del horario del partido', 'una hora que no es múltiplo de 15 se rechaza');
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Parque', pg_temp.at(3, '22:00')) $$,
  'P0001', 'La hora va de a 15 minutos, dentro del horario del partido', 'el fin del rango queda afuera');
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Parque', pg_temp.at(3, '19:45')) $$,
  'P0001', 'La hora va de a 15 minutos, dentro del horario del partido', 'y lo de antes del inicio también');
select throws_ok(
  $$ select public.coordinate_match('00000000-1111-0000-0000-000000000000', 'Club Parque', date_trunc('hour', now()) + interval '30 minutes') $$,
  'P0001', 'El partido ya empezó', 'después de la hora de inicio no se coordina');

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Parque', pg_temp.at(3, '20:15')) $$,
  'P0001', 'No encontramos el partido', 'el plantel no coordina: solo el capitán');
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Parque', pg_temp.at(3, '20:15')) $$,
  'P0001', 'No encontramos el partido', 'a un ajeno no se le confirma que existe');

-- Cargar ---------------------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.coordinate_match('11111111-0000-0000-0000-000000000000', '  Club Parque  ', pg_temp.at(3, '20:15'));

reset role;
select results_eq(
  $$ select n.user_id, n.params ->> 'rival_name', n.params ->> 'venue', (n.params ->> 'start_at')::timestamptz
       from public.notices n where kind = 'venue_to_confirm' $$,
  $$ values ('00000000-0000-0000-0000-0000000000e1'::uuid, 'Real Floresta', 'Club Parque', pg_temp.at(3, '20:15')) $$,
  'cargar cancha y hora le avisa al capitán rival "Confirmá cancha y hora", con la cancha sin espacios de más'
);

-- Corregir y confirmar -------------------------------------------------------

set local role authenticated;
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Parque', pg_temp.at(3, '20:15')) $$,
  'P0001', 'Ya cargaste esa cancha y hora: falta que confirme el rival',
  'quien cargó no se confirma a sí mismo');

-- Rafa corrige: le toca confirmar a Caro.
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Norte', pg_temp.at(3, '21:00'));

reset role;
select results_eq(
  $$ select n.user_id, n.params ->> 'rival_name', n.params ->> 'venue'
       from public.notices n where kind = 'venue_to_confirm' and n.params ->> 'venue' = 'Club Norte' $$,
  $$ values ('00000000-0000-0000-0000-0000000000c1'::uuid, 'Los Rivales', 'Club Norte') $$,
  'corregir le pasa el turno al primero, con aviso solo a su capitán'
);
select is(
  (select public.match_start_at(m) from public.matches m where id = '11111111-0000-0000-0000-000000000000'),
  pg_temp.at(3, '20:00'),
  'mientras nadie confirma, la hora de inicio sigue siendo el inicio del rango'
);

set local role authenticated;
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Norte', pg_temp.at(3, '21:00')) $$,
  'P0001', 'Ya cargaste esa cancha y hora: falta que confirme el rival',
  'el que corrigió tampoco se confirma a sí mismo');

-- Caro confirma mandando los mismos valores: Coordinado.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Norte', pg_temp.at(3, '21:00'));

reset role;
select is(
  (select public.match_start_at(m) from public.matches m where id = '11111111-0000-0000-0000-000000000000'),
  pg_temp.at(3, '21:00'),
  'confirmar deja el partido Coordinado y la hora de inicio pasa a ser la hora exacta'
);
select results_eq(
  $$ select n.user_id, n.params ->> 'team_a', n.params ->> 'team_b', n.params ->> 'venue', (n.params ->> 'start_at')::timestamptz
       from public.notices n where kind = 'match_coordinated' order by n.user_id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Real Floresta', 'Los Rivales', 'Club Norte', pg_temp.at(3, '21:00')),
            ('00000000-0000-0000-0000-0000000000e1'::uuid, 'Real Floresta', 'Los Rivales', 'Club Norte', pg_temp.at(3, '21:00')) $$,
  '"Partido coordinado" a los dos planteles, menos a quien confirmó'
);

set local role authenticated;
select throws_ok(
  $$ select public.coordinate_match('11111111-0000-0000-0000-000000000000', 'Club Norte', pg_temp.at(3, '21:00')) $$,
  'P0001', 'El partido ya está coordinado con esa cancha y hora',
  'confirmar de nuevo no hace nada');

-- Plazo de la confirmación previa ---------------------------------------------

reset role;
select is(
  (select public.match_deadline(m, pg_temp.at(3, '21:00') - interval '24 hours') from public.matches m
    where id = '11111111-0000-0000-0000-000000000000'),
  pg_temp.at(3, '21:00'),
  'desde 24 h antes de la hora de inicio (la coordinada) está abierta la confirmación previa, hasta esa hora'
);
select is(
  (select public.match_deadline(m, pg_temp.at(3, '21:00') - interval '24 hours 1 minute') from public.matches m
    where id = '11111111-0000-0000-0000-000000000000'),
  null,
  'un minuto antes, todavía no'
);
select is(
  (select public.match_deadline(m, pg_temp.at(3, '21:00')) from public.matches m
    where id = '11111111-0000-0000-0000-000000000000'),
  (select upper(range) + interval '48 hours' from public.matches where id = '11111111-0000-0000-0000-000000000000'),
  'y a la hora de inicio ya se cerró: el plazo pasa a ser el del resultado'
);

-- Vamos ----------------------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.confirm_going('22222222-0000-0000-0000-000000000000') $$,
  'P0001', 'Se confirma desde 24 h antes del partido',
  'con 24 h y 1 min de anticipación, "Vamos" se rechaza');
select throws_ok(
  $$ select public.confirm_going('00000000-1111-0000-0000-000000000000') $$,
  'P0001', 'El partido ya empezó',
  'después de la hora de inicio, tampoco');
select lives_ok(
  $$ select public.confirm_going('33333333-0000-0000-0000-000000000000') $$,
  'con 23 h 59 min, "Vamos" se acepta');

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.confirm_going('33333333-0000-0000-0000-000000000000') $$,
  'P0001', 'No encontramos el partido', 'el plantel no confirma: solo el capitán');

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select going_at is not null, rival_going_at is not null from public.match_details
      where id = '33333333-0000-0000-0000-000000000000' $$,
  $$ values (true, false) $$,
  'la fila muestra quién ya dijo "Vamos"'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.confirm_going('33333333-0000-0000-0000-000000000000');
select results_eq(
  $$ select going_at is not null, rival_going_at is not null, deadline from public.match_details
      where id = '33333333-0000-0000-0000-000000000000' $$,
  $$ values (true, true, now() + interval '23 hours 59 minutes') $$,
  'los dos dijeron "Vamos": Confirmado, y la fila trae hasta cuándo se confirma'
);

reset role;
select is_empty(
  $$ select * from public.notices where kind not in ('venue_to_confirm', 'match_coordinated') $$,
  'quedar Confirmado no avisa a nadie'
);

select * from finish();
rollback;
