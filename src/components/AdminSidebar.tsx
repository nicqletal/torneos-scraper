'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, LayoutDashboard, Users, Trophy, Flag, Activity, LifeBuoy, Bell, Settings, ArrowUpRight, LogOut, Menu, X } from 'lucide-react'
import { closeAdminSession } from '@/app/admin/(backoffice)/seguridad/actions'

const navigationGroups = [
  {
    label: 'Plataforma',
    items: [
      { label: 'Resumen', href: '/admin', icon: LayoutDashboard },
      { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
      { label: 'Torneos y equipos', href: '/admin/contenido', icon: Trophy },
    ],
  },
  {
    label: 'Seguimiento',
    items: [
      { label: 'Reportes', href: '/admin/reportes', icon: Flag },
      { label: 'Registro de actividad', href: '/admin/actividad', icon: Activity },
      { label: 'Soporte', href: '/admin/soporte', icon: LifeBuoy },
      { label: 'Avisos', href: '/admin/avisos', icon: Bell },
    ],
  },
  {
    label: 'Cuenta y sistema',
    items: [
      { label: 'Seguridad y acceso', href: '/admin/seguridad', icon: ShieldCheck },
      { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
    ],
  },
]

export function AdminSidebar({ email }: { email?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const menuId = useId()

  function closeNavigation() {
    dialogRef.current?.close()
    setOpen(false)
  }

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    function onResize(event: MediaQueryListEvent) {
      if (event.matches) {
        dialogRef.current?.close()
        setOpen(false)
      }
    }
    desktop.addEventListener('change', onResize)
    return () => desktop.removeEventListener('change', onResize)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  return (
    <>
      <aside aria-label="Panel de administración" className="sticky top-0 hidden h-dvh min-w-0 flex-col self-start overflow-hidden border-r border-brand-border bg-brand-secondary md:flex">
        <AdminNavigation email={email} pathname={pathname} />
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-border bg-brand-secondary/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/admin" className="flex min-h-11 items-center gap-2.5">
          <ShieldCheck aria-hidden className="h-6 w-6 text-brand-lime" />
          <span className="text-sm font-semibold">Administración</span>
        </Link>
        <button type="button" aria-label="Abrir navegación de administración" aria-haspopup="dialog" aria-expanded={open} aria-controls={menuId}
          onClick={() => {
            dialogRef.current?.showModal()
            setOpen(true)
          }} className="ui-action press justify-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-foreground/80 hover:border-brand-lime">
          <Menu aria-hidden className="h-5 w-5" />Menú
        </button>
      </div>

      <dialog ref={dialogRef} id={menuId} aria-label="Navegación de administración" className="admin-navigation-dialog"
        onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) closeNavigation() }}>
        <AdminNavigation email={email} pathname={pathname} onNavigate={closeNavigation} />
      </dialog>
    </>
  )
}

function AdminNavigation({ email, pathname, onNavigate }: {
  email?: string
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-5 py-6">
        <Link href="/admin" onClick={onNavigate} className="flex min-h-11 min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-lime/20 bg-brand-lime/10 text-brand-lime"><ShieldCheck aria-hidden className="h-5 w-5" /></span>
          <span><span className="block font-display text-2xl leading-none tracking-wide">Matchmaking</span><span className="mt-1 block text-xs text-foreground/50">Panel de administración</span></span>
        </Link>
        {onNavigate && <button type="button" aria-label="Cerrar navegación de administración" onClick={onNavigate} className="ui-action press h-11 w-11 shrink-0 justify-center rounded-xl text-foreground/60 hover:bg-brand-surface hover:text-foreground"><X aria-hidden className="h-5 w-5" /></button>}
      </div>

      <nav aria-label="Secciones de administración" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-5">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                      className={`ui-action press w-full gap-3 rounded-xl border px-3 py-2.5 ${active ? 'border-brand-lime/20 bg-brand-lime/10 text-brand-lime' : 'border-transparent text-foreground/65 hover:bg-brand-surface hover:text-foreground'}`}>
                      <item.icon aria-hidden className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-sm">{item.label}</span>
                      {active && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-brand-border p-3">
        <Link href="/" onClick={onNavigate} className="ui-action press mb-3 w-full justify-between gap-2 rounded-xl px-3 py-2 text-sm text-foreground/60 hover:bg-brand-surface hover:text-foreground">Volver al sitio<ArrowUpRight aria-hidden className="h-4 w-4" /></Link>
        <div className="rounded-2xl border border-brand-border bg-brand-bg/50 p-3">
          <div className="mb-2 flex items-center gap-2.5">
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-lime/10 text-sm font-semibold text-brand-lime">{email?.[0]?.toUpperCase() ?? 'A'}</span>
            <div className="min-w-0"><p className="text-xs text-foreground/50">Sesión administrativa</p><p className="truncate text-sm text-foreground/80" title={email}>{email ?? 'Administrador'}</p></div>
          </div>
          <form action={closeAdminSession}>
            <input type="hidden" name="scope" value="local" />
            <button type="submit" className="ui-action press w-full gap-2 rounded-lg px-2 py-2 text-sm text-foreground/60 hover:bg-brand-red/10 hover:text-brand-red"><LogOut aria-hidden className="h-4 w-4" />Cerrar sesión</button>
          </form>
        </div>
      </div>
    </div>
  )
}
