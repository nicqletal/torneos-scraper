-- Edición de torneos: el dueño edita solo las columnas del formulario.
-- Editar nunca cuenta como verificar, y el dueño no se puede pasar el torneo a
-- otro. Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date,
   verified_at, user_id)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa de Ana', 'futbol_5', 'palermo',
   '2026-10-25', '2026-11-01', '2026-11-30',
   '2026-09-01 12:00:00-03', '00000000-0000-0000-0000-00000000000a');

-- Ana, con sesión: edita su torneo con todos los campos del formulario.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select isnt_empty(
  $$ update public.tournaments set
       name = 'Copa de Ana 2026', sport_modality = 'futbol_7', zone_id = 'belgrano',
       inscription_deadline = '2026-10-20', start_date = '2026-10-31', end_date = '2026-12-15',
       price = 0, capacity = 12, description = 'Con tercer tiempo', rules = 'Sin offside',
       venue_address = 'Av. Santa Fe 3000', contact_whatsapp = '5491112345678',
       contact_instagram = 'copa.ana'
     where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'el dueño edita todos los campos del formulario'
);

select is(
  (select verified_at from public.tournaments where id = '11111111-1111-1111-1111-111111111111'),
  '2026-09-01 12:00:00-03'::timestamptz,
  'editar no cuenta como verificar: verified_at no cambia'
);

-- Lo que no es del formulario no se toca por update directo, ni siquiera el dueño.
select throws_ok(
  $$ update public.tournaments set verified_at = now()
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'el dueño no puede marcar su torneo como verificado'
);

select throws_ok(
  $$ update public.tournaments set user_id = '00000000-0000-0000-0000-00000000000b'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'el dueño no puede pasarle su torneo a otro'
);

select throws_ok(
  $$ update public.tournaments set created_at = '2020-01-01'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'el dueño no puede cambiar la fecha de creación'
);

-- Beto, con sesión: el torneo de Ana no le aparece para editar.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select is_empty(
  $$ update public.tournaments set name = 'Copa de Beto'
     where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'otro usuario edita un torneo ajeno y afecta 0 filas'
);

-- anon no tiene update sobre ninguna columna.
reset role;
select ok(
  not has_table_privilege('anon', 'public.tournaments', 'update')
    and not has_column_privilege('anon', 'public.tournaments', 'name', 'update'),
  'anon no puede editar torneos'
);

-- authenticated puede editar exactamente las columnas del formulario, más
-- `image_url`, que la escribe la Server Action después de subir el flyer.
select is(
  (select array_agg(column_name::text order by column_name::text)
     from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'tournaments'
      and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  array[
    'capacity', 'contact_instagram', 'contact_whatsapp', 'description', 'end_date',
    'image_url', 'inscription_deadline', 'name', 'price', 'rules', 'sport_modality', 'start_date',
    'venue_address', 'zone_id'
  ],
  'authenticated edita solo las columnas del formulario y el flyer'
);

select * from finish();
rollback;
