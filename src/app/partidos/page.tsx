import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, Check, MapPin, MessageCircle, MoreHorizontal, Search, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamCrest } from '@/components/TeamCrest'
import { SubmitButton } from '@/components/SubmitButton'
import { SPORT_MODALITIES, isSportModality, modalityLabel, type SportModality } from '@/utils/modality'
import { levelLabel } from '@/utils/teams'
import {
  SEARCH_DAYS,
  addDays,
  buenosAiresToday,
  dayLabel,
  isUpcoming,
  slotFromRange,
  slotLabel,
  slotValue,
  type Slot,
} from '@/utils/rival-search-form'
import { noticeDate } from '@/utils/notices'
import { proposalCardTitle, proposalStatusLabel, type ProposalStatus } from '@/utils/proposals'
import {
  asksGoing,
  dropDetail,
  dropMenu,
  goingNote,
  isOccupied,
  mapsLink,
  matchPhaseBadge,
  matchRowDetail,
  mutualDropNote,
  mutualDropToAnswer,
  nextMatch,
  sortByStart,
  timeLabel,
  type MatchCoordination,
  type MatchDrop,
  type MatchTone,
} from '@/utils/match-display'
import { coordinationTimes } from '@/utils/match-forms'
import { whatsappLink } from '@/utils/whatsapp'
import {
  acceptProposal,
  answerMutualDrop,
  confirmGoing,
  coordinateMatch,
  declineProposal,
  dropMatch,
  requestMutualDrop,
  saveRivalSearch,
  sendProposal,
} from './actions'

interface CaptainRow {
  teams: { id: string; name: string; modality: SportModality }
}

interface CompatibleRow {
  team_id: string
  team_name: string
  crest_url: string | null
  zone_name: string
  level: string
  slot_id: string
  rival_slot_id: string
  rival_slot_range: string
  common_range: string
}

// Una fila de la vista `proposal_details`: por RLS, solo las de los equipos
// que capitanea el usuario, mandadas o recibidas.
interface ProposalRow {
  id: string
  from_slot_id: string
  to_slot_id: string
  range: string
  from_team_id: string
  from_team_name: string
  from_crest_url: string | null
  to_team_id: string
  to_team_name: string
  status: ProposalStatus
  expires_at: string
}

// Una fila de la vista `match_details`: por RLS, los partidos de los equipos
// del usuario (plantel actual), cada uno visto desde su equipo.
interface MatchRow extends MatchCoordination, MatchDrop {
  id: string
  range: string
  venue_by_own: boolean | null
  team_id: string
  team_name: string
  rival_team_id: string
  rival_team_name: string
  rival_crest_url: string | null
}

const TONE_CLASS: Record<MatchTone, string> = {
  lime: 'border-brand-lime/40 text-brand-lime',
  muted: 'border-foreground/20 text-foreground/70',
}

const HOURS_FROM = Array.from({ length: 16 }, (_, i) => i + 8) // 8 a 23
const HOURS_TO = Array.from({ length: 16 }, (_, i) => i + 9) // 9 a 24

const pill = 'ui-action px-3 py-1.5 text-sm font-display uppercase tracking-wider rounded-sm border transition-colors'
const pillOn = 'border-brand-lime text-brand-lime'
const pillOff = 'border-foreground/20 text-foreground/70 hover:border-brand-lime hover:text-brand-lime'

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export default async function PartidosPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/partidos')
  }

  // Solo el capitán opera Partidos: el panel aparece para los equipos activos
  // que capitanea. El plantel no lo ve.
  const { data } = await supabase
    .from('team_members')
    .select('teams!inner(id, name, modality)')
    .eq('user_id', user.id)
    .eq('is_captain', true)
    .is('teams.dissolved_at', null)
    .order('joined_at', { ascending: true })
  const captainTeams = ((data ?? []) as unknown as CaptainRow[]).map((row) => row.teams)

  // Las propuestas de esos equipos, de la más nueva a la más vieja. El estado
  // (pendiente, vencida, cancelada…) lo calcula la base al leer.
  let proposals: ProposalRow[] = []
  if (captainTeams.length > 0) {
    const { data: proposalRows } = await supabase
      .from('proposal_details')
      .select('id, from_slot_id, to_slot_id, range, from_team_id, from_team_name, from_crest_url, to_team_id, to_team_name, status, expires_at')
      .order('created_at', { ascending: false })
    proposals = (proposalRows ?? []) as ProposalRow[]
  }
  const captainTeamIds = new Set(captainTeams.map((t) => t.id))
  // Las recibidas pendientes, y las que un bloqueo por faltas canceló mientras
  // no vencen: se ven canceladas, sin botones (el bloqueo no avisa).
  const now = new Date()
  const received = proposals.filter(
    (p) =>
      captainTeamIds.has(p.to_team_id) &&
      (p.status === 'pendiente' || (p.status === 'equipo_bloqueado' && new Date(p.expires_at) > now))
  )
  const teamParam = param(searchParams.equipo)
  const modalityParam = param(searchParams.modalidad)

  // Los partidos los ve todo el plantel, capitán o no.
  const { data: matchRows } = await supabase
    .from('match_details')
    .select('id, range, start_at, phase, team_id, team_name, is_captain, rival_team_id, rival_team_name, rival_crest_url, venue, venue_start_at, venue_by_own, coordinated_at, going_at, rival_going_at, deadline, drop_reason, dropped_by_own, drop_mutual, drop_fault, mutual_drop_reason, mutual_drop_by_own, mutual_drop_answered_at, mutual_drop_accepted')
  const matches = sortByStart((matchRows ?? []) as MatchRow[])
  const next = nextMatch(matches)
  const matchError = param(searchParams.error_partido)

  // El WhatsApp del capitán rival solo se le da al capitán: la función
  // devuelve null a cualquier otro.
  let rivalWhatsapp: string | null = null
  if (next?.is_captain) {
    const { data: whatsapp } = await supabase.rpc('rival_captain_whatsapp', { p_match_id: next.id })
    rivalWhatsapp = whatsapp
  }

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-8">
      <div className="border-b border-brand-border pb-6">
        <h1 className="text-4xl md:text-5xl font-display tracking-wider text-foreground uppercase leading-none">Partidos</h1>
        <p className="text-foreground/70 text-sm mt-2">Los partidos de tus equipos y la búsqueda de rival.</p>
      </div>

      {next && <NextMatch match={next} whatsapp={rivalWhatsapp} now={now} />}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
        <section className="flex flex-col gap-4">
          {received.length > 0 && (
            <>
              <h2 className="text-2xl font-display tracking-wider uppercase text-foreground">Propuestas recibidas</h2>
              <ul className="flex flex-col gap-3 mb-4">
                {received.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-4 border border-brand-lime/40 bg-brand-surface rounded-sm">
                    <TeamCrest name={p.from_team_name} src={p.from_crest_url} />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground">{proposalCardTitle(p.from_team_name, p.range)}</p>
                      <p className="text-xs text-foreground/70 mt-1">
                        {p.status === 'pendiente'
                          ? `Para ${p.to_team_name} · vence el ${noticeDate(p.expires_at)}`
                          : `Para ${p.to_team_name} · ${proposalStatusLabel(p.status)}`}
                      </p>
                    </div>
                    {p.status === 'pendiente' && (
                    <>
                    <form action={acceptProposal}>
                      <input type="hidden" name="proposal_id" value={p.id} />
                      <input type="hidden" name="team_id" value={teamParam ?? ''} />
                      <input type="hidden" name="modality" value={modalityParam ?? ''} />
                      <SubmitButton
                        pendingLabel="Aceptando…"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold font-display uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors"
                      >
                        <Check className="w-4 h-4" /> Aceptar
                      </SubmitButton>
                    </form>
                    <form action={declineProposal}>
                      <input type="hidden" name="proposal_id" value={p.id} />
                      <input type="hidden" name="team_id" value={teamParam ?? ''} />
                      <input type="hidden" name="modality" value={modalityParam ?? ''} />
                      <SubmitButton
                        pendingLabel="Rechazando…"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-display uppercase tracking-wider rounded-sm border border-foreground/20 text-foreground/80 hover:border-brand-red hover:text-brand-red transition-colors"
                      >
                        <X className="w-4 h-4" /> Rechazar
                      </SubmitButton>
                    </form>
                    </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="text-2xl font-display tracking-wider uppercase text-foreground">Tus partidos</h2>
          {matchError && (
            <p role="alert" className="p-3 border border-brand-red/40 text-brand-red rounded-sm text-sm">
              {matchError}
            </p>
          )}
          {matches.length === 0 ? (
            <p className="p-6 border border-brand-border bg-brand-surface rounded-sm text-foreground/70 text-sm">
              Todavía no hay partidos. Cuando un capitán acuerde uno, va a aparecer acá.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {matches.map((m) => {
                const badge = matchPhaseBadge(m.phase)
                const note = goingNote(m, now)
                const menu = dropMenu(m, now)
                const mutualNote = mutualDropNote(m)
                return (
                  <li key={m.id} className="flex flex-col gap-3 p-4 border border-brand-border bg-brand-surface rounded-sm">
                    <div className="flex items-center gap-3">
                      <TeamCrest name={m.rival_team_name} src={m.rival_crest_url} />
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground">
                          {slotLabel(slotFromRange(m.range))} · vs{' '}
                          <Link href={`/equipos/${m.rival_team_id}`} className="font-display tracking-wider uppercase hover:text-brand-lime">
                            {m.rival_team_name}
                          </Link>
                        </p>
                        <p className="text-xs text-foreground/70 mt-1">
                          Con {m.team_name} · {m.phase === 'caido' ? dropDetail(m) : matchRowDetail(m)}
                          {m.phase !== 'caido' && m.venue && <MapLink venue={m.venue} />}
                        </p>
                        {note && <p className="text-xs text-brand-red mt-1">{note}</p>}
                        {mutualNote && <p className="text-xs text-foreground/70 mt-1">{mutualNote}</p>}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 text-xs font-display uppercase tracking-wider border rounded-sm ${TONE_CLASS[badge.tone]}`}>
                        {badge.text}
                      </span>
                    </div>
                    <MutualDropAnswer match={m} now={now} />
                    {/* Menú ⋯: tirar el partido, y con menos de 24 h, pedirlo de común acuerdo. El motivo se escribe en la fila, que se despliega. */}
                    {menu && (
                      <details>
                        <summary className="cursor-pointer inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-brand-lime" aria-label="Más acciones">
                          <MoreHorizontal className="w-5 h-5" /> {menu.label}
                        </summary>
                        <DropForm match={m} menu={menu} />
                      </details>
                    )}
                    {/* El "¿Van?" del próximo partido va arriba; el de otro partido (capitán de dos equipos que juegan el mismo día), en su fila. */}
                    {m.id !== next?.id && asksGoing(m) && <GoingPrompt match={m} now={now} />}
                    {m.is_captain && m.phase === 'por_jugarse' && new Date(m.start_at) > now && <Coordination match={m} />}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {captainTeams.length > 0 && (
          <RivalSearchPanel
            supabase={supabase}
            teams={captainTeams}
            proposals={proposals}
            matches={matches}
            teamParam={teamParam}
            modalityParam={modalityParam}
            error={param(searchParams.error)}
          />
        )}
      </div>
    </div>
  )
}

async function RivalSearchPanel({
  supabase,
  teams,
  proposals,
  matches,
  teamParam,
  modalityParam,
  error,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  teams: CaptainRow['teams'][]
  proposals: ProposalRow[]
  matches: MatchRow[]
  teamParam?: string
  modalityParam?: string
  error?: string
}) {
  const team = teams.find((t) => t.id === teamParam) ?? teams[0]
  // La modalidad viene completada con la habitual del equipo y se puede cambiar.
  const modality = isSportModality(modalityParam) ? modalityParam : team.modality
  const now = new Date()
  const today = buenosAiresToday(now)

  // Que la búsqueda esté activa y que el equipo esté bloqueado por faltas lo
  // calcula la base, igual que en las RPC.
  const [{ data: searchId }, { data: blockedUntil }] = await Promise.all([
    supabase.rpc('active_rival_search', { p_team_id: team.id, p_modality: modality, p_now: now.toISOString() }),
    supabase.rpc('team_blocked_until', { p_team_id: team.id, p_now: now.toISOString() }),
  ])

  let slots: Slot[] = []
  let compatibles: CompatibleRow[] = []
  if (searchId) {
    const [{ data: slotRows }, { data: compatibleRows }] = await Promise.all([
      supabase.from('search_slots').select('range').eq('search_id', searchId).is('removed_at', null),
      supabase.rpc('compatible_rivals', { p_search_id: searchId }),
    ])
    slots = (slotRows ?? [])
      .map((row) => slotFromRange(row.range))
      .filter((slot) => isUpcoming(slot, today))
      .sort((a, b) => a.date.localeCompare(b.date) || a.from - b.from)
    compatibles = (compatibleRows ?? []) as CompatibleRow[]
  }

  // Los partidos del equipo, para marcar sus franjas ocupadas.
  const matchSlots = matches.filter((m) => m.team_id === team.id).map((m) => slotFromRange(m.range))

  const hrefFor = (teamId: string, mod: string) => `/partidos?equipo=${teamId}&modalidad=${mod}`
  const days = Array.from({ length: SEARCH_DAYS }, (_, i) => addDays(today.date, i))
  const hiddenFields = (
    <>
      <input type="hidden" name="team_id" value={team.id} />
      <input type="hidden" name="modality" value={modality} />
    </>
  )

  return (
    <aside className="flex flex-col gap-5 p-5 border border-brand-border bg-brand-surface rounded-sm">
      <h2 className="flex items-center gap-2 text-2xl font-display tracking-wider uppercase text-foreground">
        <Search className="w-5 h-5 text-brand-lime" /> Buscar rival
      </h2>

      {teams.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-foreground/70 uppercase tracking-wider">Equipo</span>
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <Link key={t.id} href={hrefFor(t.id, t.modality)} className={`${pill} ${t.id === team.id ? pillOn : pillOff}`}>
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground/70 uppercase tracking-wider">Modalidad</span>
        <div className="flex flex-wrap gap-2">
          {SPORT_MODALITIES.map((m) => (
            <Link key={m.value} href={hrefFor(team.id, m.value)} className={`${pill} ${m.value === modality ? pillOn : pillOff}`}>
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="p-3 border border-brand-red/40 text-brand-red rounded-sm text-sm">
          {error}
        </p>
      )}

      {blockedUntil && (
        <p role="alert" className="p-3 border border-brand-red/40 text-brand-red rounded-sm text-sm">
          {team.name} está bloqueado por faltas hasta el {noticeDate(blockedUntil)}: 3 faltas en 90 días. Hasta entonces no
          puede publicar búsquedas. Los partidos ya acordados siguen en pie.
        </p>
      )}

      {searchId && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-foreground/70 uppercase tracking-wider">
            Tu búsqueda de {modalityLabel(modality)}
          </span>
          <ul className="flex flex-col divide-y divide-brand-border border border-brand-border rounded-sm">
            {slots.map((slot) => (
              <li key={slotValue(slot)} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-foreground">
                  {slotLabel(slot)}
                  {isOccupied(slot, matchSlots) && (
                    <span className="ml-2 text-xs text-foreground/70 uppercase tracking-wider">Ocupada</span>
                  )}
                </span>
                {/* Sacar una franja guarda todas las demás. Sacar la última cancela la búsqueda. */}
                <form action={saveRivalSearch}>
                  {hiddenFields}
                  {slots.filter((other) => other !== slot).map((other) => (
                    <input key={slotValue(other)} type="hidden" name="slot" value={slotValue(other)} />
                  ))}
                  <SubmitButton
                    pendingLabel="Sacando…"
                    className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-brand-red"
                  >
                    <X className="w-4 h-4" /> Sacar
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!blockedUntil && (
      <form action={saveRivalSearch} className="flex flex-col gap-4">
        {hiddenFields}
        {slots.map((slot) => (
          <input key={slotValue(slot)} type="hidden" name="slot" value={slotValue(slot)} />
        ))}

        <fieldset className="flex flex-col gap-2">
          <legend className="flex items-center gap-2 text-sm text-foreground/70 uppercase tracking-wider mb-2">
            <CalendarDays className="w-4 h-4" /> {searchId ? 'Agregar una franja' : 'Elegí el día'}
          </legend>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => (
              <label
                key={day}
                className="cursor-pointer flex flex-col items-center py-2 text-xs uppercase rounded-sm border border-foreground/20 text-foreground/80 hover:border-brand-lime has-[:checked]:border-brand-lime has-[:checked]:bg-brand-lime has-[:checked]:text-brand-bg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-lime"
              >
                <input type="radio" name="day" value={day} required className="sr-only" />
                <span>{dayLabel(day).split(' ')[0]}</span>
                <span className="font-display text-lg leading-none">{dayLabel(day).split(' ')[1].split('/')[0]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-2 text-foreground">
          <label className="flex items-center gap-2">
            de
            <select name="from" defaultValue="20" className="bg-brand-bg border border-brand-border rounded-sm px-2 py-1.5">
              {HOURS_FROM.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            a
            <select name="to" defaultValue="22" className="bg-brand-bg border border-brand-border rounded-sm px-2 py-1.5">
              {HOURS_TO.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
          <span className="text-foreground/70 text-sm">h</span>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" name="repeat" className="accent-brand-lime w-4 h-4" />
          Repetir la semana que viene
        </label>

        <SubmitButton
          pendingLabel="Guardando…"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors font-display"
        >
          {searchId ? 'Agregar franja' : 'Publicar búsqueda'}
        </SubmitButton>
      </form>
      )}

      {searchId && (
        <form action={saveRivalSearch}>
          {hiddenFields}
          <SubmitButton pendingLabel="Cancelando…" className="text-sm text-foreground/70 hover:text-brand-red underline underline-offset-4">
            Cancelar búsqueda
          </SubmitButton>
        </form>
      )}

      {searchId && (
        <div className="flex flex-col gap-3 border-t border-brand-border pt-5">
          <h3 className="text-xl font-display tracking-wider uppercase text-foreground">Compatibles</h3>
          {compatibles.length === 0 ? (
            <p className="text-sm text-foreground/70">
              Todavía no hay equipos de {modalityLabel(modality)} con al menos 1 h en común. Probá con más franjas.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {compatibles.map((c) => {
                // Las propuestas que este equipo le mandó por este par de
                // franjas, la más nueva primero.
                const sent = proposals.filter((p) => p.from_slot_id === c.slot_id && p.to_slot_id === c.rival_slot_id)
                const pending = sent.find((p) => p.status === 'pendiente')
                const lastNote = !pending && sent.length > 0 ? proposalStatusLabel(sent[0].status) : null
                return (
                <li key={`${c.slot_id}-${c.rival_slot_id}`} className="flex items-center gap-3 p-3 border border-brand-border rounded-sm bg-brand-bg">
                  <TeamCrest name={c.team_name} src={c.crest_url} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/equipos/${c.team_id}`} className="font-display text-lg tracking-wider uppercase text-foreground hover:text-brand-lime truncate block">
                      {c.team_name}
                    </Link>
                    <p className="text-xs text-foreground/70 uppercase">{c.zone_name} · {levelLabel(c.level)}</p>
                    <p className="text-sm text-foreground mt-1">
                      En común: <span className="text-brand-lime">{slotLabel(slotFromRange(c.common_range))}</span>
                    </p>
                    <p className="text-xs text-foreground/70">Su franja: {slotLabel(slotFromRange(c.rival_slot_range))}</p>
                    {pending ? (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-sm font-display uppercase tracking-wider text-brand-lime">
                          <Check className="w-4 h-4" /> Propuesta enviada
                        </span>
                        <form action={declineProposal}>
                          {hiddenFields}
                          <input type="hidden" name="proposal_id" value={pending.id} />
                          <SubmitButton pendingLabel="Cancelando…" className="text-sm text-foreground/70 hover:text-brand-red underline underline-offset-4">
                            Cancelar
                          </SubmitButton>
                        </form>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-1 mt-2">
                        {lastNote && <span className="text-xs text-foreground/70">{lastNote}</span>}
                        <form action={sendProposal}>
                          {hiddenFields}
                          <input type="hidden" name="slot_id" value={c.slot_id} />
                          <input type="hidden" name="rival_slot_id" value={c.rival_slot_id} />
                          <SubmitButton
                            pendingLabel="Mandando…"
                            className="inline-flex items-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors font-display"
                          >
                            Proponer partido
                          </SubmitButton>
                        </form>
                      </div>
                    )}
                  </div>
                </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </aside>
  )
}

// El próximo partido, arriba y en grande: rival, día y rango, y el WhatsApp del
// capitán rival para arreglar cancha y hora (solo si el usuario es capitán).
function NextMatch({ match, whatsapp, now }: { match: MatchRow; whatsapp: string | null; now: Date }) {
  const when = slotLabel(slotFromRange(match.range))
  const note = goingNote(match, now)
  return (
    <section className="flex flex-col gap-4 p-6 border border-brand-lime/40 bg-brand-surface rounded-sm">
      <span className="text-sm text-brand-lime uppercase tracking-wider font-display">Próximo partido</span>
      <div className="flex items-center gap-4">
        <TeamCrest name={match.rival_team_name} src={match.rival_crest_url} />
        <div className="min-w-0 flex-1">
          <p className="text-3xl md:text-4xl font-display tracking-wider uppercase text-foreground leading-none">
            vs{' '}
            <Link href={`/equipos/${match.rival_team_id}`} className="hover:text-brand-lime">
              {match.rival_team_name}
            </Link>
          </p>
          <p className="text-foreground mt-2">{when}</p>
          <p className="text-sm text-foreground/70">
            Con {match.team_name} · {matchRowDetail(match)}
            {match.venue && <MapLink venue={match.venue} />}
          </p>
          {note && <p className="text-sm text-brand-red mt-1">{note}</p>}
        </div>
      </div>
      {asksGoing(match) && <GoingPrompt match={match} now={now} />}
      {whatsapp && (
        <a
          href={whatsappLink(whatsapp, `Hola, somos ${match.team_name}. Arreglemos cancha y hora para el partido del ${when}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors font-display"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp del capitán rival
        </a>
      )}
    </section>
  )
}

// "Ver en el mapa": busca la cancha en Google Maps.
function MapLink({ venue }: { venue: string }) {
  return (
    <a
      href={mapsLink(venue)}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-2 inline-flex items-center gap-1 text-brand-lime hover:underline underline-offset-4"
    >
      <MapPin className="w-3 h-3" /> Ver en el mapa
    </a>
  )
}

// "¿Van?": desde 24 h antes de la hora de inicio, para el capitán que todavía
// no dijo "Vamos". "No vamos" abre el formulario de tirar el partido, con el
// aviso de la falta y la opción de pedirlo de común acuerdo.
function GoingPrompt({ match, now }: { match: MatchRow; now: Date }) {
  const menu = dropMenu(match, now)
  return (
    <div className="flex flex-col gap-2 p-3 border border-brand-lime/40 rounded-sm bg-brand-bg">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-lg tracking-wider uppercase text-foreground">¿Van?</span>
        <form action={confirmGoing}>
          <input type="hidden" name="match_id" value={match.id} />
          <SubmitButton
            pendingLabel="Confirmando…"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold font-display uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors"
          >
            <Check className="w-4 h-4" /> Vamos
          </SubmitButton>
        </form>
      </div>
      {menu && (
        <details>
          <summary className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-sm font-display uppercase tracking-wider rounded-sm border border-foreground/20 text-foreground/80 hover:border-brand-red hover:text-brand-red">
            <X className="w-4 h-4" /> No vamos
          </summary>
          <DropForm match={match} menu={menu} />
        </details>
      )}
    </div>
  )
}

// El formulario de tirar el partido: motivo, el aviso si suma falta y, con
// menos de 24 h, el botón para pedirlo de común acuerdo con el mismo motivo.
function DropForm({ match, menu }: { match: MatchRow; menu: NonNullable<ReturnType<typeof dropMenu>> }) {
  return (
    <form action={dropMatch} className="flex flex-col gap-2 mt-2">
      <input type="hidden" name="match_id" value={match.id} />
      <label className="flex flex-col gap-1 text-xs text-foreground/70 uppercase tracking-wider">
        Motivo
        <input
          name="reason"
          required
          maxLength={140}
          placeholder="Nos faltan dos"
          className="bg-brand-bg border border-brand-border rounded-sm px-2 py-1.5 text-sm text-foreground normal-case tracking-normal"
        />
      </label>
      <p className="text-xs text-foreground/70">El motivo queda en el historial público del equipo.</p>
      {menu.withFault && <p className="text-sm text-brand-red">Suma una falta a tu equipo.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          pendingLabel="Tirando…"
          className="inline-flex items-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider rounded-sm border border-brand-red text-brand-red hover:bg-brand-red hover:text-brand-bg transition-colors font-display"
        >
          {menu.label}
        </SubmitButton>
        {menu.canAskMutual && (
          <SubmitButton
            formAction={requestMutualDrop}
            pendingLabel="Pidiendo…"
            className="inline-flex items-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors font-display"
          >
            Pedir tirarlo de común acuerdo
          </SubmitButton>
        )}
      </div>
      {menu.canAskMutual && (
        <p className="text-xs text-foreground/70">De común acuerdo no suma falta, si el rival acepta antes de la hora de inicio.</p>
      )}
    </form>
  )
}

// El pedido de común acuerdo del rival, para responder en la fila.
function MutualDropAnswer({ match, now }: { match: MatchRow; now: Date }) {
  const reason = mutualDropToAnswer(match, now)
  if (!reason) return null
  return (
    <div className="flex flex-col gap-2 p-3 border border-brand-lime/40 rounded-sm bg-brand-bg">
      <p className="text-sm text-foreground">
        {match.rival_team_name} pide tirar el partido de común acuerdo: <span className="text-brand-lime">&ldquo;{reason}&rdquo;</span>
      </p>
      <p className="text-xs text-foreground/70">Si aceptás, se cae sin falta para nadie. Si no respondés, sigue en pie.</p>
      <div className="flex items-center gap-3">
        <form action={answerMutualDrop}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="accept" value="true" />
          <SubmitButton
            pendingLabel="Aceptando…"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold font-display uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors"
          >
            <Check className="w-4 h-4" /> Aceptar
          </SubmitButton>
        </form>
        <form action={answerMutualDrop}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="accept" value="false" />
          <SubmitButton
            pendingLabel="Rechazando…"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-display uppercase tracking-wider rounded-sm border border-foreground/20 text-foreground/80 hover:border-brand-red hover:text-brand-red transition-colors"
          >
            <X className="w-4 h-4" /> Rechazar
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}

// Cancha y hora en la fila, solo para el capitán y antes de la hora de inicio.
// Si el rival las cargó, se confirman (mandando los mismos valores) o se
// corrigen; si no hay, se cargan; si ya están, se pueden cambiar.
function Coordination({ match }: { match: MatchRow }) {
  const slot = slotFromRange(match.range)
  const loaded = match.venue && match.venue_start_at ? { venue: match.venue, time: timeLabel(match.venue_start_at) } : null
  const toConfirm = loaded && !match.coordinated_at && !match.venue_by_own

  const fields = (venue: string, time: string) => (
    <>
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="slot" value={slotValue(slot)} />
      <input type="hidden" name="venue" value={venue} />
      <input type="hidden" name="time" value={time} />
    </>
  )

  const form = (
    <form action={coordinateMatch} className="flex flex-wrap items-end gap-2 mt-2">
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="slot" value={slotValue(slot)} />
      <label className="flex flex-col gap-1 text-xs text-foreground/70 uppercase tracking-wider flex-1 min-w-48">
        Cancha
        <input
          name="venue"
          required
          maxLength={120}
          defaultValue={loaded?.venue}
          placeholder="Club, dirección"
          className="bg-brand-bg border border-brand-border rounded-sm px-2 py-1.5 text-sm text-foreground normal-case tracking-normal"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground/70 uppercase tracking-wider">
        Hora
        <select
          name="time"
          defaultValue={loaded?.time}
          className="bg-brand-bg border border-brand-border rounded-sm px-2 py-1.5 text-sm text-foreground"
        >
          {coordinationTimes(slot).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <SubmitButton
        pendingLabel="Guardando…"
        className="inline-flex items-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors font-display"
      >
        {loaded ? 'Mandar cambio' : 'Cargar'}
      </SubmitButton>
    </form>
  )

  if (toConfirm) {
    return (
      <div className="flex flex-col gap-2 p-3 border border-brand-lime/40 rounded-sm bg-brand-bg">
        <p className="text-sm text-foreground">
          Confirmá cancha y hora: {match.rival_team_name} cargó <span className="text-brand-lime">{loaded.venue}, {loaded.time}</span>
        </p>
        <div className="flex items-center gap-3">
          <form action={coordinateMatch}>
            {fields(loaded.venue, loaded.time)}
            <SubmitButton
              pendingLabel="Confirmando…"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold font-display uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors"
            >
              <Check className="w-4 h-4" /> Confirmar
            </SubmitButton>
          </form>
        </div>
        <details>
          <summary className="cursor-pointer text-sm text-foreground/70 hover:text-brand-lime">Corregir</summary>
          {form}
        </details>
      </div>
    )
  }

  return (
    <details>
      <summary className="cursor-pointer text-sm text-foreground/70 hover:text-brand-lime">
        {!loaded
          ? 'Cargar cancha y hora'
          : match.coordinated_at
            ? 'Cambiar cancha y hora'
            : `Esperando que ${match.rival_team_name} confirme · Cambiar`}
      </summary>
      {form}
    </details>
  )
}
