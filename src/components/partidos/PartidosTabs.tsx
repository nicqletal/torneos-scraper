import Link from 'next/link'
import { CalendarDays, Search } from 'lucide-react'

// Las dos pantallas del módulo, como pestañas: /partidos (lo que tenés) y
// /partidos/buscar (lo que querés). Son links, no estado: cada pestaña es una
// URL compartible. `pending` prende un punto en "Partidos" cuando hay algo que
// responder.
export function PartidosTabs({ current, pending = false }: { current: 'partidos' | 'buscar'; pending?: boolean }) {
  const base = 'ui-action press flex-1 sm:flex-none justify-center gap-2 px-5 py-3 rounded-sm font-display text-xl uppercase tracking-wider'
  const on = 'bg-brand-lime text-brand-bg'
  const off = 'border border-brand-border bg-brand-secondary text-foreground/80 hover:text-brand-lime hover:border-brand-lime'
  return (
    <nav aria-label="Secciones de Partidos" className="flex gap-2">
      <Link href="/partidos" aria-current={current === 'partidos' ? 'page' : undefined} className={`${base} ${current === 'partidos' ? on : off}`}>
        <CalendarDays className="w-5 h-5" />
        Partidos
        {pending && current !== 'partidos' && <span aria-label="Hay algo pendiente" className="w-2 h-2 rounded-full bg-brand-lime" />}
      </Link>
      <Link href="/partidos/buscar" aria-current={current === 'buscar' ? 'page' : undefined} className={`${base} ${current === 'buscar' ? on : off}`}>
        <Search className="w-5 h-5" />
        Buscar rival
      </Link>
    </nav>
  )
}
