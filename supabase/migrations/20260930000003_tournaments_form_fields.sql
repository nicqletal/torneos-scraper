-- Campos y reglas del formulario de alta (ver "Formulario" en
-- docs/decisiones-casos-de-uso.md): reglamento, dirección de la sede, al menos
-- un contacto, WhatsApp normalizado y precio no negativo.
--
-- La Server Action ya normaliza y valida con mensajes para el usuario
-- (src/utils/tournament-form.ts). Estos `check` son la última defensa.

alter table public.tournaments
  add column rules         text,
  add column venue_address text;

-- 1. Contactos de los torneos de prueba al formato nuevo, con la misma regla
--    que normalizeWhatsapp: se dejan solo los dígitos y se completa el 549.
--    Lo que no se puede normalizar (incluido un 15 de celular sin código de
--    área) queda en null, y a Instagram se le saca el @.

update public.tournaments
   set contact_whatsapp = regexp_replace(contact_whatsapp, '\D', '', 'g')
 where contact_whatsapp is not null;

update public.tournaments
   set contact_whatsapp = case
     when contact_whatsapp ~ '^549\d{10}$' then contact_whatsapp
     when contact_whatsapp ~ '^54\d{10}$'  then '549' || substr(contact_whatsapp, 3)
     when contact_whatsapp ~ '^0\d{10}$'   then '549' || substr(contact_whatsapp, 2)
     when contact_whatsapp ~ '^\d{10}$'    then '549' || contact_whatsapp
   end
 where contact_whatsapp is not null;

update public.tournaments
   set contact_whatsapp = null
 where contact_whatsapp ~ '^54915';

update public.tournaments
   set contact_instagram = nullif(ltrim(trim(contact_instagram), '@'), '')
 where contact_instagram is not null;

-- Un torneo sin ningún contacto no tiene cómo cargarse a mano: si aparece
-- alguno, la migración se frena y dice cuál, en vez de inventar un contacto.
do $$
declare
  missing text;
begin
  select string_agg(name, ', ') into missing
    from public.tournaments
   where contact_whatsapp is null and contact_instagram is null;

  if missing is not null then
    raise exception 'Torneos sin WhatsApp ni Instagram, completalos antes de migrar: %', missing;
  end if;
end
$$;

-- 2. Las restricciones.

alter table public.tournaments
  add constraint tournaments_has_contact
    check (contact_whatsapp is not null or contact_instagram is not null),
  add constraint tournaments_whatsapp_format
    check (contact_whatsapp ~ '^549\d{10}$' and contact_whatsapp !~ '^54915'),
  add constraint tournaments_price_not_negative
    check (price >= 0);
