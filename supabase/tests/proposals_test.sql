-- Propuestas: el estado se calcula al leer (`proposal_status` con `p_now`),
-- `send_proposal` y `respond_proposal` son las únicas formas de escribirlas, y
-- sacar una franja o cancelar la búsqueda cancela sus propuestas pendientes.
-- Solo las ven los capitanes de los dos equipos. Cada test corre en una
-- transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- Caro: capitana de A y de G. Juli: plantel de A. Rafa: capitán de R.
-- Beto: capitán de B. Oscar: ajeno.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'caro@test.local',  '{"display_name": "Caro"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'juli@test.local',  '{"display_name": "Juli"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'rafa@test.local',  '{"display_name": "Rafa"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'beto@test.local',  '{"display_name": "Beto"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'oscar@test.local', '{"display_name": "Oscar"}');

update public.profile_contacts set whatsapp = '5491122334455';

insert into public.teams (id, name, zone_id, modality, level) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Real Floresta', 'palermo', 'futbol_5', 'recreativo'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Los Rivales',   'palermo', 'futbol_5', 'recreativo'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'Beto FC',       'palermo', 'futbol_5', 'recreativo'),
  ('99999999-0000-0000-0000-000000000000', 'G de Caro',     'palermo', 'futbol_5', 'recreativo');

insert into public.team_members (team_id, user_id, is_captain) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', false),
  ('99999999-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', true),
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

-- Estado calculado ---------------------------------------------------------

-- Una propuesta armada a mano: creada el 1/11 a las 12:00, por un rango que
-- empieza el 5/11 a las 20:00 (más de 72 h después).
create temp table fixed_slots as
  select gen_random_uuid() as search_id, gen_random_uuid() as slot_a, gen_random_uuid() as slot_b;
insert into public.rival_searches (id, team_id, modality)
  select search_id, 'aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5' from fixed_slots;
insert into public.search_slots (id, search_id, range)
  select slot_a, search_id, '[2026-11-05 20:00-03, 2026-11-05 22:00-03)'::tstzrange from fixed_slots
  union all
  select slot_b, search_id, '[2026-11-02 20:00-03, 2026-11-02 22:00-03)'::tstzrange from fixed_slots;

-- Lejos: vence a las 72 h justas.
insert into public.proposals (id, from_slot_id, to_slot_id, range, created_at)
  select '11111111-0000-0000-0000-000000000001', slot_a, slot_a,
         '[2026-11-05 20:00-03, 2026-11-05 22:00-03)', '2026-11-01 12:00-03' from fixed_slots;
-- Cerca: vence cuando empieza el rango (antes de las 72 h).
insert into public.proposals (id, from_slot_id, to_slot_id, range, created_at)
  select '11111111-0000-0000-0000-000000000002', slot_b, slot_b,
         '[2026-11-02 20:00-03, 2026-11-02 22:00-03)', '2026-11-01 12:00-03' from fixed_slots;

select results_eq(
  $$ select public.proposal_status(p, t::timestamptz)::text
       from public.proposals p,
            unnest(array['2026-11-04 11:59:59-03', '2026-11-04 12:00-03']) with ordinality as x(t, n)
      where p.id = '11111111-0000-0000-0000-000000000001' order by n $$,
  $$ values ('pendiente'), ('vencida') $$,
  'vence a las 72 h justas'
);

select results_eq(
  $$ select public.proposal_status(p, t::timestamptz)::text
       from public.proposals p,
            unnest(array['2026-11-02 19:59:59-03', '2026-11-02 20:00-03']) with ordinality as x(t, n)
      where p.id = '11111111-0000-0000-0000-000000000002' order by n $$,
  $$ values ('pendiente'), ('vencida') $$,
  'vence cuando empieza su rango, si llega antes que las 72 h'
);

update public.proposals set closed_at = '2026-11-01 13:00-03', close_reason = 'rechazada'
 where id = '11111111-0000-0000-0000-000000000001';
select is(
  (select public.proposal_status(p, '2026-11-04 13:00-03')::text from public.proposals p
    where id = '11111111-0000-0000-0000-000000000001'),
  'rechazada',
  'una propuesta cerrada devuelve lo guardado, aunque ya hubiera vencido'
);

delete from public.proposals;
delete from public.search_slots;
delete from public.rival_searches;

-- Mandar ---------------------------------------------------------------------

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

set local role authenticated;

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 18, 23), pg_temp.slot(3, 18, 20)));
select public.save_rival_search('99999999-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 18, 23)));
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.save_rival_search('eeeeeeee-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 20, 24), pg_temp.slot(4, 20, 22)));
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select public.save_rival_search('bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 19, 21)));

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table sent as
  select public.send_proposal(
    pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
    pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 2, 20)) as id;

select results_eq(
  $$ select from_team_name, to_team_name, pg_temp.hours(range), status from public.proposal_details $$,
  $$ values ('Real Floresta', 'Los Rivales', '20-23', 'pendiente') $$,
  'Caro propone por la parte en común de las dos franjas y la ve pendiente'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select results_eq(
  $$ select from_team_name, pg_temp.hours(range), status, expires_at = lower(range)
       from public.proposal_details $$,
  $$ values ('Real Floresta', '20-23', 'pendiente', true) $$,
  'el capitán rival la ve; vence cuando empieza el rango, que llega antes de las 72 h'
);

select results_eq(
  $$ select kind::text, params ->> 'rival_name', pg_temp.hours(tstzrange((params ->> 'range_start')::timestamptz,
            (params ->> 'range_end')::timestamptz)), (params ->> 'deadline')::timestamptz > now()
       from public.notices $$,
  $$ values ('proposal_received', 'Real Floresta', '20-23', true) $$,
  'y recibe "Te propusieron un partido" con el horario y el vencimiento'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is_empty($$ select * from public.proposal_details $$, 'el plantel no ve las propuestas');
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select is_empty($$ select * from public.proposal_details $$, 'un ajeno no ve las propuestas');
select is_empty($$ select * from public.proposals $$, 'ni la tabla');

reset role;
set local role anon;
select throws_ok($$ select * from public.proposal_details $$, '42501', null, 'anon no puede leerlas');
reset role;
set local role authenticated;

-- Rechazos de send_proposal.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.send_proposal(pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
                                 pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 2, 20)) $$,
  'Ya le mandaste una propuesta a ese equipo por ese horario',
  'no se manda otra al mismo rival por el mismo horario mientras la anterior está pendiente'
);

select throws_ok(
  $$ select public.send_proposal(pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
                                 pg_temp.slot_id('99999999-0000-0000-0000-000000000000', 2, 18)) $$,
  'No podés proponerle un partido a un equipo que capitaneás',
  'no se propone a un equipo del mismo capitán'
);

select throws_ok(
  $$ select public.send_proposal(pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 3, 18),
                                 pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 4, 20)) $$,
  'Esas franjas no tienen al menos 1 h en común',
  'sin horario en común no hay propuesta'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.send_proposal(pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
                                 pg_temp.slot_id('bbbbbbbb-0000-0000-0000-000000000000', 2, 19)) $$,
  'Solo el capitán puede proponer partidos',
  'el plantel no propone'
);

-- Búsqueda inactiva, de un lado o del otro.
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
create temp table b_slot as select pg_temp.slot_id('bbbbbbbb-0000-0000-0000-000000000000', 2, 19) as id;
select public.save_rival_search('bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5', '[]');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ select public.send_proposal(pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
                                 (select id from b_slot)) $$,
  'Ese equipo ya no busca rival en ese horario',
  'no se propone a una búsqueda cancelada'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select public.save_rival_search('bbbbbbbb-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(2, 19, 21)));
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table g_slot as select pg_temp.slot_id('99999999-0000-0000-0000-000000000000', 2, 18) as id;
select public.save_rival_search('99999999-0000-0000-0000-000000000000', 'futbol_5', '[]');
select throws_ok(
  $$ select public.send_proposal((select id from g_slot),
                                 pg_temp.slot_id('bbbbbbbb-0000-0000-0000-000000000000', 2, 19)) $$,
  'Tu búsqueda ya no está activa',
  'no se propone desde una búsqueda cancelada'
);

-- Responder ------------------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select throws_ok(
  $$ select public.respond_proposal((select id from sent), false) $$,
  'No encontramos la propuesta',
  'un ajeno no la puede tocar'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.respond_proposal((select id from sent), false);
select results_eq(
  $$ select status from public.proposal_details $$,
  $$ values ('rechazada') $$,
  'el receptor la rechaza'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select kind::text, params ->> 'rival_name' from public.notices $$,
  $$ values ('proposal_rejected', 'Los Rivales') $$,
  'y a Caro le llega "Rechazaron tu propuesta"'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select throws_ok(
  $$ select public.respond_proposal((select id from sent), false) $$,
  'La propuesta ya no está pendiente',
  'una propuesta cerrada no se responde'
);

-- Rechazada, se puede volver a proponer. El emisor la cancela, sin aviso.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table resent as
  select public.send_proposal(
    pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
    pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 2, 20)) as id;
select throws_ok(
  $$ select public.respond_proposal((select id from resent), true) $$,
  'Solo el equipo que la recibe puede aceptarla',
  'el emisor no acepta su propia propuesta'
);
select public.respond_proposal((select id from resent), false);
select results_eq(
  $$ select status from public.proposal_details where id = (select id from resent) $$,
  $$ values ('cancelada') $$,
  'el emisor la cancela'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select is(
  (select count(*)::int from public.notices where kind = 'proposal_cancelled'),
  0,
  'cancelar una propuesta suelta no avisa (se ve al entrar)'
);

-- Cancelación en cascada ---------------------------------------------------

-- Rafa saca su franja: cae la propuesta que recibió por ella.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table to_removed as
  select public.send_proposal(
    pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
    pg_temp.slot_id('eeeeeeee-0000-0000-0000-000000000000', 2, 20)) as id;
-- Y una a Beto, que cae cuando Caro cancela su búsqueda.
create temp table to_beto as
  select public.send_proposal(
    pg_temp.slot_id('aaaaaaaa-0000-0000-0000-000000000000', 2, 18),
    pg_temp.slot_id('bbbbbbbb-0000-0000-0000-000000000000', 2, 19)) as id;

select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select public.save_rival_search('eeeeeeee-0000-0000-0000-000000000000', 'futbol_5',
  jsonb_build_array(pg_temp.slot(4, 20, 22)));

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select results_eq(
  $$ select status from public.proposal_details where id = (select id from to_removed) $$,
  $$ values ('franja_sacada') $$,
  'sacar una franja cancela sus propuestas pendientes'
);
select results_eq(
  $$ select params ->> 'rival_name', pg_temp.hours(tstzrange((params ->> 'range_start')::timestamptz,
            (params ->> 'range_end')::timestamptz))
       from public.notices where kind = 'proposal_cancelled' $$,
  $$ values ('Los Rivales', '20-23') $$,
  'y el otro lado recibe "Se canceló tu propuesta"'
);

select public.save_rival_search('aaaaaaaa-0000-0000-0000-000000000000', 'futbol_5', '[]');
select results_eq(
  $$ select status from public.proposal_details where id = (select id from to_beto) $$,
  $$ values ('busqueda_cancelada') $$,
  'cancelar la búsqueda cancela sus propuestas pendientes'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select results_eq(
  $$ select kind::text, params ->> 'rival_name' from public.notices order by 1 $$,
  $$ values ('proposal_cancelled', 'Real Floresta'), ('proposal_received', 'Real Floresta') $$,
  'con aviso al otro lado'
);
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select results_eq(
  $$ select status, count(*)::int from public.proposal_details group by status order by status $$,
  $$ values ('cancelada', 1), ('franja_sacada', 1), ('rechazada', 1) $$,
  'las propuestas ya cerradas no cambian al cancelar la búsqueda'
);

select * from finish();
rollback;
