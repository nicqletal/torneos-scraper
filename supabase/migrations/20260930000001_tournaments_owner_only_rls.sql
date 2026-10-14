-- RLS de `tournaments`: lectura pública y escritura solo sobre los torneos propios.
--
-- Postgres combina con OR las policies permissive de una misma operación, así
-- que las tres con `using (true)` / `with check (true)` anulaban a las de
-- `auth.uid() = user_id`: cualquier usuario con sesión podía crear a nombre de
-- otro, editar y dar de baja torneos ajenos. Se borran todas y se vuelven a
-- crear una por operación, con nombres que siguen la convención del resto del esquema.

drop policy if exists "Lectura publica de torneos"                    on public.tournaments;
drop policy if exists "Permitir lectura pública"                      on public.tournaments;
drop policy if exists "Solo usuarios logueados pueden crear torneos"  on public.tournaments;
drop policy if exists "Solo usuarios logueados pueden editar torneos" on public.tournaments;
drop policy if exists "Solo usuarios logueados pueden borrar torneos" on public.tournaments;
drop policy if exists "Usuarios autenticados insertan sus torneos"     on public.tournaments;
drop policy if exists "Usuarios pueden actualizar sus propios torneos" on public.tournaments;
drop policy if exists "Usuarios pueden borrar sus propios torneos"     on public.tournaments;
drop policy if exists "tournaments: lectura pública"                   on public.tournaments;
drop policy if exists "tournaments: el organizador crea los suyos"     on public.tournaments;
drop policy if exists "tournaments: el organizador edita los suyos"    on public.tournaments;
drop policy if exists "tournaments: el organizador da de baja los suyos" on public.tournaments;

create policy "tournaments: lectura pública"
  on public.tournaments for select to anon, authenticated
  using (true);

create policy "tournaments: el organizador crea los suyos"
  on public.tournaments for insert to authenticated
  with check (auth.uid() = user_id);

create policy "tournaments: el organizador edita los suyos"
  on public.tournaments for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tournaments: el organizador da de baja los suyos"
  on public.tournaments for delete to authenticated
  using (auth.uid() = user_id);
