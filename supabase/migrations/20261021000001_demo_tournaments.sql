-- Torneos ficticios para dar variedad al catálogo de demostración.
-- Son datos (no contenido de la interfaz) y se cargan como torneos copiados:
-- sin cuenta organizadora, con contactos de ejemplo y sin inscripciones.

insert into public.tournaments (
  name,
  description,
  sport_modality,
  zone_id,
  price,
  start_date,
  end_date,
  inscription_deadline,
  contact_instagram,
  organizer_name,
  capacity,
  rules,
  venue_address
)
values
  (
    'Copa Barrial Amateur',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_5', 'palermo', 12000,
    current_date + 30, current_date + 32, current_date + 20,
    'torneos.ejemplo.01', 'Organizador ficticio', 16,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Palermo'
  ),
  (
    'Encuentro de Fútbol 7',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_7', 'belgrano', 18000,
    current_date + 36, current_date + 39, current_date + 25,
    'torneos.ejemplo.02', 'Organizador ficticio', 12,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Belgrano'
  ),
  (
    'Copa Metropolitana',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_8', 'vicente-lopez', 22000,
    current_date + 42, current_date + 45, current_date + 30,
    'torneos.ejemplo.03', 'Organizador ficticio', 20,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Vicente López'
  ),
  (
    'Liga Amateur de Zona Norte',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_11', 'san-isidro', 35000,
    current_date + 48, current_date + 55, current_date + 35,
    'torneos.ejemplo.04', 'Organizador ficticio', 16,
    'Reglamento de ejemplo.', 'Sede de ejemplo, San Isidro'
  ),
  (
    'Copa de los Barrios',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_5', 'moron', 0,
    current_date + 54, current_date + 56, current_date + 40,
    'torneos.ejemplo.05', 'Organizador ficticio', 24,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Morón'
  ),
  (
    'Torneo Apertura Amateur',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_7', 'palermo', 15000,
    current_date + 60, current_date + 63, current_date + 45,
    'torneos.ejemplo.06', 'Organizador ficticio', 16,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Palermo'
  ),
  (
    'Desafío de Fútbol 8',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_8', 'belgrano', null,
    current_date + 66, current_date + 69, current_date + 50,
    'torneos.ejemplo.07', 'Organizador ficticio', 12,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Belgrano'
  ),
  (
    'Copa Interclubes Amateur',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_11', 'vicente-lopez', 40000,
    current_date + 72, current_date + 79, current_date + 55,
    'torneos.ejemplo.08', 'Organizador ficticio', 20,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Vicente López'
  ),
  (
    'Torneo de Primavera',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_5', 'san-isidro', 10000,
    current_date + 78, current_date + 80, current_date + 60,
    'torneos.ejemplo.09', 'Organizador ficticio', 16,
    'Reglamento de ejemplo.', 'Sede de ejemplo, San Isidro'
  ),
  (
    'Liga de Fútbol 7 Amateur',
    'Torneo ficticio de demostración. Los datos y el contacto no son reales.',
    'futbol_7', 'moron', 20000,
    current_date + 84, current_date + 87, current_date + 65,
    'torneos.ejemplo.10', 'Organizador ficticio', 24,
    'Reglamento de ejemplo.', 'Sede de ejemplo, Morón'
  );
