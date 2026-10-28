'use client'

import { useState, useRef, useEffect, useId } from 'react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronDown, Trophy, UserRound, Users, ShieldCheck, Swords } from 'lucide-react'

interface UserMenuProps {
  email: string
  // Solo muestra el link: el acceso a /admin lo controlan el proxy y is_admin()
  isAdmin?: boolean
}

export function UserMenu({ email, isAdmin = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const initial = email ? email[0].toUpperCase() : 'U'

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Mi cuenta"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen(!isOpen)}
        className="ui-action flex items-center gap-2 px-3 py-1.5 rounded-sm bg-brand-surface hover:bg-brand-secondary border border-brand-border text-foreground transition-colors cursor-pointer"
      >
        <div className="w-6 h-6 rounded-sm bg-brand-lime flex items-center justify-center font-bold text-brand-bg text-sm">
          {initial}
        </div>
        <span className="text-sm font-semibold tracking-wide font-sans hidden sm:inline max-w-[140px] truncate">
          {email.split('@')[0]}
        </span>
        <ChevronDown className={`w-4 h-4 text-foreground/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 rounded-sm bg-brand-surface border border-brand-border shadow-2xl py-1.5 backdrop-blur-md z-50 origin-top-right"
          >
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className="ui-action flex items-center gap-2.5 px-4 py-2.5 text-sm font-display tracking-wider uppercase text-foreground/90 hover:text-brand-bg hover:bg-brand-lime transition-colors"
            >
              <UserRound className="w-4 h-4" />
              Mi perfil
            </Link>

            <Link
              href="/mis-equipos"
              onClick={() => setIsOpen(false)}
              className="ui-action flex items-center gap-2.5 px-4 py-2.5 text-sm font-display tracking-wider uppercase text-foreground/90 hover:text-brand-bg hover:bg-brand-lime transition-colors"
            >
              <Users className="w-4 h-4" />
              Mis equipos
            </Link>

            <Link
              href="/partidos"
              onClick={() => setIsOpen(false)}
              className="ui-action flex items-center gap-2.5 px-4 py-2.5 text-sm font-display tracking-wider uppercase text-foreground/90 hover:text-brand-bg hover:bg-brand-lime transition-colors"
            >
              <Swords className="w-4 h-4" />
              Partidos
            </Link>

            <Link
              href="/mis-torneos"
              onClick={() => setIsOpen(false)}
              className="ui-action flex items-center gap-2.5 px-4 py-2.5 text-sm font-display tracking-wider uppercase text-foreground/90 hover:text-brand-bg hover:bg-brand-lime transition-colors"
            >
              <Trophy className="w-4 h-4" />
              Mis torneos
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="ui-action flex items-center gap-2.5 px-4 py-2.5 text-sm font-display tracking-wider uppercase text-foreground/90 hover:text-brand-bg hover:bg-brand-lime transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Administración
              </Link>
            )}

            <div className="h-px bg-brand-border my-1" />
            
            <form action={logout}>
              <button
                type="submit"
                onClick={() => setIsOpen(false)}
                className="ui-action w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-display tracking-wider uppercase text-brand-red hover:text-foreground hover:bg-brand-red transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
