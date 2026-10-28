-- Partido acordado: aceptar una propuesta hace nacer el partido, anula las
-- propuestas pendientes superpuestas de los dos equipos y ocupa sus franjas.
-- Lo ve el plantel actual de los dos equipos; el WhatsApp del rival, solo el
-- capitán. Disolver un equipo con un partido por jugarse se rechaza. Cada test
-- corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

-- Caro: capitana de A. Juli: plantel de A. Rafa: capitán de R.
-- Beto: capitán de B. Oscar: ajeno.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local',  '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'juli@test.local',  '{"display_name": "Juli"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'rafa@test.local',  '{"display_name": "Rafa"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'beto@test.local',  '{"display_name": "Beto"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'oscar@test.local', '{"display_name": "Oscar"}');

update public.profile_contacts set whatsapp = case user_id
  when '00000000-0000-0000-0000-0000000000c1' then '5491100000001'
  when '00000000-0000-0000-0000-0000000000a1' then '5491100000002'
  when '00000000-0000-0000-0000-0000000000e1' then '5491100000003'
  when '00000000-0000-0000-0000-0000000000b1' then '5491100000004'
  when '00000000-0000-0000-0000-0000000000f1' then '5491100000005'
end;

insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Real Floresta', 'palermo', 'futbol_5', 'recreativo'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Los Rivales',   'palermo', 'futbol_5', 'recreativo'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'Beto FC',       'palermo', 'futbol_5', 'recreativo');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', false),
  ('eeeeeeee-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000e1', true),
  ('bbbbbbbb-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', true);

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

-- Las horas de Buenos Aires de un rango, "20-23".
create function pg_temp.hours(p_range tstzrange) returns text
language sql as $$
  select h || '-' || (h + extract(epoch from upper(p_range) - lower(p_range)) / 3600)::int
    from (select extract(hour from lower(p_range) at time zone 'America/Argentina/Buenos_Aires')::int as h) as x
$$;

-- La franja vigente de un equipo que empieza a tal hora, en `p_days` días.
create function pg_temp.slot_id(p_team uuid, p_days int, p_from int) returns uuid
language sql security definer as $$
  select sl.id from public.search_slots sl join public.rival_searches s on s.id = sl.search_id
   where s.team_id = p_team and s.cancelled_at is null and sl.removed_at is null
     and lower(sl.range) = ((now() at time zone 'America/Argentina/Buenos_Aires')::date + p_days
                            + make_interval(hours => p_from)) at time zone 'America/Argentina/Buenos_Aires'
$$;

-- Fase calculada -------------------------------------------------------------

select is(
  public.match_phase(row(gen_random_uuid(), '[2026-11-05 20:00-03, 2026-11-05 22:00-03)', now())::public.matches,
                     '2026-11-05 19:59-03'),
  'por_jugarse',
  'un partido recién acordado está por jugarse'
);

-- Aceptar ------------------------------------------------------------------

set local role authenticated;

-- A busca en dos días; R y B, el mismo día que A.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 18, 23), pg_temp.slot(3, 18, 22)));
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.save_rival_search('eeeeeeee-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 20, 24), pg_temp.slot(3, 20, 22)));
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select public.save_rival_search('bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 19, 21)));

-- Caro le propone a R (20 a 23) y B le propone a Caro (19 a 21): se superponen.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table to_rafa as
  select public.send_proposal(
    pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
    pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 2, 20)) as id;
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
create temp table from_beto as
  select public.send_proposal(
    pg_temp.slot_id('bbbbbbbb-0000-0000-0000-000000000000', 2, 19),
    pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18)) as id;
-- Y otra de Caro a R, otro día: no se superpone.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table other_day as
  select public.send_proposal(
    pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 3, 18),
    pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 3, 20)) as id;

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select lives_ok(
  $$ select public.respond_proposal((select id from to_rafa), true) $$,
  'Rafa acepta la propuesta de Caro'
);

select results_eq(
  $$ select team_name, rival_team_name, pg_temp.hours(range), phase from public.match_details $$,
  $$ values ('Los Rivales', 'Real Floresta', '20-23', 'por_jugarse') $$,
  'nace el partido, por el rango de la propuesta, y Rafa lo ve'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select team_name, rival_team_name, pg_temp.hours(range), phase from public.match_details $$,
  $$ values ('Real Floresta', 'Los Rivales', '20-23', 'por_jugarse') $$,
  'Caro lo ve desde su equipo'
);


select results_eq(
  $$ select status from public.proposal_details where id in (select id from to_rafa) $$,
  $$ values ('aceptada') $$,
  'la propuesta queda aceptada'
);
select results_eq(
  $$ select kind::text, params ->> 'team_a', params ->> 'team_b', pg_temp.hours(tstzrange(
            (params ->> 'range_start')::timestamptz, (params ->> 'range_end')::timestamptz))
       from public.notices where kind = 'match_agreed' $$,
  $$ values ('match_agreed', 'Real Floresta', 'Los Rivales', '20-23') $$,
  'Caro recibe "Partido acordado"'
);
select results_eq(
  $$ select status from public.proposal_details where id in (select id from other_day) $$,
  $$ values ('pendiente') $$,
  'una propuesta de otro horario sigue pendiente'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select results_eq(
  $$ select kind::text from public.notices $$,
  $$ values ('match_agreed') $$,
  'Juli, del plantel, también recibe "Partido acordado"'
);
select results_eq(
  $$ select team_name, rival_team_name, is_captain from public.match_details $$,
  $$ values ('Real Floresta', 'Los Rivales', false) $$,
  'y ve el partido'
);
select is_empty($$ select * from public.proposal_details $$, 'pero no las propuestas');

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select is_empty(
  $$ select * from public.notices where kind = 'match_agreed' $$,
  'Rafa, que aceptó, no recibe aviso'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select results_eq(
  $$ select status from public.proposal_details where id in (select id from from_beto) $$,
  $$ values ('anulada') $$,
  'la propuesta de Beto a Caro, superpuesta, queda anulada'
);
select results_eq(
  $$ select params ->> 'rival_name', pg_temp.hours(tstzrange(
            (params ->> 'range_start')::timestamptz, (params ->> 'range_end')::timestamptz))
       from public.notices where kind = 'proposal_annulled' $$,
  $$ values ('Real Floresta', '19-21') $$,
  'y Beto recibe "Se anuló tu propuesta: ya no tienen ese horario"'
);
select is_empty($$ select * from public.match_details $$, 'Beto no ve el partido');

select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select is_empty($$ select * from public.match_details $$, 'Oscar no ve el partido');
select is_empty($$ select * from public.matches $$, 'ni la tabla');
select is_empty($$ select * from public.notices $$, 'ni recibe avisos');

reset role;
set local role anon;
select throws_ok($$ select * from public.match_details $$, '42501', null, 'anon no puede leer los partidos');
select throws_ok($$ select * from public.match_sides $$, '42501', null, 'ni los lados');
reset role;
set local role authenticated;

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ insert into public.matches (range) values ('[2026-11-05 20:00-03, 2026-11-05 22:00-03)') $$,
  '42501', null, 'nadie escribe partidos desde la API'
);


-- Superposición -------------------------------------------------------------

-- La carrera de dos aceptaciones: la primera anula la otra propuesta
-- superpuesta, así que la segunda, que espera el bloqueo de los equipos y
-- relee, ya no la encuentra pendiente.
select throws_ok(
  $$ select public.respond_proposal((select id from from_beto), true) $$,
  'La propuesta ya no está pendiente',
  'Caro ya no puede aceptar la propuesta de Beto, superpuesta con el partido'
);

-- Un partido de B escrito a mano, sin anular nada: aceptar una propuesta que
-- se le superpone igual se rechaza.
reset role;
create temp table b_match as
  select gen_random_uuid() as id,
         tstzrange(lower(range), upper(range), '[)') as range
    from public.proposals where id = (select id from other_day);
insert into public.matches (id, range) select id, range from b_match;
insert into public.match_sides (match_id, team_id)
  select id, 'bbbbbbbb-0000-0000-0000-000000000000'::uuid from b_match
  union all
  select id, 'eeeeeeee-0000-0000-0000-000000000000' from b_match;
set local role authenticated;

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select throws_ok(
  $$ select public.respond_proposal((select id from other_day), true) $$,
  'Alguno de los dos equipos ya tiene un partido en ese horario',
  'no se acepta si alguno de los dos ya tiene un partido en ese horario'
);

reset role;
delete from public.match_sides where match_id = (select id from b_match);
delete from public.matches where id = (select id from b_match);
set local role authenticated;

-- Franjas ocupadas -----------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select is_empty(
  $$ select * from public.compatible_rivals(
       public.active_rival_search('bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5', now())) $$,
  'las franjas ocupadas de A y de R salen de los compatibles de Beto'
);
select throws_ok(
  $$ select public.send_proposal(pg_temp.slot_id('bbbbbbbb-0000-0000-0000-000000000000', 2, 19),
                                 pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18)) $$,
  'Ese equipo no es compatible con tu búsqueda',
  'y no reciben más propuestas'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select team_name, pg_temp.hours(common_range) from public.compatible_rivals(
       public.active_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5', now())) $$,
  $$ values ('Los Rivales', '20-22') $$,
  'Caro sigue viendo a R en el otro día, pero no en la franja ocupada'
);

select throws_ok(
  $$ select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_7',
       jsonb_build_array(pg_temp.slot(2, 21, 23))) $$,
  'Esa franja se pisa con un partido de tu equipo',
  'no se publica una franja que se superpone con un partido del equipo, aunque sea de otra modalidad'
);
select lives_ok(
  $$ select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5',
       jsonb_build_array(pg_temp.slot(2, 18, 23), pg_temp.slot(3, 18, 22), pg_temp.slot(4, 18, 20))) $$,
  'la franja que ya estaba y quedó ocupada no impide editar la búsqueda'
);


-- WhatsApp del capitán rival ------------------------------------------------

reset role;
create temp table the_match as
  select match_id as id from public.proposals where id = (select id from to_rafa);
grant select on the_match to authenticated;
set local role authenticated;

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is(public.rival_captain_whatsapp((select id from the_match)), '5491100000003',
  'Caro ve el WhatsApp de Rafa');
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select is(public.rival_captain_whatsapp((select id from the_match)), '5491100000001',
  'Rafa ve el de Caro');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is(public.rival_captain_whatsapp((select id from the_match)), null,
  'Juli, del plantel, no ve el WhatsApp del rival');
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select is(public.rival_captain_whatsapp((select id from the_match)), null,
  'Oscar tampoco');

reset role;
select ok(not has_function_privilege('anon', 'public.rival_captain_whatsapp(uuid)', 'EXECUTE'),
  'anon no lo puede pedir');

-- Siempre el del capitán actual: Caro le pasa la capitanía a Juli.
update public.team_members set is_captain = false
 where team_id = 'aaaaaaaa-0000-0000-0000-000000000000';
update public.team_members set is_captain = true
 where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' and user_id = '00000000-0000-0000-0000-0000000000a1';
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select is(public.rival_captain_whatsapp((select id from the_match)), '5491100000002',
  'después de un cambio de capitán, Rafa ve el WhatsApp de Juli');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is(public.rival_captain_whatsapp((select id from the_match)), null,
  'y Caro, que ya no es capitana, deja de ver el de Rafa');
reset role;
update public.team_members set is_captain = false
 where team_id = 'aaaaaaaa-0000-0000-0000-000000000000';
update public.team_members set is_captain = true
 where team_id = 'aaaaaaaa-0000-0000-0000-000000000000' and user_id = '00000000-0000-0000-0000-0000000000c1';
set local role authenticated;

-- Disolver -------------------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.dissolve_team('aaaaaaaa-0000-0000-0000-000000000000') $$,
  'Tenés un partido pendiente: tiralo o cerrá el resultado antes de disolver',
  'Caro no puede disolver A con un partido por jugarse'
);

-- Beto, sin partidos, le propone a Rafa y después disuelve su equipo.
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select public.save_rival_search('bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 19, 21), pg_temp.slot(3, 20, 22)));
create temp table beto_to_rafa as
  select public.send_proposal(
    pg_temp.slot_id('bbbbbbbb-0000-0000-0000-000000000000', 3, 20),
    pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 3, 20)) as id;
select lives_ok(
  $$ select public.dissolve_team('bbbbbbbb-0000-0000-0000-000000000000') $$,
  'Beto, sin partidos pendientes, disuelve su equipo'
);
select is_empty(
  $$ select * from public.rival_searches where cancelled_at is null $$,
  'y se cancelan sus búsquedas activas'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select results_eq(
  $$ select status from public.proposal_details where id = (select id from beto_to_rafa) $$,
  $$ values ('busqueda_cancelada') $$,
  'con sus propuestas pendientes'
);
select results_eq(
  $$ select params ->> 'rival_name' from public.notices where kind = 'proposal_cancelled' $$,
  $$ values ('Beto FC') $$,
  'y Rafa recibe "Se canceló tu propuesta"'
);

select * from finish();
rollback;
