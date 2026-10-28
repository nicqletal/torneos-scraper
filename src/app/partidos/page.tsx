import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, Check, Search, X } from 'lucide-react'
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
import { declineProposal, saveRivalSearch, sendProposal } from './actions'

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
  const received = proposals.filter((p) => p.status === 'pendiente' && captainTeamIds.has(p.to_team_id))
  const teamParam = param(searchParams.equipo)
  const modalityParam = param(searchParams.modalidad)

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-8">
      <div className="border-b border-brand-border pb-6">
        <h1 className="text-4xl md:text-5xl font-display tracking-wider text-foreground uppercase leading-none">Partidos</h1>
        <p className="text-foreground/70 text-sm mt-2">Los partidos de tus equipos y la búsqueda de rival.</p>
      </div>

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
                        Para {p.to_team_name} · vence el {noticeDate(p.expires_at)}
                      </p>
                    </div>
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
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="text-2xl font-display tracking-wider uppercase text-foreground">Tus partidos</h2>
          <p className="p-6 border border-brand-border bg-brand-surface rounded-sm text-foreground/70 text-sm">
            Todavía no hay partidos. Cuando un capitán acuerde uno, va a aparecer acá.
          </p>
        </section>

        {captainTeams.length > 0 && (
          <RivalSearchPanel
            supabase={supabase}
            teams={captainTeams}
            proposals={proposals}
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
  teamParam,
  modalityParam,
  error,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  teams: CaptainRow['teams'][]
  proposals: ProposalRow[]
  teamParam?: string
  modalityParam?: string
  error?: string
}) {
  const team = teams.find((t) => t.id === teamParam) ?? teams[0]
  // La modalidad viene completada con la habitual del equipo y se puede cambiar.
  const modality = isSportModality(modalityParam) ? modalityParam : team.modality
  const now = new Date()
  const today = buenosAiresToday(now)

  // Que la búsqueda esté activa lo calcula la base, igual que en la RPC.
  const { data: searchId } = await supabase.rpc('active_rival_search', {
    p_team_id: team.id,
    p_modality: modality,
    p_now: now.toISOString(),
  })

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

      {searchId && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-foreground/70 uppercase tracking-wider">
            Tu búsqueda de {modalityLabel(modality)}
          </span>
          <ul className="flex flex-col divide-y divide-brand-border border border-brand-border rounded-sm">
            {slots.map((slot) => (
              <li key={slotValue(slot)} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-foreground">{slotLabel(slot)}</span>
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
