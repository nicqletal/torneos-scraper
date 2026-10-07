import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { ZoneSelect } from '@/components/ZoneSelect'
import { TEAM_LEVELS, MAX_CAPTAINCIES } from '@/utils/teams'
import { SPORT_MODALITIES } from '@/utils/modality'
import { createTeam } from './actions'
import { BackLink } from '@/components/BackLink'

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

  const labelClass = 'text-[10px] uppercase tracking-wider font-mono text-white/50'
  const inputClass =
    'px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-white text-sm focus:outline-none focus:border-brand-lime transition-colors'

  return (
    <div className="max-w-xl w-full mx-auto flex flex-col gap-8">
      <BackLink href="/mis-equipos" label="Mis equipos" />

      <div className="border-b border-brand-border pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-brand-lime flex items-center justify-center text-brand-bg">
          <Shield className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-4xl font-display tracking-wider text-white uppercase leading-none">Crear equipo</h1>
          <p className="text-white/50 text-xs mt-1">Vas a quedar como capitán. El escudo lo podés subir después.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-brand-red/40 bg-brand-red/10 text-brand-red text-sm rounded-sm">
          {error}
        </div>
      )}

      {/* Sin WhatsApp el formulario se ve igual, pero deshabilitado: el aviso
          explica por qué y lleva al perfil, que devuelve acá con `next`. */}
      {!hasWhatsapp && (
        <div role="status" className="p-4 border border-brand-amber bg-brand-amber/5 rounded-sm flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="flex-1 text-sm text-brand-amber">
            Para crear un equipo necesitás tener tu WhatsApp en el perfil: es la forma en que los capitanes rivales
            coordinan los partidos con vos.
          </p>
          <Link
            href="/perfil?next=/crear-equipo"
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-lime hover:bg-white text-brand-bg font-display font-bold uppercase tracking-wider text-xs rounded-sm transition-colors shrink-0"
          >
            Cargar mi WhatsApp
          </Link>
        </div>
      )}

      {hasWhatsapp && reachedLimit ? (
        <div className="p-6 bg-brand-surface border border-brand-border rounded-sm text-white/80 text-sm">
          Ya sos capitán de {MAX_CAPTAINCIES} equipos, que es el máximo. Para crear otro, pasá la capitanía de alguno
          o disolvelo.
        </div>
      ) : (
        <form action={createTeam} className="p-6 bg-brand-surface border border-brand-border rounded-sm">
          {/* <fieldset disabled> deshabilita de una todos los campos y el botón */}
            <fieldset disabled={!hasWhatsapp} className="flex flex-col gap-5 disabled:opacity-50">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className={labelClass}>Nombre del equipo</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={50}
                placeholder="Ej: Los Pibes de Palermo"
                className={inputClass}
              />
              <p className="text-[11px] text-white/40">Puede repetirse con otro equipo: se distinguen por la zona.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="zone_id" className={labelClass}>Zona</label>
              <ZoneSelect id="zone_id" name="zone_id" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="modality" className={labelClass}>Modalidad habitual</label>
                <select id="modality" name="modality" required defaultValue="" className={inputClass}>
                  <option value="" disabled>Elegí una modalidad</option>
                  {SPORT_MODALITIES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="level" className={labelClass}>Nivel</label>
                <select id="level" name="level" required defaultValue="" className={inputClass}>
                  <option value="" disabled>Elegí un nivel</option>
                  {TEAM_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center gap-2 py-3 bg-brand-lime hover:bg-white text-brand-bg font-display font-bold uppercase tracking-wider text-sm rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-brand-lime"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Crear equipo
            </button>
          </fieldset>
        </form>
      )}
    </div>
  )
}
