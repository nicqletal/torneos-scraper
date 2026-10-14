insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-crests', 'team-crests', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']);

-- INSERT: solo en el bucket de escudos y la carpeta de un equipo activo que
-- capitaneás. Comparamos como texto para que un nombre inválido no rompa RLS.
create policy "team-crests: el capitán sube el escudo de su equipo activo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'team-crests'
    and exists (
      select 1 from public.teams t
      where t.id::text = (storage.foldername(objects.name))[1]
        and t.dissolved_at is null and public.is_team_captain(t.id)
    )
  );

-- SELECT: el capitán activo ve los objetos de su equipo. Quien subió un
-- archivo también puede ver un huérfano propio para limpiar un guardado fallido,
-- incluso si perdió la capitanía o el equipo se disolvió durante la subida.
create policy "team-crests: el capitán ve sus objetos y el usuario sus huérfanos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'team-crests'
    and (
      exists (
        select 1 from public.teams t
        where t.id::text = (storage.foldername(objects.name))[1]
          and t.dissolved_at is null and public.is_team_captain(t.id)
      )
      or (
        owner_id = (select auth.uid())::text
        and not exists (
          select 1 from public.teams t
          where right(split_part(t.crest_url, '?', 1),
            length('/storage/v1/object/public/team-crests/' || objects.name))
            = '/storage/v1/object/public/team-crests/' || objects.name
        )
      )
    )
  );

-- DELETE: nunca retira un escudo vigente, ni siquiera de un equipo disuelto.
-- El capitán activo limpia escudos anteriores; quien subió limpia sus huérfanos.
-- No hay UPDATE: cada reemplazo sube un objeto nuevo.
create policy "team-crests: se retiran solo escudos que ya no están vigentes"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'team-crests'
    and not exists (
      select 1 from public.teams t
      where right(split_part(t.crest_url, '?', 1),
        length('/storage/v1/object/public/team-crests/' || objects.name))
        = '/storage/v1/object/public/team-crests/' || objects.name
    )
    and (
      owner_id = (select auth.uid())::text
      or exists (
        select 1 from public.teams t
        where t.id::text = (storage.foldername(objects.name))[1]
          and t.dissolved_at is null and public.is_team_captain(t.id)
      )
    )
  );
