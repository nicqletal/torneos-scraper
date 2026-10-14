'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Users, LayoutDashboard, ShieldCheck, LogIn } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { navigationItems, navigationIsActive } from '@/utils/navigation'

const icons = { tournaments: Trophy, teams: Users, organizer: LayoutDashboard, admin: ShieldCheck }

export function Navbar({ email, isAdmin, isGuest }: { email?: string; isAdmin: boolean; isGuest: boolean }) {
  const pathname = usePathname()
  return (
    <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <Link href="/" aria-label="Torneos Scraper, inicio" className="min-h-11 flex items-center gap-2 group shrink-0">
        <span className="w-8 h-8 rounded-sm bg-brand-lime flex items-center justify-center text-brand-bg transition-transform group-hover:scale-105">
          <Trophy className="w-4.5 h-4.5 stroke-[2.5]" aria-hidden="true" />
        </span>
        <span className="font-display text-2xl tracking-wider uppercase group-hover:text-brand-lime transition-colors">Torneos Scraper</span>
      </Link>

      <nav aria-label="Navegación principal" className="order-last w-full flex flex-wrap items-center gap-1 border-t border-brand-border pt-2 lg:order-none lg:w-auto lg:border-0 lg:pt-0">
        {navigationItems(Boolean(email), isAdmin).map(item => {
          const Icon = icons[item.id as keyof typeof icons]
          const active = navigationIsActive(pathname, item.paths)
          return (
            <Link key={item.id} href={item.href} aria-current={active ? 'page' : undefined}
              className={`ui-action inline-flex items-center justify-center gap-2 px-3 py-2 rounded-sm border transition-colors focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2 ${active
                ? 'border-brand-lime/40 bg-brand-lime/10 text-brand-lime'
                : 'border-transparent text-foreground/80 hover:text-brand-lime hover:bg-brand-surface'}`}>
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2">
        {email ? <UserMenu email={email} /> : <>
          {isGuest && <span className="hidden sm:inline text-sm text-foreground/60">Invitado</span>}
          <Link href="/login" className="ui-action inline-flex items-center justify-center gap-2 px-3 py-2 rounded-sm border border-brand-border bg-brand-surface hover:border-brand-lime hover:text-brand-lime transition-colors">
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Iniciar sesión</span>
            <span className="sr-only sm:hidden">Iniciar sesión</span>
          </Link>
        </>}
      </div>
    </div>
  )
}
