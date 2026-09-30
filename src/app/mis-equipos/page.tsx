import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Users, Crown } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamCrest } from '@/components/TeamCrest'
import { levelLabel } from '@/utils/teams'
import { modalityLabel } from '@/utils/modality'

interface MembershipRow {
  is_captain: boolean
  teams: {
    id: string
    name: string
    modality: string
    level: string
    dissolved_at: string | null
    zones: { name: string }
  }
}

export default async function MisEquiposPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/mis-equipos')
  }

  const { data } = await supabase
    .from('team_members')
    .select('is_captain, teams!inner(id, name, modality, level, dissolved_at, zones(name))')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const memberships = (data ?? []) as unknown as MembershipRow[]
  // Active teams first; dissolved ones keep their history, so they stay listed
  const sorted = [...memberships].sort((a, b) => Number(!!a.teams.dissolved_at) - Number(!!b.teams.dissolved_at))

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-8">
      <div className="border-b border-brand-border pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display tracking-wider text-white uppercase leading-none">Mis equipos</h1>
          <p className="text-white/50 text-xs mt-2">Los equipos en los que jugás o sos capitán.</p>
        </div>
        <Link
          href="/crear-equipo"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-white text-brand-bg transition-colors font-display w-fit"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          Crear equipo
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="p-12 border border-brand-border bg-brand-surface text-center flex flex-col items-center gap-3 rounded-sm">
          <Users className="w-10 h-10 text-brand-lime" />
          <h2 className="text-xl font-display tracking-wider text-white uppercase">Todavía no estás en ningún equipo</h2>
          <p className="text-white/50 text-sm max-w-sm">
            Creá uno, o pedile al capitán de tu equipo el link de invitación.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
          {sorted.map(({ is_captain, teams: team }) => (
            <li key={team.id}>
              <Link
                href={`/equipos/${team.id}`}
                className="p-4 flex items-center gap-4 hover:bg-brand-secondary transition-colors"
              >
                <TeamCrest name={team.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl tracking-wider text-white uppercase truncate">{team.name}</span>
                    {is_captain && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-display tracking-wider uppercase border border-brand-lime text-brand-lime rounded-sm">
                        <Crown className="w-3 h-3" />
                        Capitán
                      </span>
                    )}
                    {team.dissolved_at && (
                      <span className="px-2 py-0.5 text-[10px] font-display tracking-wider uppercase border border-brand-border text-white/50 rounded-sm">
                        Disuelto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 font-mono uppercase mt-1">
                    {team.zones.name} · {modalityLabel(team.modality)} · {levelLabel(team.level)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
