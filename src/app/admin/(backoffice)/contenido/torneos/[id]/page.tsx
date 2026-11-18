import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { statusLabels, type TournamentStatus } from '@/utils/tournament-status'
import { modalityLabel } from '@/utils/modality'
import { removeObserved } from '@/app/admin/(backoffice)/reportes/actions'

export default async function AdminTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: tournament, error } = await supabase.from('tournaments').select('id, name, sport_modality, status, start_date, end_date, capacity, inscriptions_count, verified_at, observed_at, user_id, zones(name, corridors(name))').eq('id', id).maybeSingle()
  if (error) return <p role="alert" className="text-brand-red">No pudimos cargar el torneo. Volvé a intentar.</p>
  if (!tournament) notFound()
  const { data: organizer } = await supabase.from('profiles').select('display_name').eq('id', tournament.user_id).maybeSingle()
  const zone = tournament.zones as unknown as { name: string; corridors: { name: string } } | null
  const date = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })

  return <div className="max-w-4xl flex flex-col gap-7">
    <Link href="/admin/contenido" className="ui-action gap-2 w-fit text-foreground/80 hover:text-brand-lime"><ArrowLeft className="w-4 h-4" aria-hidden="true" />Torneos y equipos</Link>
    <div className="border-b border-brand-border pb-6"><p className="text-sm text-brand-lime font-semibold">Panel de administración · Torneos</p><h1 className="font-display text-4xl sm:text-5xl tracking-wide mt-2">{tournament.name}</h1><p className="text-foreground/70 mt-2">{statusLabels[tournament.status as TournamentStatus]}</p></div>
    <section className="p-5 sm:p-6 bg-brand-surface border border-brand-border rounded-sm"><h2 className="text-xl font-semibold mb-5">Datos del torneo</h2><dl className="grid sm:grid-cols-2 gap-5">
      <div><dt className="text-sm text-foreground/60">Organizador</dt><dd>{organizer?.display_name ?? 'No disponible'}</dd></div>
      <div><dt className="text-sm text-foreground/60">Zona</dt><dd>{zone ? `${zone.name} · ${zone.corridors.name}` : 'No disponible'}</dd></div>
      <div><dt className="text-sm text-foreground/60">Modalidad</dt><dd>{modalityLabel(tournament.sport_modality)}</dd></div>
      <div><dt className="text-sm text-foreground/60">Estado</dt><dd>{statusLabels[tournament.status as TournamentStatus]}</dd></div>
      <div><dt className="text-sm text-foreground/60">Inicio</dt><dd>{date(tournament.start_date)}</dd></div>
      <div><dt className="text-sm text-foreground/60">Fin</dt><dd>{date(tournament.end_date)}</dd></div>
      <div><dt className="text-sm text-foreground/60">Inscripciones</dt><dd>{tournament.inscriptions_count}{tournament.capacity ? ` / ${tournament.capacity}` : ' · Sin cupo'}</dd></div>
      <div><dt className="text-sm text-foreground/60">Última verificación</dt><dd>{tournament.verified_at ? new Date(tournament.verified_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'No disponible'}</dd></div>
    </dl></section>
    {tournament.observed_at && <form action={removeObserved} className="p-5 border border-brand-amber/40 rounded-sm flex flex-col gap-3"><h2 className="font-semibold text-brand-amber">Torneo Observado</h2><p className="text-sm text-foreground/70">Solo un administrador puede quitar esta marca. La decisión queda registrada.</p><input type="hidden" name="id" value={id} /><label htmlFor="unobserve-reason" className="ui-label">Motivo para quitar Observado</label><textarea id="unobserve-reason" name="reason" required minLength={3} maxLength={500} rows={3} className="px-3 py-2 bg-brand-bg border border-brand-border rounded-sm" /><button type="submit" className="ui-action w-fit px-4 py-2 border border-brand-amber text-brand-amber rounded-sm">Quitar Observado</button></form>}
    <Link href={`/torneos/${id}`} className="ui-action gap-2 w-fit text-brand-lime">Ver ficha pública <ExternalLink className="w-4 h-4" aria-hidden="true" /></Link>
  </div>
}
