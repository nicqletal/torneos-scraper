'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { parseSuspension, validUuid } from '@/utils/admin-forms'
export async function resolveTeamReport(form: FormData) {
  await requireAdmin()
  const id = form.get('report_id'), action = form.get('action')
  if (!validUuid(id) || (action !== 'descartado' && action !== 'suspension')) redirect('/admin/reportes/equipos?error=datos')
  const parsed = action === 'suspension' ? parseSuspension(form) : null
  if (action === 'suspension' && (!parsed?.ok || form.get('confirm') !== 'on')) redirect(`/admin/reportes/equipos/${id}?error=datos`)
  const supabase = await createClient()
  const { error } = await supabase.rpc('resolve_team_report', { p_report_id: id, p_action: action, p_responsible: parsed?.ok ? parsed.fields.userId : null, p_days: parsed?.ok ? parsed.fields.days : null, p_reason: parsed?.ok ? parsed.fields.reason : null })
  if (error) redirect(`/admin/reportes/equipos/${id}?error=guardar`)
  revalidatePath('/', 'layout')
  revalidatePath('/admin/reportes/equipos')
  revalidatePath('/admin/actividad')
  revalidatePath('/mis-reportes')
  redirect('/admin/reportes/equipos?ok=1')
}
