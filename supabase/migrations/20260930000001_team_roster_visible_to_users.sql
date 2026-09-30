-- El plantel de un equipo pasa a ser visible para cualquier usuario con sesión
-- (buscador de equipos). Antes solo lo veían los integrantes.
-- Ver "Visibilidad" en docs/decisiones-casos-de-uso.md.
--
-- Es seguro porque team_members solo tiene ids, la marca de capitán y la fecha
-- de ingreso. El nombre y la foto salen de profiles (ya público) y el WhatsApp
-- está en profile_contacts, que sigue siendo privado. Sin sesión (anon) no hay
-- policy, así que el plantel sigue oculto.

drop policy "team_members: solo los integrantes ven el plantel" on public.team_members;

create policy "team_members: lectura con sesión"
  on public.team_members for select to authenticated using (true);
