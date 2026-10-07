import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Verifica que el usuario actual sea administrador.
 *
 * Llama a la función de Postgres `is_admin()` (security definer), que
 * consulta la tabla `admins` sin exponer su contenido vía la API.
 *
 * Se usa en los Server Components de `/admin` como segunda capa de
 * seguridad (la primera es el middleware en `proxy.ts`). Redirige a
 * la home si el usuario no es admin o no tiene sesión.
 */
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const { data: isAdmin, error } = await supabase.rpc('is_admin')

  if (error || !isAdmin) {
    redirect('/')
  }
}
