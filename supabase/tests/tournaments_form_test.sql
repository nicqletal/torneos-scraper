-- Restricciones del formulario de alta: contacto, formato de WhatsApp, precio,
-- reglamento y sede. Cada test corre en una transacción que se descarta al final.

begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@test.local', '{"display_name": "Ana"}');

select has_column('public', 'tournaments', 'rules', 'el torneo tiene reglamento');
select has_column('public', 'tournaments', 'venue_address', 'el torneo tiene dirección de la sede');

-- Contacto: al menos uno.
select throws_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone, inscription_deadline, start_date, end_date, user_id)
     values ('Sin contacto', 'futbol_5', 'Palermo', '2026-11-10', '2026-11-15', '2026-11-30',
             '00000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'un torneo sin WhatsApp ni Instagram no se guarda'
);
select lives_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone, inscription_deadline, start_date, end_date, contact_instagram, user_id)
     values ('Solo Instagram', 'futbol_5', 'Palermo', '2026-11-10', '2026-11-15', '2026-11-30',
             'copa.palermo', '00000000-0000-0000-0000-00000000000a') $$,
  'alcanza con Instagram'
);

-- WhatsApp: 549 + 10 dígitos, ya normalizado.
select lives_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone, inscription_deadline, start_date, end_date, contact_whatsapp, user_id)
     values ('WhatsApp bien', 'futbol_5', 'Palermo', '2026-11-10', '2026-11-15', '2026-11-30',
             '5491112345678', '00000000-0000-0000-0000-00000000000a') $$,
  'WhatsApp normalizado se guarda'
);
select throws_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone, inscription_deadline, start_date, end_date, contact_whatsapp, user_id)
     values ('WhatsApp mal', 'futbol_5', 'Palermo', '2026-11-10', '2026-11-15', '2026-11-30',
             '+54 9 11 1234-5678', '00000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'WhatsApp sin normalizar no se guarda'
);

select throws_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone, inscription_deadline, start_date, end_date, contact_whatsapp, user_id)
     values ('WhatsApp con 15', 'futbol_5', 'Palermo', '2026-11-10', '2026-11-15', '2026-11-30',
             '5491512345678', '00000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'un 15 de celular tomado como código de área no se guarda'
);

-- Precio: vacío es "Consultar", 0 es "Gratis", negativo no.
select lives_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone, inscription_deadline, start_date, end_date, contact_instagram, price, user_id)
     values ('Gratis', 'futbol_5', 'Palermo', '2026-11-10', '2026-11-15', '2026-11-30',
             'copa.gratis', 0, '00000000-0000-0000-0000-00000000000a') $$,
  'precio 0 (Gratis) se guarda'
);
select throws_ok(
  $$ insert into public.tournaments
       (name, sport_modality, zone, inscription_deadline, start_date, end_date, contact_instagram, price, user_id)
     values ('Negativo', 'futbol_5', 'Palermo', '2026-11-10', '2026-11-15', '2026-11-30',
             'copa.negativa', -1, '00000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'precio negativo no se guarda'
);

select * from finish();
rollback;
