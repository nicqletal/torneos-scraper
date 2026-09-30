-- RLS de `tournaments`: lectura pública y escritura solo sobre los torneos propios.
-- Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

-- Dos organizadores: Ana es dueña del torneo, Beto no.
-- display_name va en la metadata como en el signUp real (el trigger de perfiles de equipos lo necesita).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, user_id)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa de Ana', 'futbol_5', 'palermo',
   '2026-10-25', '2026-11-01', '2026-11-30',
   '00000000-0000-0000-0000-00000000000a');

-- anon: lee los torneos.
set local role anon;

select results_eq(
  $$ select name from public.tournaments $$,
  $$ values ('Copa de Ana') $$,
  'anon ve los torneos'
);

-- Beto, con sesión: no puede tocar el torneo de Ana.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select is_empty(
  $$ update public.tournaments set name = 'Copa de Beto'
     where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'update de un torneo ajeno afecta 0 filas'
);

-- La baja no es un delete: va por `withdraw_tournament` (ver tournaments_withdraw_test.sql).
select throws_ok(
  $$ delete from public.tournaments
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'no hay delete directo, ni de un torneo ajeno'
);

select throws_ok(
  $$ insert into public.tournaments
       (contact_instagram, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, user_id)
     values ('copa.test', 'Copa trucha', 'futbol_5', 'palermo', '2026-10-25', '2026-11-01', '2026-11-30',
             '00000000-0000-0000-0000-00000000000a') $$,
  '42501',
  null,
  'no puede crear un torneo a nombre de otro'
);

-- Ana, con sesión: sí puede editar su torneo.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select isnt_empty(
  $$ update public.tournaments set name = 'Copa de Ana 2026'
     where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'el dueño puede editar su torneo'
);

-- Solo queda una policy por operación: sin duplicados ni policies abiertas.
reset role;

select policies_are(
  'public', 'tournaments',
  array[
    'tournaments: lectura pública',
    'tournaments: el organizador crea los suyos',
    'tournaments: el organizador edita los suyos'
  ],
  'tournaments tiene lectura pública, alta y edición del dueño (la baja va por función)'
);

select * from finish();
rollback;
