'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { validUuid } from '@/utils/admin-forms'
export async function reportTeam(form: FormData) {
  const id = form.get('id'), reason = form.get('reason'), detail = String(form.get('detail') ?? '').trim()
  if (!validUuid(id) || !['violencia', 'cuenta_falsa', 'abuso_calificaciones'].includes(String(reason)) || detail.length > 500) redirect('/mis-reportes?error=datos')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/equipos/${id}/reportar`)}`)
  const { error } = await supabase.rpc('report_team', { p_team_id: id, p_reason: reason, p_detail: detail || null })
  if (error) redirect(`/equipos/${id}/reportar?error=${error.code === '23505' ? 'duplicado' : 'guardar'}`)
  revalidatePath('/admin/reportes/equipos')
  revalidatePath('/mis-reportes')
  redirect('/mis-reportes?ok=equipo')
}
