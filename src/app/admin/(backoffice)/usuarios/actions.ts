'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { parseSuspension, validUuid } from '@/utils/admin-forms'

export async function suspendAccount(form: FormData) {
  await requireAdmin()
  const parsed = parseSuspension(form)
  if (!parsed.ok || form.get('confirm') !== 'on') redirect('/admin/usuarios?error=suspension')
  const supabase = await createClient()
  const { error } = await supabase.rpc('suspend_account', { p_user_id: parsed.fields.userId, p_days: parsed.fields.days, p_reason: parsed.fields.reason })
  if (error) redirect(`/admin/usuarios/${parsed.fields.userId}?error=suspension`)
  revalidatePath('/', 'layout')
  revalidatePath('/admin/actividad')
  revalidatePath(`/admin/usuarios/${parsed.fields.userId}`)
  redirect(`/admin/usuarios/${parsed.fields.userId}?ok=suspension`)
}
export async function liftSuspension(form: FormData) {
  await requireAdmin()
  const id = form.get('id'), userId = form.get('user_id'), reason = String(form.get('reason') ?? '').trim()
  if (!validUuid(id) || !validUuid(userId) || reason.length < 3 || reason.length > 500) redirect('/admin/usuarios?error=suspension')
  const supabase = await createClient()
  const { error } = await supabase.rpc('lift_suspension', { p_id: id, p_reason: reason })
  if (error) redirect(`/admin/usuarios/${userId}?error=suspension`)
  revalidatePath('/', 'layout')
  revalidatePath(`/admin/usuarios/${userId}`)
  revalidatePath('/admin/actividad')
  redirect(`/admin/usuarios/${userId}?ok=levantada`)
}
