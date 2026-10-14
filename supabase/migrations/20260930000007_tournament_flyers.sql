-- Flyer del torneo en Storage.
--
-- Cada torneo tiene como mucho un flyer: el objeto `flyers/<id del torneo>`,
-- sin extensión (el tipo va en la metadata del objeto). Reemplazarlo pisa el
-- mismo objeto; la baja lo borra. `tournaments.image_url` guarda su URL
-- pública, con `?v=<ms>` al final para que un flyer nuevo no se vea como el
-- viejo por el caché del navegador o del CDN.

-- 1. El bucket. Es público de lectura: el flyer se ve en el catálogo sin
--    sesión, y la URL pública no pasa por RLS. Escribir sí pasa (ver 3).
--    El tipo y el tamaño se repiten en `parseFlyer` (src/utils/tournament-flyer.ts),
--    que da el mensaje; esto es la última defensa si alguien sube por la API.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flyers', 'flyers', true, 3 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 2. `image_url` pasa a ser editable por el dueño (se la había dejado afuera
--    del grant de update en 20260930000004 a la espera de este issue). La fila
--    la sigue limitando la policy de update: solo sus torneos. El valor no se
--    puede limitar acá sin saber la URL de Supabase de cada entorno; por eso
--    `flyerSrc` solo muestra URLs del bucket `flyers`, y cualquier otra cae en
--    el placeholder.

grant update (image_url) on public.tournaments to authenticated;

-- 3. Policies de Storage. `storage.objects` guarda los archivos de todos los
--    buckets, así que cada policy empieza con `bucket_id = 'flyers'`: sin eso
--    abriría también los buckets que se sumen después.
--
--    `objects.name` es el nombre del objeto dentro del bucket, que acá es el
--    id del torneo. Va calificado con la tabla porque `tournaments` también
--    tiene `name`: dentro de la subconsulta, un `name` suelto sería el nombre
--    del torneo. Se compara como texto (`t.id::text = objects.name`) y no al
--    revés (`objects.name::uuid`), porque un nombre que no es uuid haría
--    fallar el cast y la consulta entera, en vez de simplemente no dar permiso.
--
--    Solo `authenticated`: anon no escribe nada.

-- Subir: solo al objeto con el id de un torneo tuyo. En el alta, la Server
-- Action sube después del insert, así que el torneo ya existe; si el insert
-- falla, no hay torneo y esta policy no deja subir nada.
create policy "flyers: el organizador sube el de sus torneos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'flyers'
    and exists (
      select 1 from public.tournaments t
       where t.id::text = objects.name
         and t.user_id = auth.uid()
    )
  );

-- Reemplazar: la subida con `upsert` pisa el objeto, y para eso Storage pide
-- update (y select, abajo) además de insert. `using` mira el objeto que ya
-- está; `with check`, cómo queda: los dos tienen que ser de un torneo tuyo.
create policy "flyers: el organizador reemplaza el de sus torneos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'flyers'
    and exists (
      select 1 from public.tournaments t
       where t.id::text = objects.name
         and t.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'flyers'
    and exists (
      select 1 from public.tournaments t
       where t.id::text = objects.name
         and t.user_id = auth.uid()
    )
  );
-- Borrar: Postgres no puede borrar archivos de Storage (el trigger
-- `storage.protect_objects_delete` rechaza el delete por SQL, porque dejaría
-- el archivo huérfano en el almacenamiento), así que `withdraw_tournament` no
-- lo borra. Lo borra la Server Action de la baja por la API, después de que la
-- función dio de baja el torneo. Para ese momento el torneo ya no existe, por
-- eso hay dos casos:
--   - el flyer de un torneo tuyo;
--   - un flyer huérfano (no hay torneo con ese id) que subiste vos: `owner_id`
--     es quien subió el objeto, y lo pone Storage a partir del JWT.
create policy "flyers: el organizador borra el de sus torneos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'flyers'
    and (
      exists (
        select 1 from public.tournaments t
         where t.id::text = objects.name
           and t.user_id = auth.uid()
      )
      or (
        owner_id = auth.uid()::text
        and not exists (
          select 1 from public.tournaments t
           where t.id::text = objects.name
        )
      )
    )
  );

-- Leer la fila de `storage.objects` (no el archivo, que es público por URL).
-- Storage la necesita para el `upsert` y para borrar: un update o un delete
-- solo encuentran las filas que la policy de select deja ver. Por eso tiene
-- los mismos dos casos que el delete; si no, el huérfano quedaría invisible y
-- no se podría borrar. Nadie más ve la fila, así que no se pueden listar los
-- flyers de todos por la API.
create policy "flyers: el organizador ve el de sus torneos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'flyers'
    and (
      exists (
        select 1 from public.tournaments t
         where t.id::text = objects.name
           and t.user_id = auth.uid()
      )
      or (
        owner_id = auth.uid()::text
        and not exists (
          select 1 from public.tournaments t
           where t.id::text = objects.name
        )
      )
    )
  );
