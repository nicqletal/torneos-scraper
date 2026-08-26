'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { User, LogOut, Trophy, ChevronDown, List } from 'lucide-react'

export function UserMenu({ email }: { email: string }) {
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-zinc-950 text-xs">
          {initial}
        </div>
        <span className="text-sm font-medium hidden sm:inline max-w-[120px] truncate">{email}</span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900/95 border border-white/10 shadow-xl py-1 backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <Link
            href="/mis-torneos"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <List className="w-4 h-4 text-emerald-400" />
            Mis torneos
          </Link>
          
          <div className="h-px bg-white/10 my-1" />
          
          <form action={logout}>
            <button
              type="submit"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
