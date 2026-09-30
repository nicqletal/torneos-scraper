'use client'

import { useState, useTransition } from 'react'
import { Ban } from 'lucide-react'
import { withdrawTournament } from './actions'

// "Dar de baja" con confirmación. No es un <form> a propósito: un form con
// Server Action se envía aunque el JavaScript no haya cargado todavía, y ahí
// el `confirm()` no correría. Con `onClick`, sin JS el botón no hace nada,
// así que nunca hay una baja sin confirmar.
export function WithdrawButton({
  id,
  confirmMessage,
  className,
}: {
  id: string
  confirmMessage: string
  className: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="ml-auto flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm(confirmMessage)) return
          setError(null)
          startTransition(async () => {
            const result = await withdrawTournament(id)
            if (result?.error) setError(result.error)
          })
        }}
        className={`${className} hover:text-brand-red hover:border-brand-red cursor-pointer disabled:opacity-40 disabled:cursor-wait`}
      >
        <Ban className="w-3.5 h-3.5" />
        {isPending ? 'Dando de baja…' : 'Dar de baja'}
      </button>
      {error && <p role="alert" className="text-[11px] font-mono uppercase text-brand-red">{error}</p>}
    </div>
  )
}
