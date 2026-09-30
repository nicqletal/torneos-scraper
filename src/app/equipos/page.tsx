import Link from 'next/link'
import { Users, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamCrest } from '@/components/TeamCrest'
import { ZoneSelect } from '@/components/ZoneSelect'
import { modalityLabel, levelLabel } from '@/utils/teams'

interface TeamRow {
  id: string
  name: string
  modality: string
  level: string
  player_count: number
  zones: { name: string; corridors: { name: string } }
}

// Team finder: lists active teams, filterable by zone. The filter lives in the
// URL (?zona=) so a filtered view is a shareable link.
export default async function EquiposPage({
  searchParams,
}: {
  searchParams: Promise<{ zona?: string }>
}) {
  const { zona } = await searchParams

  const supabase = await createClient()
  let query = supabase
    .from('teams')
    .select('id, name, modality, level, player_count, zones(name, corridors(name))')
    .is('dissolved_at', null)
    .order('name', { ascending: true })

  if (zona) query = query.eq('zone_id', zona)

  const { data } = await query
  const teams = (data ?? []) as unknown as TeamRow[]

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-8">
      <div className="border-b border-brand-border pb-6">
        <h1 className="text-4xl md:text-5xl font-display tracking-wider text-white uppercase leading-none">Equipos</h1>
        <p className="text-white/50 text-xs mt-2">Los equipos activos de la app. Filtrá por zona.</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-3">
        <ZoneSelect id="zona" name="zona" defaultValue={zona} placeholder="Todas las zonas" />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-white text-brand-bg transition-colors font-display"
        >
          <Search className="w-3.5 h-3.5 stroke-[3]" />
          Filtrar
        </button>
        {zona && (
          <Link
            href="/equipos"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm border border-brand-border text-white hover:border-brand-lime hover:text-brand-lime transition-colors font-display"
          >
            Quitar filtro
          </Link>
        )}
      </form>

      {teams.length === 0 ? (
        <div className="p-12 border border-brand-border bg-brand-surface text-center flex flex-col items-center gap-3 rounded-sm">
          <Users className="w-10 h-10 text-brand-lime" />
          <h2 className="text-xl font-display tracking-wider text-white uppercase">No hay equipos para mostrar</h2>
          <p className="text-white/50 text-sm max-w-sm">Probá con otra zona o quitá el filtro.</p>
        </div>
      ) : (
        <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/equipos/${team.id}`}
                className="p-4 flex items-center gap-4 hover:bg-brand-secondary transition-colors"
              >
                <TeamCrest name={team.name} />
                <div className="flex-1 min-w-0">
                  <span className="font-display text-xl tracking-wider text-white uppercase truncate block">{team.name}</span>
                  <p className="text-xs text-white/50 font-mono uppercase mt-1">
                    {team.zones.name} · {modalityLabel(team.modality)} · {levelLabel(team.level)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 shrink-0">
                  <Users className="w-3.5 h-3.5 text-brand-lime" />
                  {team.player_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
