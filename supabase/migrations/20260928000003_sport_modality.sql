-- Modalidad de juego, compartida por torneos, equipos y búsquedas de rival.
-- Un solo tipo para que "misma modalidad" se compare igual en todos los módulos.
-- Los valores son los que ya usa el código (TournamentCard, Filters, crear-torneo).
create type public.sport_modality as enum ('futbol_5', 'futbol_7', 'futbol_8', 'futbol_11');
