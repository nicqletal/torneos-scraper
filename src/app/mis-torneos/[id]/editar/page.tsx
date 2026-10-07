import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TournamentForm } from '@/components/TournamentForm'
import { getZoneGroups } from '@/components/ZoneSelect'
import {
  TOURNAMENT_FORM_COLUMNS,
  editConfirmation,
  tournamentToFormValues,
  type TournamentInput,
} from '@/utils/tournament-form'
import { updateTournament } from './actions'

interface EditarTorneoProps {
  params: Promise<{ id: string }>
}

export default async function EditarTorneoPage({ params }: EditarTorneoProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/mis-torneos/${id}/editar`)
  }

  // Un torneo ajeno da 404, igual que uno que no existe: no se confirma que
  // exista un torneo con ese id que no es tuyo. Un id que no es uuid hace
  // fallar la consulta, y también cae acá.
  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`${TOURNAMENT_FORM_COLUMNS}, image_url, inscriptions_count`)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tournament) {
    notFound()
  }

  // El flyer no es un campo que se precarga (un <input type="file"> no puede):
  // solo se avisa que ya hay uno.
  // `inscriptions_count` es una columna calculada; con equipos anotados se
  // pide confirmar antes de guardar.
  const { image_url, inscriptions_count, ...formColumns } = tournament as TournamentInput & {
    image_url: string | null
    inscriptions_count: number
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <Link
        href="/mis-torneos"
        className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-white/50 hover:text-brand-lime transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        <span>Volver a mis torneos</span>
      </Link>

      <div className="border-b border-brand-border pb-6 flex flex-col gap-2">
        <h1 className="text-5xl font-display tracking-widest font-bold text-white uppercase leading-none">
          Editar torneo
        </h1>
        <p className="text-white/60 text-xs tracking-wider uppercase font-mono">
          Editar no cuenta como confirmar que sigue vigente.
        </p>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 md:p-8">
        <TournamentForm
          action={updateTournament.bind(null, id)}
          zoneGroups={await getZoneGroups()}
          submitLabel="Guardar cambios"
          pendingLabel="Guardando…"
          initialValues={tournamentToFormValues(formColumns)}
          confirmMessage={editConfirmation(inscriptions_count)}
          hasFlyer={image_url !== null}
        />
      </div>
    </div>
  )
}
