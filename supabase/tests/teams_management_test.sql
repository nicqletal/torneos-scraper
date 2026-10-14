begin;
create extension if not exists pgtap with schema extensions;
select plan(20);
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name":"Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@test.local', '{"display_name":"Beto"}');
update public.profile_contacts set whatsapp = '5491122334455';
insert into public.teams (id, name, zone_id, modality, level, crest_url) values
  ('11111111-1111-1111-1111-111111111111', 'Los Pibes', 'palermo', 'futbol_7', 'intermedio', 'https://test.supabase.co/storage/v1/object/public/team-crests/11111111-1111-1111-1111-111111111111/actual'),
  ('22222222-2222-2222-2222-222222222222', 'Segundo', 'palermo', 'futbol_7', 'intermedio', null),
  ('33333333-3333-3333-3333-333333333333', 'Tercero', 'palermo', 'futbol_7', 'intermedio', null);
insert into public.team_members (team_id, user_id, is_captain) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', true),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-00000000000a', true),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-00000000000a', true),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b', false);
insert into public.team_invites (team_id, token, expires_at)
values ('11111111-1111-1111-1111-111111111111', 'test-invite', now() + interval '7 days');

select ok(not has_function_privilege('anon', 'public.dissolve_team(uuid)', 'EXECUTE'), 'anon no ejecuta disolución, tampoco por PUBLIC');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is_empty(
  $$ update public.teams set name = 'Ajeno' where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'un integrante que no es capitán no edita'
);
select throws_ok($$ select public.dissolve_team('11111111-1111-1111-1111-111111111111') $$,
  'P0001', 'Solo el capitán puede disolver el equipo', 'un integrante no disuelve');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select isnt_empty(
  $$ update public.teams set name = 'Los Pibes BA', level = 'competitivo'
     where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'el capitán edita un equipo activo'
);
select throws_ok(
  $$ update public.teams set dissolved_at = now() where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'disolver no admite update directo'
);
select public.transfer_captaincy('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b');
select is_empty(
  $$ update public.teams set name = 'Creador' where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'quien creó el equipo pierde el permiso al transferir capitanía'
);
select throws_ok($$ select public.dissolve_team('11111111-1111-1111-1111-111111111111') $$,
  'P0001', 'Solo el capitán puede disolver el equipo', 'el creador anterior no disuelve');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select isnt_empty(
  $$ update public.teams set name = 'Los Pibes' where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'la edición corresponde al capitán actual'
);
select public.transfer_captaincy('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.dissolve_team('11111111-1111-1111-1111-111111111111') $$, 'el capitán disuelve');
select isnt_empty($$ select dissolved_at from public.teams where id = '11111111-1111-1111-1111-111111111111' and dissolved_at is not null $$,
  'la disolución marca la fecha y conserva el equipo');
select is((select count(*) from public.team_members where team_id = '11111111-1111-1111-1111-111111111111'), 2::bigint,
  'se conserva el plantel');
select is((select crest_url from public.teams where id = '11111111-1111-1111-1111-111111111111'),
  'https://test.supabase.co/storage/v1/object/public/team-crests/11111111-1111-1111-1111-111111111111/actual',
  'se conserva el escudo');
select is_empty($$ select * from public.get_team_invite('11111111-1111-1111-1111-111111111111') $$, 'la invitación deja de estar disponible');
select throws_ok($$ select public.join_team('test-invite') $$, 'P0001', 'El link de invitación no es válido o venció', 'la invitación antigua no permite entrar');
select is_empty(
  $$ update public.teams set name = 'Reactivado' where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'el equipo disuelto no se edita'
);
select throws_ok($$ select public.dissolve_team('11111111-1111-1111-1111-111111111111') $$,
  'P0001', 'El equipo ya está disuelto', 'no se disuelve nuevamente');
select throws_ok($$ select public.regenerate_team_invite('11111111-1111-1111-1111-111111111111') $$,
  'P0001', 'El equipo está disuelto', 'no se regeneran invitaciones');
select lives_ok($$ select public.create_team('Nuevo equipo', 'palermo', 'futbol_7', 'intermedio') $$,
  'la disolución libera un cupo de capitanía');
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select isnt_empty($$ select id from public.teams where id = '11111111-1111-1111-1111-111111111111' $$,
  'la página del equipo disuelto sigue siendo pública');
select is_empty($$ select user_id from public.team_members where team_id = '11111111-1111-1111-1111-111111111111' $$,
  'su plantel continúa privado');
select * from finish();
rollback;
