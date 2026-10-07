'use client'

import { useState, useTransition } from 'react'
import { Ban } from 'lucide-react'
import { dangerButtonClass, errorTextClass } from '@/components/button-styles'
import { withdrawTournament } from './actions'

// "Dar de baja el torneo" con confirmación. No es un <form> a propósito: un
// form con Server Action se envía aunque el JavaScript no haya cargado todavía,
// y ahí el `confirm()` no correría. Con `onClick`, sin JS el botón no hace
// nada, así que nunca hay una baja sin confirmar.
export function WithdrawButton({ id, confirmMessage }: { id: string; confirmMessage: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm(confirmMessage)) return
          setError(null)
          startTransition(async () => {
            // Si sale bien, la acción redirige a la lista y esto no vuelve.
            const result = await withdrawTournament(id)
            if (result?.error) setError(result.error)
          })
        }}
        className={`${dangerButtonClass} cursor-pointer disabled:opacity-40 disabled:cursor-wait`}
      >
        <Ban className="w-3.5 h-3.5" />
        {isPending ? 'Dando de baja…' : 'Dar de baja el torneo'}
      </button>
      {error && <p role="alert" className={`animate-enter ${errorTextClass}`}>{error}</p>}
    </div>
  )
}
