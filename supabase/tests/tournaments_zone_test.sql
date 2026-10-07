-- Zona del torneo desde la lista cerrada, y la lista misma: lectura pública y
-- sin escritura desde la API. Cada test corre en una transacción que se
-- descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name": "Ana"}');

insert into public.tournaments
  (id, name, sport_modality, zone_id, inscription_deadline, start_date, end_date, contact_instagram, user_id)
values
  ('11111111-1111-1111-1111-111111111111', 'Copa de Ana', 'futbol_5', 'palermo',
   '2026-11-10', '2026-11-15', '2026-11-30', 'copa.ana', '00000000-0000-0000-0000-00000000000a');

-- Cuántas zonas hay, contado como postgres (sin RLS), para comparar después
-- con lo que ve anon sin depender de cuántas tenga la planilla.
select set_config('test.zones', (select count(*)::text from public.zones), true);

-- El esquema: la zona es una FK a la lista, y el texto libre ya no existe.
select hasnt_column('public', 'tournaments', 'zone', 'la zona como texto libre ya no existe');
select col_not_null('public', 'tournaments', 'zone_id', 'todo torneo tiene zona');
select fk_ok('public', 'tournaments', 'zone_id', 'public', 'zones', 'id', 'la zona es una de la lista cerrada');

-- Ana, con sesión.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone_id, inscription_deadline, start_date, end_date, contact_instagram, user_id)
     values ('Otra copa de Ana', 'futbol_5', 'belgrano',
             '2026-11-10', '2026-11-15', '2026-11-30', 'copa.ana', '00000000-0000-0000-0000-00000000000a') $$,
  'el organizador crea un torneo con una zona de la lista'
);

select throws_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone_id, inscription_deadline, start_date, end_date, contact_instagram, user_id)
     values ('Copa trucha', 'futbol_5', 'narnia',
             '2026-11-10', '2026-11-15', '2026-11-30', 'copa.ana', '00000000-0000-0000-0000-00000000000a') $$,
  '23503', null, 'una zona que no está en la lista no se guarda'
);

select isnt_empty(
  $$ update public.tournaments set zone_id = 'moron'
     where id = '11111111-1111-1111-1111-111111111111' returning id $$,
  'el organizador cambia la zona de su torneo'
);

select throws_ok(
  $$ update public.tournaments set zone_id = 'narnia'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23503', null, 'y no puede cambiarla por una que no está en la lista'
);

-- La lista cerrada: nadie la escribe desde la API, ni con sesión.
select throws_ok(
  $$ insert into public.zones (id, corridor_id, name) values ('narnia', 'caba-norte', 'Narnia') $$,
  '42501', null, 'un usuario con sesión no agrega zonas'
);

select is_empty(
  $$ update public.zones set name = 'Palermo Hollywood' where id = 'palermo' returning id $$,
  'un usuario con sesión no renombra zonas'
);

-- Sin sesión: la lista y el torneo con su zona y corredor se leen igual.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is(
  (select count(*)::int from public.zones z join public.corridors c on c.id = z.corridor_id
     join public.regions r on r.id = c.region_id),
  current_setting('test.zones')::int,
  'sin sesión se lee la lista completa: región, corredor y zona'
);

select is(
  (select z.name || ' · ' || c.name from public.tournaments t
     join public.zones z on z.id = t.zone_id join public.corridors c on c.id = z.corridor_id
    where t.id = '11111111-1111-1111-1111-111111111111'),
  'Morón · GBA Oeste', 'sin sesión se lee la zona y el corredor de un torneo'
);

select * from finish();
rollback;
