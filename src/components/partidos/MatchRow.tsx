import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { TeamCrest } from '@/components/TeamCrest'
import { dayLabel, dayName, slotFromRange } from '@/utils/rival-search-form'
import {
  asksGoing,
  canCoordinate,
  goingNote,
  mapsLink,
  matchRowDetail,
  mutualDropNote,
  ownOutcome,
  resultDeadlineNote,
  resultDetail,
  type MatchTone,
} from '@/utils/match-display'
import { Coordination, DropMenu, GoingPrompt, MutualDropAnswer, Rating, ResultActions, type MatchActionRow } from './MatchActions'

export type MatchRowData = MatchActionRow & {
  team_id: string
  rival_team_id: string
  rival_crest_url: string | null
}

const TONE: Record<MatchTone, string> = {
  lime: 'border-brand-lime/50 text-brand-lime',
  muted: 'border-foreground/20 text-foreground/60',
  red: 'border-brand-red/50 text-brand-red',
}

// El día de un partido como bloque: "SÁB" arriba y el número grande, o "HOY".
// Es lo primero que se lee en la fila, porque es lo primero que importa.
export function DateBlock({ date, today, size = 'md' }: { date: string; today: string; size?: 'md' | 'lg' }) {
  const name = dayName(date, today)
  const special = name === 'Hoy' || name === 'Mañana'
  const number = date.slice(-2).replace(/^0/, '')
  const weekday = special ? name : name.split(' ')[0]
  return (
    <div className={`shrink-0 flex flex-col items-center justify-center rounded-sm border ${special ? 'border-brand-lime text-brand-lime' : 'border-brand-border text-foreground'} ${size === 'lg' ? 'w-20 h-20' : 'w-14 h-14'}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider leading-none">{weekday}</span>
      <span className={`font-display leading-none mt-1 ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>{number}</span>
    </div>
  )
}

export function Pill({ text, tone }: { text: string; tone: MatchTone }) {
  return <span className={`shrink-0 px-2 py-1 text-xs font-semibold uppercase tracking-wider border rounded-sm ${TONE[tone]}`}>{text}</span>
}

export function MapLink({ venue }: { venue: string }) {
  return (
    <a href={mapsLink(venue)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-lime hover:underline underline-offset-4">
      <MapPin className="w-3.5 h-3.5" /> Mapa
    </a>
  )
}

// Un partido por jugarse o esperando resultado: el día, el rival y el dato
// del momento, y abajo lo que haya que hacer, abierto. `showTeam` nombra el
// equipo propio solo cuando el usuario está en más de uno.
export function MatchRow({ match, today, now, showTeam, withGoing = true }: { match: MatchRowData; today: string; now: Date; showTeam: boolean; withGoing?: boolean }) {
  const slot = slotFromRange(match.range)
  const waiting = match.phase === 'esperando_resultado'
  const note = goingNote(match, now)
  const mutualNote = mutualDropNote(match)
  const deadlineNote = resultDeadlineNote(match)
  // "Falta cargar el resultado" sobra cuando el formulario está justo abajo.
  const rawDetail = waiting ? resultDetail(match) : matchRowDetail(match)
  const detail = rawDetail === 'Falta cargar el resultado' && match.is_captain ? null : rawDetail
  const needsVenue = !waiting && !match.venue

  return (
    <li className="flex flex-col gap-4 p-4 border border-brand-border bg-brand-surface rounded-sm">
      <div className="flex items-start gap-4">
        <DateBlock date={slot.date} today={today} />
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <p className="text-foreground/60 text-sm">
            {slot.from} a {slot.to} h{showTeam && <> · {match.team_name}</>}
          </p>
          <p className="font-display text-2xl tracking-wider uppercase leading-tight text-foreground">
            vs{' '}
            <Link href={`/equipos/${match.rival_team_id}`} className="hover:text-brand-lime">
              {match.rival_team_name}
            </Link>
          </p>
          {(detail || (!waiting && match.venue)) && <p className={`text-sm ${needsVenue ? 'text-foreground/60' : 'text-foreground'}`}>
            {detail}
            {!waiting && match.venue && (
              <>
                {' '}
                <MapLink venue={match.venue} />
              </>
            )}
          </p>}
          {deadlineNote && <p className="text-xs text-foreground/50">{deadlineNote}</p>}
          {note && <p className="text-sm text-brand-red">{note}</p>}
          {mutualNote && <p className="text-sm text-foreground/60">{mutualNote}</p>}
        </div>
        <div className="hidden sm:block">
          <TeamCrest name={match.rival_team_name} src={match.rival_crest_url} />
        </div>
      </div>

      {withGoing && asksGoing(match) && <GoingPrompt match={match} now={now} />}
      <MutualDropAnswer match={match} now={now} />
      {canCoordinate(match, now) && <Coordination match={match} />}
      <ResultActions match={match} />
      <DropMenu match={match} now={now} />
    </li>
  )
}

// Un partido cerrado, en una línea: el día, el rival y cómo terminó. El
// detalle (quién lo tiró, las dos versiones) vive en la página del equipo.
export function HistoryRow({ match, now, showTeam }: { match: MatchRowData; now: Date; showTeam: boolean }) {
  const slot = slotFromRange(match.range)
  const outcome = ownOutcome(match)
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="w-14 shrink-0 text-sm text-foreground/60">{dayLabel(slot.date)}</span>
        <p className="min-w-0 flex-1 font-display text-lg tracking-wider uppercase leading-tight text-foreground truncate">
          <Link href={`/equipos/${match.rival_team_id}`} className="hover:text-brand-lime">
            {match.rival_team_name}
          </Link>
          {showTeam && <span className="text-foreground/50 text-sm font-sans tracking-normal normal-case"> · {match.team_name}</span>}
        </p>
        <Pill text={outcome.text} tone={outcome.tone} />
      </div>
      <Rating match={match} now={now} />
    </li>
  )
}
