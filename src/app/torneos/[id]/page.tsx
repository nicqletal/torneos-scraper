import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Trophy, MapPin, Users, Calendar, DollarSign, MessageCircle, Info, ExternalLink, UserRound, ScrollText, CheckCircle2, ImageOff } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { priceLabel } from '@/utils/tournament-price'
import { ZONE_LABEL_EMBED, zoneLabel } from '@/utils/zones'
import { verificationAge } from '@/utils/tournament-verification'
import { VerificationBadge } from '@/components/VerificationBadge'
import { TournamentFlyer } from '@/components/TournamentFlyer'

interface TournamentDetailProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TournamentDetail({
  params,
  searchParams,
}: TournamentDetailProps) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select(`*, status, ${ZONE_LABEL_EMBED}`)
    .eq('id', id)
    .single()

  if (error || !tournament) {
    notFound()
  }

  // Torneo con organizador: su nombre enlaza a la página pública del organizador.
  // `user_id` apunta a auth.users (no a profiles), así que no se puede embeber:
  // va en una consulta aparte. Los torneos copiados no tienen organizador.
  const { data: organizer } = tournament.user_id
    ? await supabase.from('profiles').select('display_name').eq('id', tournament.user_id).maybeSingle()
    : { data: null }

  const status = tournament.status as TournamentStatus
  const verification = verificationAge(tournament.verified_at, status, new Date())

  // Recién publicado desde /crear-torneo: se le muestra al organizador cómo lo
  // ve la gente. Solo al dueño, por si comparte el link con el ?publicado=1.
  const { data: { user } } = await supabase.auth.getUser()
  const query = await searchParams
  const justPublished = query.publicado === '1' && user?.id === tournament.user_id
  // El alta salió pero la subida del flyer no (ver crear-torneo/actions.ts).
  const flyerFailed = justPublished && query.flyer === 'fallo'

  const modalityLabels = {
    futbol_5: 'Fútbol 5',
    futbol_7: 'Fútbol 7',
    futbol_8: 'Fútbol 8',
    futbol_11: 'Fútbol 11',
  }

  const formatDate = (date: string) =>
    format(new Date(date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })

  const defaultWhatsappMessage = encodeURIComponent(`Hola, vengo de Torneos Scraper. Me interesa el torneo "${tournament.name}"!`)

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      
      {justPublished && (
        <div role="status" className="flex items-center gap-3 px-4 py-3 border border-brand-lime bg-brand-lime/5 rounded-sm">
          <CheckCircle2 className="w-5 h-5 text-brand-lime shrink-0" />
          <p className="font-display tracking-wider uppercase text-brand-lime">Publicado. Así lo ve la gente</p>
        </div>
      )}

      {flyerFailed && (
        <div role="alert" className="flex items-center gap-3 px-4 py-3 border border-brand-amber bg-brand-amber/5 rounded-sm">
          <ImageOff className="w-5 h-5 text-brand-amber shrink-0" />
          <p className="text-sm text-brand-amber">
            No pudimos subir el flyer.{' '}
            <Link href={`/mis-torneos/${tournament.id}/editar`} className="underline hover:text-white">
              Probá de nuevo desde Editar
            </Link>
            .
          </p>
        </div>
      )}

      {/* Return link */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-white/50 hover:text-brand-lime transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        <span>Volver al listado</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Flyer (Left Column) */}
        <div className="lg:col-span-5 h-[500px] relative bg-brand-surface border border-brand-border rounded-sm overflow-hidden">
          <TournamentFlyer
            imageUrl={tournament.image_url}
            name={tournament.name}
            priority
            sizes="(max-width: 768px) 100vw, 400px"
            className={status === 'cerrado' ? 'grayscale opacity-60' : 'opacity-90'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/85 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border font-display rounded-sm ${statusStyles[status]}`}>
              {statusLabels[status]}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-[10px] text-white/40 font-mono">
            ID: {tournament.id}
          </div>
        </div>

        {/* Info Content (Right Column) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Header Title Info */}
          <div className="border-b border-brand-border pb-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-wider text-white uppercase mb-4 leading-tight">
              {tournament.name}
            </h1>
            
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-brand-lime rounded-sm uppercase">
                <MapPin className="w-3.5 h-3.5" />
                {zoneLabel(tournament.zones)}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-brand-lime rounded-sm uppercase">
                <Users className="w-3.5 h-3.5" />
                {modalityLabels[tournament.sport_modality as keyof typeof modalityLabels]}
              </span>
              {/* Torneo copiado: no tiene organizador en la app, solo el nombre del real */}
              {tournament.organizer_name && (
                <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-white/80 rounded-sm uppercase">
                  <UserRound className="w-3.5 h-3.5 text-brand-lime" />
                  Organiza {tournament.organizer_name}
                </span>
              )}
              {organizer && (
                <Link
                  href={`/organizadores/${tournament.user_id}`}
                  className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-white/80 hover:text-brand-lime hover:border-brand-lime rounded-sm uppercase transition-colors"
                >
                  <UserRound className="w-3.5 h-3.5 text-brand-lime" />
                  Organiza: {organizer.display_name}
                </Link>
              )}
              {verification && <VerificationBadge age={verification} className="px-3 py-1" />}
            </div>
          </div>

          {/* Pricing & Dates Panel */}
          <div className="p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-5">
            
            <div>
              <span className="text-white/40 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand-lime" />
                PRECIO DE INSCRIPCIÓN
              </span>
              <p className="text-4xl font-bold text-white font-mono leading-none">
                {priceLabel(tournament.price)}
              </p>
            </div>

            <div className="h-px bg-brand-border w-full" />
            
            {/* Cierre, inicio y fin (las tres son obligatorias) y cupo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['CIERRE DE INSCRIPCIÓN', tournament.inscription_deadline],
                ['FECHA DE INICIO', tournament.start_date],
                ['FECHA DE FINALIZACIÓN', tournament.end_date],
              ].map(([label, date]) => (
                <div key={label}>
                  <span className="text-white/40 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-lime" />
                    {label}
                  </span>
                  <p className="font-semibold text-white text-sm">{formatDate(date)}</p>
                </div>
              ))}

              {tournament.capacity && (
                <div>
                  <span className="text-white/40 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-lime" />
                    CUPO
                  </span>
                  <p className="font-semibold text-white text-sm">{tournament.capacity} equipos</p>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          {tournament.description && (
            <div className="flex flex-col gap-3">
              <h3 className="font-display tracking-wider text-sm text-white/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
                <Info className="w-4 h-4 text-brand-lime" />
                SOBRE EL TORNEO
              </h3>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans pl-3 border-l-2 border-brand-lime/30">
                {tournament.description}
              </p>
            </div>
          )}

          {tournament.rules && (
            <div className="flex flex-col gap-3">
              <h3 className="font-display tracking-wider text-sm text-white/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
                <ScrollText className="w-4 h-4 text-brand-lime" />
                REGLAMENTO
              </h3>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans pl-3 border-l-2 border-brand-lime/30">
                {tournament.rules}
              </p>
            </div>
          )}

          {/* Sede: si hay dirección se muestra con un link al mapa; si no, alcanza con la zona de arriba */}
          {tournament.venue_address && (
            <div className="flex flex-col gap-3">
              <h3 className="font-display tracking-wider text-sm text-white/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
                <MapPin className="w-4 h-4 text-brand-lime" />
                SEDE
              </h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.venue_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/80 hover:text-brand-lime text-sm pl-3 w-fit"
              >
                {tournament.venue_address}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {tournament.contact_whatsapp && (
              <a
                href={`https://wa.me/${tournament.contact_whatsapp.replace(/[^0-9]/g, '')}?text=${defaultWhatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-4 px-6 bg-brand-lime hover:bg-white text-brand-bg hover:text-brand-bg transition-all duration-200 font-display font-bold uppercase tracking-wider text-sm rounded-sm shadow-md cursor-pointer group"
              >
                <MessageCircle className="w-4.5 h-4.5 fill-current" />
                Contactar por WhatsApp
              </a>
            )}
            
            {tournament.contact_instagram && (
              <a
                href={`https://instagram.com/${tournament.contact_instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-4 px-6 bg-brand-surface border border-brand-border hover:bg-brand-secondary text-white hover:text-brand-lime transition-all duration-200 font-display font-bold uppercase tracking-wider text-sm rounded-sm shadow-md cursor-pointer"
              >
                <ExternalLink className="w-4.5 h-4.5" />
                Ver Instagram
              </a>
            )}

            {!tournament.contact_whatsapp && !tournament.contact_instagram && (
              <div className="w-full py-4 px-6 bg-brand-surface border border-brand-border text-center rounded-sm text-white/30 text-xs font-mono uppercase">
                El organizador no suministró datos de contacto directo.
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
