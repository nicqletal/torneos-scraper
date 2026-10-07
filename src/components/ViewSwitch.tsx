'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { ORGANIZER_PANEL_PATH, isOrganizerView } from '@/utils/organizer-view'

// Botón de la barra superior para pasar de la vista de jugador a la de
// organizador y volver. Es de cliente porque el layout (Server Component) no
// conoce la ruta actual: usePathname la lee y se actualiza al navegar.
// "Soy organizador" lo ve cualquiera: sin sesión, el proxy manda a /login y
// después vuelve al panel.
export function ViewSwitch() {
  const pathname = usePathname()

  if (isOrganizerView(pathname)) {
    return (
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm border border-brand-border text-white/80 hover:text-brand-lime hover:border-brand-lime transition-colors duration-200 font-display"
      >
        <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
        Volver a jugador
      </Link>
    )
  }

  return (
    <Link
      href={ORGANIZER_PANEL_PATH}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-white text-brand-bg hover:text-brand-bg transition-all duration-200 font-display shadow-sm"
    >
      <ClipboardList className="w-3.5 h-3.5 stroke-[2.5]" />
      Soy organizador
    </Link>
  )
}
