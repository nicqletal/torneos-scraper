'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Star, Trophy, Users } from 'lucide-react'

const destinations = [
  { href: '/', label: 'Torneos', icon: Trophy, matches: (path: string) => path === '/' || path.startsWith('/torneos') || path.startsWith('/crear-torneo') || path.startsWith('/mis-torneos') },
  { href: '/favoritos', label: 'Favoritos', icon: Star, matches: (path: string) => path.startsWith('/favoritos') },
  { href: '/mis-equipos', label: 'Mis equipos', icon: Users, matches: (path: string) => path.startsWith('/mis-equipos') || path.startsWith('/equipos') || path.startsWith('/crear-equipo') },
  { href: '/partidos', label: 'Partidos', icon: CalendarDays, matches: (path: string) => path.startsWith('/partidos') },
]

function DestinationLink({ href, label, icon: Icon, active, pending = false, mobile = false }: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  pending?: boolean
  mobile?: boolean
}) {
  const className = mobile
    ? `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold transition-colors ${active ? 'text-brand-lime' : 'text-foreground/70 hover:text-foreground'}`
    : `ui-action rounded-sm px-3 text-sm font-semibold transition-colors ${active ? 'text-brand-lime' : 'text-foreground/75 hover:bg-brand-surface hover:text-foreground'}`

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      aria-label={pending && label === 'Partidos' ? 'Partidos, tenés algo para responder' : label}
      className={className}
    >
      <Icon aria-hidden="true" className={mobile ? 'h-5 w-5' : 'mr-2 h-4 w-4'} />
      <span>{label}</span>
      {pending && label === 'Partidos' && (
        <span aria-hidden="true" title="Tenés algo para responder" className={mobile
          ? 'absolute left-1/2 top-2 h-2 w-2 translate-x-2 rounded-full bg-brand-lime ring-2 ring-brand-secondary'
          : 'ml-2 h-2 w-2 rounded-full bg-brand-lime'
        } />
      )}
    </Link>
  )
}

export function MainNavigation({ signedIn, hasPendingAction = false }: { signedIn: boolean; hasPendingAction?: boolean }) {
  const pathname = usePathname()
  const visibleDestinations = signedIn ? destinations : destinations.slice(0, 2)

  return (
    <>
      <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
        {visibleDestinations.map(({ href, label, icon, matches }) => (
          <DestinationLink key={href} href={href} label={label} icon={icon} active={matches(pathname)} pending={signedIn && hasPendingAction} />
        ))}
      </nav>

      {signedIn && (
        <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-[60] flex border-t border-brand-border bg-brand-secondary/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md md:hidden">
          {destinations.map(({ href, label, icon, matches }) => (
            <DestinationLink key={href} href={href} label={label} icon={icon} active={matches(pathname)} pending={hasPendingAction} mobile />
          ))}
        </nav>
      )}
    </>
  )
}
