'use client'

import { useOptimistic, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { SPORT_MODALITIES } from '@/utils/modality'

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useOptimistic({
    modality: searchParams.get('modality') || '',
    status: searchParams.get('status') || '',
  })
  const hasActiveFilters = Boolean(filters.modality || filters.status)

  function updateFilters(next: typeof filters) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [name, value] of Object.entries(next)) {
      if (value) params.set(name, value)
      else params.delete(name)
    }
    // Conserva la cantidad por página y vuelve al inicio de los resultados.
    params.delete('page')
    params.delete('pagina')

    startTransition(() => {
      setFilters(next)
      router.push(params.size ? `/?${params.toString()}` : '/', { scroll: false })
    })
  }

  const selectClass = 'ui-input w-full appearance-none rounded-xl border border-brand-border bg-brand-surface py-3 pl-3 pr-10 text-foreground transition-colors hover:border-brand-lime/50 focus:border-brand-lime focus:outline-none'

  return (
    <section aria-label="Filtros del catálogo" aria-busy={isPending} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex min-h-11 items-center gap-2 pr-2 text-sm font-semibold text-foreground/70">
        <SlidersHorizontal aria-hidden className="h-4 w-4 text-brand-lime" />
        Filtros
      </div>
      <label className="min-w-0 sm:w-56">
        <span className="mb-1.5 block text-xs text-foreground/60">Modalidad</span>
        <span className="relative block">
          <select name="modality" value={filters.modality} onChange={(event) => updateFilters({ ...filters, modality: event.target.value })} className={selectClass}>
            <option value="">Todas las modalidades</option>
            {SPORT_MODALITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
        </span>
      </label>
      <label className="min-w-0 sm:w-60">
        <span className="mb-1.5 block text-xs text-foreground/60">Estado de inscripción</span>
        <span className="relative block">
          <select name="status" value={filters.status} onChange={(event) => updateFilters({ ...filters, status: event.target.value })} className={selectClass}>
            <option value="">Todos los estados</option>
            <option value="abierto">Inscripción abierta</option>
            <option value="en_curso">En curso</option>
            <option value="cerrado">Inscripción cerrada</option>
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
        </span>
      </label>
      {hasActiveFilters && (
        <button type="button" onClick={() => updateFilters({ modality: '', status: '' })} className="ui-action press justify-center gap-2 self-start rounded-xl px-3 py-3 text-foreground/60 hover:bg-brand-secondary hover:text-foreground sm:self-auto">
          <X aria-hidden className="h-4 w-4" />Limpiar
        </button>
      )}
      <span role="status" className="self-center text-xs text-foreground/50">{isPending ? 'Actualizando torneos…' : ''}</span>
    </section>
  )
}
