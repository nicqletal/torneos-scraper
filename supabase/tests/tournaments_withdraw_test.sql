-- Baja: la función `withdraw_tournament` es la única forma de sacar un torneo.
-- Solo el dueño da de baja, y nunca un Finalizado (es su trayectoria).
-- Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

-- Un torneo de Ana en cada estado. Las fechas son relativas a hoy para que el
-- estado calculado no cambie con el tiempo; con la zona horaria de Buenos
-- Aires, `current_date` es el mismo "hoy" que usa `status`.
set local timezone = 'America/Argentina/Buenos_Aires';

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, user_id)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa abierta', 'futbol_5', 'palermo',
   current_date + 10, current_date + 20, current_date + 50, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '22222222-2222-2222-2222-222222222222', 'Copa cerrada', 'futbol_5', 'palermo',
   current_date - 1, current_date + 5, current_date + 30, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '33333333-3333-3333-3333-333333333333', 'Copa en curso', 'futbol_5', 'palermo',
   current_date - 20, current_date - 10, current_date + 10, '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '44444444-4444-4444-4444-444444444444', 'Copa finalizada', 'futbol_5', 'palermo',
   current_date - 60, current_date - 50, current_date - 1, '00000000-0000-0000-0000-00000000000a');

-- Las fechas dan los cuatro estados, así los tests de abajo prueban lo que dicen.
select results_eq(
  $$ select t.status from public.tournaments t where t.user_id = '00000000-0000-0000-0000-00000000000a' order by t.name $$,
  $$ values ('abierto'), ('cerrado'), ('en_curso'), ('finalizado') $$,
  'los torneos de prueba cubren los cuatro estados'
);

-- Beto, con sesión: no puede dar de baja el torneo de Ana.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select throws_ok(
  $$ select public.withdraw_tournament('11111111-1111-1111-1111-111111111111') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'otro usuario no puede dar de baja un torneo ajeno'
);

select throws_ok(
  $$ select public.withdraw_tournament('99999999-9999-9999-9999-999999999999') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'un torneo que no existe da el mismo error que uno ajeno'
);

-- Tampoco por la puerta de atrás: ya no hay delete directo.
select throws_ok(
  $$ delete from public.tournaments where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'nadie borra torneos con un delete directo'
);

-- Ana, con sesión.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select throws_ok(
  $$ select public.withdraw_tournament('44444444-4444-4444-4444-444444444444') $$,
  '22023', 'Un torneo finalizado no se da de baja',
  'el dueño no puede dar de baja un torneo Finalizado'
);

select lives_ok(
  $$ select public.withdraw_tournament('11111111-1111-1111-1111-111111111111') $$,
  'el dueño da de baja un torneo Abierto'
);

select lives_ok(
  $$ select public.withdraw_tournament('22222222-2222-2222-2222-222222222222') $$,
  'el dueño da de baja un torneo Cerrado'
);

select lives_ok(
  $$ select public.withdraw_tournament('33333333-3333-3333-3333-333333333333') $$,
  'el dueño da de baja un torneo En curso'
);

-- Solo queda el Finalizado: los dados de baja ya no existen.
select results_eq(
  $$ select name from public.tournaments where user_id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Copa finalizada') $$,
  'los dados de baja desaparecen y el Finalizado queda'
);

-- Un torneo ya dado de baja no existe: da el error de siempre.
select throws_ok(
  $$ select public.withdraw_tournament('11111111-1111-1111-1111-111111111111') $$,
  '42501', 'El torneo no existe o no es tuyo',
  'dar de baja dos veces el mismo torneo da error'
);

-- anon no puede ni llamar a la función.
reset role;
set local role anon;

select throws_ok(
  $$ select public.withdraw_tournament('44444444-4444-4444-4444-444444444444') $$,
  '42501', null,
  'anon no puede dar de baja'
);

select * from finish();
rollback;
