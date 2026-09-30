-- Flyer en Storage: el objeto `flyers/<id del torneo>` lo sube, reemplaza y
-- borra solo el dueño de ese torneo. Se prueba escribiendo en
-- `storage.objects` con el rol y el JWT del usuario, que es lo que hace la API
-- de Storage por dentro (el archivo en sí no pasa por la base).
-- Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local',  '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

insert into public.tournaments
  (contact_instagram, id, name, sport_modality, zone, inscription_deadline, start_date, end_date, user_id)
values
  ('copa.test', '11111111-1111-1111-1111-111111111111', 'Copa de Ana', 'futbol_5', 'Palermo',
   '2026-10-25', '2026-11-01', '2026-11-30', '00000000-0000-0000-0000-00000000000a'),
  ('copa.test', '22222222-2222-2222-2222-222222222222', 'Copa de Beto', 'futbol_5', 'Palermo',
   '2026-10-25', '2026-11-01', '2026-11-30', '00000000-0000-0000-0000-00000000000b');

-- El bucket: público de lectura, 3 MB, solo JPG/PNG/WebP.
select results_eq(
  $$ select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'flyers' $$,
  $$ values (true, 3145728::bigint, array['image/jpeg', 'image/png', 'image/webp']) $$,
  'el bucket flyers es público, de hasta 3 MB y solo JPG, PNG o WebP'
);

-- La API de Storage borra con este permiso; sin él, el trigger
-- `protect_objects_delete` rechaza cualquier delete por SQL y no se podría
-- probar la policy.
set local storage.allow_delete_query = 'true';

-- Ana, con sesión.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('flyers', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a') $$,
  'el dueño sube el flyer de su torneo'
);

select isnt_empty(
  $$ select 1 from storage.objects where name = '11111111-1111-1111-1111-111111111111' $$,
  'el dueño ve la fila del flyer de su torneo (Storage la necesita para reemplazarlo)'
);

select isnt_empty(
  $$ update storage.objects set metadata = '{"mimetype": "image/png"}'
     where bucket_id = 'flyers' and name = '11111111-1111-1111-1111-111111111111' returning id $$,
  'el dueño reemplaza el flyer de su torneo'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('flyers', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'nadie sube el flyer de un torneo ajeno'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('flyers', '99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'nadie sube un flyer para un torneo que no existe'
);

-- Un nombre que no es uuid no rompe la policy: simplemente no da permiso.
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('flyers', 'Copa de Ana', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'nadie sube un flyer con un nombre que no es el id de un torneo'
);

-- Tampoco sirve renombrar el flyer propio al id de un torneo ajeno.
select throws_ok(
  $$ update storage.objects set name = '22222222-2222-2222-2222-222222222222'
     where bucket_id = 'flyers' and name = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'el dueño no puede mover su flyer al de un torneo ajeno'
);

-- Beto, con sesión: el flyer de Ana no le aparece para nada.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'flyers' $$,
  'otro usuario no lista los flyers ajenos'
);

select is_empty(
  $$ update storage.objects set metadata = '{}'
     where bucket_id = 'flyers' and name = '11111111-1111-1111-1111-111111111111' returning id $$,
  'otro usuario reemplaza un flyer ajeno y afecta 0 filas'
);

select is_empty(
  $$ delete from storage.objects
     where bucket_id = 'flyers' and name = '11111111-1111-1111-1111-111111111111' returning id $$,
  'otro usuario borra un flyer ajeno y afecta 0 filas'
);

-- Su propio flyer sí lo borra, con el torneo todavía publicado.
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('flyers', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-00000000000b') $$,
  'otro dueño sube el flyer de su torneo'
);

select isnt_empty(
  $$ delete from storage.objects
     where bucket_id = 'flyers' and name = '22222222-2222-2222-2222-222222222222' returning id $$,
  'el dueño borra el flyer de su torneo'
);

-- La baja: `withdraw_tournament` borra el torneo y el flyer queda huérfano
-- hasta que la Server Action lo borra por la API. Ana da de baja su torneo.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select public.withdraw_tournament('11111111-1111-1111-1111-111111111111');

-- Beto, aunque el torneo ya no exista, no borra un huérfano que no subió.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select is_empty(
  $$ delete from storage.objects
     where bucket_id = 'flyers' and name = '11111111-1111-1111-1111-111111111111' returning id $$,
  'otro usuario no borra un flyer huérfano que no subió'
);

-- Ana sí: lo subió ella y ya no hay torneo con ese id.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select isnt_empty(
  $$ delete from storage.objects
     where bucket_id = 'flyers' and name = '11111111-1111-1111-1111-111111111111' returning id $$,
  'quien subió el flyer lo borra después de la baja'
);

-- anon no escribe ni lista nada.
reset role;
set local role anon;

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('flyers', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'anon no sube flyers'
);

select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'flyers' $$,
  'anon no lista los flyers (los ve por su URL pública)'
);

select * from finish();
rollback;
