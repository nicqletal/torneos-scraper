'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { pageFrame } from '@/utils/page-frame'

export function AppFrame({ children, navbar, footer }: { children: ReactNode; navbar: ReactNode; footer: ReactNode }) {
  const frame = pageFrame(usePathname())
  // Solo presentación. Cada página y acción privada verifica permisos en el servidor.
  if (frame === 'admin') return <main className="relative z-10 flex-1 min-w-0">{children}</main>
  return <>
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-secondary/90 backdrop-blur-md">{navbar}</header>
    <main className="relative z-10 flex-1 container mx-auto px-4 py-8 sm:py-12 flex flex-col justify-start">{children}</main>
    {footer}
  </>
}
