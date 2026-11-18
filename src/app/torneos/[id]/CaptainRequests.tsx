'use client'

import { useActionState } from 'react'
import { CheckCircle2, Clock, Send, XCircle } from 'lucide-react'
import type { RequestOption } from '@/utils/inscription-requests'
import { SubmitButton } from '@/components/SubmitButton'
import { errorTextClass, secondaryButtonClass } from '@/components/button-styles'
import { requestInscription, withdrawInscriptionRequest, type RequestFormState } from './actions'

const initialState: RequestFormState = { error: null }

const primaryButtonClass =
  'press inline-flex items-center gap-2 py-3 px-5 bg-brand-lime hover:bg-foreground text-brand-bg font-display font-bold uppercase tracking-wider text-sm rounded-sm cursor-pointer'

// Bloque del capitán en la ficha: una fila por equipo suyo, con lo que puede
// hacer o cómo quedó. Es de cliente solo por `useActionState`, que muestra el
// error de la base al lado del botón que lo causó.
export function CaptainRequests({
  tournamentId,
  options,
}: {
  tournamentId: string
  options: RequestOption[]
}) {
  if (options.length === 0) return null
  const single = options.length === 1

  return (
    <div className="flex flex-col gap-3 p-5 bg-brand-surface border border-brand-border rounded-sm">
      <h3 className="font-display tracking-wider text-sm text-foreground uppercase font-bold">
        Inscripción desde la app
      </h3>
      <p className="text-foreground/70 text-xs leading-relaxed">
        El organizador recibe tu solicitud y te escribe por WhatsApp para arreglar el pago. Tu equipo queda
        inscripto cuando la acepta.
      </p>
      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.team.id}>
            <TeamRow tournamentId={tournamentId} option={option} showName={!single} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function TeamRow({
  tournamentId,
  option,
  showName,
}: {
  tournamentId: string
  option: RequestOption
  showName: boolean
}) {
  const { team, state } = option
  const name = <span className="font-semibold text-foreground text-sm">{team.name}</span>
  const note = 'text-[11px] font-mono uppercase'

  switch (state.kind) {
    case 'can_request':
      return <RequestButton tournamentId={tournamentId} teamId={team.id} teamName={showName ? team.name : null} />
    case 'pending':
      return <PendingRow tournamentId={tournamentId} requestId={state.requestId} name={name} />
    case 'inscribed':
      return (
        <p className={`flex items-center gap-2 ${note} text-brand-lime`}>
          <CheckCircle2 className="w-4 h-4" /> {showName && <>{name} · </>}Tu equipo está inscripto
        </p>
      )
    case 'rejected':
      return (
        <p className={`flex items-center gap-2 ${note} text-foreground/70`}>
          <XCircle className="w-4 h-4" /> {showName && <>{name} · </>}El organizador no aceptó la solicitud
        </p>
      )
    case 'expired':
      return (
        <p className={`flex items-center gap-2 ${note} text-foreground/70`}>
          <Clock className="w-4 h-4" /> {showName && <>{name} · </>}El torneo ya no recibe inscripciones
        </p>
      )
    case 'unavailable':
      return (
        <p className={`flex items-center gap-2 ${note} text-foreground/50`}>
          {name} · {state.reason}
        </p>
      )
  }
}

function RequestButton({
  tournamentId,
  teamId,
  teamName,
}: {
  tournamentId: string
  teamId: string
  teamName: string | null
}) {
  const [state, action] = useActionState(requestInscription, initialState)
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <input type="hidden" name="team_id" value={teamId} />
      <SubmitButton pendingLabel={<><Send className="w-4 h-4" />Enviando…</>} className={`${primaryButtonClass} w-fit`}>
        <Send className="w-4 h-4" />
        {teamName ? `Solicitar con ${teamName}` : 'Solicitar inscripción'}
      </SubmitButton>
      {state.error && <p role="alert" className={errorTextClass}>{state.error}</p>}
    </form>
  )
}

function PendingRow({
  tournamentId,
  requestId,
  name,
}: {
  tournamentId: string
  requestId: string
  name: React.ReactNode
}) {
  const [state, action] = useActionState(withdrawInscriptionRequest, initialState)
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <input type="hidden" name="request_id" value={requestId} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-mono uppercase text-brand-amber">
          <Clock className="w-4 h-4" /> {name} · Solicitud enviada
        </span>
        <SubmitButton pendingLabel="Retirando…" className={`${secondaryButtonClass} cursor-pointer`}>
          Retirar
        </SubmitButton>
      </div>
      {state.error && <p role="alert" className={errorTextClass}>{state.error}</p>}
    </form>
  )
}
