import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Shield } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamForm } from '@/components/TeamForm'
import { MAX_CAPTAINCIES } from '@/utils/teams'
import { createTeam } from './actions'

export default async function CrearEquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/crear-equipo')
  }

  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : undefined

  // Same preconditions create_team enforces, checked here to explain them
  // before the user fills the form. The database is still the one that decides.
  const [{ data: contact }, { data: captaincies }] = await Promise.all([
    supabase.from('profile_contacts').select('whatsapp').eq('user_id', user.id).single(),
    supabase
      .from('team_members')
      .select('team_id, teams!inner(dissolved_at)')
      .eq('user_id', user.id)
      .eq('is_captain', true)
      .is('teams.dissolved_at', null),
  ])

  const hasWhatsapp = !!contact?.whatsapp
  const reachedLimit = (captaincies?.length ?? 0) >= MAX_CAPTAINCIES

  return (
    <div className="max-w-xl w-full mx-auto flex flex-col gap-8">
      <Link
        href="/mis-equipos"
        className="ui-action inline-flex items-center gap-2 text-sm font-display font-bold uppercase tracking-wider text-foreground/70 hover:text-brand-lime transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Mis equipos
      </Link>

      <div className="border-b border-brand-border pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-brand-lime flex items-center justify-center text-brand-bg">
          <Shield className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-4xl font-display tracking-wider text-foreground uppercase leading-none">Crear equipo</h1>
          <p className="text-foreground/70 text-sm mt-1">Vas a quedar como capitán. Podés sumar un escudo para identificar a tu equipo.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-brand-red/40 bg-brand-red/10 text-brand-red text-sm rounded-sm">
          {error}
        </div>
      )}

      {!hasWhatsapp ? (
        <div className="p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-4">
          <p className="text-foreground/80 text-sm">
            Para crear un equipo necesitás tener tu WhatsApp en el perfil: es la forma en que los capitanes rivales
            coordinan los partidos con vos.
          </p>
          <Link
            href="/perfil?next=/crear-equipo"
            className="ui-action inline-flex items-center justify-center py-3 bg-brand-lime hover:bg-foreground text-brand-bg font-display font-bold uppercase tracking-wider text-sm rounded-sm transition-colors"
          >
            Cargar mi WhatsApp
          </Link>
        </div>
      ) : reachedLimit ? (
        <div className="p-6 bg-brand-surface border border-brand-border rounded-sm text-foreground/80 text-sm">
          Ya sos capitán de {MAX_CAPTAINCIES} equipos, que es el máximo. Para crear otro, pasá la capitanía de alguno
          o disolvelo.
        </div>
      ) : (
        <TeamForm action={createTeam} submitLabel="Crear equipo" />
      )}
    </div>
  )
}
