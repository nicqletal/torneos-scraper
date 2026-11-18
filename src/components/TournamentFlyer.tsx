import Image from 'next/image'
import { BrandMark } from '@/components/BrandMark'
import { hasFlyer } from '@/utils/tournament-flyer'

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
  organizerImageUrl?: string | null
  demoFlyerUrl?: string | null
}

// El flyer del torneo, o un placeholder de marca si no tiene. Llena el
// contenedor, que tiene que ser `relative` y tener alto.
// El placeholder es para las cards del catálogo, que necesitan todas el mismo
// alto; la ficha sin flyer no lo usa: pasa a una sola columna.
export function TournamentFlyer({ imageUrl, name, sizes, priority, className, fit = 'cover', organizerImageUrl, demoFlyerUrl }: TournamentFlyerProps) {
  if (!hasFlyer(imageUrl)) {
    if (demoFlyerUrl) return <div className="absolute inset-0"><Image src={demoFlyerUrl} alt={`Flyer demo de ${name}`} fill sizes={sizes} priority={priority} unoptimized className="object-cover" /><span className="absolute bottom-3 left-3 border border-brand-border bg-brand-bg/85 px-2 py-1 text-xs uppercase tracking-wider text-foreground">DEMO</span></div>
    if (organizerImageUrl) {
      return (
        <div className="absolute inset-0">
          <Image src={organizerImageUrl} alt={`Foto de perfil del organizador de ${name}`} fill sizes={sizes} priority={priority} className="object-cover opacity-80" />
          <span className="absolute bottom-3 left-3 border border-brand-border bg-brand-bg/85 px-2 py-1 text-xs uppercase tracking-wider text-foreground">Organizador</span>
        </div>
      )
    }
    return (
      <div
        role="img"
        aria-label={`${name}, sin flyer`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-secondary bg-[repeating-linear-gradient(135deg,transparent_0_18px,var(--color-brand-border)_18px_19px)]"
      >
        <BrandMark className="h-10 w-12 opacity-50" />
        <span className="font-sans tracking-widest uppercase text-sm text-foreground/70">Sin flyer</span>
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={`Flyer de ${name}`}
      fill
      sizes={sizes}
      priority={priority}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className ?? ''}`}
    />
  )
}
