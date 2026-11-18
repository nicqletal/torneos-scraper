'use client'

import { Star } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

export function FavoriteToggle({ tournamentId, className = '' }: { tournamentId: string; className?: string }) {
  const { toggle, isFavorite } = useFavorites()
  const active = isFavorite(tournamentId)

  return (
    <button
      type="button"
      aria-label={active ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
      aria-pressed={active}
      title={active ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
      onClick={() => toggle(tournamentId)}
      className={`ui-action press z-10 h-11 w-11 justify-center rounded-full border border-brand-border bg-brand-bg/85 text-foreground shadow-sm backdrop-blur-sm hover:border-brand-lime ${className}`}
    >
      <Star aria-hidden="true" className={`h-5 w-5 ${active ? 'fill-brand-lime text-brand-lime' : ''}`} />
    </button>
  )
}
