-- La foto del perfil es pública; escribir o listar sus objetos exige sesión.
-- Cada subida usa avatars/<id del usuario>/<uuid nuevo>, sin extensión.
-- No se pisa la foto anterior: se retira por la API después de guardar la URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']);

-- INSERT: solo en este bucket y en la carpeta del usuario autenticado.
-- auth.uid() viene del JWT, nunca del formulario. No abre otros buckets.
create policy "avatars: cada usuario sube su foto"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- SELECT: Storage necesita ver la fila para poder retirarla. No permite
-- listar las fotos de otros; las URLs públicas sí muestran las imágenes.
create policy "avatars: cada usuario ve sus objetos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- DELETE: permite limpiar la foto anterior y una subida cuyo guardado falló,
-- solo dentro de la carpeta propia. No hay UPDATE: las subidas son nuevas.
create policy "avatars: cada usuario retira sus fotos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
