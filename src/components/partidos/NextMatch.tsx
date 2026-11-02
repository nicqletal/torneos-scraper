import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { TeamCrest } from '@/components/TeamCrest'
import { slotFromRange, slotLabel, slotTitle } from '@/utils/rival-search-form'
import { asksGoing, canCoordinate, goingNote, timeLabel } from '@/utils/match-display'
import { whatsappLink } from '@/utils/whatsapp'
import { MapLink, type MatchRowData } from './MatchRow'
import { Coordination, DropMenu, GoingPrompt, MutualDropAnswer } from './MatchActions'

// El próximo partido, arriba y en tres líneas: cuándo, contra quién, y dónde
// (o que falta la cancha). Una sola acción visible a la vez: "¿Van?" desde
// 24 h antes, si no la cancha y hora. El WhatsApp del capitán rival es el
// ícono de arriba a la derecha; tirar el partido queda detrás de "⋯".
export function NextMatch({ match, whatsapp, today, now, showTeam }: { match: MatchRowData; whatsapp: string | null; today: string; now: Date; showTeam: boolean }) {
  const slot = slotFromRange(match.range)
  const note = goingNote(match, now)
  const confirmed = match.going_at !== null && match.rival_going_at !== null
  const venue = match.venue && match.venue_start_at ? `${match.venue}, ${timeLabel(match.venue_start_at)}` : null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
        Próximo partido{showTeam && <> · {match.team_name}</>}
      </h2>
      <div className="flex flex-col gap-4 p-5 border-l-4 border-l-brand-lime border border-brand-border bg-brand-surface rounded-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl uppercase tracking-wider text-brand-lime leading-none">{slotTitle(slot, today)}</p>
          <p className="font-display text-3xl sm:text-5xl tracking-wider uppercase leading-none text-foreground mt-2">
            vs{' '}
            <Link href={`/equipos/${match.rival_team_id}`} className="hover:text-brand-lime">
              {match.rival_team_name}
            </Link>
          </p>
          <p className="text-sm mt-2">
            {venue ? (
              <span className="text-foreground">
                {venue} <MapLink venue={match.venue!} />
                {confirmed && <span className="text-brand-lime"> · Confirmado</span>}
                {!confirmed && !match.coordinated_at && <span className="text-foreground/60"> · a confirmar</span>}
              </span>
            ) : (
              <span className="text-foreground/60">Falta cancha y hora</span>
            )}
            {note && <span className="text-brand-red"> · {note}</span>}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp, `Hola, somos ${match.team_name}. Arreglemos cancha y hora para el partido del ${slotLabel(slot)}.`)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp del capitán rival"
              title="WhatsApp del capitán rival"
              className="ui-action press w-11 justify-center rounded-sm border border-brand-border bg-brand-secondary text-brand-lime hover:border-brand-lime"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          )}
          <div className="hidden sm:block">
            <TeamCrest name={match.rival_team_name} src={match.rival_crest_url} />
          </div>
        </div>
      </div>
      {asksGoing(match) ? <GoingPrompt match={match} now={now} /> : <MutualDropAnswer match={match} now={now} />}
      {canCoordinate(match, now) && <Coordination match={match} />}
      <DropMenu match={match} now={now} />
      </div>
    </section>
  )
}
