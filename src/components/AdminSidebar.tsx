'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, LayoutDashboard, Users, Trophy, Flag, Activity, LifeBuoy, Bell, Settings, ArrowLeft, LogOut, Menu, X } from 'lucide-react'
import { logout } from '@/app/login/actions'

const upcoming = [
  { label: 'Usuarios', icon: Users }, { label: 'Torneos y equipos', icon: Trophy },
  { label: 'Reportes', icon: Flag }, { label: 'Registro de actividad', icon: Activity },
  { label: 'Soporte', icon: LifeBuoy }, { label: 'Avisos', icon: Bell },
  { label: 'Configuración', icon: Settings },
]
const current = [
  { label: 'Resumen', href: '/admin', icon: LayoutDashboard },
  { label: 'Seguridad y acceso', href: '/admin/seguridad', icon: ShieldCheck },
]

export function AdminSidebar({ email }: { email?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  return (
    <aside aria-label="Sidebar de administración" className="sticky top-0 z-30 md:h-screen self-start bg-brand-secondary border-b md:border-b-0 md:border-r border-brand-border flex flex-col min-w-0"
      onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
      <div className="p-4 flex items-center justify-between gap-3 border-b border-brand-border">
        <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 min-h-11">
          <ShieldCheck className="w-8 h-8 shrink-0 text-brand-lime" aria-hidden="true" />
          <span><span className="block font-display text-2xl tracking-wide leading-none">Administración</span><span className="block text-sm text-foreground/60 mt-1">Torneos Amateur BA</span></span>
        </Link>
        <div className="md:hidden">
          <button type="button" aria-label={open ? 'Cerrar navegación de administración' : 'Abrir navegación de administración'} aria-expanded={open} aria-controls={menuId}
            onClick={() => setOpen(!open)} className="ui-action justify-center gap-2 px-3 py-2 border border-brand-border rounded-sm">
            {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div className="px-4 py-2 border-b border-brand-border shrink-0">
        <Link href="/torneos" onClick={() => setOpen(false)} className="ui-action gap-2 text-foreground/80 hover:text-brand-lime"><ArrowLeft className="w-4 h-4" aria-hidden="true" />Volver al sitio</Link>
      </div>
      <div id={menuId} className={`${open ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-h-0 max-h-[calc(100dvh-10rem)] md:max-h-none overflow-y-auto md:overflow-visible`}>
        <nav aria-label="Navegación de administración" className="flex flex-col gap-5 px-3 py-5 flex-1 md:min-h-0 md:overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {current.map(item => <li key={item.href}>
              <Link href={item.href} onClick={() => setOpen(false)} aria-current={pathname === item.href ? 'page' : undefined}
                className={`ui-action w-full gap-3 px-3 py-2 rounded-sm transition-colors ${pathname === item.href ? 'bg-brand-lime/10 text-brand-lime' : 'text-foreground/80 hover:bg-brand-surface hover:text-foreground'}`}>
                <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />{item.label}
              </Link>
            </li>)}
          </ul>
          <div className="flex flex-col gap-2">
            <p className="px-3 text-sm font-semibold text-foreground/60">Próximas etapas</p>
            <ul className="flex flex-col gap-1">
              {upcoming.map(item => <li key={item.label}>
                <div aria-disabled="true" className="min-h-11 px-3 py-2 flex items-center gap-3 text-sm text-foreground/60">
                  <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" /><span className="flex-1">{item.label}</span>
                  <span className="text-xs border border-brand-border px-1.5 rounded-sm">Pendiente</span>
                </div>
              </li>)}
            </ul>
          </div>
        </nav>
        <div className="p-4 border-t border-brand-border flex flex-col gap-2 shrink-0">
          <p className="text-sm text-foreground/70 truncate" title={email}>{email ?? 'Cuenta de administración'}</p>
          <form action={logout}><button type="submit" className="ui-action gap-2 text-foreground/80 hover:text-brand-red"><LogOut className="w-4 h-4" aria-hidden="true" />Cerrar sesión</button></form>
        </div>
      </div>
    </aside>
  )
}
