import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TournamentForm } from '@/components/TournamentForm'
import { createTournament } from './actions'

export default async function CrearTorneoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/crear-torneo')
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
          Cargar torneo
        </h1>
        <p className="text-white/60 text-xs tracking-wider uppercase font-mono">
          Los equipos te contactan por WhatsApp o Instagram. La inscripción la arreglás vos.
        </p>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 md:p-8">
        <TournamentForm action={createTournament} submitLabel="Publicar torneo" pendingLabel="Publicando…" />
      </div>
    </div>
  )
}
