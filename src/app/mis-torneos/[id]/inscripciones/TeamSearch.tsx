import Link from 'next/link'
import { Link2, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { parseTeamQuery, teamSearchPattern } from '@/utils/team-search'
import { zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import { SubmitButton } from '@/components/SubmitButton'
import { errorTextClass } from '@/components/button-styles'
import { addLinkedInscription } from './actions'

interface TeamRow {
  id: string
  name: string
  zones: ZoneLabelFields
}

interface TeamSearchProps {
  tournamentId: string
  q: string | undefined
  // Equipos ya anotados en este torneo: el botón pasa a "Ya anotado".
  linkedTeamIds: Set<string>
}

// Buscador de equipos de la app para la inscripción vinculada. Es un <form>
// GET: la búsqueda vive en `?q=` (como los filtros del catálogo) y la página
// se renderiza en el servidor, sin JavaScript de cliente. Los resultados
// muestran siempre la zona al lado del nombre, porque los nombres se repiten.
// Lee solo `teams` (lectura pública) con la sesión del usuario: nunca el plantel.
export async function TeamSearch({ tournamentId, q, linkedTeamIds }: TeamSearchProps) {
  const parsed = parseTeamQuery(q)

  let teams: TeamRow[] = []
  if (parsed.ok) {
    const supabase = await createClient()
    // Los disueltos se filtran acá para no ofrecerlos; la regla de verdad la
    // aplica igual `add_linked_inscription`.
    const { data } = await supabase
      .from('teams')
      .select('id, name, zones(name, corridors(name))')
      .is('dissolved_at', null)
      .ilike('name', teamSearchPattern(parsed.query))
      .order('name')
      .limit(10)
    teams = (data ?? []) as unknown as TeamRow[]
  }

  return (
    <div className="flex flex-col gap-3">
      <form method="get" className="flex flex-col sm:flex-row gap-2">
        {/* Un form GET pisa la query entera: sin esto, buscar volvería a "Datos". */}
        <input type="hidden" name="tab" value="inscripciones" />
        <label className="flex-1 flex flex-col gap-1.5">
          <span className="sr-only">Buscar equipo de la app</span>
          <input
            name="q"
            type="search"
            defaultValue={q ?? ''}
            placeholder="Buscar un equipo de la app"
            autoComplete="off"
            className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-lime transition-colors"
          />
        </label>
        <button
          type="submit"
          className="press inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-brand-border bg-brand-secondary hover:border-brand-lime hover:text-brand-lime text-white text-xs font-display font-bold uppercase tracking-wider rounded-sm cursor-pointer"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </form>

      {!parsed.ok && parsed.error && (
        <p role="alert" className={`animate-enter ${errorTextClass}`}>
          {parsed.error}
        </p>
      )}

      {parsed.ok && teams.length === 0 && (
        <p className="text-[11px] font-mono uppercase text-white/50">
          No hay equipos activos con ese nombre. Si no está en la app, anotalo solo con el nombre.
        </p>
      )}

      {teams.length > 0 && (
        <ul className="flex flex-col gap-2">
          {teams.map((team) => (
            <li
              key={team.id}
              className="flex items-center gap-3 px-4 py-3 bg-brand-bg border border-brand-border rounded-sm"
            >
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <Link
                  href={`/equipos/${team.id}`}
                  className="text-white font-semibold text-sm truncate hover:text-brand-lime transition-colors"
                >
                  {team.name}
                </Link>
                <span className="text-[11px] font-mono uppercase text-white/50">{zoneLabel(team.zones)}</span>
              </div>
              {linkedTeamIds.has(team.id) ? (
                <span className="px-3 py-2 text-[11px] font-mono uppercase text-white/50">Ya anotado</span>
              ) : (
                <form action={addLinkedInscription}>
                  <input type="hidden" name="tournament_id" value={tournamentId} />
                  <input type="hidden" name="team_id" value={team.id} />
                  <input type="hidden" name="q" value={q ?? ''} />
                  <SubmitButton
                    pendingLabel={<><Link2 className="w-3.5 h-3.5" />Anotando…</>}
                    className="press inline-flex items-center gap-1.5 px-3 py-2 bg-brand-lime hover:bg-white text-brand-bg text-xs font-display font-bold uppercase tracking-wider rounded-sm cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Anotar
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
