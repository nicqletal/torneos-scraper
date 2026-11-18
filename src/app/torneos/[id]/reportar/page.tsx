import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { submitTournamentReport } from './actions'

export default async function ReportTournamentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/torneos/${id}/reportar`)}`)
  const { data: tournament } = await supabase.from('tournaments').select('id, name').eq('id', id).maybeSingle()
  if (!tournament) notFound()
  const { data: existing } = await supabase.from('tournament_reports').select('id').eq('tournament_id', id).eq('reporter_id', user.id).maybeSingle()
  const state = await searchParams
  return <div className="max-w-xl mx-auto flex flex-col gap-6">
    <Link href={`/torneos/${id}`} className="ui-action text-brand-lime">← Volver al torneo</Link>
    <h1 className="font-display text-4xl">Reportar torneo</h1>
    <p className="text-foreground/70">{tournament.name}</p>
    {state.ok === '1' || existing ? <p className="p-5 border border-brand-lime/40 rounded-sm">Tu reporte quedó registrado. <Link href="/mis-reportes" className="text-brand-lime underline">Ver mis reportes</Link></p> : <>
      {state.error === '1' && <p role="alert" className="text-brand-red">No pudimos guardar el reporte. Revisá los datos e intentá de nuevo.</p>}
      <form action={submitTournamentReport} className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-5">
        <input type="hidden" name="id" value={id} />
        <div className="flex flex-col gap-2"><label htmlFor="report-reason" className="ui-label">Motivo</label><select id="report-reason" name="reason" required className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm"><option value="">Elegí un motivo</option><option value="ya_no_existe">Ya no existe</option><option value="datos_incorrectos">Datos incorrectos</option><option value="no_es_torneo">No es un torneo</option></select></div>
        <div className="flex flex-col gap-2"><label htmlFor="report-detail" className="ui-label">Explicación (opcional)</label><textarea id="report-detail" name="detail" maxLength={500} rows={4} className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm" /></div>
        <button type="submit" className="ui-action justify-center px-5 py-3 bg-brand-lime text-brand-bg rounded-sm">Enviar reporte</button>
      </form>
    </>}
  </div>
}
