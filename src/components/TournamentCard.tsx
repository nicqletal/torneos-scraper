import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Users, Clock, ArrowRight, Trophy, ImageOff } from 'lucide-react'

export type Tournament = {
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

// TODO: agregar cupos y format de torneo, si tiene arbitro, si tiene premios, cuantos premios son
// TODO: limite de jugadores, si se puede pagar con mercado pago, etc.
// TODO: si tiene fotografo , cuanto cuesta y cuanto sale las fotos, si tiene utilero
// TODO: https://www.40servidoresmc.es/anadir-servidor

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const lastUpdated = new Date(tournament.verified_at || tournament.updated_at)

  const statusColors = {
    abierto: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cerrado: 'bg-red-500/10 text-red-500 border-red-500/20',
    en_curso: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    finalizado: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  }

  const modalityLabels = {
    futbol_5: 'Fútbol 5',
    futbol_7: 'Fútbol 7',
    futbol_8: 'Fútbol 8',
    futbol_11: 'Fútbol 11',
  }

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/20 hover:bg-white/10 group">
      <div className="relative h-48 w-full bg-black/40">
        {true ? (
          <Image
            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop"
            alt={`Flyer de ${tournament.name}`}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${tournament.status === 'cerrado' ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
            <ImageOff className="w-8 h-8 mb-1" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-md border backdrop-blur-md ${statusColors[tournament.status]}`}>
            {tournament.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {tournament.name}
        </h3>

        <div className="flex items-center gap-4 text-xs text-white/60 mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            {tournament.zone}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            {modalityLabels[tournament.sport_modality]}
          </span>
        </div>

        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              hace {formatDistanceToNow(lastUpdated, { locale: es })}
            </p>
            {tournament.price ? (
              <p className="font-medium text-emerald-400 text-base">
                ${tournament.price} <span className="text-xs text-white/40">{tournament.price_currency}</span>
              </p>
            ) : (
              <p className="text-xs text-white/40">Precio a consultar</p>
            )}
          </div>

          <Link
            href={`/torneos/${tournament.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Ver más
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
