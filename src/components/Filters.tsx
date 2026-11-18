'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Activity, Check, ChevronDown, Filter, SlidersHorizontal, Trophy, X } from 'lucide-react'
import { SPORT_MODALITIES } from '@/utils/modality'

const modalities = [
  { value: '', label: 'Todas las modalidades' },
  ...SPORT_MODALITIES.map((modality) => ({ value: modality.value, label: modality.label })),
]

const statuses = [
  { value: '', label: 'Todos los estados' },
  { value: 'abierto', label: 'Inscripción abierta' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'cerrado', label: 'Inscripción cerrada' },
]

function FilterGroup({
  title,
  value,
  options,
  icon: Icon,
  onSelect,
}: {
  title: string
  value: string
  options: { value: string; label: string }[]
  icon: typeof Trophy
  onSelect: (value: string) => void
}) {
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

  return (
    <details className="filter-group border-b border-brand-border/70 last:border-b-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 py-2 text-left outline-none marker:hidden focus-visible:outline-2 focus-visible:outline-brand-lime">
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground/55" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-foreground/70">{title}</span>
          <span className="block truncate text-sm font-medium text-foreground">{selectedOption.label}</span>
        </span>
        {value ? <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" /> : null}
        <ChevronDown aria-hidden="true" className="filter-group-chevron h-4 w-4 shrink-0 text-foreground/45" />
      </summary>

      <div role="group" aria-label={title} className="flex flex-col gap-1 pb-3 pl-6">
        {options.map((option) => {
          const isActive = value === option.value

          return (
            <button
              key={option.value || 'all'}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(option.value)}
              className={`filter-option flex min-h-11 items-center gap-2 rounded-sm px-2.5 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-brand-lime/10 text-foreground'
                  : 'text-foreground/65 hover:bg-brand-secondary hover:text-foreground'
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isActive ? 'border-brand-lime bg-brand-lime text-brand-bg' : 'border-brand-border'}`}>
                {isActive ? <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">{option.label}</span>
            </button>
          )
        })}
      </div>
    </details>
  )
}

function FilterPanel({
  currentModality,
  currentStatus,
  hasActiveFilters,
  onSelect,
  onClear,
  onClose,
  mobile = false,
}: {
  currentModality: string
  currentStatus: string
  hasActiveFilters: boolean
  onSelect: (name: string, value: string) => void
  onClear: () => void
  onClose?: () => void
  mobile?: boolean
}) {
  return (
    <div className={mobile ? 'flex h-full flex-col' : 'filter-sidebar-panel'}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-brand-border/70 pb-3">
        <div className="flex items-center gap-2">
          {mobile ? <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-brand-lime" /> : null}
          <h2 id={mobile ? 'mobile-filters-title' : undefined} className="text-sm font-semibold text-foreground">Filtros</h2>
        </div>
        <div className="flex items-center gap-1">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="ui-action press min-h-9 rounded-sm px-2 text-xs font-medium text-foreground/60 hover:bg-brand-secondary hover:text-foreground"
            >
              Limpiar
            </button>
          ) : null}
          {mobile && onClose ? (
            <button
              type="button"
              aria-label="Cerrar filtros"
              onClick={onClose}
              className="ui-action press min-h-10 w-10 justify-center rounded-sm text-foreground/65 hover:bg-brand-secondary hover:text-foreground"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className={mobile ? 'flex-1 overflow-y-auto' : ''}>
        <FilterGroup
          title="Modalidad"
          value={currentModality}
          options={modalities}
          icon={Trophy}
          onSelect={(value) => onSelect('modality', value)}
        />
        <FilterGroup
          title="Estado de inscripción"
          value={currentStatus}
          options={statuses}
          icon={Activity}
          onSelect={(value) => onSelect('status', value)}
        />
      </div>

      {mobile ? <p className="border-t border-brand-border/70 pt-3 text-xs text-foreground/50">Los cambios se aplican al elegir una opción.</p> : null}
    </div>
  )
}

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const updateFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      // Reset pagination when filters change, keeping the page size preference.
      params.delete('page')
      params.delete('pagina')

      router.push(params.size ? `/?${params.toString()}` : '/', { scroll: false })
    },
    [searchParams, router]
  )

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('modality')
    params.delete('status')
    params.delete('page')
    params.delete('pagina')

    router.push(params.size ? `/?${params.toString()}` : '/', { scroll: false })
  }, [searchParams, router])

  const currentModality = searchParams.get('modality') || ''
  const currentStatus = searchParams.get('status') || ''
  const hasActiveFilters = Boolean(currentModality || currentStatus)

  function closeMobileFilters() {
    dialogRef.current?.close()
    setIsMobileOpen(false)
  }

  useEffect(() => {
    if (isMobileOpen) dialogRef.current?.showModal()
  }, [isMobileOpen])

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen(true)}
        className="ui-action press w-full justify-center gap-2 rounded-sm border border-brand-border bg-brand-surface px-4 text-sm font-semibold text-foreground hover:border-brand-lime xl:hidden"
      >
        <Filter aria-hidden="true" className="h-4 w-4 text-brand-lime" />
        Filtros
      </button>

      <aside className="hidden xl:block" aria-label="Filtros del catálogo">
        <FilterPanel
          currentModality={currentModality}
          currentStatus={currentStatus}
          hasActiveFilters={hasActiveFilters}
          onSelect={updateFilter}
          onClear={clearFilters}
        />
      </aside>

      {isMobileOpen ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="mobile-filters-title"
          className="filter-dialog"
          onClose={() => setIsMobileOpen(false)}
          onClick={(event) => {
            if (event.target === dialogRef.current) closeMobileFilters()
          }}
        >
          <FilterPanel
            currentModality={currentModality}
            currentStatus={currentStatus}
            hasActiveFilters={hasActiveFilters}
            onSelect={updateFilter}
            onClear={clearFilters}
            onClose={closeMobileFilters}
            mobile
          />
        </dialog>
      ) : null}
    </>
  )
}
