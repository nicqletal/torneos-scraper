'use client'

// PROTOTIPO: barra flotante para cambiar de variante con ?variant=. No se
// muestra en producción.

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PrototypeSwitcherProps {
  variants: { key: string; name: string }[]
  current: string
}

export function PrototypeSwitcher({ variants, current }: PrototypeSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const index = Math.max(0, variants.findIndex((v) => v.key === current))

  function go(step: number) {
    const next = variants[(index + step + variants.length) % variants.length]
    router.replace(`${pathname}?variant=${next.key}`, { scroll: false })
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]')) return
      if (event.key === 'ArrowLeft') go(-1)
      if (event.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-2 rounded-full bg-foreground text-brand-bg shadow-2xl font-sans text-sm">
      <button onClick={() => go(-1)} aria-label="Variante anterior" className="cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
      <span className="font-bold">{variants[index].key} <span className="font-normal">({variants[index].name})</span></span>
      <button onClick={() => go(1)} aria-label="Variante siguiente" className="cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
    </div>
  )
}
