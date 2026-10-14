import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { MapPin, Users, Gauge, RefreshCw, Crown, Trophy, Pencil, Link as LinkIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamCrest } from '@/components/TeamCrest'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { ConfirmButton } from '@/components/ConfirmButton'
import { SubmitButton } from '@/components/SubmitButton'
import { regenerateInvite, leaveTeam, removeMember, transferCaptaincy, dissolveTeam } from './actions'
import { levelLabel } from '@/utils/teams'
import { modalityLabel } from '@/utils/modality'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { BackLink } from '@/components/BackLink'

const rowButton =
  'px-3 py-1.5 text-sm font-bold uppercase tracking-wider rounded-sm border border-brand-border text-foreground hover:border-brand-lime hover:text-brand-lime transition-colors font-display'

// Botones de la sección de invitación: mismo tamaño y forma que "Copiar"
// (CopyLinkButton) y que "Crear equipo" en Mis equipos.
const actionButton =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors font-display cursor-pointer w-full sm:w-fit'
const primaryAction = 'bg-brand-lime hover:bg-foreground text-brand-bg'
const secondaryAction = 'bg-brand-bg border border-foreground/40 text-foreground hover:border-brand-lime hover:text-brand-lime'

interface PublicTeam {
  id: string
  name: string
  crest_url: string | null
  modality: string
  level: string
  dissolved_at: string | null
  player_count: number
  zones: { name: string; corridors: { name: string } }
}

// Un torneo de la historia del equipo: los que tienen una Inscripción
// vinculada a este equipo. Es público (vista `tournament_inscriptions` más
// la ficha del torneo), igual que el resto de la página.
interface TeamTournament {
  id: string
  name: string
  start_date: string
  status: TournamentStatus
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
  searchParams: Promise<{ error?: string | string[]; ok?: string | string[] }>
}) {
  const { id } = await params
  const query = await searchParams
  const error = typeof query.error === 'string' ? query.error : undefined

  const supabase = await createClient()
  const { data } = await supabase
    .from('teams')
    .select('id, name, crest_url, modality, level, dissolved_at, player_count, zones(name, corridors(name))')
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()
  const team = data as unknown as PublicTeam

  // The squad is private: RLS returns rows only when the visitor is in it, so
  // an empty result means "not a member" (or not logged in).
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

  // Historia: torneos con inscripción vinculada. Primero los ids por la vista
  // pública y después los torneos, con su estado calculado. La baja de un
  // torneo se lleva sus inscripciones, así que acá solo quedan los vigentes.
  const { data: linked } = await supabase
    .from('tournament_inscriptions')
    .select('tournament_id')
    .eq('team_id', id)
  const tournamentIds = (linked ?? []).map((row) => row.tournament_id as string)
  const { data: tournamentRows } = tournamentIds.length > 0
    ? await supabase
        .from('tournaments')
        .select('id, name, start_date, status')
        .in('id', tournamentIds)
        .order('start_date', { ascending: false })
    : { data: [] }
  const tournaments = (tournamentRows ?? []) as unknown as TeamTournament[]

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
      {isMember
        ? <BackLink href="/mis-equipos" label="Mis equipos" />
        : <BackLink href="/" label="Volver al catálogo" />}

      <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-b border-brand-border pb-8">
        <TeamCrest name={team.name} src={team.crest_url} size="lg" />
        <div className="flex flex-col gap-2">
          {team.dissolved_at && (
            <span className="px-2 py-0.5 text-sm font-sans tracking-wider uppercase border border-brand-border text-foreground/70 rounded-sm w-fit">
              Equipo disuelto
            </span>
          )}
          <h1 className="text-5xl md:text-6xl font-display tracking-wider text-foreground uppercase leading-none">{team.name}</h1>
        </div>
      </div>

      {canManage && (
        <Link href={`/equipos/${team.id}/editar`} className="ui-action press inline-flex items-center gap-2 px-5 py-3 bg-brand-lime text-brand-bg rounded-sm w-fit">
          <Pencil className="w-5 h-5" /> Editar equipo
        </Link>
      )}
      {(query.ok === 'editado' || query.ok === 'disuelto') && (
        <p role="status" className="p-4 border border-brand-lime/40 text-brand-lime rounded-sm">
          {query.ok === 'disuelto' ? 'El equipo quedó disuelto. Su página y su historia se conservan.' : 'Los cambios del equipo se guardaron.'}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-border border border-brand-border rounded-sm overflow-hidden">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-brand-surface p-4 flex flex-col gap-1.5">
            <span className="text-sm uppercase tracking-wider font-sans text-foreground/70 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-brand-lime" />
              {label}
            </span>
            <span className="text-foreground font-semibold text-sm">{value}</span>
          </div>
        ))}
      </div>

      {error && (
        <p className="p-3 text-sm text-foreground border border-brand-border rounded-sm" role="alert">
          {error}
        </p>
      )}

      <section className="border border-brand-border bg-brand-surface rounded-sm p-5 flex flex-col gap-3">
        <h2 className="text-xl font-display tracking-wider text-foreground uppercase flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-lime" />
          Torneos
        </h2>
        {tournaments.length > 0 ? (
          <ul className="flex flex-col divide-y divide-brand-border">
            {tournaments.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center gap-3">
                <Link
                  href={`/torneos/${t.id}`}
                  className="flex-1 min-w-0 truncate text-sm text-foreground font-semibold hover:text-brand-lime transition-colors"
                >
                  {t.name}
                </Link>
                <span className="text-[11px] font-mono text-foreground/60 shrink-0">
                  {new Date(`${t.start_date}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-display font-bold tracking-widest uppercase border rounded-sm shrink-0 ${statusStyles[t.status]}`}>
                  {statusLabels[t.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-foreground/70">Todavía no está anotado en ningún torneo.</p>
        )}
      </section>

      {isMember && (
        <section className="border border-brand-border bg-brand-surface rounded-sm p-5 flex flex-col gap-3">
          <h2 className="text-xl font-display tracking-wider text-foreground uppercase">Plantel</h2>
          <ul className="flex flex-col divide-y divide-brand-border">
            {roster.map((m) => (
              <li key={m.user_id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="flex-1 min-w-0 truncate text-sm text-foreground">
                  {m.profiles.display_name}
                  {m.user_id === user?.id && <span className="text-foreground/70"> (vos)</span>}
                </span>
                {m.is_captain && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-sm font-sans tracking-wider uppercase border border-brand-lime text-brand-lime rounded-sm">
                    <Crown className="w-3 h-3" />
                    Capitán
                  </span>
                )}
                {canManage && !m.is_captain && (
                  <div className="flex flex-wrap gap-2">
                    <form action={transferCaptaincy.bind(null, team.id, m.user_id)}>
                      <ConfirmButton
                        message={`¿Pasarle la capitanía a ${m.profiles.display_name}? Vas a quedar como jugador.`}
                        className={`ui-action ${rowButton}`}
                      >
                        Hacer capitán
                      </ConfirmButton>
                    </form>
                    <form action={removeMember.bind(null, team.id, m.user_id)}>
                      <ConfirmButton
                        message={`¿Sacar a ${m.profiles.display_name} del equipo?`}
                        className={`ui-action ${rowButton}`}
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
              <ConfirmButton message="¿Salir del equipo?" className={`ui-action ${rowButton}`}>
                Salir del equipo
              </ConfirmButton>
            </form>
          )}
          {isCaptain && !team.dissolved_at && (
            <p className="text-sm text-foreground/70">Para salir, primero pasale la capitanía a otro jugador.</p>
          )}
        </section>
      )}

      {canManage && (
        <section className="border border-brand-border bg-brand-surface rounded-sm p-5 flex flex-col gap-3">
          <h2 className="text-xl font-display tracking-wider text-foreground uppercase">Invitar jugadores</h2>
          {invite ? (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={`${origin}/unirse/${invite.token}`}
                  className="ui-input flex-1 min-w-0 px-3 py-2 text-sm font-mono bg-brand-bg border border-brand-border rounded-sm text-foreground"
                />
                <CopyLinkButton url={`${origin}/unirse/${invite.token}`} />
                {/* Secundario: con un link vigente la acción principal es copiarlo */}
                <form action={regenerateInvite.bind(null, team.id)} className="flex">
                  <SubmitButton pendingLabel="Regenerando…" className={`${actionButton} ${secondaryAction}`}>
                    <RefreshCw className="w-3.5 h-3.5 stroke-[3]" />
                    Regenerar
                  </SubmitButton>
                </form>
              </div>
              <p className="text-sm text-foreground/70">
                Vale hasta el {new Date(invite.expires_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.
                Regenerarlo invalida el anterior.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-foreground/70">No hay un link vigente. Generá uno para invitar jugadores; vale 7 días.</p>
              <form action={regenerateInvite.bind(null, team.id)}>
                <SubmitButton pendingLabel="Generando…" className={`${actionButton} ${primaryAction}`}>
                  <LinkIcon className="w-3.5 h-3.5 stroke-[3]" />
                  Generar link
                </SubmitButton>
              </form>
            </>
          )}
        </section>
      )}
      {canManage && (
        <section className="border border-brand-red/30 bg-brand-surface rounded-sm p-5 sm:p-7 flex flex-col gap-4">
          <h2 className="text-2xl font-display text-foreground">Disolver equipo</h2>
          <p className="text-base text-foreground/80">
            {team.name} conservará su página, su plantel y su escudo, pero ya no podrá operar.
            Las invitaciones dejarán de valer. Esta acción es definitiva.
          </p>
          <form action={dissolveTeam.bind(null, team.id)} className="flex flex-col gap-4">
            <label className="ui-label flex items-start gap-3 text-sm text-foreground min-h-11 py-2">
              <input name="confirm_dissolve" type="checkbox" required className="w-5 h-5 mt-0.5 accent-brand-red shrink-0" />
              Entiendo que no podré reactivar este equipo.
            </label>
            <ConfirmButton message={`¿Disolver "${team.name}"? La página y la historia se conservan. No se puede deshacer.`}
              className="ui-action press px-5 py-3 border border-brand-red text-brand-red rounded-sm w-fit hover:bg-brand-red/10">
              Disolver equipo
            </ConfirmButton>
          </form>
        </section>
      )}
    </div>
  )
}
