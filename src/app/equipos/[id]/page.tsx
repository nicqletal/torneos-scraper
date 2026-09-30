import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ArrowLeft, MapPin, Users, Gauge, RefreshCw, Crown } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamCrest } from '@/components/TeamCrest'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { ConfirmButton } from '@/components/ConfirmButton'
import { regenerateInvite, leaveTeam, removeMember, transferCaptaincy } from './actions'
import { modalityLabel, levelLabel } from '@/utils/teams'

const rowButton =
  'px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border border-brand-border text-white hover:border-brand-lime hover:text-brand-lime transition-colors font-display'

interface PublicTeam {
  id: string
  name: string
  modality: string
  level: string
  dissolved_at: string | null
  player_count: number
  zones: { name: string; corridors: { name: string } }
}

interface RosterRow {
  user_id: string
  is_captain: boolean
  profiles: { display_name: string }
}

// Public team page (UC-29). The squad only shows up for its own members.
// Attendance, rating and last matches come with the matches module.
export default async function EquipoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data } = await supabase
    .from('teams')
    .select('id, name, modality, level, dissolved_at, player_count, zones(name, corridors(name))')
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()
  const team = data as unknown as PublicTeam

  // The squad is visible to any logged-in user (RLS returns nothing without a
  // session). Only names and the captain mark: contacts live in profile_contacts.
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rosterData } = user
    ? await supabase
        .from('team_members')
        .select('user_id, is_captain, joined_at, profiles(display_name)')
        .eq('team_id', id)
        .order('joined_at', { ascending: true })
    : { data: null }

  const roster = (rosterData ?? []) as unknown as RosterRow[]
  const isMember = roster.some((m) => m.user_id === user?.id)
  const isCaptain = roster.some((m) => m.user_id === user?.id && m.is_captain)
  const canManage = isCaptain && !team.dissolved_at

  let invite: { token: string; expires_at: string } | null = null
  if (canManage) {
    const { data: rows } = await supabase.rpc('get_team_invite', { p_team_id: id })
    invite = rows?.[0] ?? null
  }

  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  const stats = [
    { icon: MapPin, label: 'Zona', value: `${team.zones.name} · ${team.zones.corridors.name}` },
    { icon: Users, label: 'Modalidad', value: modalityLabel(team.modality) },
    { icon: Gauge, label: 'Nivel', value: levelLabel(team.level) },
    { icon: Users, label: 'Jugadores', value: String(team.player_count) },
  ]

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-white/50 hover:text-brand-lime transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Volver
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-b border-brand-border pb-8">
        <TeamCrest name={team.name} size="lg" />
        <div className="flex flex-col gap-2">
          {team.dissolved_at && (
            <span className="px-2 py-0.5 text-[10px] font-display tracking-wider uppercase border border-brand-border text-white/50 rounded-sm w-fit">
              Equipo disuelto
            </span>
          )}
          <h1 className="text-5xl md:text-6xl font-display tracking-wider text-white uppercase leading-none">{team.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-border border border-brand-border rounded-sm overflow-hidden">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-brand-surface p-4 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-mono text-white/40 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-brand-lime" />
              {label}
            </span>
            <span className="text-white font-semibold text-sm">{value}</span>
          </div>
        ))}
      </div>

      {error && (
        <p className="p-3 text-xs text-white border border-brand-border rounded-sm" role="alert">
          {error}
        </p>
      )}

      {!user && (
        <p className="text-xs text-white/50">
          <Link href={`/login?next=/equipos/${team.id}`} className="text-brand-lime hover:text-white transition-colors">
            Iniciá sesión
          </Link>{' '}
          para ver los integrantes.
        </p>
      )}

      {user && (
        <section className="border border-brand-border bg-brand-surface rounded-sm p-5 flex flex-col gap-3">
          <h2 className="text-xl font-display tracking-wider text-white uppercase">Plantel</h2>
          <ul className="flex flex-col divide-y divide-brand-border">
            {roster.map((m) => (
              <li key={m.user_id} className="py-2.5 flex items-center gap-3">
                <span className="flex-1 min-w-0 truncate text-sm text-white">
                  {m.profiles.display_name}
                  {m.user_id === user?.id && <span className="text-white/40"> (vos)</span>}
                </span>
                {m.is_captain && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-display tracking-wider uppercase border border-brand-lime text-brand-lime rounded-sm">
                    <Crown className="w-3 h-3" />
                    Capitán
                  </span>
                )}
                {canManage && !m.is_captain && (
                  <div className="flex gap-2">
                    <form action={transferCaptaincy.bind(null, team.id, m.user_id)}>
                      <ConfirmButton
                        message={`¿Pasarle la capitanía a ${m.profiles.display_name}? Vas a quedar como jugador.`}
                        className={rowButton}
                      >
                        Hacer capitán
                      </ConfirmButton>
                    </form>
                    <form action={removeMember.bind(null, team.id, m.user_id)}>
                      <ConfirmButton
                        message={`¿Sacar a ${m.profiles.display_name} del equipo?`}
                        className={rowButton}
                      >
                        Sacar
                      </ConfirmButton>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {isMember && !isCaptain && !team.dissolved_at && (
            <form action={leaveTeam.bind(null, team.id)}>
              <ConfirmButton message="¿Salir del equipo?" className={rowButton}>
                Salir del equipo
              </ConfirmButton>
            </form>
          )}
          {isCaptain && !team.dissolved_at && (
            <p className="text-xs text-white/50">Para salir, primero pasale la capitanía a otro jugador.</p>
          )}
        </section>
      )}

      {canManage && (
        <section className="border border-brand-border bg-brand-surface rounded-sm p-5 flex flex-col gap-3">
          <h2 className="text-xl font-display tracking-wider text-white uppercase">Invitar jugadores</h2>
          {invite ? (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={`${origin}/unirse/${invite.token}`}
                  className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-brand-bg border border-brand-border rounded-sm text-white"
                />
                <CopyLinkButton url={`${origin}/unirse/${invite.token}`} />
              </div>
              <p className="text-xs text-white/50">
                Vale hasta el {new Date(invite.expires_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.
                Regenerarlo invalida el anterior.
              </p>
            </>
          ) : (
            <p className="text-xs text-white/50">No hay un link vigente. Generá uno para invitar jugadores; vale 7 días.</p>
          )}
          <form action={regenerateInvite.bind(null, team.id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border border-brand-border text-white hover:border-brand-lime hover:text-brand-lime transition-colors font-display"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {invite ? 'Regenerar link' : 'Generar link'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
