'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function submitTournamentReport(formData: FormData) {
  const id = formData.get('id')
  const reason = formData.get('reason')
  const detail = formData.get('detail')
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || typeof reason !== 'string' || typeof detail !== 'string'
      || !['ya_no_existe', 'datos_incorrectos', 'no_es_torneo'].includes(reason) || detail.length > 500) {
    redirect('/torneos')
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/torneos/${id}/reportar`)}`)
  const { error } = await supabase.rpc('report_tournament', { p_tournament_id: id, p_reason: reason, p_detail: detail })
  if (error) redirect(`/torneos/${id}/reportar?error=1`)
  revalidatePath('/admin/reportes')
  redirect(`/torneos/${id}/reportar?ok=1`)
}
