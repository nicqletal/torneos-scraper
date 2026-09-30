-- "Sigue vigente": la función `verify_tournament` es la única forma de tocar
-- `verified_at`. Solo el dueño verifica, y verificar no cambia nada más.
-- Cada test corre en una transacción que se descarta al final (y dentro de
-- ella `now()` es siempre el mismo instante, así que se puede comparar).

begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date,
   verified_at, user_id)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa de Ana', 'futbol_5', 'palermo',
   '2026-10-25', '2026-11-01', '2026-11-30',
   '2026-07-01 12:00:00-03', '00000000-0000-0000-0000-00000000000a'),
  ('copa.vieja', '33333333-3333-3333-3333-333333333333', 'Copa vieja de Ana', 'futbol_5', 'palermo',
   '2025-10-25', '2025-11-01', '2025-11-30',
   '2025-11-01 12:00:00-03', '00000000-0000-0000-0000-00000000000a');

-- Foto de la fila sin `verified_at`, para comprobar que verificar no toca nada más.
create temp table before_verify as
  select to_jsonb(t) - 'verified_at' as row
    from public.tournaments t
   where id = '11111111-1111-1111-1111-111111111111';
grant select on before_verify to authenticated;

-- Un torneo recién creado cuenta como verificado al crearlo.
select col_not_null('public', 'tournaments', 'verified_at', 'todo torneo tiene fecha de verificación');

-- Beto, con sesión: no puede verificar el torneo de Ana.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select throws_ok(
  $$ select public.verify_tournament('11111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'otro usuario no puede verificar un torneo ajeno'
);

select is(
  (select verified_at from public.tournaments where id = '11111111-1111-1111-1111-111111111111'),
  '2026-07-01 12:00:00-03'::timestamptz,
  'el intento de otro usuario no cambia la fecha de verificación'
);

select throws_ok(
  $$ select public.verify_tournament('99999999-9999-9999-9999-999999999999') $$,
  '42501', null,
  'un torneo que no existe da el mismo error que uno ajeno'
);

-- Ana, con sesión: verifica su torneo.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select is(
  public.verify_tournament('11111111-1111-1111-1111-111111111111'),
  now(),
  'el dueño verifica su torneo y la función devuelve la nueva fecha'
);

select is(
  (select verified_at from public.tournaments where id = '11111111-1111-1111-1111-111111111111'),
  now(),
  'verified_at queda en el momento de la verificación'
);

select is(
  (select to_jsonb(t) - 'verified_at' from public.tournaments t
    where id = '11111111-1111-1111-1111-111111111111'),
  (select row from before_verify),
  'verificar no cambia ninguna otra columna'
);

select throws_ok(
  $$ select public.verify_tournament('33333333-3333-3333-3333-333333333333') $$,
  '22023', 'Un torneo finalizado no se verifica',
  'el dueño no puede verificar un torneo Finalizado'
);

-- Al crear, `verified_at` lo pone la base: el organizador no lo puede elegir.
select throws_ok(
  $$ insert into public.tournaments
       (contact_instagram, name, sport_modality, zone_id, inscription_deadline, start_date, end_date,
        verified_at, user_id)
     values ('copa.test', 'Copa verificada a futuro', 'futbol_5', 'palermo',
             '2026-10-25', '2026-11-01', '2026-11-30',
             '2099-01-01', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'el organizador no puede elegir la fecha de verificación al crear'
);

insert into public.tournaments
  (contact_instagram, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, user_id)
values
  ('copa.test', 'Copa nueva', 'futbol_5', 'palermo',
   '2026-10-25', '2026-11-01', '2026-11-30', '00000000-0000-0000-0000-00000000000a');

select is(
  (select verified_at from public.tournaments where name = 'Copa nueva'),
  now(),
  'un torneo recién creado queda verificado al crearlo'
);

-- anon no puede ni llamar a la función.
reset role;
set local role anon;

select throws_ok(
  $$ select public.verify_tournament('11111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'anon no puede verificar'
);

-- authenticated crea con exactamente las columnas del formulario + user_id.
reset role;
select is(
  (select array_agg(column_name::text order by column_name::text)
     from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'tournaments'
      and grantee = 'authenticated' and privilege_type = 'INSERT'),
  array[
    'capacity', 'contact_instagram', 'contact_whatsapp', 'description', 'end_date',
    'inscription_deadline', 'name', 'price', 'rules', 'sport_modality', 'start_date',
    'user_id', 'venue_address', 'zone_id'
  ],
  'authenticated crea solo con las columnas del formulario y user_id'
);

select * from finish();
rollback;
