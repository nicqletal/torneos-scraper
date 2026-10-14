import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { ADMIN_LOGIN_PATH } from '@/utils/admin-access'

/**
 * Verifica que el usuario actual sea administrador.
 *
 * Llama a la función de Postgres `is_admin()` (security definer), que
 * consulta la tabla `admins` sin exponer su contenido vía la API.
 *
 * Se usa en los Server Components de `/admin` como segunda capa de
 * seguridad (la primera es el proxy en `proxy.ts`). Redirige
 * al acceso diferenciado si el usuario no es administrador o no tiene sesión.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`${ADMIN_LOGIN_PATH}?next=/admin`)
  }

  const { data: isAdmin, error } = await supabase.rpc('is_admin')

  if (error || isAdmin !== true) {
    redirect(`${ADMIN_LOGIN_PATH}?error=${error ? 'unavailable' : 'denied'}`)
  }
  return user
})
