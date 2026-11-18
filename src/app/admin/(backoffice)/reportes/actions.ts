'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { removeFlyer } from '@/utils/supabase/flyer'

export async function resolveTournamentReport(formData: FormData) {
  await requireAdmin()
  const reportId = formData.get('report_id')
  const action = formData.get('action')
  if (typeof reportId !== 'string' || typeof action !== 'string' || !['descartado', 'observado', 'baja'].includes(action)) redirect('/admin/reportes?error=1')
  const supabase = await createClient()
  const { data: report } = await supabase.from('tournament_reports').select('tournament_id, tournament_name').eq('id', reportId).maybeSingle()
  if (!report?.tournament_id) redirect('/admin/reportes?error=1')
  if (action === 'baja') {
    const { data: tournament } = await supabase.from('tournaments').select('name, inscriptions_count').eq('id', report.tournament_id).maybeSingle()
    if (!tournament || formData.get('confirm_name') !== tournament.name
        || formData.get('expected_count') !== String(tournament.inscriptions_count)) {
      redirect('/admin/reportes?error=confirmacion')
    }
  }
  const { error } = await supabase.rpc('resolve_tournament_report', { p_report_id: reportId, p_action: action, p_expected_count: action === 'baja' ? Number(formData.get('expected_count')) : null, p_confirm_name: action === 'baja' ? String(formData.get('confirm_name') ?? '') : null })
  if (error) redirect('/admin/reportes?error=1')
  const flyerRemoved = action !== 'baja' || await removeFlyer(supabase, report.tournament_id)
  revalidatePath('/')
  revalidatePath('/admin/reportes')
  revalidatePath('/admin/contenido')
  revalidatePath('/avisos')
  revalidatePath(`/torneos/${report.tournament_id}`)
  redirect(`/admin/reportes?${flyerRemoved ? 'ok=1' : 'warning=flyer'}`)
}

export async function removeObserved(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id')
  const reason = formData.get('reason')
  if (typeof id !== 'string' || typeof reason !== 'string' || reason.trim().length < 3) redirect('/admin/contenido?error=1')
  const supabase = await createClient()
  const { error } = await supabase.rpc('unobserve_tournament', { p_tournament_id: id, p_reason: reason.trim() })
  if (error) redirect(`/admin/contenido/torneos/${id}?error=1`)
  revalidatePath('/')
  revalidatePath('/admin/contenido')
  revalidatePath(`/admin/contenido/torneos/${id}`)
  revalidatePath(`/torneos/${id}`)
  redirect(`/admin/contenido/torneos/${id}?ok=1`)
}
