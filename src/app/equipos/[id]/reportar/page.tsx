import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { validUuid } from '@/utils/admin-forms'
import { SubmitButton } from '@/components/SubmitButton'
import { reportTeam } from './actions'
export default async function TeamReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  if (!validUuid(id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/equipos/${id}/reportar`)}`)
  const [{ data: allowed, error: permissionError }, { data: team }] = await Promise.all([supabase.rpc('can_report_team', { p_team_id: id }), supabase.from('teams').select('name').eq('id', id).maybeSingle()])
  if (!team) notFound()
  const { error } = await searchParams
  return <main className="max-w-xl w-full mx-auto flex flex-col gap-5"><Link href={`/equipos/${id}`} className="text-brand-lime">Volver al Equipo</Link><h1 className="font-display text-4xl">Reportar a {team.name}</h1>{permissionError ? <p role="alert">No pudimos comprobar si podés reportar.</p> : !allowed ? <p>Tenés que integrar actualmente un Equipo con un Partido Jugado contra este rival.</p> : <>
    {error && <p role="alert" className="text-brand-red">{error === 'duplicado' ? 'Ya tenés un reporte pendiente sobre este Equipo.' : 'No pudimos guardar el reporte. Revisá los datos e intentá de nuevo.'}</p>}
    <form action={reportTeam} className="flex flex-col gap-3"><input name="id" value={id} type="hidden" /><label htmlFor="reason">Motivo</label><select id="reason" name="reason" required className="p-3 bg-brand-bg border border-brand-border"><option value="">Elegí un motivo</option><option value="violencia">Violencia o agresiones</option><option value="cuenta_falsa">Cuenta falsa</option><option value="abuso_calificaciones">Abuso de calificaciones</option></select><label htmlFor="detail">Explicación (opcional, hasta 500 caracteres)</label><textarea id="detail" name="detail" maxLength={500} rows={5} className="p-3 bg-brand-bg border border-brand-border" /><p className="text-sm text-foreground/70">Se permite un reporte pendiente por persona y Equipo. Si el anterior ya fue resuelto, describí los hechos nuevos.</p><SubmitButton pendingLabel="Enviando…" className="ui-action p-3 bg-brand-lime text-brand-bg">Enviar reporte</SubmitButton></form></>}
  </main>
}
