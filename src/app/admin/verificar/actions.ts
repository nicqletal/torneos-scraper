'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdminIdentity } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { adminDestination } from '@/utils/admin-access'

export type EnrollmentState = { error?: string; factorId?: string; qr?: string; secret?: string }
export async function enrollAdminMfa(): Promise<EnrollmentState> {
  await requireAdminIdentity()
  const supabase = await createClient()
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
  if (listError) return { error: 'No pudimos consultar tus métodos de acceso.' }
  if (factors.totp.some(factor => factor.status === 'verified')) return { error: 'Ya tenés un autenticador. Usá su código para verificar.' }
  for (const factor of factors.all.filter(factor => factor.factor_type === 'totp' && factor.status === 'unverified')) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (error) return { error: 'No pudimos reiniciar la configuración. Volvé a intentar.' }
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Administración Torneos BA', issuer: 'Torneos Amateur BA' })
  if (error) return { error: 'No pudimos preparar el autenticador. Verificá que los dos pasos estén habilitados e intentá de nuevo.' }
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
}
export async function verifyAdminMfa(form: FormData) {
  await requireAdminIdentity()
  const code = String(form.get('code') ?? '').trim(), factorId = String(form.get('factor_id') ?? '')
  const next = adminDestination(form.get('next'))
  if (!/^\d{6}$/.test(code)) redirect('/admin/verificar?error=codigo')
  const supabase = await createClient()
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
  if (listError || !factors.all.some(factor => factor.id === factorId && factor.factor_type === 'totp')) redirect('/admin/verificar?error=codigo')
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) redirect('/admin/verificar?error=codigo')
  const { error: auditError } = await supabase.rpc('record_admin_security_action', { p_action: 'mfa_verificado' })
  if (auditError) redirect('/admin/verificar?error=registro')
  revalidatePath('/', 'layout')
  redirect(next === '/admin/verificar' || next.startsWith('/admin/verificar?') ? '/admin' : next)
}
