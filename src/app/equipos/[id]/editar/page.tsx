import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamForm } from '@/components/TeamForm'
import type { TeamFields } from '@/utils/team-form'
import { updateTeam } from '../actions'

export default async function EditarEquipoPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/equipos/${id}/editar`)}`)

  const [{ data: team }, { data: captain }] = await Promise.all([
    supabase.from('teams').select('name, zone_id, modality, level, crest_url, dissolved_at').eq('id', id).single(),
    supabase.rpc('is_team_captain', { p_team_id: id }),
  ])
  if (!team) notFound()
  if (!captain || team.dissolved_at) redirect(`/equipos/${id}`)

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col gap-7">
      <Link href={`/equipos/${id}`} className="ui-action inline-flex items-center gap-2 text-foreground/80 hover:text-brand-lime w-fit">
        <ArrowLeft className="w-5 h-5" /> Volver al equipo
      </Link>
      <div className="border-b border-brand-border pb-6 flex items-center gap-3">
        <Pencil className="w-7 h-7 text-brand-lime" />
        <div>
          <h1 className="text-4xl sm:text-5xl font-display text-foreground">Editar equipo</h1>
          <p className="text-base text-foreground/70 mt-2">Actualizá los datos de {team.name}.</p>
        </div>
      </div>
      {typeof query.error === 'string' && <p role="alert" className="p-4 text-brand-red border border-brand-red/40 rounded-sm">{query.error}</p>}
      <TeamForm action={updateTeam.bind(null, id)} initial={team as TeamFields} crestUrl={team.crest_url} submitLabel="Guardar cambios" />
    </div>
  )
}
