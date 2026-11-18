'use client'

import { SunMoon } from 'lucide-react'

const STORAGE_KEY = 'matchmaking-theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  function toggleTheme() {
    const root = document.documentElement
    const current = root.dataset.theme === 'light' || root.dataset.theme === 'dark'
      ? root.dataset.theme
      : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    const next = current === 'dark' ? 'light' : 'dark'

    root.dataset.theme = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // La preferencia sigue activa en esta página aunque el navegador bloquee el almacenamiento.
    }
  }

  return (
    <button type="button" onClick={toggleTheme} className={className} aria-label="Cambiar tema claro u oscuro">
      <SunMoon aria-hidden="true" className="h-4 w-4" />
      <span>Cambiar tema</span>
    </button>
  )
}
