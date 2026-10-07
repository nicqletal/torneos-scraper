import { Flame } from 'lucide-react'

// "Últimos cupos" es una etiqueta, no un estado (ver CONTEXT.md): va al lado
// del estado cuando quedan 2 lugares o menos. Quién decide si se muestra es
// `isLastSpots` (src/utils/inscriptions.ts). Sin hooks: sirve en Server y
// Client Components.
export function LastSpotsBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border border-brand-amber/40 bg-brand-amber/5 text-brand-amber font-display font-bold uppercase tracking-widest rounded-sm ${className}`}
    >
      <Flame className="w-3.5 h-3.5 shrink-0" />
      Últimos cupos
    </span>
  )
}
