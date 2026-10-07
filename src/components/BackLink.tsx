import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface BackLinkProps {
  href: string
  // Nombre del destino, no un "Volver" genérico: "Mis torneos", "Volver al catálogo".
  label: string
}

// La única forma de volver de una pantalla interna: va arriba a la izquierda y
// dice a dónde lleva (ver "Cuenta y acceso" en docs/decisiones-casos-de-uso.md).
// Cada pantalla tiene uno solo.
export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-white/50 hover:text-brand-lime transition-colors w-fit group"
    >
      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
      <span>{label}</span>
    </Link>
  )
}
