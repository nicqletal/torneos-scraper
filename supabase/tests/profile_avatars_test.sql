-- Se prueban las filas de Storage con los roles y JWT que usa su API.
-- El límite de bytes y los MIME se verifican en la configuración del bucket;
-- un INSERT SQL no sube bytes ni ejecuta las validaciones del servicio Storage.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

select results_eq(
  $$ select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars' $$,
  $$ values (true, 2097152::bigint, array['image/jpeg', 'image/png', 'image/webp']) $$,
  'avatars es público y limita a JPG, PNG y WebP de hasta 2 MB'
);
set local storage.allow_delete_query = 'true';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('avatars', '00000000-0000-0000-0000-00000000000a/foto', '00000000-0000-0000-0000-00000000000a') $$,
  'el usuario sube una foto en su carpeta'
);
select isnt_empty($$ select id from storage.objects where bucket_id = 'avatars' $$,
  'el usuario ve sus objetos para poder retirarlos');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('avatars', '00000000-0000-0000-0000-00000000000b/foto', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'el usuario no sube fotos en otra carpeta aunque declare que son suyas'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', 'foto') $$,
  '42501', null, 'no se suben fotos sin carpeta de usuario'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('flyers', '00000000-0000-0000-0000-00000000000a/foto') $$,
  '42501', null, 'la policy de fotos no abre otros buckets'
);
select is_empty(
  $$ update storage.objects set metadata = '{}' where bucket_id = 'avatars' returning id $$,
  'no se pisa una foto: el reemplazo requiere una subida nueva'
);

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select is_empty($$ select id from storage.objects where bucket_id = 'avatars' $$,
  'otro usuario no lista fotos ajenas');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('avatars', '00000000-0000-0000-0000-00000000000b/foto', '00000000-0000-0000-0000-00000000000b') $$,
  'otro usuario también puede subir en su propia carpeta'
);
select is_empty(
  $$ update storage.objects set metadata = '{}'
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-00000000000a/foto' returning id $$,
  'otro usuario no modifica la foto ajena'
);
select is_empty(
  $$ delete from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-00000000000a/foto' returning id $$,
  'otro usuario no retira la foto ajena'
);
select isnt_empty(
  $$ select id from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-00000000000b/foto' $$,
  'cada usuario sí ve su propia foto'
);
select isnt_empty(
  $$ delete from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-00000000000b/foto' returning id $$,
  'se puede retirar una subida cuyo guardado falló'
);
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select isnt_empty(
  $$ delete from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-00000000000a/foto' returning id $$,
  'el usuario retira su foto anterior'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '00000000-0000-0000-0000-00000000000a/foto') $$,
  '42501', null, 'anon no sube fotos'
);
select is_empty($$ select id from storage.objects where bucket_id = 'avatars' $$,
  'anon no lista objetos: las fotos se ven por URL pública');

select * from finish();
rollback;
