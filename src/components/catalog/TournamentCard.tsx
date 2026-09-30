'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow, differenceInDays } from 'date-fns' // <-- differenceInDays agregado
import { es } from 'date-fns/locale'
import { MapPin, Users, Clock, ArrowRight, Trophy, ImageOff } from 'lucide-react'

export interface Tournament {
  id: string
  name: string
  description: string | null
  sport_modality: 'futbol_5' | 'futbol_7' | 'futbol_8' | 'futbol_11'
  zone: string
  price: number | null
  price_currency: string
  status: 'abierto' | 'cerrado' | 'en_curso' | 'finalizado'
  contact_whatsapp: string | null
  contact_instagram: string | null
  image_url: string | null
  verified_at: string | null
  updated_at: string
}

export interface TournamentCardProps {
  tournament: Tournament
  index: number
}

export function TournamentCard({ tournament, index }: TournamentCardProps) {
  const lastUpdated = new Date(tournament.verified_at || tournament.updated_at)
  const daysSinceUpdate = differenceInDays(new Date(), lastUpdated) // <-- Calculamos los días acá

  // Status mapping to brand-lime styling or sport indicators
  const statusLabels = {
    abierto: 'Inscripción Abierta',
    cerrado: 'Inscripción Cerrada',
    en_curso: 'En Juego',
    finalizado: 'Torneo Finalizado',
  }

  const statusStyles = {
    abierto: 'text-brand-lime border-brand-lime bg-brand-lime/5',
    cerrado: 'text-red-400 border-red-500/30 bg-red-950/20',
    en_curso: 'text-sky-400 border-sky-500/30 bg-sky-950/20',
    finalizado: 'text-zinc-500 border-zinc-700 bg-zinc-800/20',
  }

  const modalityLabels = {
    futbol_5: 'Fútbol 5',
    futbol_7: 'Fútbol 7',
    futbol_8: 'Fútbol 8',
    futbol_11: 'Fútbol 11',
  }

  // Format index as scoreboard double-digit (e.g. "01", "02")
  const scoreboardIndex = String(index + 1).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      whileHover={{ y: -4, borderColor: '#CCFF00' }}
      className="flex flex-col bg-brand-surface border border-brand-border h-full transition-colors duration-200"
    >
      {/* Flyer Header */}
      <div className="relative h-44 w-full bg-brand-bg overflow-hidden group">
        <Image
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop"
          alt={`Flyer de ${tournament.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={index < 3}
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
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

        {/* Indicador de antigüedad (>30 o >60 días) */}
        {daysSinceUpdate > 30 && (
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border font-display rounded-sm shadow-md ${
              daysSinceUpdate > 60 
                ? 'bg-red-500 text-white border-red-400' 
                : 'bg-amber-400 text-black border-amber-300'
            }`}>
              {daysSinceUpdate > 60 ? 'sin confirmar' : 'actualizar'}
            </span>
          </div>
        )}

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
          <h3 className="text-xl font-bold tracking-tight text-white line-clamp-2 uppercase font-display leading-tight flex-1">
            {tournament.name}
          </h3>
        </div>

        {/* Tabular Sports Metrics Layout */}
        <div className="grid grid-cols-2 gap-px bg-brand-border/60 border border-brand-border/60 mb-5 text-xs text-white/80">
          <div className="bg-brand-surface p-2.5 flex flex-col gap-1">
            <span className="text-[10px] uppercase text-white/40 tracking-wider font-mono">Zona</span>
            <span className="font-semibold flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-brand-lime shrink-0" />
              {tournament.zone}
            </span>
          </div>

          <div className="bg-brand-surface p-2.5 flex flex-col gap-1">
            <span className="text-[10px] uppercase text-white/40 tracking-wider font-mono">Modalidad</span>
            <span className="font-semibold flex items-center gap-1 truncate">
              <Users className="w-3.5 h-3.5 text-brand-lime shrink-0" />
              {modalityLabels[tournament.sport_modality]}
            </span>
          </div>
        </div>

        {/* Footer Row (Price & CTA Button) */}
        <div className="mt-auto pt-4 border-t border-brand-border flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-lime" />
              Actualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: es })}
            </span>
            
            {/* Lógica estricta de precios */}
            {tournament.price === 0 ? (
              <span className="text-lg font-bold text-brand-lime font-mono mt-1">Gratis</span>
            ) : tournament.price ? (
              <span className="text-lg font-bold text-white font-mono mt-1">
                ${tournament.price} <span className="text-xs font-normal text-white/40">{tournament.price_currency}</span>
              </span>
            ) : (
              <span className="text-xs text-white/50 font-semibold mt-1">Consultar</span>
            )}
          </div>

          <Link
            href={`/torneos/${tournament.id}`}
            className="inline-flex items-center gap-1 px-3 py-2 bg-brand-border hover:bg-brand-lime hover:text-brand-bg text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all duration-200 font-display group-hover:bg-brand-lime group-hover:text-brand-bg shadow-sm"
          >
            Ficha
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </motion.div>
  )
}