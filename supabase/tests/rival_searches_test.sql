-- Búsqueda de rival: solo el capitán del equipo la publica, edita, cancela y la
-- ve; `compatible_rivals` le muestra los equipos con los que tiene al menos
-- 1 h en común. Las fechas se arman desde hoy en Buenos Aires para que los
-- tests no venzan. Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- Caro: capitana de A. Juli: plantel de A. Beto: capitán de B. Oscar: ajeno.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local',  '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'juli@test.local',  '{"display_name": "Juli"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'beto@test.local',  '{"display_name": "Beto"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'oscar@test.local', '{"display_name": "Oscar"}');

update public.profile_contacts set whatsapp = '5491122334455';

insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Real Floresta', 'palermo', 'futbol_5', 'intermedio'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Los Pibes',     'palermo', 'futbol_5', 'intermedio');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-0000000000c1', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-0000000000a1', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-0000000000b1', true);

-- Una franja dentro de `p_days` días (hoy en Buenos Aires + p_days).
create function pg_temp.slot(p_days int, p_from int, p_to int) returns jsonb
language sql as $$
  select jsonb_build_object(
    'date', ((now() at time zone 'America/Argentina/Buenos_Aires')::date + p_days)::text,
    'from', p_from, 'to', p_to)
$$;

create function pg_temp.login(p_user uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;

-- Publicar -----------------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_5',
  jsonb_build_array(pg_temp.slot(1, 20, 23), pg_temp.slot(2, 9, 11)));

select results_eq(
  $$ select s.modality::text, count(*)
       from public.rival_searches s join public.search_slots sl on sl.search_id = s.id
      group by s.modality $$,
  $$ values ('futbol_5', 2::bigint) $$,
  'la capitana publica una búsqueda con sus dos franjas y la ve'
);

select is(
  (select lower(range) from public.search_slots order by lower(range) limit 1),
  (((now() at time zone 'America/Argentina/Buenos_Aires')::date + 1) + time '20:00') at time zone 'America/Argentina/Buenos_Aires',
  'la franja se arma en hora de Buenos Aires'
);

-- Visibilidad ---------------------------------------------------------------

select isnt(public.active_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_5', now()), null,
  'la capitana encuentra su búsqueda activa');

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is(public.active_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_5', now()), null,
  'al plantel la búsqueda activa de su equipo no le contesta');
select is_empty($$ select id from public.search_slots $$, 'el plantel no ve las franjas de su equipo');
select is_empty($$ select id from public.rival_searches $$, 'el plantel no ve la búsqueda de su equipo');

select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select is_empty($$ select id from public.rival_searches $$, 'un tercero no ve búsquedas ajenas');

select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select is_empty($$ select id from public.rival_searches $$, 'otro capitán no ve búsquedas ajenas');

select throws_ok(
  $$ insert into public.rival_searches (team_id, modality) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'futbol_5') $$,
  '42501', null, 'nadie escribe búsquedas por la API'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok($$ select 1 from public.search_slots $$, '42501', null, 'anon no lee franjas');
select ok(not has_function_privilege('anon', 'public.save_rival_search(uuid, public.sport_modality, jsonb)', 'EXECUTE'),
  'anon no publica búsquedas');
reset role;
set local role authenticated;

-- Rechazos ------------------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_5', jsonb_build_array(pg_temp.slot(3, 20, 22))) $$,
  'P0001', 'Solo el capitán puede buscar rival', 'el plantel no publica'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7',
       jsonb_build_array(pg_temp.slot(3, 20, 22), pg_temp.slot(3, 21, 23))) $$,
  'P0001', 'Hay franjas que se pisan: cada horario va una sola vez', 'franjas pisadas de la misma búsqueda'
);
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', jsonb_build_array(pg_temp.slot(3, 7, 9))) $$,
  'P0001', 'Cada franja va de 8 a 24, en horas enteras, y dura al menos 1 h', 'antes de las 8'
);
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', jsonb_build_array(pg_temp.slot(3, 22, 22))) $$,
  'P0001', 'Cada franja va de 8 a 24, en horas enteras, y dura al menos 1 h', 'menos de 1 h'
);
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', jsonb_build_array(pg_temp.slot(14, 20, 22))) $$,
  'P0001', 'Las franjas tienen que ser de los próximos 14 días', 'a 14 días ya no entra'
);
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', jsonb_build_array(pg_temp.slot(-1, 20, 22))) $$,
  'P0001', 'Las franjas tienen que ser de los próximos 14 días', 'ayer no entra'
);

reset role;
update public.profile_contacts set whatsapp = null where user_id = '00000000-0000-0000-0000-0000000000c1';
set local role authenticated;
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', jsonb_build_array(pg_temp.slot(3, 20, 22))) $$,
  'P0001', 'Cargá tu WhatsApp en el perfil para buscar rival', 'sin WhatsApp no publica'
);
reset role;
update public.profile_contacts set whatsapp = '5491122334455' where user_id = '00000000-0000-0000-0000-0000000000c1';


-- Editar y cancelar ---------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');

-- Conserva la del día 1, saca la del día 2 y agrega una del día 3.
select is(
  public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_5',
    jsonb_build_array(pg_temp.slot(1, 20, 23), pg_temp.slot(3, 18, 20))),
  (select id from public.rival_searches where modality = 'futbol_5'),
  'editar guarda sobre la misma búsqueda activa de esa modalidad'
);
select is(
  (select array_agg(extract(hour from lower(range) at time zone 'America/Argentina/Buenos_Aires')::int order by lower(range))
     from public.search_slots where removed_at is null),
  array[20, 18],
  'quedan la franja conservada y la nueva; la que no vino se saca'
);

select lives_ok(
  $$ select public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', jsonb_build_array(pg_temp.slot(1, 20, 22))) $$,
  'una búsqueda de otra modalidad puede pisar los mismos horarios'
);
select is((select count(*) from public.rival_searches where cancelled_at is null), 2::bigint,
  'una búsqueda por modalidad');

select is(
  public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', '[]'::jsonb),
  null::uuid,
  'sacar la última franja cancela la búsqueda'
);
select isnt_empty($$ select id from public.rival_searches where modality = 'futbol_7' and cancelled_at is not null $$,
  'la búsqueda cancelada queda marcada');
select isnt(
  public.save_rival_search('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'futbol_7', jsonb_build_array(pg_temp.slot(1, 20, 22))),
  (select id from public.rival_searches where modality = 'futbol_7' and cancelled_at is not null),
  'después de cancelar, publicar arma una búsqueda nueva'
);

-- Una búsqueda cuyas franjas ya pasaron deja de estar activa sola.
reset role;
insert into public.rival_searches (id, team_id, modality) values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'futbol_5');
insert into public.search_slots (search_id, range) values
  ('cccccccc-0000-0000-0000-000000000001', tstzrange(now() - interval '3 days', now() - interval '2 days', '[)'));
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select isnt(
  public.save_rival_search('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'futbol_5', jsonb_build_array(pg_temp.slot(1, 21, 23))),
  'cccccccc-0000-0000-0000-000000000001'::uuid,
  'una búsqueda con todas sus franjas pasadas no es la activa'
);

reset role;
update public.teams set dissolved_at = now() where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
set local role authenticated;
select throws_ok(
  $$ select public.save_rival_search('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'futbol_5', jsonb_build_array(pg_temp.slot(2, 20, 22))) $$,
  'P0001', 'El equipo está disuelto', 'un equipo disuelto no busca rival'
);
reset role;
update public.teams set dissolved_at = null where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select * from finish();
rollback;
