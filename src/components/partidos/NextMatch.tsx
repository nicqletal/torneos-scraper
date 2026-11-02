import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { TeamCrest } from '@/components/TeamCrest'
import { slotFromRange, slotLabel } from '@/utils/rival-search-form'
import { asksGoing, canCoordinate, goingNote, matchRowDetail } from '@/utils/match-display'
import { whatsappLink } from '@/utils/whatsapp'
import { DateBlock, MapLink, type MatchRowData } from './MatchRow'
import { Coordination, DropMenu, GoingPrompt, MutualDropAnswer } from './MatchActions'
import { secondaryButton } from './styles'

// El próximo partido, arriba y en grande: el día, el rival, dónde y a qué
// hora, y el WhatsApp del capitán rival (solo al capitán). Desde 24 h antes,
// "¿Van?" acá mismo, y lo demás del partido (cancha y hora, tirarlo) también:
// es su única fila, no se repite en la lista.
export function NextMatch({ match, whatsapp, today, now, showTeam }: { match: MatchRowData; whatsapp: string | null; today: string; now: Date; showTeam: boolean }) {
  const slot = slotFromRange(match.range)
  const note = goingNote(match, now)
  const confirmed = match.going_at !== null && match.rival_going_at !== null
  // El WhatsApp del capitán rival va junto a cancha y hora: es para arreglarlas.
  const whatsappButton = whatsapp ? (
    <a
      href={whatsappLink(whatsapp, `Hola, somos ${match.team_name}. Arreglemos cancha y hora para el partido del ${slotLabel(slot)}.`)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${secondaryButton} w-full sm:w-auto sm:self-start`}
    >
      <MessageCircle className="w-5 h-5" /> WhatsApp del capitán rival
    </a>
  ) : null
  return (
    <section className="flex flex-col gap-5 p-5 sm:p-6 border-l-4 border-l-brand-lime border border-brand-border bg-brand-surface rounded-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-brand-lime">Próximo partido{showTeam && <span className="text-foreground/60"> · {match.team_name}</span>}</span>
        {confirmed && <span className="text-xs font-semibold uppercase tracking-wider text-brand-lime border border-brand-lime/50 px-2 py-1 rounded-sm">Confirmado</span>}
      </div>
      <div className="flex items-center gap-4">
        <DateBlock date={slot.date} today={today} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl sm:text-5xl tracking-wider uppercase leading-none text-foreground">
            vs{' '}
            <Link href={`/equipos/${match.rival_team_id}`} className="hover:text-brand-lime">
              {match.rival_team_name}
            </Link>
          </p>
          <p className="text-foreground mt-2">
            {slot.from} a {slot.to} h
            {match.venue && match.venue_start_at ? (
              <>
                {' '}
                · {matchRowDetail(match).replace(/^(Confirmado · |Coordinado · )/, '')} <MapLink venue={match.venue} />
              </>
            ) : (
              <span className="text-foreground/60"> · Falta cancha y hora</span>
            )}
          </p>
          {note && <p className="text-sm text-brand-red mt-1">{note}</p>}
        </div>
        <div className="hidden sm:block">
          <TeamCrest name={match.rival_team_name} src={match.rival_crest_url} size="lg" />
        </div>
      </div>
      {asksGoing(match) && <GoingPrompt match={match} now={now} />}
      <MutualDropAnswer match={match} now={now} />
      {canCoordinate(match, now) ? <Coordination match={match} whatsapp={whatsappButton} /> : whatsappButton}
      <DropMenu match={match} now={now} />
    </section>
  )
}
