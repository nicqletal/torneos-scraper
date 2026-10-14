import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TournamentForm } from '@/components/TournamentForm'
import { getZoneGroups } from '@/components/ZoneSelect'
import { createTournament } from './actions'
import { BackLink } from '@/components/BackLink'

export default async function CrearTorneoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/crear-torneo')
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <BackLink href="/mis-torneos" label="Mis torneos" />

      <div className="border-b border-brand-border pb-6 flex flex-col gap-2">
        <h1 className="text-5xl font-display tracking-widest font-bold text-foreground uppercase leading-none">
          Publicar torneo
        </h1>
        <p className="text-foreground/60 text-sm tracking-wider uppercase font-sans">
          Los equipos te contactan por WhatsApp o Instagram. La inscripción la arreglás vos.
        </p>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 md:p-8">
        <TournamentForm action={createTournament} zoneGroups={await getZoneGroups()} submitLabel="Publicar torneo" pendingLabel="Publicando…" />
      </div>
    </div>
  )
}
