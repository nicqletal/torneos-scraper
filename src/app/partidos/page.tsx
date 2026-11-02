import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check, Search, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TeamCrest } from '@/components/TeamCrest'
import { SubmitButton } from '@/components/SubmitButton'
import { buenosAiresToday, slotFromRange, slotTitle } from '@/utils/rival-search-form'
import { noticeDate } from '@/utils/notices'
import { proposalStatusLabel, type ProposalStatus } from '@/utils/proposals'
import { isClosed, nextMatch, sortByStart } from '@/utils/match-display'
import { PartidosTabs } from '@/components/partidos/PartidosTabs'
import { NextMatch } from '@/components/partidos/NextMatch'
import { HistoryRow, MatchRow, type MatchRowData } from '@/components/partidos/MatchRow'
import { alert, card, cardHighlight, eyebrow, primaryButton, secondaryButton } from '@/components/partidos/styles'
import { acceptProposal, declineProposal } from './actions'

// Una fila de la vista `proposal_details`: por RLS, solo las de los equipos
// que capitanea el usuario, mandadas o recibidas.
interface ProposalRow {
  id: string
  range: string
  from_team_id: string
  from_team_name: string
  from_crest_url: string | null
  to_team_id: string
  to_team_name: string
  status: ProposalStatus
  expires_at: string
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

// Lo que tenés: el próximo partido en grande, lo que te piden responder, los
// otros partidos por jugarse y el historial. Lo que querés (un rival) vive en
// /partidos/buscar. Ver "Pantalla de Partidos" en docs/decisiones-casos-de-uso.md.
export default async function PartidosPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const now = new Date()
  const today = buenosAiresToday(now).date

  // Las propuestas recibidas pendientes las ve solo el capitán (la vista ya
  // filtra por RLS). Las que un bloqueo por faltas canceló se muestran sin
  // botones mientras no vencen: es la única forma de que el rival se entere.
  const { data: proposalRows } = await supabase
    .from('proposal_details')
    .select('id, range, from_team_id, from_team_name, from_crest_url, to_team_id, to_team_name, status, expires_at')
    .order('created_at', { ascending: false })
  const { data: captainRows } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).eq('is_captain', true)
  const captainTeamIds = new Set((captainRows ?? []).map((r) => r.team_id as string))
  const received = ((proposalRows ?? []) as ProposalRow[]).filter(
    (p) => captainTeamIds.has(p.to_team_id) && (p.status === 'pendiente' || (p.status === 'equipo_bloqueado' && new Date(p.expires_at) > now))
  )

  // Los partidos los ve todo el plantel, capitán o no.
  const { data: matchRows } = await supabase
    .from('match_details')
    .select(
      'id, range, start_at, phase, team_id, team_name, is_captain, rival_team_id, rival_team_name, rival_crest_url, venue, venue_start_at, venue_by_own, coordinated_at, going_at, rival_going_at, deadline, drop_reason, dropped_by_own, drop_mutual, drop_fault, mutual_drop_reason, mutual_drop_by_own, mutual_drop_answered_at, mutual_drop_accepted, goals_for, goals_against, rival_goals_for, rival_goals_against, no_show_at, rival_no_show_at, went_at, rival_went_at, score_for, score_against, rating_deadline, rated_by_own, received_stars'
    )
  const matches = sortByStart((matchRows ?? []) as MatchRowData[])
  const next = nextMatch(matches)
  const upcoming = matches.filter((m) => m.phase === 'por_jugarse' && m.id !== next?.id)
  const waiting = matches.filter((m) => m.phase === 'esperando_resultado')
  const history = matches.filter((m) => isClosed(m.phase)).reverse()
  // El nombre del equipo propio solo cuando hay más de uno: si no, es ruido.
  const showTeam = new Set(matches.map((m) => m.team_id)).size > 1
  const matchError = param(searchParams.error_partido)

  // El WhatsApp del capitán rival solo se le da al capitán: la función
  // devuelve null a cualquier otro.
  let rivalWhatsapp: string | null = null
  if (next?.is_captain) {
    const { data } = await supabase.rpc('rival_captain_whatsapp', { p_match_id: next.id })
    rivalWhatsapp = data
  }

  const empty = matches.length === 0 && received.length === 0

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <h1 className="text-4xl md:text-5xl font-display tracking-wider text-foreground uppercase leading-none">Partidos</h1>
        <PartidosTabs current="partidos" />
      </header>

      {matchError && (
        <p role="alert" className={alert}>
          {matchError}
        </p>
      )}

      {empty && (
        <section className={`${card} p-8 sm:p-12 text-center flex flex-col items-center gap-4`}>
          <Search className="w-10 h-10 text-brand-lime" />
          <h2 className="text-2xl font-display tracking-wider text-foreground uppercase">Todavía no hay partidos</h2>
          <p className="text-foreground/70 max-w-sm">
            {captainTeamIds.size > 0
              ? 'Publicá cuándo pueden jugar y te mostramos rivales de tu zona.'
              : 'Cuando tu equipo acuerde un partido, va a aparecer acá. Si todavía no tenés equipo, creá uno o pedí el link de invitación.'}
          </p>
          {captainTeamIds.size > 0 ? (
            <Link href="/partidos/buscar" className={primaryButton}>
              <Search className="w-5 h-5" /> Buscar rival
            </Link>
          ) : (
            <Link href="/mis-equipos" className={secondaryButton}>
              Mis equipos
            </Link>
          )}
        </section>
      )}

      {received.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={eyebrow}>Te proponen jugar</h2>
          <ul className="flex flex-col gap-3">
            {received.map((p) => (
              <li key={p.id} className={`${cardHighlight} flex flex-col gap-4`}>
                <div className="flex items-center gap-4">
                  <TeamCrest name={p.from_team_name} src={p.from_crest_url} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-2xl tracking-wider uppercase leading-none text-foreground">
                      <Link href={`/equipos/${p.from_team_id}`} className="hover:text-brand-lime">
                        {p.from_team_name}
                      </Link>
                    </p>
                    <p className="text-foreground mt-1">
                      te propone jugar <span className="text-brand-lime font-semibold">{slotTitle(slotFromRange(p.range), today)}</span>
                      {showTeam && <span className="text-foreground/60"> · con {p.to_team_name}</span>}
                    </p>
                    <p className="text-sm text-foreground/60 mt-1">
                      {p.status === 'pendiente' ? `Vence el ${noticeDate(p.expires_at)}` : proposalStatusLabel(p.status)}
                    </p>
                  </div>
                </div>
                {p.status === 'pendiente' && (
                  <div className="flex gap-3">
                    <form action={acceptProposal} className="flex-1 sm:flex-none">
                      <input type="hidden" name="proposal_id" value={p.id} />
                      <SubmitButton pendingLabel="Aceptando…" className={`${primaryButton} w-full`}>
                        <Check className="w-5 h-5 stroke-[3]" /> Aceptar
                      </SubmitButton>
                    </form>
                    <form action={declineProposal} className="flex-1 sm:flex-none">
                      <input type="hidden" name="proposal_id" value={p.id} />
                      <SubmitButton pendingLabel="Rechazando…" className={`${secondaryButton} w-full`}>
                        <X className="w-4 h-4" /> Rechazar
                      </SubmitButton>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {next && <NextMatch match={next} whatsapp={rivalWhatsapp} today={today} now={now} showTeam={showTeam} />}

      {waiting.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={eyebrow}>Esperando resultado</h2>
          <ul className="flex flex-col gap-3">
            {waiting.map((m) => (
              <MatchRow key={m.id} match={m} today={today} now={now} showTeam={showTeam} />
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={eyebrow}>Más adelante</h2>
          <ul className="flex flex-col gap-3">
            {upcoming.map((m) => (
              <MatchRow key={m.id} match={m} today={today} now={now} showTeam={showTeam} />
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={eyebrow}>Historial</h2>
          <ul className="flex flex-col divide-y divide-brand-border border border-brand-border bg-brand-surface rounded-sm">
            {history.map((m) => (
              <HistoryRow key={m.id} match={m} today={today} now={now} showTeam={showTeam} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
