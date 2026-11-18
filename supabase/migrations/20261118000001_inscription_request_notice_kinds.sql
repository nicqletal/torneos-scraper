-- Avisos de las Solicitudes de inscripción (ver "Solicitudes de inscripción" en
-- docs/especificaciones-y-requerimientos/decisiones-casos-de-uso.md).
--
-- Van en su propia migración porque un valor nuevo de un enum no se puede usar
-- en la misma transacción en la que se agrega, y las funciones de
-- 20261118000002 los usan.
alter type public.notice_kind add value if not exists 'inscription_request_received';  -- al organizador
alter type public.notice_kind add value if not exists 'inscription_request_accepted';  -- al capitán
alter type public.notice_kind add value if not exists 'inscription_request_rejected';  -- al capitán
alter type public.notice_kind add value if not exists 'inscription_request_withdrawn'; -- al capitán: baja del torneo
