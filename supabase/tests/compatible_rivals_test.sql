-- Compatibles: equipos con una búsqueda activa de la misma modalidad, al menos
-- 1 h en común el mismo día y nivel no opuesto, ordenados por cercanía (zona >
-- corredor > región), nivel y presentismo. Solo los ve el capitán de la
-- búsqueda. Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- Caro: capitana de A y de G. Juli: plantel de A. Beto y Dani: capitanes de
-- los rivales. Oscar: ajeno.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local',  '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'juli@test.local',  '{"display_name": "Juli"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'beto@test.local',  '{"display_name": "Beto"}'),
  ('00000000-0000-0000-0000-0000000000d1', 'dani@test.local',  '{"display_name": "Dani"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'oscar@test.local', '{"display_name": "Oscar"}');

update public.profile_contacts set whatsapp = '5491122334455';

-- Palermo y Belgrano son de CABA Norte; Morón, de GBA Oeste.
insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'A propio',          'palermo',  'futbol_5', 'recreativo'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'B zona nivel +1',   'palermo',  'futbol_5', 'intermedio'),
  ('cccccccc-0000-0000-0000-000000000000', 'C zona mismo nivel','palermo',  'futbol_5', 'recreativo'),
  ('dddddddd-0000-0000-0000-000000000000', 'D corredor',        'belgrano', 'futbol_5', 'recreativo'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'E otra región',     'moron',    'futbol_5', 'recreativo'),
  ('ffffffff-0000-0000-0000-000000000000', 'F competitivo',     'palermo',  'futbol_5', 'competitivo'),
  ('99999999-0000-0000-0000-000000000000', 'G de Caro',         'palermo',  'futbol_5', 'recreativo'),
  ('88888888-0000-0000-0000-000000000000', 'H otra modalidad',  'palermo',  'futbol_7', 'recreativo'),
  ('77777777-0000-0000-0000-000000000000', 'I se tocan',        'palermo',  'futbol_5', 'recreativo'),
  ('66666666-0000-0000-0000-000000000000', 'J disuelto',        'palermo',  'futbol_5', 'recreativo'),
  ('55555555-0000-0000-0000-000000000000', 'K cancelada',       'palermo',  'futbol_5', 'recreativo');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', false),
  ('99999999-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
  ('bbbbbbbb-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', true),
  ('cccccccc-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', true),
  ('dddddddd-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', true),
  ('eeeeeeee-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', true),
  ('ffffffff-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', true),
  ('88888888-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', true),
  ('77777777-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', true),
  ('66666666-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', true),
  ('55555555-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', true);

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

-- Publica una búsqueda como el capitán del equipo.
create function pg_temp.publish(p_user uuid, p_team uuid, p_modality public.sport_modality, p_slots jsonb) returns uuid
language sql as $$
  select pg_temp.login(p_user);
  select public.save_rival_search(p_team, p_modality, p_slots);
$$;

-- Las horas de Buenos Aires de un rango, "18-23" (una franja nunca cruza la medianoche).
create function pg_temp.hours(p_range tstzrange) returns text
language sql as $$
  select h || '-' || (h + extract(epoch from upper(p_range) - lower(p_range)) / 3600)::int
    from (select extract(hour from lower(p_range) at time zone 'America/Argentina/Buenos_Aires')::int as h) as x
$$;

set local role authenticated;

create temp table search_a as
  select pg_temp.publish('00000000-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5',
    jsonb_build_array(pg_temp.slot(2, 18, 23), pg_temp.slot(3, 20, 22))) as id;

select pg_temp.publish('00000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 20, 22), pg_temp.slot(3, 20, 22)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000b1', 'cccccccc-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 21, 24)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000b1', 'dddddddd-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 17, 19)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000d1', 'eeeeeeee-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 22, 23)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000d1', 'ffffffff-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 18, 23)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000c1', '99999999-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 18, 23)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000d1', '88888888-0000-0000-0000-000000000000', 'futbol_7',
  jsonb_build_array(pg_temp.slot(2, 18, 23)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000d1', '77777777-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 8, 18), pg_temp.slot(4, 18, 23)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000d1', '66666666-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 18, 23)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000d1', '55555555-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 18, 23)));
select pg_temp.publish('00000000-0000-0000-0000-0000000000d1', '55555555-0000-0000-0000-000000000000', 'futbol_5', '[]');

reset role;
update public.teams set dissolved_at = now() where id = '66666666-0000-0000-0000-000000000000';
set local role authenticated;

-- Filtros y orden ----------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select team_name, pg_temp.hours(common_range) from public.compatible_rivals((select id from search_a)) $$,
  $$ values ('C zona mismo nivel', '21-23'),
            ('B zona nivel +1',    '20-22'),
            ('B zona nivel +1',    '20-22'),
            ('D corredor',         '18-19'),
            ('E otra región',      '22-23') $$,
  'misma modalidad, ≥ 1 h en común el mismo día, nivel no opuesto, ni equipos propios; por zona, corredor, región y nivel'
);

select results_eq(
  $$ select pg_temp.hours(slot_range), pg_temp.hours(rival_slot_range), zone_name, level::text
       from public.compatible_rivals((select id from search_a)) where team_name = 'C zona mismo nivel' $$,
  $$ values ('18-23', '21-24', 'Palermo', 'recreativo') $$,
  'cada compatible trae la franja propia, la del rival y los datos del rival para mostrar'
);

-- La cercanía y el nivel salen de los datos actuales del equipo.
reset role;
update public.teams set zone_id = 'moron' where id = 'cccccccc-0000-0000-0000-000000000000';
set local role authenticated;
select results_eq(
  $$ select team_name from public.compatible_rivals((select id from search_a)) $$,
  $$ values ('B zona nivel +1'), ('B zona nivel +1'), ('D corredor'), ('C zona mismo nivel'), ('E otra región') $$,
  'si un rival se muda de zona, baja en la lista sin editar su búsqueda (entre iguales, primero el horario más temprano)'
);

-- Acceso -------------------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is_empty($$ select * from public.compatible_rivals((select id from search_a)) $$,
  'el plantel no ve los compatibles de su equipo');

select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select is_empty($$ select * from public.compatible_rivals((select id from search_a)) $$,
  'otro capitán no ve los compatibles de una búsqueda ajena');

select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select is_empty($$ select * from public.compatible_rivals((select id from search_a)) $$,
  'un tercero no ve compatibles');

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5', '[]');
select is_empty($$ select * from public.compatible_rivals((select id from search_a)) $$,
  'una búsqueda cancelada no tiene compatibles');

reset role;
select ok(not has_function_privilege('anon', 'public.compatible_rivals(uuid)', 'EXECUTE'),
  'anon no ve compatibles');

select * from finish();
rollback;
