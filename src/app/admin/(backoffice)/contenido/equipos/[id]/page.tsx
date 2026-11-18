import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { modalityLabel } from '@/utils/modality'

export default async function AdminTeamPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: team, error } = await supabase.from('teams').select('id, name, modality, level, dissolved_at, created_at, player_count, zones(name, corridors(name))').eq('id', id).maybeSingle()
  if (error) return <p role="alert" className="text-brand-red">No pudimos cargar el equipo. Volvé a intentar.</p>
  if (!team) notFound()
  const zone = team.zones as unknown as { name: string; corridors: { name: string } } | null

  return <div className="max-w-4xl flex flex-col gap-7">
    <Link href="/admin/contenido?tab=equipos" className="ui-action gap-2 w-fit text-foreground/80 hover:text-brand-lime"><ArrowLeft className="w-4 h-4" aria-hidden="true" />Torneos y equipos</Link>
    <div className="border-b border-brand-border pb-6"><p className="text-sm text-brand-lime font-semibold">Panel de administración · Equipos</p><h1 className="font-display text-4xl sm:text-5xl tracking-wide mt-2">{team.name}</h1><p className="text-foreground/70 mt-2">{team.dissolved_at ? 'Disuelto' : 'Activo'}</p></div>
    <section className="p-5 sm:p-6 bg-brand-surface border border-brand-border rounded-sm"><h2 className="text-xl font-semibold mb-5">Datos del equipo</h2><dl className="grid sm:grid-cols-2 gap-5">
      <div><dt className="text-sm text-foreground/60">Zona</dt><dd>{zone ? `${zone.name} · ${zone.corridors.name}` : 'No disponible'}</dd></div>
      <div><dt className="text-sm text-foreground/60">Modalidad</dt><dd>{modalityLabel(team.modality)}</dd></div>
      <div><dt className="text-sm text-foreground/60">Nivel</dt><dd className="capitalize">{team.level}</dd></div>
      <div><dt className="text-sm text-foreground/60">Estado</dt><dd>{team.dissolved_at ? 'Disuelto' : 'Activo'}</dd></div>
      <div><dt className="text-sm text-foreground/60">Jugadores</dt><dd>{team.player_count}</dd></div>
      <div><dt className="text-sm text-foreground/60">Fecha de creación</dt><dd>{new Date(team.created_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</dd></div>
    </dl></section>
    <Link href={`/equipos/${id}`} className="ui-action gap-2 w-fit text-brand-lime">Ver ficha pública <ExternalLink className="w-4 h-4" aria-hidden="true" /></Link>
  </div>
}
