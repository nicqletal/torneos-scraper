'use client'

import Link from 'next/link'
import { Megaphone, X } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

// Sugerencia comercial dentro de la app, independiente de la campanita de Avisos.
export function PromotionNotice({ userId, tournamentId }: { userId: string; tournamentId: string }) {
  const storageKey = `matchmaking:promotion-notice-dismissed:${userId}`
  const [closed, setClosed] = useState(false)
  const dismissed = useSyncExternalStore(subscribe, () => {
    try { return window.localStorage.getItem(storageKey) === '1' } catch { return false }
  }, () => true)

  if (closed || dismissed) return null

  return (
    <aside aria-label="Sugerencia para promocionar tu torneo" className="fixed bottom-24 right-4 z-40 w-[calc(100%-2rem)] max-w-80 animate-enter overflow-hidden rounded-3xl border border-brand-sky/40 bg-brand-surface p-4 shadow-xl md:bottom-6">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-sky"><Megaphone aria-hidden="true" className="h-4 w-4" />Para organizadores</span>
        <button type="button" aria-label="Cerrar sugerencia de promoción" className="-mr-1 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:bg-brand-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand-sky" onClick={() => {
          setClosed(true)
          try { window.localStorage.setItem(storageKey, '1') } catch { /* El cierre funciona también sin almacenamiento. */ }
        }}><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <p className="font-display text-2xl leading-tight tracking-wide text-foreground">Dale más visibilidad a tu torneo</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">Mirá cómo se vería tu publicación destacada.</p>
      <Link href={`/mis-torneos/${tournamentId}/promocionar`} className="ui-action press mt-3 inline-flex rounded-xl border border-brand-sky/50 bg-brand-sky/10 px-4 py-2 text-sm font-bold text-brand-sky hover:bg-brand-sky hover:text-brand-bg">Ver promoción</Link>
      <p className="mt-2 text-xs text-foreground/60">Vista previa · Próximamente</p>
    </aside>
  )
}
