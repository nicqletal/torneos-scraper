-- Faltas y bloqueo: con 3 faltas en 90 días el equipo queda bloqueado 30 días
-- desde la tercera. Un equipo bloqueado no publica búsquedas, sus búsquedas
-- dejan de estar activas y sus propuestas pendientes se ven canceladas. Los
-- compatibles ordenan por faltas en 90 días y mandan al final a los de 2. Las
-- faltas se escriben como partidos caídos con fechas hacia atrás. Cada test
-- corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Caro: capitana de A. Beto: capitán de B, C y D.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local', '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'beto@test.local', '{"display_name": "Beto"}');

update public.profile_contacts set whatsapp = '5491122334455';

-- Palermo y Belgrano son de CABA Norte.
insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'A propio',         'palermo',  'futbol_5', 'recreativo'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'B zona, 2 faltas', 'palermo',  'futbol_5', 'recreativo'),
  ('cccccccc-0000-0000-0000-000000000000', 'C zona, 1 falta',  'palermo',  'futbol_5', 'recreativo'),
  ('dddddddd-0000-0000-0000-000000000000', 'D corredor',       'belgrano', 'futbol_5', 'recreativo');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
  ('bbbbbbbb-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', true),
  ('cccccccc-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', true),
  ('dddddddd-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', true);

create function pg_temp.login(p_user uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true)
$$;

create function pg_temp.slot(p_days int, p_from int, p_to int) returns jsonb
language sql as $$
  select jsonb_build_object(
    'date', ((now() at time zone 'America/Argentina/Buenos_Aires')::date + p_days)::text,
    'from', p_from, 'to', p_to)
$$;

-- Una falta del equipo: un partido que tiró solo `p_ago` atrás, 1 h antes de
-- empezar.
create function pg_temp.fault(p_team uuid, p_ago interval) returns void
language sql as $$
  insert into public.matches (range, dropped_at, drop_reason, dropped_by_team_id)
  values (tstzrange(now() - p_ago + interval '1 hour', now() - p_ago + interval '3 hours', '[)'),
          now() - p_ago, 'no llegamos', p_team);
$$;

create function pg_temp.blocked_until(p_team uuid, p_now timestamptz) returns timestamptz
language sql as $$
  select public.team_blocked_until(p_team, p_now)
$$;

-- Bloqueo --------------------------------------------------------------------

-- A: dos faltas recientes.
select pg_temp.fault('aaaaaaaa-0000-0000-0000-000000000000', interval '40 days');
select pg_temp.fault('aaaaaaaa-0000-0000-0000-000000000000', interval '20 days');
select is(pg_temp.blocked_until('aaaaaaaa-0000-0000-0000-000000000000', now()), null,
  'con 2 faltas en 90 días no hay bloqueo');

-- La tercera, hace 5 días: bloqueado hasta dentro de 25 días.
select pg_temp.fault('aaaaaaaa-0000-0000-0000-000000000000', interval '5 days');
select is(pg_temp.blocked_until('aaaaaaaa-0000-0000-0000-000000000000', now()), now() + interval '25 days',
  'a la tercera falta en 90 días, bloqueado 30 días desde la tercera');
select is(pg_temp.blocked_until('aaaaaaaa-0000-0000-0000-000000000000', now() + interval '25 days' - interval '1 second'),
  now() + interval '25 days', 'sigue bloqueado hasta el último segundo');
select is(pg_temp.blocked_until('aaaaaaaa-0000-0000-0000-000000000000', now() + interval '25 days'), null,
  'a los 30 días de la tercera se termina el bloqueo');

-- D: una falta de hace 100 días y dos recientes.
select pg_temp.fault('dddddddd-0000-0000-0000-000000000000', interval '100 days');
select pg_temp.fault('dddddddd-0000-0000-0000-000000000000', interval '10 days');
select pg_temp.fault('dddddddd-0000-0000-0000-000000000000', interval '2 days');
select is(pg_temp.blocked_until('dddddddd-0000-0000-0000-000000000000', now()), null,
  'las faltas de hace más de 90 días no cuentan');

-- Un equipo bloqueado no publica ni propone ---------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5', jsonb_build_array(pg_temp.slot(2, 20, 22))) $$,
  'P0001', 'El equipo está bloqueado por faltas hasta el ' || to_char((now() + interval '25 days') at time zone 'America/Argentina/Buenos_Aires', 'FMDD/FMMM'),
  'un equipo bloqueado no publica búsquedas, y se le dice hasta cuándo');

-- Búsquedas de antes del bloqueo: se escribe la tercera falta de A después de
-- publicar, como pasa en la realidad.
reset role;
delete from public.matches where dropped_by_team_id = 'aaaaaaaa-0000-0000-0000-000000000000' and dropped_at > now() - interval '6 days';

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table search_a as
  select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5', jsonb_build_array(pg_temp.slot(2, 20, 22))) as id;
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
create temp table search_b as
  select public.save_rival_search('bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5', jsonb_build_array(pg_temp.slot(2, 20, 22))) as id;
create temp table search_c as
  select public.save_rival_search('cccccccc-0000-0000-0000-000000000000', 'futbol_5', jsonb_build_array(pg_temp.slot(2, 20, 22))) as id;
create temp table search_d as
  select public.save_rival_search('dddddddd-0000-0000-0000-000000000000', 'futbol_5', jsonb_build_array(pg_temp.slot(2, 20, 22))) as id;

-- C le propone a A.
create temp table proposal_ca as
  select public.send_proposal(
    (select id from public.search_slots where search_id = (select id from search_c)),
    (select c.rival_slot_id from public.compatible_rivals((select id from search_c)) c
      where c.team_id = 'aaaaaaaa-0000-0000-0000-000000000000')) as id;

-- Presentismo: B con 2 faltas en 90 días, C con 1, D con 2 (y una vieja).
reset role;
select pg_temp.fault('bbbbbbbb-0000-0000-0000-000000000000', interval '30 days');
select pg_temp.fault('bbbbbbbb-0000-0000-0000-000000000000', interval '3 days');
select pg_temp.fault('cccccccc-0000-0000-0000-000000000000', interval '3 days');
create temp table slot_d as select id from public.search_slots where search_id = (select id from search_d);
grant select on search_a, search_b, search_c, search_d, proposal_ca, slot_d to authenticated;

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select team_name from public.compatible_rivals((select id from search_a)) $$,
  $$ values ('C zona, 1 falta'), ('B zona, 2 faltas'), ('D corredor') $$,
  'los compatibles ordenan por presentismo después de cercanía y nivel, y mandan al final a los de 2 faltas en 90 días'
);

-- Ahora A suma la tercera falta.
reset role;
select pg_temp.fault('aaaaaaaa-0000-0000-0000-000000000000', interval '1 minute');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is(public.active_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5', now()), null,
  'la búsqueda de un equipo bloqueado deja de estar activa');
select is((select status from public.proposal_details where id = (select id from proposal_ca)), 'equipo_bloqueado',
  'sus propuestas pendientes se ven canceladas porque el equipo está bloqueado');

select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select is((select status from public.proposal_details where id = (select id from proposal_ca)), 'equipo_bloqueado',
  'también desde el otro lado');
select is_empty(
  $$ select 1 from public.compatible_rivals((select id from search_b)) where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' $$,
  'un equipo bloqueado no aparece como compatible');
select throws_ok(
  $$ select public.respond_proposal((select id from proposal_ca), true) $$,
  'P0001', 'La propuesta ya no está pendiente', 'ni se puede aceptar una propuesta con un equipo bloqueado');

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.send_proposal(
       (select id from public.search_slots where search_id = (select id from search_a)),
       (select id from slot_d)) $$,
  'P0001', 'El equipo está bloqueado por faltas hasta el ' || to_char((now() + interval '30 days' - interval '1 minute') at time zone 'America/Argentina/Buenos_Aires', 'FMDD/FMMM'),
  'un equipo bloqueado no manda propuestas');

select * from finish();
rollback;
