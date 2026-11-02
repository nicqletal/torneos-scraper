import { Check, MoreHorizontal, Star, X } from 'lucide-react'
import { SubmitButton } from '@/components/SubmitButton'
import { slotFromRange, slotValue } from '@/utils/rival-search-form'
import { coordinationTimes } from '@/utils/match-forms'
import {
  dropMenu,
  mutualDropToAnswer,
  ratingRow,
  resultActions,
  starsLabel,
  timeLabel,
  type MatchCoordination,
  type MatchDrop,
  type MatchRating,
  type MatchResult,
} from '@/utils/match-display'
import {
  answerMutualDrop,
  confirmGoing,
  coordinateMatch,
  dropMatch,
  rateRival,
  replyWent,
  reportNoShow,
  reportResult,
  requestMutualDrop,
} from '@/app/partidos/actions'
import { dangerButton, input, primaryButton, quietDangerLink, quietLink, secondaryButton } from './styles'

// Las acciones de un partido, cada una en su momento (ver "Pantalla de
// Partidos" en docs/decisiones-casos-de-uso.md). Todas son formularios con
// Server Actions; la base valida de nuevo cada regla. Lo que pide una
// respuesta va abierto, con un solo botón primario; lo que no, plegado.

export type MatchActionRow = MatchCoordination & MatchDrop & MatchResult & MatchRating & { id: string; range: string; venue_by_own: boolean | null }

// Lo que se le pide al capitán, abierto dentro de la fila.
function Ask({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 p-4 border border-brand-lime/50 bg-brand-bg rounded-sm">{children}</div>
}

// "¿Van?": desde 24 h antes, al capitán que todavía no dijo "Vamos". "No
// vamos" abre el formulario de tirar el partido, con el aviso de la falta.
export function GoingPrompt({ match, now }: { match: MatchActionRow; now: Date }) {
  const menu = dropMenu(match, now)
  return (
    <Ask>
      <p className="font-display text-2xl uppercase tracking-wider text-foreground">¿Van?</p>
      <div className="flex flex-wrap items-center gap-3">
        <form action={confirmGoing}>
          <input type="hidden" name="match_id" value={match.id} />
          <SubmitButton pendingLabel="Confirmando…" className={primaryButton}>
            <Check className="w-5 h-5 stroke-[3]" /> Vamos
          </SubmitButton>
        </form>
        {menu && (
          <details className="group">
            <summary className={`${secondaryButton} list-none cursor-pointer`}>
              <X className="w-4 h-4" /> No vamos
            </summary>
            <DropForm match={match} menu={menu} />
          </details>
        )}
      </div>
    </Ask>
  )
}

// Tirar el partido: motivo, el aviso de la falta y, con menos de 24 h, pedirlo
// de común acuerdo con el mismo motivo.
export function DropForm({ match, menu }: { match: MatchActionRow; menu: NonNullable<ReturnType<typeof dropMenu>> }) {
  return (
    <form action={dropMatch} className="flex flex-col gap-3 mt-3">
      <input type="hidden" name="match_id" value={match.id} />
      <label className="flex flex-col gap-1">
        ¿Por qué?
        <input name="reason" required maxLength={140} placeholder="Nos faltan dos" className={input} />
      </label>
      <p className="text-sm text-foreground/60">El motivo queda en el historial público del equipo.</p>
      {menu.withFault && <p className="text-sm font-semibold text-brand-red">Tirarlo ahora suma una falta a tu equipo.</p>}
      <div className="flex flex-wrap items-center gap-3">
        {menu.canAskMutual && (
          <SubmitButton formAction={requestMutualDrop} pendingLabel="Pidiendo…" className={primaryButton}>
            Pedir tirarlo de común acuerdo
          </SubmitButton>
        )}
        <SubmitButton pendingLabel="Tirando…" className={menu.canAskMutual ? dangerButton : primaryButton}>
          {menu.label}
        </SubmitButton>
      </div>
      {menu.canAskMutual && (
        <p className="text-sm text-foreground/60">De común acuerdo no suma falta, si el rival acepta antes de la hora de inicio.</p>
      )}
    </form>
  )
}

// El menú ⋯ de la fila, antes de la hora de inicio: tirar el partido. Se
// abre en dos pasos para que nadie lo tire sin querer.
export function DropMenu({ match, now }: { match: MatchActionRow; now: Date }) {
  const menu = dropMenu(match, now)
  if (!menu) return null
  return (
    <details className="self-start">
      <summary aria-label="Más acciones" className="ui-action cursor-pointer list-none text-foreground/50 hover:text-brand-red gap-1">
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-sm [details[open]>summary>&]:hidden">Más</span>
        <span className="text-sm hidden [details[open]>summary>&]:inline">{menu.label}</span>
      </summary>
      <DropForm match={match} menu={menu} />
    </details>
  )
}

// El pedido de común acuerdo del rival, para responder.
export function MutualDropAnswer({ match, now }: { match: MatchActionRow; now: Date }) {
  const reason = mutualDropToAnswer(match, now)
  if (!reason) return null
  return (
    <Ask>
      <p className="text-foreground">
        <span className="font-semibold">{match.rival_team_name}</span> pide tirar el partido de común acuerdo: <span className="text-brand-lime">&ldquo;{reason}&rdquo;</span>
      </p>
      <p className="text-sm text-foreground/60">Si aceptás, se cae sin falta para nadie. Si no respondés, sigue en pie.</p>
      <div className="flex flex-wrap items-center gap-3">
        <form action={answerMutualDrop}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="accept" value="true" />
          <SubmitButton pendingLabel="Aceptando…" className={primaryButton}>
            <Check className="w-5 h-5 stroke-[3]" /> Aceptar
          </SubmitButton>
        </form>
        <form action={answerMutualDrop}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="accept" value="false" />
          <SubmitButton pendingLabel="Rechazando…" className={secondaryButton}>
            <X className="w-4 h-4" /> Rechazar
          </SubmitButton>
        </form>
      </div>
    </Ask>
  )
}

// Cancha y hora: cargar, confirmar lo que cargó el rival, o cambiar.
export function Coordination({ match, whatsapp }: { match: MatchActionRow; whatsapp?: React.ReactNode }) {
  const slot = slotFromRange(match.range)
  const loaded = match.venue && match.venue_start_at ? { venue: match.venue, time: timeLabel(match.venue_start_at) } : null
  const toConfirm = loaded && !match.coordinated_at && !match.venue_by_own

  const form = (
    <form action={coordinateMatch} className="flex flex-wrap items-end gap-3 mt-3">
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="slot" value={slotValue(slot)} />
      <label className="flex flex-col gap-1 flex-1 min-w-52">
        Cancha
        <input name="venue" required maxLength={120} defaultValue={loaded?.venue} placeholder="Club, dirección" className={input} />
      </label>
      <label className="flex flex-col gap-1">
        Hora
        <select name="time" defaultValue={loaded?.time} className={input}>
          {coordinationTimes(slot).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton pendingLabel="Guardando…" className={primaryButton}>
        {loaded ? 'Mandar cambio' : 'Cargar'}
      </SubmitButton>
    </form>
  )

  if (toConfirm) {
    return (
      <Ask>
        <p className="text-foreground">
          <span className="font-semibold">{match.rival_team_name}</span> cargó cancha y hora:{' '}
          <span className="text-brand-lime">
            {loaded.venue}, {loaded.time}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <form action={coordinateMatch}>
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="slot" value={slotValue(slot)} />
            <input type="hidden" name="venue" value={loaded.venue} />
            <input type="hidden" name="time" value={loaded.time} />
            <SubmitButton pendingLabel="Confirmando…" className={primaryButton}>
              <Check className="w-5 h-5 stroke-[3]" /> Confirmar
            </SubmitButton>
          </form>
          <details className="w-full">
            <summary className={`${quietLink} cursor-pointer list-none`}>Corregir</summary>
            {form}
          </details>
        </div>
      </Ask>
    )
  }

  // Sin cancha, un botón que abre el formulario; con cancha, un link chico.
  return (
    <div className="flex flex-col gap-3">
      {whatsapp}
      <details>
        <summary className={`${loaded ? quietLink : secondaryButton} cursor-pointer list-none w-full sm:w-auto`}>
          {!loaded ? 'Cargar cancha y hora' : match.coordinated_at ? 'Cambiar cancha y hora' : `Esperando que ${match.rival_team_name} confirme · Cambiar`}
        </summary>
        {form}
      </details>
    </div>
  )
}

// Después de la hora de inicio: cargar o corregir el resultado, confirmar el
// del rival, o responder "fuimos". "No vinieron" es un link chico al lado.
export function ResultActions({ match }: { match: MatchActionRow }) {
  const actions = resultActions(match)
  if (!actions) return null

  const noShow = actions.noShow && (
    <form action={reportNoShow}>
      <input type="hidden" name="match_id" value={match.id} />
      <SubmitButton pendingLabel="Reportando…" className={quietDangerLink}>
        {actions.went ? 'Ellos tampoco vinieron' : 'No vinieron'}
      </SubmitButton>
    </form>
  )

  if (actions.went) {
    return (
      <Ask>
        <p className="text-foreground">
          <span className="font-semibold">{match.rival_team_name}</span> dice que no fueron.
        </p>
        <p className="text-sm text-foreground/60">Si respondés &ldquo;fuimos&rdquo;, el partido queda en conflicto, sin falta para nadie.</p>
        <div className="flex flex-wrap items-center gap-4">
          <form action={replyWent}>
            <input type="hidden" name="match_id" value={match.id} />
            <SubmitButton pendingLabel="Respondiendo…" className={primaryButton}>
              <Check className="w-5 h-5 stroke-[3]" /> Fuimos
            </SubmitButton>
          </form>
          {noShow}
        </div>
      </Ask>
    )
  }

  const form = (
    <form action={reportResult} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="match_id" value={match.id} />
      {[
        { name: 'goals_for', label: 'Nosotros', value: match.goals_for },
        { name: 'goals_against', label: 'Ellos', value: match.goals_against },
      ].map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-xs text-foreground/60">
          {field.label}
          <input
            name={field.name}
            type="number"
            inputMode="numeric"
            required
            min={0}
            max={99}
            step={1}
            defaultValue={field.value ?? undefined}
            className={`${input} w-16 text-center font-display text-2xl`}
          />
        </label>
      ))}
      <SubmitButton pendingLabel="Guardando…" className={primaryButton}>
        {actions.load === 'Corregir' ? 'Mandar corrección' : 'Cargar'}
      </SubmitButton>
    </form>
  )

  if (actions.confirm) {
    return (
      <Ask>
        <p className="text-foreground">
          <span className="font-semibold">{match.rival_team_name}</span> cargó el resultado:{' '}
          <span className="font-display text-2xl text-brand-lime tracking-wider">
            {actions.confirm.goals_for}–{actions.confirm.goals_against}
          </span>{' '}
          <span className="text-foreground/60 text-sm">(nosotros–ellos)</span>
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <form action={reportResult}>
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="goals_for" value={actions.confirm.goals_for} />
            <input type="hidden" name="goals_against" value={actions.confirm.goals_against} />
            <SubmitButton pendingLabel="Confirmando…" className={primaryButton}>
              <Check className="w-5 h-5 stroke-[3]" /> Confirmar
            </SubmitButton>
          </form>
          {noShow}
        </div>
        <details>
          <summary className={`${quietLink} cursor-pointer list-none`}>Corregir</summary>
          <div className="mt-3">{form}</div>
        </details>
      </Ask>
    )
  }

  if (actions.load === 'Corregir') {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <details className="w-full">
          <summary className={`${quietLink} cursor-pointer list-none`}>Corregir el resultado</summary>
          <div className="mt-3">{form}</div>
        </details>
      </div>
    )
  }

  return (
    <Ask>
      <div className="flex flex-wrap items-end gap-4">
        {form}
        {noShow}
      </div>
    </Ask>
  )
}

// Calificar al rival en un partido Jugado, con el plazo; o lo que le pusieron.
export function Rating({ match, now }: { match: MatchActionRow; now: Date }) {
  const row = ratingRow(match, now)
  if (!row) return null
  if (!row.canRate) return <p className="text-sm text-foreground/60">{row.note}</p>

  return (
    <details>
      <summary className="ui-action cursor-pointer list-none gap-2 text-brand-lime hover:text-foreground">
        <Star className="w-5 h-5" /> Calificar a {match.rival_team_name}
      </summary>
      <form action={rateRival} className="flex flex-col gap-3 mt-3 p-4 border border-brand-border rounded-sm bg-brand-bg">
        <input type="hidden" name="match_id" value={match.id} />
        <p className="text-sm text-foreground/60">{row.note}. Se califica una sola vez y no se edita.</p>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Estrellas</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer px-3 py-2 rounded-sm border border-brand-border text-foreground/80 has-[:checked]:border-brand-lime has-[:checked]:text-brand-lime has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-lime"
            >
              <input type="radio" name="stars" value={n} required className="sr-only" />
              {starsLabel(n)}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1">
          Comentario (opcional, solo lo lee el administrador)
          <textarea name="comment" maxLength={500} rows={2} className={`${input} py-2`} />
        </label>
        <SubmitButton pendingLabel="Calificando…" className={`${primaryButton} self-start`}>
          Calificar
        </SubmitButton>
      </form>
    </details>
  )
}
