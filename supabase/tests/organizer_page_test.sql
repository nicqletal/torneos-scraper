-- Página pública del organizador: cualquiera lee el perfil (nombre, foto, zona,
-- fecha de alta) y sus torneos, pero nunca el WhatsApp, que vive aparte en
-- `profile_contacts`. Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

-- El trigger `handle_new_user` crea el perfil y la fila de contacto.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name": "Ana"}');

update public.profiles set zone_id = 'palermo'
 where id = '00000000-0000-0000-0000-00000000000a';
update public.profile_contacts set whatsapp = '5491122334455'
 where user_id = '00000000-0000-0000-0000-00000000000a';

insert into public.tournaments
  (name, sport_modality, zone_id, inscription_deadline, start_date, end_date, contact_instagram, user_id)
values
  ('Copa de Ana', 'futbol_5', 'palermo',
   '2026-11-10', '2026-11-15', '2026-11-30', 'copa.ana', '00000000-0000-0000-0000-00000000000a');

-- El perfil público no tiene ninguna columna de contacto.
select hasnt_column('public', 'profiles', 'whatsapp', 'el WhatsApp no está en el perfil público');

-- Un visitante sin sesión.
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select results_eq(
  $$ select display_name, zone_id from public.profiles
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Ana'::text, 'palermo'::text) $$,
  'anon lee el nombre y la zona del organizador'
);

select isnt_empty(
  $$ select created_at from public.profiles
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  'anon lee la fecha de alta, para "Organiza desde"'
);

select is_empty(
  $$ select whatsapp from public.profile_contacts $$,
  'anon no ve el WhatsApp de nadie'
);

select results_eq(
  $$ select name from public.tournaments
     where user_id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Copa de Ana'::text) $$,
  'anon lee los torneos del organizador'
);

-- Otro usuario con sesión tampoco ve el WhatsApp de Ana.
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name": "Beto"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select is_empty(
  $$ select whatsapp from public.profile_contacts
     where user_id = '00000000-0000-0000-0000-00000000000a' $$,
  'otro usuario con sesión no ve el WhatsApp del organizador'
);

select results_eq(
  $$ select display_name from public.profiles
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Ana'::text) $$,
  'y sí ve su perfil público'
);

select * from finish();
rollback;
