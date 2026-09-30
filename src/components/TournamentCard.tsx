import Link from 'next/link'
import { MapPin, Users, ArrowRight } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { priceLabel } from '@/utils/tournament-price'
import { zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import type { VerificationAge } from '@/utils/tournament-verification'
import { VerificationBadge } from './VerificationBadge'
import { TournamentFlyer } from './TournamentFlyer'
import { modalityLabel, type SportModality } from '@/utils/modality'

export interface Tournament {
  id: string
  name: string
  description: string | null
  sport_modality: SportModality
  // Embebida con ZONE_LABEL_EMBED (src/utils/zones.ts)
  zones: ZoneLabelFields
  price: number | null
  price_currency: string
  // Columna calculada: hay que pedirla explícitamente con select('*, status')
  status: TournamentStatus
  contact_whatsapp: string | null
  contact_instagram: string | null
  image_url: string | null
  verified_at: string
  updated_at: string
}

export interface TournamentCardProps {
  tournament: Tournament
  index: number
  // Antigüedad de verificación; null si no aplica (Finalizado).
  verification: VerificationAge | null
}

export function TournamentCard({ tournament, index, verification }: TournamentCardProps) {
  // Format index as scoreboard double-digit (e.g. "01", "02")
  const scoreboardIndex = String(index + 1).padStart(2, '0')

  return (
    // Toda la card es el link: el blanco para tocar es la card entera, no solo
    // el botón "Ficha". La entrada es una animación CSS (corre fuera del hilo
    // principal mientras la página carga) escalonada 40ms por card, con tope en
    // la sexta para que ninguna espere más de 200ms.
    <Link
      href={`/torneos/${tournament.id}`}
      style={{ '--i': Math.min(index, 5) } as React.CSSProperties}
      className="group flex flex-col bg-brand-surface border border-brand-border hover:border-brand-lime h-full transition-colors animate-card-in [animation-delay:calc(var(--i)*40ms)] focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
    >
      {/* Flyer Header */}
      <div className="relative h-44 w-full bg-brand-bg overflow-hidden">
        <TournamentFlyer
          imageUrl={tournament.image_url}
          name={tournament.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={index < 3}
          className={`transition-[scale,opacity] duration-300 ease-out-strong group-hover:scale-[1.03] ${
            tournament.status === 'cerrado' ? 'grayscale opacity-60' : 'opacity-85 group-hover:opacity-100'
          }`}
        />
        
        {/* Floating elements inside image */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-90" />
        
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border font-display rounded-sm ${statusStyles[tournament.status]}`}>
            {statusLabels[tournament.status]}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 text-[10px] text-white/50 bg-brand-bg/80 px-2 py-0.5 border border-brand-border rounded-sm backdrop-blur-xs font-mono">
          REF: #{tournament.id.slice(0, 5).toUpperCase()}
        </div>
      </div>

      {/* Main Info Body */}
      <div className="p-5 flex flex-col flex-1">
        
        {/* Editorial Title Header */}
        <div className="flex items-start mb-4">
          <span className="font-display text-4xl text-brand-lime/30 tracking-wider select-none leading-none mr-3 border-r border-brand-border/40 pr-3 font-bold">
            {scoreboardIndex}
          </span>
          <h3 className="text-3xl tracking-wide text-white line-clamp-2 uppercase font-display leading-none flex-1">
            {tournament.name}
          </h3>
        </div>

        {/* Tabular Sports Metrics Layout */}
        <div className="grid grid-cols-2 gap-px bg-brand-border/60 border border-brand-border/60 mb-5 text-xs text-white/80">
          <div className="bg-brand-surface p-2.5 flex flex-col gap-1">
            <span className="text-[10px] uppercase text-white/40 tracking-wider font-mono">Zona</span>
            {/* "Zona · Corredor" puede ser largo: que baje de línea en vez de cortarse */}
            <span className="font-semibold flex items-start gap-1 leading-snug">
              <MapPin className="w-3.5 h-3.5 mt-px text-brand-lime shrink-0" />
              {zoneLabel(tournament.zones)}
            </span>
          </div>

          <div className="bg-brand-surface p-2.5 flex flex-col gap-1">
            <span className="text-[10px] uppercase text-white/40 tracking-wider font-mono">Modalidad</span>
            <span className="font-semibold flex items-center gap-1 truncate">
              <Users className="w-3.5 h-3.5 text-brand-lime shrink-0" />
              {modalityLabel(tournament.sport_modality)}
            </span>
          </div>
        </div>

        {/* Footer Row (Price & CTA Button) */}
        <div className="mt-auto pt-4 border-t border-brand-border flex items-center justify-between gap-2">
          <div className="flex flex-col items-start">
            {verification && (
              <VerificationBadge age={verification} className="text-[9px] tracking-wider px-1.5 py-0.5" />
            )}
            <span className="text-lg font-bold text-white font-mono mt-1">
              {priceLabel(tournament.price)}
            </span>
          </div>

          {/* Ya no es un link aparte (no se anidan links): se ilumina con el hover de la card */}
          <span className="inline-flex items-center gap-1 px-3 py-2 bg-brand-border text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors font-display group-hover:bg-brand-lime group-hover:text-brand-bg shadow-sm">
            Ficha
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>

      </div>
    </Link>
  )
}
