begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000000b');

select ok(not has_function_privilege('anon', 'public.is_admin()', 'EXECUTE'),
  'anon no conserva EXECUTE directo ni heredado de PUBLIC');
select ok(has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE'),
  'authenticated puede consultar su rol');

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok($$ select public.is_admin() $$, '42501', null, 'anon no ejecuta el RPC');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select is(public.is_admin(), false, 'un usuario normal no es administrador');
select is_empty($$ select user_id from public.admins $$, 'un usuario no lista administradores');
select throws_ok(
  $$ insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'un usuario no se asigna el rol de administrador'
);
select is_empty(
  $$ update public.admins set user_id = '00000000-0000-0000-0000-00000000000a' returning user_id $$,
  'un usuario no cambia la asignación de administrador'
);

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select is(public.is_admin(), true, 'el RPC reconoce al administrador asignado en la base');
select is_empty($$ select user_id from public.admins $$, 'el RPC no abre la lectura de admins');
select is_empty($$ delete from public.admins returning user_id $$, 'el administrador tampoco cambia su rol desde la API');

select * from finish();
rollback;
