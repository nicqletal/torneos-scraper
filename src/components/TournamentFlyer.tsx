import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { flyerSrc } from '@/utils/tournament-flyer'

interface TournamentFlyerProps {
  imageUrl: string | null
  name: string
  sizes: string
  priority?: boolean
  // Clases de la imagen (opacidad, grises si está Cerrado, hover).
  className?: string
  // `cover` recorta para llenar (cards del catálogo); `contain` muestra el
  // flyer entero (ficha), porque suele tener fechas y premios escritos.
  fit?: 'cover' | 'contain'
}

// El flyer del torneo, o un placeholder de marca si no tiene. Llena el
// contenedor, que tiene que ser `relative` y tener alto.
export function TournamentFlyer({ imageUrl, name, sizes, priority, className, fit = 'cover' }: TournamentFlyerProps) {
  const src = flyerSrc(imageUrl, process.env.NEXT_PUBLIC_SUPABASE_URL!)

  if (!src) {
    return (
      <div
        role="img"
        aria-label={`${name}, sin flyer`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-secondary bg-[repeating-linear-gradient(135deg,transparent_0_18px,var(--color-brand-border)_18px_19px)]"
      >
        <Trophy className="w-10 h-10 text-brand-lime/40" aria-hidden />
        <span className="font-display tracking-widest uppercase text-xs text-white/30">Sin flyer</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={`Flyer de ${name}`}
      fill
      sizes={sizes}
      priority={priority}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className ?? ''}`}
    />
  )
}
