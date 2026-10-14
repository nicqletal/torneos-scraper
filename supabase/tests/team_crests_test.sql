begin;
create extension if not exists pgtap with schema extensions;
select plan(17);
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name":"Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name":"Beto"}');
insert into public.teams (id, name, zone_id, modality, level) values
  ('11111111-1111-1111-1111-111111111111', 'Los Pibes', 'palermo', 'futbol_7', 'intermedio');
insert into public.team_members (team_id, user_id, is_captain) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', true),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b', false);
select results_eq(
  $$ select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'team-crests' $$,
  $$ values (true, 2097152::bigint, array['image/jpeg', 'image/png', 'image/webp']) $$,
  'el bucket de escudos es público, JPG/PNG/WebP y hasta 2 MB'
);
set local storage.allow_delete_query = 'true';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('team-crests', '11111111-1111-1111-1111-111111111111/actual', '00000000-0000-0000-0000-00000000000a'),
     ('team-crests', '11111111-1111-1111-1111-111111111111/previo', '00000000-0000-0000-0000-00000000000a'),
     ('team-crests', '11111111-1111-1111-1111-111111111111/fallido', '00000000-0000-0000-0000-00000000000a') $$,
  'el capitán sube en la carpeta del equipo'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('team-crests', 'otro-equipo/escudo') $$,
  '42501', null, 'no se sube a otra carpeta'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('team-crests', 'escudo') $$,
  '42501', null, 'no se sube sin carpeta de equipo'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '11111111-1111-1111-1111-111111111111/escudo') $$,
  '42501', null, 'las policies no abren otros buckets'
);
select isnt_empty($$ select id from storage.objects where bucket_id = 'team-crests' $$, 'el capitán ve sus objetos');
update public.teams set crest_url = 'https://test.supabase.co/storage/v1/object/public/team-crests/11111111-1111-1111-1111-111111111111/actual'
where id = '11111111-1111-1111-1111-111111111111';
select is_empty(
  $$ delete from storage.objects where bucket_id = 'team-crests' and name = '11111111-1111-1111-1111-111111111111/actual' returning id $$,
  'nadie retira el escudo vigente'
);
select is_empty($$ update storage.objects set metadata = '{}' where bucket_id = 'team-crests' returning id $$,
  'cada reemplazo requiere un archivo nuevo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is_empty($$ select id from storage.objects where bucket_id = 'team-crests' $$, 'un integrante no lista escudos');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('team-crests', '11111111-1111-1111-1111-111111111111/ajeno', '00000000-0000-0000-0000-00000000000b') $$,
  '42501', null, 'un integrante no sube aunque declare la propiedad del archivo'
);
select is_empty($$ delete from storage.objects where bucket_id = 'team-crests' returning id $$, 'un integrante no retira objetos ajenos');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select isnt_empty(
  $$ delete from storage.objects where bucket_id = 'team-crests' and name = '11111111-1111-1111-1111-111111111111/previo' returning id $$,
  'el capitán retira un escudo que ya no está vigente'
);
select public.dissolve_team('11111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('team-crests', '11111111-1111-1111-1111-111111111111/nuevo') $$,
  '42501', null, 'el equipo disuelto no recibe escudos nuevos'
);
select is_empty(
  $$ delete from storage.objects where bucket_id = 'team-crests' and name = '11111111-1111-1111-1111-111111111111/actual' returning id $$,
  'el escudo vigente del equipo disuelto se conserva'
);
select isnt_empty(
  $$ delete from storage.objects where bucket_id = 'team-crests' and name = '11111111-1111-1111-1111-111111111111/fallido' returning id $$,
  'quien subió limpia un huérfano aunque el equipo se haya disuelto'
);
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('team-crests', '11111111-1111-1111-1111-111111111111/anon') $$,
  '42501', null, 'anon no sube escudos'
);
select is_empty($$ select id from storage.objects where bucket_id = 'team-crests' $$, 'anon no lista objetos, solo ve las imágenes por URL pública');
select * from finish();
rollback;
