'use client'

import { useLayoutEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Grid2X2, LayoutGrid } from 'lucide-react'

const DENSITY_STORAGE_KEY = 'matchmaking-density'
const densities = [
  { value: 'normal', label: 'Normal', icon: Grid2X2 },
  { value: 'amplia', label: 'Amplia', icon: LayoutGrid },
] as const

type Density = (typeof densities)[number]['value']
const densityValues = new Set<string>(densities.map(({ value }) => value))

export function TournamentCatalogControls({ pageSize }: { pageSize: 12 | 24 | 48 }) {
  const [density, setDensity] = useState<Density>('normal')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // The root layout sets the saved density before first paint. Keep the
  // server/client render identical, then sync the selected button before paint.
  useLayoutEffect(() => {
    let saved: string | undefined
    try {
      saved = window.localStorage.getItem(DENSITY_STORAGE_KEY) ?? undefined
    } catch {
      saved = undefined
    }
    const initial = document.documentElement.dataset.density ?? saved ?? 'normal'
    const next = densityValues.has(initial) ? initial as Density : 'normal'
    document.documentElement.dataset.density = next
    setDensity(next)
  }, [])

  function changeDensity(next: Density) {
    setDensity(next)
    document.documentElement.dataset.density = next
    try {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, next)
    } catch {
      // The selected density still applies for this visit if storage is blocked.
    }
  }

  function changePageSize(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('por_pagina', value)
    params.delete('pagina')
    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <div role="group" aria-label="Tamaño visual de las tarjetas" className="flex items-center">
        {densities.map(({ value, label, icon: Icon }, index) => (
          <button
            key={value}
            type="button"
            aria-label={`Vista ${label.toLowerCase()}`}
            aria-pressed={density === value}
            title={label}
            onClick={() => changeDensity(value)}
            className={`ui-action press gap-1.5 border px-2.5 text-sm font-semibold transition-colors ${
              density === value
                ? 'border-brand-lime bg-brand-lime text-brand-bg'
                : 'border-brand-border bg-brand-secondary text-foreground/75 hover:border-brand-lime hover:text-foreground'
            } ${index === 0 ? 'rounded-l-sm' : ''} ${index === densities.length - 1 ? 'rounded-r-sm' : ''} ${index > 0 ? '-ml-px' : ''}`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-foreground/70">
        <span>Por página</span>
        <select
          aria-label="Torneos por página"
          value={pageSize}
          onChange={(event) => changePageSize(event.currentTarget.value)}
          className="min-h-11 rounded-sm border border-brand-border bg-brand-secondary px-3 text-foreground focus-visible:outline-2 focus-visible:outline-brand-lime"
        >
          <option value="12">12</option>
          <option value="24">24</option>
          <option value="48">48</option>
        </select>
      </label>
    </div>
  )
}
