-- Quitar el default de organizer_name para que los torneos creados por un usuario
-- no tengan organizer_name asignado automáticamente y cumplan tournaments_organizer_xor_copied.

alter table public.tournaments alter column organizer_name drop default;
