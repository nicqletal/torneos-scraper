'use client'

import { useState, useRef, useEffect, useId } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { markNoticesRead } from '@/app/avisos/actions'

// Un aviso ya traducido a texto en el servidor (ver src/utils/notices.ts).
export interface BellNotice {
  id: string
  text: string
  link: string
  date: string
  unread: boolean
}

interface NoticeBellProps {
  // Los últimos 30 avisos, del más nuevo al más viejo.
  notices: BellNotice[]
  // No leídos en total (puede haber más que los 30 que se muestran).
  unreadCount: number
}

// Campanita: el número rojo cuenta los no leídos; abrirla marca leídos los que
// se ven. Sin botones en el aviso: cada uno es un link a donde está el estado
// actual. Ver "Campanita" en docs/decisiones-casos-de-uso.md.
export function NoticeBell({ notices, unreadCount }: NoticeBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Los que estaban sin leer al abrir: se siguen resaltando mientras la
  // campanita está abierta, aunque la base ya los haya marcado leídos.
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [count, setCount] = useState(unreadCount)
  const menuRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Cuando el layout se vuelve a renderizar con datos nuevos, manda la base.
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount)
  if (prevUnreadCount !== unreadCount) {
    setPrevUnreadCount(unreadCount)
    setCount(unreadCount)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function toggle() {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    const unreadIds = notices.filter((n) => n.unread).map((n) => n.id)
    setHighlighted(new Set(unreadIds))
    setIsOpen(true)
    if (unreadIds.length > 0) {
      // Baja el número enseguida, sin esperar a la base. Si había más no
      // leídos que los 30 que se ven, esos siguen contando.
      setCount((c) => Math.max(0, c - unreadIds.length))
      markNoticesRead(unreadIds)
    }
  }

  const label = count > 0 ? `Avisos: ${count} sin leer` : 'Avisos'

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={toggle}
        className="ui-action relative flex items-center justify-center w-9 h-9 rounded-sm bg-brand-surface hover:bg-brand-secondary border border-brand-border text-foreground transition-colors cursor-pointer"
      >
        <Bell className="w-4.5 h-4.5" />
        {count > 0 && (
          <span
            data-testid="notice-count"
            className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-brand-red text-foreground text-[11px] font-bold leading-5 text-center tabular-nums"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-brand-surface border border-brand-border shadow-2xl backdrop-blur-md z-50 origin-top-right"
          >
            <p className="px-4 py-2.5 border-b border-brand-border font-display text-sm tracking-wider uppercase text-foreground/70">
              Avisos
            </p>
            {notices.length === 0 ? (
              <p className="px-4 py-6 text-sm text-foreground/70">Todavía no tenés avisos.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto divide-y divide-brand-border">
                {notices.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 hover:bg-brand-secondary transition-colors border-l-2 ${
                        highlighted.has(n.id) ? 'border-brand-lime' : 'border-transparent'
                      }`}
                    >
                      <p className="text-sm text-foreground/90 leading-snug">{n.text}</p>
                      <p className="mt-1 text-[11px] font-mono text-foreground/60">{n.date}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
