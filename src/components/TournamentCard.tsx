import Link from 'next/link'
import { MapPin, Users, ArrowRight, Megaphone } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { priceLabel } from '@/utils/tournament-price'
import { zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import type { VerificationAge } from '@/utils/tournament-verification'
import { VerificationBadge } from './VerificationBadge'
import { TournamentFlyer } from './TournamentFlyer'
import { LastSpotsBadge } from './LastSpotsBadge'
import { isLastSpots } from '@/utils/inscriptions'
import { modalityLabel, type SportModality } from '@/utils/modality'
import { FavoriteToggle } from './FavoriteToggle'
import type { PromotionPlan } from '@/utils/tournament-promotion'

export const organizerImages: Record<string, string> = {
  areiafutbol: '/organizers/areia.jpg',
  'bdn.sabados': '/organizers/bdn-sabados.jpg',
  bdntorneos: '/organizers/bdntorneos.jpg',
  'bdntorneos.fem': '/organizers/bdntorneos-fem.jpg',
  liganunez: '/organizers/liganunez.jpg',
  liganunezfem: '/organizers/liganunez-fem.jpg',
  liganunezplus: '/organizers/liganunez-plus.jpg',
  ligapuertomadero: '/organizers/ligapuertomadero.jpg',
  ligatigre: '/organizers/liga-tigre.jpg',
  'pasion.mas': '/organizers/pasion-mas.jpg',
  torneosindiana: '/organizers/torneosindiana.jpg',
}

export interface Tournament {
  id: string
  observed_at?: string | null
  name: string
  description: string | null
  sport_modality: SportModality
  // Embebida con ZONE_LABEL_EMBED (src/utils/zones.ts)
  zones: ZoneLabelFields
  price: number | null
  price_currency: string
  // Columnas calculadas: hay que pedirlas con select('*, status, inscriptions_count')
  status: TournamentStatus
  inscriptions_count: number
  capacity: number | null
  contact_whatsapp: string | null
  contact_instagram: string | null
  source_url?: string | null
  image_url: string | null
  verified_at: string
  updated_at: string
}

export interface TournamentCardProps {
  tournament: Tournament
  index: number
  // Antigüedad de verificación; null si no aplica (Finalizado).
  verification: VerificationAge | null
  // Solo apariencia para la vista previa privada; no activa una Promoción.
  promoted?: boolean
  showFavorite?: boolean
  promotionPlan?: PromotionPlan
}

export function TournamentCard({ tournament, index, verification, promoted = false, showFavorite = true, promotionPlan }: TournamentCardProps) {
  const isPromoted = promoted || Boolean(promotionPlan)
  const promotionBorder = promotionPlan === 'partner' ? 'border-brand-amber ring-1 ring-brand-amber/20' : 'border-brand-sky ring-1 ring-brand-sky/20'
  // Format index as scoreboard double-digit (e.g. "01", "02")
  const scoreboardIndex = String(index + 1).padStart(2, '0')

  return (
    // Toda la card es el link: el blanco para tocar es la card entera, no solo
    // el botón "Ficha". La entrada es una animación CSS (corre fuera del hilo
    // principal mientras la página carga) escalonada 40ms por card, con tope en
    // la sexta para que ninguna espere más de 200ms.
    <article style={{ '--i': Math.min(index, 5) } as React.CSSProperties} className={`tournament-card group relative flex flex-col bg-brand-surface border ${isPromoted ? promotionBorder : 'border-brand-border'} hover:border-brand-lime h-full transition-colors animate-card-in [animation-delay:calc(var(--i)*40ms)]`}>
      <Link href={`/torneos/${tournament.id}`} className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2">
      {isPromoted && (
        <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-brand-bg ${promotionPlan === 'partner' ? 'bg-brand-amber' : 'bg-brand-sky'}`}>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Megaphone aria-hidden="true" className="h-3.5 w-3.5" />
            Promocionado
          </span>
          <span className="text-xs">{promotionPlan ? `${promotionPlan === 'partner' ? 'Partner' : 'Growth'} · Demo` : 'Publicidad'}</span>
        </div>
      )}
      {tournament.observed_at && <p className="px-4 py-2 text-sm text-brand-amber border-b border-brand-border">Información reportada en revisión</p>}
      {/* Flyer Header */}
      <div className="tournament-card-flyer relative w-full bg-brand-bg overflow-hidden">
        <TournamentFlyer
          imageUrl={tournament.image_url}
          demoFlyerUrl={tournament.source_url?.startsWith('demo://') ? `/demo-flyers/${tournament.source_url.split('/').pop()}.svg` : null}
          organizerImageUrl={tournament.contact_instagram ? organizerImages[tournament.contact_instagram] ?? null : null}
          name={tournament.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={index < 3}
          className={`transition-[scale,opacity] duration-300 ease-out-strong group-hover:scale-[1.03] ${
            tournament.status === 'cerrado' ? 'grayscale opacity-60' : 'opacity-85 group-hover:opacity-100'
          }`}
        />
        
        {/* Floating elements inside image */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-90" />
        
        <div className="absolute bottom-3 right-3 text-sm text-foreground/70 bg-brand-bg/80 px-2 py-0.5 border border-brand-border rounded-sm backdrop-blur-xs font-mono">
          REF: #{tournament.id.slice(0, 5).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border px-4 py-2.5">
        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider border rounded-sm ${statusStyles[tournament.status]}`}>
          {statusLabels[tournament.status]}
        </span>
        {isLastSpots(tournament.status, tournament.capacity, tournament.inscriptions_count) && (
          <LastSpotsBadge className="px-2 py-1 text-xs" />
        )}
      </div>

      {/* Main Info Body */}
      <div className="tournament-card-body flex flex-col flex-1">
        
        {/* Editorial Title Header */}
        <div className="flex items-start mb-4">
          <span className="font-display text-4xl text-brand-lime/30 tracking-wider select-none leading-none mr-3 border-r border-brand-border/40 pr-3 font-bold">
            {scoreboardIndex}
          </span>
          <h3 className="tournament-card-title tracking-wide text-foreground uppercase font-display leading-none flex-1">
            {tournament.name}
          </h3>
        </div>

        {/* Tabular Sports Metrics Layout */}
        <div className="grid grid-cols-2 gap-px bg-brand-border/60 border border-brand-border/60 mb-5 text-sm text-foreground/90">
          <div className="bg-brand-surface p-2.5 flex flex-col gap-1">
            <span className="text-sm uppercase text-foreground/70 tracking-wider font-sans">Zona</span>
            {/* "Zona · Corredor" puede ser largo: que baje de línea en vez de cortarse */}
            <span className="font-semibold flex items-start gap-1 leading-snug">
              <MapPin className="w-3.5 h-3.5 mt-px text-brand-lime shrink-0" />
              {zoneLabel(tournament.zones)}
            </span>
          </div>

          <div className="bg-brand-surface p-2.5 flex flex-col gap-1">
            <span className="text-sm uppercase text-foreground/70 tracking-wider font-sans">Modalidad</span>
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
              <VerificationBadge age={verification} className="text-sm tracking-wider px-2 py-0.5" />
            )}
            <span className="text-lg font-bold text-foreground font-mono mt-1">
              {priceLabel(tournament.price)}
            </span>
          </div>

          {/* Ya no es un link aparte (no se anidan links): se ilumina con el hover de la card */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-border text-foreground text-sm font-bold uppercase tracking-wider rounded-sm transition-colors font-sans group-hover:bg-brand-lime group-hover:text-brand-bg shadow-sm">
            Ficha
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>

      </div>
      </Link>
      {showFavorite && <FavoriteToggle tournamentId={tournament.id} className={`absolute right-3 ${isPromoted ? 'top-12' : 'top-3'}`} />}
    </article>
  )
}
