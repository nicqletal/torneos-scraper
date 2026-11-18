'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { passwordError } from '@/utils/admin-forms'
import { verifyOwnPassword } from '@/utils/supabase/admin-security'

export type SecurityState = { error?: string; success?: string }
export async function changeAdminPassword(_previous: SecurityState, form: FormData): Promise<SecurityState> {
  const user = await requireAdmin()
  const current = form.get('current_password'), password = form.get('password')
  const error = passwordError(current, password, form.get('repeat'))
  if (error) return { error }
  const supabase = await createClient()
  if (!user.email || !await verifyOwnPassword(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, user.email, String(current), user.id)) {
    return { error: 'No pudimos comprobar tu contraseña actual. Revisala e intentá nuevamente.' }
  }
  const { error: changeError } = await supabase.auth.updateUser({ password: String(password), current_password: String(current) })
  if (changeError) {
    await supabase.rpc('record_admin_security_action', { p_action: 'contrasena_actualizada', p_result: 'failed' })
    return { error: 'No pudimos cambiar la contraseña. Si requiere volver a autenticarte, cerrá sesión e ingresá nuevamente.' }
  }
  const { error: auditError } = await supabase.rpc('record_admin_security_action', { p_action: 'contrasena_actualizada' })
  if (auditError) return { error: 'La contraseña cambió, pero no pudimos registrar la acción. La contraseña anterior ya no sirve.' }
  return { success: 'Contraseña actualizada.' }
}
export async function closeAdminSession(form: FormData) {
  await requireAdmin()
  const scope = form.get('scope')
  if (scope !== 'local' && scope !== 'global') redirect('/admin/seguridad?error=sesion')
  if (scope === 'global' && form.get('confirm') !== 'on') redirect('/admin/seguridad?error=confirmacion')
  const supabase = await createClient()
  // Se registra la solicitud; después del cierre ya no queda una sesión para escribir.
  const { error: auditError } = await supabase.rpc('record_admin_security_action', { p_action: scope === 'global' ? 'cierre_global_solicitado' : 'cierre_sesion_solicitado', p_result: 'requested' })
  if (auditError) redirect('/admin/seguridad?error=registro')
  const { error } = await supabase.auth.signOut({ scope })
  if (error) {
    await supabase.rpc('record_admin_security_action', { p_action: scope === 'global' ? 'cierre_global_solicitado' : 'cierre_sesion_solicitado', p_result: 'failed' })
    redirect('/admin/seguridad?error=sesion')
  }
  revalidatePath('/', 'layout')
  redirect('/admin/login')
}
