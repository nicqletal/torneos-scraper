-- Función para verificar si el usuario actual es administrador.
--
-- La tabla `admins` tiene RLS habilitado sin policies a propósito: nadie la
-- puede leer ni escribir desde la API. Esta función es `security definer`
-- para poder leerla sin abrir una policy, y devuelve solo un booleano sin
-- exponer los IDs de los otros administradores.
--
-- Se usa desde el middleware (proxy.ts) y desde los Server Components de
-- /admin para impedir el acceso a usuarios que no sean administradores.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  )
$$;

-- Solo se puede llamar autenticado: un anónimo nunca es admin.
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
