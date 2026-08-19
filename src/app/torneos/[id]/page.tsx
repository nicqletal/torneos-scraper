import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Trophy, MapPin, Users, Calendar, DollarSign, MessageCircle, ImageOff, Info } from 'lucide-react'

export default async function TournamentDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !tournament) {
    notFound()
  }

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

  const defaultWhatsappMessage = encodeURIComponent(`Hola, vengo de Torneos Scraper. Me interesa el torneo "${tournament.name}"!`)

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors w-fit group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Volver al listado</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Flyer (Izquierda) */}
        <div className="lg:col-span-5 h-[500px] relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
          {true ? (
            <Image
              src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop"
              alt={`Flyer de ${tournament.name}`}
              fill
              className={`object-cover ${tournament.status === 'cerrado' ? 'grayscale' : ''}`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
              <Trophy className="w-16 h-16 mb-4 stroke-1" />
              <span className="text-sm font-medium">Sin flyer disponible</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 text-sm font-bold rounded-lg border backdrop-blur-md ${statusColors[tournament.status as keyof typeof statusColors]}`}>
              {tournament.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Info (Derecha) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">{tournament.name}</h1>
            <div className="flex items-center gap-4 text-white/70">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {tournament.zone}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                {modalityLabels[tournament.sport_modality as keyof typeof modalityLabels]}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
            {tournament.price ? (
              <div>
                <span className="text-white/60 text-xs flex items-center gap-1 mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Precio del torneo
                </span>
                <p className="text-3xl font-bold text-emerald-400">
                  ${tournament.price} <span className="text-base text-white/40">{tournament.price_currency}</span>
                </p>
              </div>
            ) : (
              <div>
                <span className="text-white/60 text-xs flex items-center gap-1 mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Precio
                </span>
                <p className="text-lg text-white font-medium">Consultar</p>
              </div>
            )}

            <div className="h-px bg-white/10 w-full" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-white/60 text-xs flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Fecha de inicio
                </span>
                <p className="font-medium text-white">
                  {format(new Date(tournament.start_date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              {tournament.end_date && (
                <div>
                  <span className="text-white/60 text-xs flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Fecha de fin
                  </span>
                  <p className="font-medium text-white">
                    {format(new Date(tournament.end_date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {tournament.description && (
            <div>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                Sobre el torneo
              </h3>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                {tournament.description}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {tournament.contact_whatsapp && (
              <a
                href={`https://wa.me/${tournament.contact_whatsapp.replace(/[^0-9]/g, '')}?text=${defaultWhatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/10"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                Contactar por WhatsApp
              </a>
            )}
            
            {tournament.contact_instagram && (
              <a
                href={`https://instagram.com/${tournament.contact_instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Ver Instagram
              </a>
            )}

            {!tournament.contact_whatsapp && !tournament.contact_instagram && (
              <div className="w-full py-4 px-6 bg-white/5 border border-white/10 text-center rounded-xl text-white/40">
                El organizador no dejó datos de contacto directos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
