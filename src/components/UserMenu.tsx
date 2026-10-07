'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronDown, Trophy, UserRound, Users } from 'lucide-react'

interface UserMenuProps {
  email: string
}

export function UserMenu({ email }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initial = email ? email[0].toUpperCase() : 'U'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-brand-surface hover:bg-brand-secondary border border-brand-border text-white transition-colors cursor-pointer"
      >
        <div className="w-6 h-6 rounded-sm bg-brand-lime flex items-center justify-center font-bold text-brand-bg text-xs">
          {initial}
        </div>
        <span className="text-xs font-semibold tracking-wider font-display uppercase hidden sm:inline max-w-[120px] truncate">
          {email.split('@')[0]}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 rounded-sm bg-brand-surface border border-brand-border shadow-2xl py-1 backdrop-blur-md z-50 origin-top-right"
          >
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-display tracking-wider uppercase text-white/80 hover:text-brand-bg hover:bg-brand-lime transition-colors"
            >
              <UserRound className="w-3.5 h-3.5" />
              Mi perfil
            </Link>

            <Link
              href="/mis-equipos"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-display tracking-wider uppercase text-white/80 hover:text-brand-bg hover:bg-brand-lime transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Mis equipos
            </Link>

            <Link
              href="/mis-torneos"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-display tracking-wider uppercase text-white/80 hover:text-brand-bg hover:bg-brand-lime transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              Mis torneos
            </Link>

            <div className="h-px bg-brand-border my-1" />
            
            <form action={logout}>
              <button
                type="submit"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-display tracking-wider uppercase text-red-400 hover:text-white hover:bg-red-600 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
