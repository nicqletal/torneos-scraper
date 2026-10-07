'use client'

import { useActionState } from 'react'
import { Plus } from 'lucide-react'
import { TEAM_NAME_MAX } from '@/utils/inscriptions'
import type { InscriptionFormState } from './actions'

// Alta por nombre: un campo y un botón. Si la base rechaza (cupo completo,
// torneo finalizado), el mensaje aparece abajo y el nombre queda escrito.
export function InscriptionForm({
  action,
}: {
  action: (state: InscriptionFormState, formData: FormData) => Promise<InscriptionFormState>
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, teamName: '' })

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex flex-col gap-1.5">
          <span className="sr-only">Nombre del equipo</span>
          <input
            key={state.teamName}
            name="team_name"
            defaultValue={state.teamName}
            placeholder="Nombre del equipo"
            maxLength={TEAM_NAME_MAX}
            required
            autoComplete="off"
            className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-lime transition-colors"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="press inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-lime hover:bg-white text-brand-bg text-xs font-display font-bold uppercase tracking-wider rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          <Plus className="w-4 h-4" />
          {pending ? 'Anotando…' : 'Anotar equipo'}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="animate-enter text-[11px] font-mono uppercase text-brand-red">
          {state.error}
        </p>
      )}
    </form>
  )
}
