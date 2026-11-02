import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check, Plus, Users, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamCrest } from '@/components/TeamCrest'
import { SubmitButton } from '@/components/SubmitButton'
import { SPORT_MODALITIES, isSportModality, modalityLabel, type SportModality } from '@/utils/modality'
import { levelLabel } from '@/utils/teams'
import { SEARCH_DAYS, SHIFTS, addDays, buenosAiresToday, isUpcoming, slotFromRange, slotTitle, slotValue, type Slot } from '@/utils/rival-search-form'
import { noticeDate } from '@/utils/notices'
import { proposalStatusLabel, type ProposalStatus } from '@/utils/proposals'
import { isOccupied } from '@/utils/match-display'
import { PartidosTabs } from '@/components/partidos/PartidosTabs'
import { SlotPicker } from '@/components/partidos/SlotPicker'
import { DateBlock } from '@/components/partidos/MatchRow'
import { alert, card, chip, chipOff, chipOn, eyebrow, primaryButton, quietDangerLink, quietLink, secondaryButton } from '@/components/partidos/styles'
import { declineProposal, saveRivalSearch, sendProposal } from '../actions'

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

interface SentProposal {
  id: string
  from_slot_id: string
  to_slot_id: string
  status: ProposalStatus
}

// El turno de una franja, si coincide con uno ("Noche"); si no, "Otro horario".
function shiftLabel(slot: Slot): string {
  return SHIFTS.find((s) => s.from === slot.from && s.to === slot.to)?.label ?? 'Otro horario'
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

// Buscar rival, en tres pasos y una sola columna: el equipo y la modalidad,
// cuándo pueden jugar, y los rivales compatibles con "Proponer partido". Solo
// la opera el capitán. Las reglas están en "Búsqueda de rival" de
// docs/decisiones-casos-de-uso.md; la base las valida de nuevo.
export default async function BuscarRivalPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos/buscar')

  const { data } = await supabase
    .from('team_members')
    .select('teams!inner(id, name, modality)')
    .eq('user_id', user.id)
    .eq('is_captain', true)
    .is('teams.dissolved_at', null)
    .order('joined_at', { ascending: true })
  const teams = ((data ?? []) as unknown as CaptainRow[]).map((row) => row.teams)

  const header = (
    <header className="flex flex-col gap-5">
      <h1 className="hidden sm:block text-5xl font-display tracking-wider text-foreground uppercase leading-none">Buscar rival</h1>
      <PartidosTabs current="buscar" />
    </header>
  )

  if (teams.length === 0) {
    return (
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-8">
        {header}
        <section className={`${card} p-8 sm:p-12 text-center flex flex-col items-center gap-4`}>
          <Users className="w-10 h-10 text-brand-lime" />
          <h2 className="text-2xl font-display tracking-wider text-foreground uppercase">Buscar rival es cosa del capitán</h2>
          <p className="text-foreground/70 max-w-sm">Si capitaneás un equipo, publicás cuándo pueden jugar y te mostramos rivales de tu zona.</p>
          <Link href="/mis-equipos" className={secondaryButton}>
            Mis equipos
          </Link>
        </section>
      </div>
    )
  }

  const teamParam = param(searchParams.equipo)
  const modalityParam = param(searchParams.modalidad)
  const team = teams.find((t) => t.id === teamParam) ?? teams[0]
  // La modalidad viene completada con la habitual del equipo y se puede cambiar.
  const modality = isSportModality(modalityParam) ? modalityParam : team.modality
  const now = new Date()
  const today = buenosAiresToday(now)
  const error = param(searchParams.error)

  // Que la búsqueda esté activa y que el equipo esté bloqueado por faltas lo
  // calcula la base, igual que en las RPC.
  const [{ data: searchId }, { data: blockedUntil }, { data: matchRows }, { data: proposalRows }] = await Promise.all([
    supabase.rpc('active_rival_search', { p_team_id: team.id, p_modality: modality, p_now: now.toISOString() }),
    supabase.rpc('team_blocked_until', { p_team_id: team.id, p_now: now.toISOString() }),
    supabase.from('match_details').select('range').eq('team_id', team.id).eq('phase', 'por_jugarse'),
    supabase.from('proposal_details').select('id, from_slot_id, to_slot_id, status').eq('from_team_id', team.id).order('created_at', { ascending: false }),
  ])
  const proposals = (proposalRows ?? []) as SentProposal[]
  const matchSlots = (matchRows ?? []).map((m) => slotFromRange(m.range as string))

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

  const hrefFor = (teamId: string, mod: string) => `/partidos/buscar?equipo=${teamId}&modalidad=${mod}`
  const days = Array.from({ length: SEARCH_DAYS }, (_, i) => addDays(today.date, i))
  const hiddenFields = (
    <>
      <input type="hidden" name="team_id" value={team.id} />
      <input type="hidden" name="modality" value={modality} />
    </>
  )

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-8">
      {header}

      {/* Paso 1: el equipo (solo si capitanea más de uno) y la modalidad. En
          el celular va plegado en una línea: lo normal es no cambiarlo. */}
      {(() => {
        const chips = (
          <div className="flex flex-col gap-4">
            {teams.length > 1 && (
              <div className="flex flex-col gap-2">
                <span className={eyebrow}>Equipo</span>
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <Link key={t.id} href={hrefFor(t.id, t.modality)} className={`${chip} ${t.id === team.id ? chipOn : chipOff}`}>
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className={eyebrow}>{teams.length > 1 ? 'Modalidad' : `${team.name} · Modalidad`}</span>
              <div className="flex flex-wrap gap-2">
                {SPORT_MODALITIES.map((m) => (
                  <Link key={m.value} href={hrefFor(team.id, m.value)} className={`${chip} ${m.value === modality ? chipOn : chipOff}`}>
                    {m.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
        return (
          <>
            <details className={`${card} sm:hidden`}>
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-foreground">
                <span className="truncate">
                  <span className="font-semibold">{team.name}</span> · {modalityLabel(modality)}
                </span>
                <span className={`${quietLink} shrink-0 text-sm`}>Cambiar</span>
              </summary>
              <div className="mt-4">{chips}</div>
            </details>
            <section className={`${card} hidden sm:block`}>{chips}</section>
          </>
        )
      })()}

      {/* Paso 2: cuándo pueden jugar. */}
      <section className={`${card} flex flex-col gap-5`}>
        {error && (
          <p role="alert" className={alert}>
            {error}
          </p>
        )}

        {blockedUntil ? (
          <p role="alert" className={alert}>
            {team.name} está bloqueado por faltas hasta el {noticeDate(blockedUntil)}: 3 faltas en 90 días. Hasta entonces no puede publicar búsquedas. Los partidos ya
            acordados siguen en pie.
          </p>
        ) : (
          <>
            {searchId ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-3 font-display text-3xl uppercase tracking-wider text-foreground leading-none">
                    <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-brand-lime animate-pulse" />
                    Buscando rival
                  </h2>
                  <span className={eyebrow}>{modalityLabel(modality)}</span>
                </div>
                <p className="text-foreground/70">Pueden jugar en estos horarios. Abajo aparece quién puede en alguno de ellos.</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {slots.map((slot) => {
                    const occupied = isOccupied(slot, matchSlots)
                    return (
                      <li key={slotValue(slot)} className={`flex items-center gap-3 p-2 pr-1 rounded-sm border bg-brand-bg ${occupied ? 'border-brand-border' : 'border-brand-lime/50'}`}>
                        <DateBlock date={slot.date} today={today.date} />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-2xl leading-none text-foreground">
                            {slot.from} a {slot.to} h
                          </p>
                          <p className="text-sm text-foreground/60 mt-1">{occupied ? 'Ya tienen partido a esa hora' : shiftLabel(slot)}</p>
                        </div>
                        {/* Sacar una franja guarda todas las demás. Sacar la última cancela la búsqueda. */}
                        <form action={saveRivalSearch}>
                          {hiddenFields}
                          {slots
                            .filter((other) => other !== slot)
                            .map((other) => (
                              <input key={slotValue(other)} type="hidden" name="slot" value={slotValue(other)} />
                            ))}
                          <SubmitButton pendingLabel="…" className="ui-action w-11 justify-center text-foreground/50 hover:text-brand-red">
                            <X className="w-5 h-5" />
                            <span className="sr-only">Sacar {slotTitle(slot, today.date)}</span>
                          </SubmitButton>
                        </form>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-3xl uppercase tracking-wider text-foreground leading-none">¿Cuándo pueden jugar?</h2>
              </div>
            )}

            {(() => {
              const form = (
                <form action={saveRivalSearch} className="flex flex-col gap-5">
                  {hiddenFields}
                  {slots.map((slot) => (
                    <input key={slotValue(slot)} type="hidden" name="slot" value={slotValue(slot)} />
                  ))}
                  <SlotPicker days={days} today={today.date} nowHour={today.hour} />
                  <SubmitButton pendingLabel="Guardando…" className={`${primaryButton} w-full sm:w-auto sm:self-start`}>
                    {searchId ? 'Agregar horario' : 'Publicar búsqueda'}
                  </SubmitButton>
                </form>
              )
              // Con una búsqueda activa, el formulario va plegado detrás del
              // botón "Agregar otro horario"; sin búsqueda, es la pantalla.
              return searchId ? (
                <details className="group">
                  <summary className={`${secondaryButton} cursor-pointer list-none w-full sm:w-auto [details[open]>&]:!hidden`}>
                    <Plus className="w-5 h-5" /> Agregar otro horario
                  </summary>
                  <div className="flex flex-col gap-4 pt-4 border-t border-brand-border">
                    <h3 className={eyebrow}>Otro horario</h3>
                    {form}
                  </div>
                </details>
              ) : (
                form
              )
            })()}

            {searchId && (
              <form action={saveRivalSearch} className="self-start">
                {hiddenFields}
                <SubmitButton pendingLabel="Cancelando…" className={`${quietDangerLink} text-sm`}>
                  Cancelar la búsqueda
                </SubmitButton>
              </form>
            )}
          </>
        )}
      </section>

      {/* Paso 3: los rivales compatibles, uno por franja en común. */}
      {searchId && (
        <section className="flex flex-col gap-3">
          <h2 className={eyebrow}>Rivales compatibles</h2>
          {compatibles.length === 0 ? (
            <div className={`${card} flex flex-col items-center text-center gap-2 py-8`}>
              <Users className="w-8 h-8 text-foreground/40" />
              <p className="font-display text-2xl uppercase tracking-wider text-foreground leading-none">Todavía nadie</p>
              <p className="text-foreground/70 max-w-sm">Ningún equipo de la zona publicó esos horarios. Con más horarios, más chances de partido.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {compatibles.map((c) => {
                // Las propuestas que este equipo le mandó por este par de
                // franjas, la más nueva primero.
                const sent = proposals.filter((p) => p.from_slot_id === c.slot_id && p.to_slot_id === c.rival_slot_id)
                const pending = sent.find((p) => p.status === 'pendiente')
                const lastNote = !pending && sent.length > 0 ? proposalStatusLabel(sent[0].status) : null
                const common = slotFromRange(c.common_range)
                return (
                  <li key={`${c.slot_id}-${c.rival_slot_id}`} className={`${card} flex flex-col gap-4`}>
                    <div className="flex items-center gap-4">
                      <TeamCrest name={c.team_name} src={c.crest_url} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/equipos/${c.team_id}`} className="font-display text-2xl tracking-wider uppercase leading-none text-foreground hover:text-brand-lime block truncate">
                          {c.team_name}
                        </Link>
                        <p className="text-sm text-foreground/60 mt-1">
                          {c.zone_name} · {levelLabel(c.level)}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-brand-lime">
                      {slotTitle(common, today.date)} <span className="font-normal text-foreground/60">en común</span>
                    </p>
                    {pending ? (
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-2 font-semibold text-brand-lime">
                          <Check className="w-5 h-5 stroke-[3]" /> Propuesta enviada
                        </span>
                        <form action={declineProposal}>
                          {hiddenFields}
                          <input type="hidden" name="proposal_id" value={pending.id} />
                          <SubmitButton pendingLabel="Cancelando…" className={quietDangerLink}>
                            Cancelar
                          </SubmitButton>
                        </form>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {lastNote && <p className="text-sm text-foreground/60">{lastNote}</p>}
                        <form action={sendProposal}>
                          {hiddenFields}
                          <input type="hidden" name="slot_id" value={c.slot_id} />
                          <input type="hidden" name="rival_slot_id" value={c.rival_slot_id} />
                          <SubmitButton pendingLabel="Mandando…" className={`${primaryButton} w-full sm:w-auto`}>
                            Proponer partido
                          </SubmitButton>
                        </form>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
