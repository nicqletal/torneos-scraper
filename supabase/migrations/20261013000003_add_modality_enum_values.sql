-- Asegurar que el enum sport_modality tenga los valores requeridos por la aplicación.
-- En la base vieja el enum se creó con otros valores y la migración 20260928000003
-- se marcó como aplicada sin correrse.

alter type public.sport_modality add value if not exists 'futbol_5';
alter type public.sport_modality add value if not exists 'futbol_7';
alter type public.sport_modality add value if not exists 'futbol_8';
alter type public.sport_modality add value if not exists 'futbol_11';
