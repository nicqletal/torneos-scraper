-- Edición de torneos: el organizador edita solo lo que carga en el formulario.
--
-- La policy "el organizador edita los suyos" decide QUÉ FILAS puede tocar
-- (las de `auth.uid() = user_id`), pero no QUÉ COLUMNAS: con el `grant all`
-- del baseline, el dueño podía mandar por la API `verified_at = now()` y
-- marcar su torneo como verificado sin pasar por "Sigue vigente", o cambiar
-- `created_at`. RLS no filtra columnas; eso lo hacen los privilegios.
--
-- Por eso se saca el update de toda la tabla y se devuelve solo sobre las
-- columnas del formulario (las de `TournamentInput` en src/utils/tournament-form.ts).
-- Quedan afuera, entre otras:
--   verified_at     la actualiza "Sigue vigente": editar no cuenta como verificar
--   user_id         el dueño no se pasa el torneo a otro
--   organizer_name  era de los torneos copiados; se elimina en 20261007000002
--   created_at, updated_at, created_by, id
--   image_url       el flyer entra con Storage, en su propio issue
--
-- Si una columna nueva tiene que ser editable desde el formulario, hay que
-- sumarla a este grant en su migración.

-- anon no tiene policy de update, así que ya no podía editar; se le saca el
-- privilegio igual para que no dependa de que nadie agregue una policy.
revoke update on public.tournaments from anon, authenticated;

grant update (
  name,
  sport_modality,
  inscription_deadline,
  start_date,
  end_date,
  price,
  capacity,
  description,
  rules,
  venue_address,
  contact_whatsapp,
  contact_instagram
) on public.tournaments to authenticated;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tournaments' and column_name = 'zone') then
    execute 'grant update (zone) on public.tournaments to authenticated';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tournaments' and column_name = 'zone_id') then
    execute 'grant update (zone_id) on public.tournaments to authenticated';
  end if;
end $$;
