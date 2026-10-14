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
import { modalityLabel } from '@/utils/modality'
import { whatsappLink } from '@/utils/whatsapp'

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

  const formatDate = (date: string) =>
    format(new Date(date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })

  const defaultWhatsappMessage = `Hola, vengo de Torneos Scraper. Me interesa el torneo "${tournament.name}"!`

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      
      {justPublished && (
        <div role="status" className="animate-enter flex items-center gap-3 px-4 py-3 border border-brand-lime bg-brand-lime/5 rounded-sm">
          <CheckCircle2 className="w-5 h-5 text-brand-lime shrink-0" />
          <p className="font-sans tracking-wider uppercase text-brand-lime">Publicado. Así lo ve la gente</p>
        </div>
      )}

      {flyerFailed && (
        <div role="alert" className="animate-enter flex items-center gap-3 px-4 py-3 border border-brand-amber bg-brand-amber/5 rounded-sm">
          <ImageOff className="w-5 h-5 text-brand-amber shrink-0" />
          <p className="text-sm text-brand-amber">
            No pudimos subir el flyer.{' '}
            <Link href={`/mis-torneos/${tournament.id}/editar`} className="underline hover:text-foreground">
              Probá de nuevo desde Editar
            </Link>
            .
          </p>
        </div>
      )}

      {/* Return link */}
      <Link 
        href="/torneos"
        className="ui-action inline-flex items-center gap-2 text-sm font-display font-bold uppercase tracking-wider text-foreground/70 hover:text-brand-lime transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        <span>Volver al listado</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Flyer (Left Column) */}
        {/* 4:5 es la proporción de un posteo de Instagram, de donde salen los flyers.
            Se muestra entero (contain): recortarlo tapa fechas y premios. */}
        <div className="lg:col-span-5 lg:self-start aspect-[4/5] relative bg-brand-surface border border-brand-border rounded-sm overflow-hidden">
          <TournamentFlyer
            imageUrl={tournament.image_url}
            name={tournament.name}
            priority
            fit="contain"
            sizes="(max-width: 1024px) 100vw, 400px"
            className={status === 'cerrado' ? 'grayscale opacity-60' : undefined}
          />

          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 text-sm font-bold uppercase tracking-wider border font-sans rounded-sm ${statusStyles[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
        </div>

        {/* Info Content (Right Column) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Header Title Info */}
          <div className="border-b border-brand-border pb-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-wider text-foreground uppercase mb-4 leading-tight">
              {tournament.name}
            </h1>
            
            <div className="flex flex-wrap gap-2 text-sm font-mono">
              <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-brand-lime rounded-sm uppercase">
                <MapPin className="w-3.5 h-3.5" />
                {zoneLabel(tournament.zones)}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-brand-lime rounded-sm uppercase">
                <Users className="w-3.5 h-3.5" />
                {modalityLabel(tournament.sport_modality)}
              </span>
              {/* Torneo copiado: no tiene organizador en la app, solo el nombre del real */}
              {tournament.organizer_name && (
                <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-foreground/80 rounded-sm uppercase">
                  <UserRound className="w-3.5 h-3.5 text-brand-lime" />
                  Organiza {tournament.organizer_name}
                </span>
              )}
              {organizer && (
                <Link
                  href={`/organizadores/${tournament.user_id}`}
                  className="press flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-foreground/80 hover:text-brand-lime hover:border-brand-lime rounded-sm uppercase"
                >
                  <UserRound className="w-3.5 h-3.5 text-brand-lime" />
                  Organiza {organizer.display_name}
                </Link>
              )}
              {verification && <VerificationBadge age={verification} className="px-3 py-1" />}
            </div>
          </div>

          {/* Pricing & Dates Panel */}
          <div className="p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-5">
            
            <div>
              <span className="text-foreground/70 text-sm uppercase tracking-wider font-sans flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand-lime" />
                PRECIO DE INSCRIPCIÓN
              </span>
              <p className="text-4xl font-bold text-foreground font-sans leading-none">
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
                  <span className="text-foreground/70 text-sm uppercase tracking-wider font-sans flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-lime" />
                    {label}
                  </span>
                  <p className="font-semibold text-foreground text-sm">{formatDate(date)}</p>
                </div>
              ))}

              {tournament.capacity && (
                <div>
                  <span className="text-foreground/70 text-sm uppercase tracking-wider font-sans flex items-center gap-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-lime" />
                    CUPO
                  </span>
                  <p className="font-semibold text-foreground text-sm">{tournament.capacity} equipos</p>
                </div>
              )}
            </div>
          </div>

          {/* Contacto: es donde termina el flujo (la app no inscribe), así que va
              justo después de precio y fechas, sin tener que leer el reglamento. */}
          <div className="flex flex-col sm:flex-row gap-4">
            {tournament.contact_whatsapp && (
              <a
                href={whatsappLink(tournament.contact_whatsapp, defaultWhatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-action flex-1 inline-flex items-center justify-center gap-2 py-4 px-6 press bg-brand-lime hover:bg-foreground text-brand-bg font-display font-bold uppercase tracking-wider text-sm rounded-sm shadow-md cursor-pointer"
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
                className="ui-action flex-1 inline-flex items-center justify-center gap-2 py-4 px-6 press bg-brand-surface border border-brand-border hover:bg-brand-secondary hover:border-brand-lime text-foreground hover:text-brand-lime font-display font-bold uppercase tracking-wider text-sm rounded-sm shadow-md cursor-pointer"
              >
                <ExternalLink className="w-4.5 h-4.5" />
                Ver Instagram
              </a>
            )}

            {!tournament.contact_whatsapp && !tournament.contact_instagram && (
              <div className="w-full py-4 px-6 bg-brand-surface border border-brand-border text-center rounded-sm text-foreground/70 text-sm font-mono uppercase">
                El organizador no suministró datos de contacto directo.
              </div>
            )}
          </div>

          {/* Description Section */}
          {tournament.description && (
            <div className="flex flex-col gap-3">
              <h3 className="font-display tracking-wider text-sm text-foreground/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
                <Info className="w-4 h-4 text-brand-lime" />
                SOBRE EL TORNEO
              </h3>
              <p className="text-foreground/70 text-sm leading-relaxed whitespace-pre-wrap font-sans pl-3 border-l-2 border-brand-lime/30">
                {tournament.description}
              </p>
            </div>
          )}

          {tournament.rules && (
            <div className="flex flex-col gap-3">
              <h3 className="font-display tracking-wider text-sm text-foreground/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
                <ScrollText className="w-4 h-4 text-brand-lime" />
                REGLAMENTO
              </h3>
              <p className="text-foreground/70 text-sm leading-relaxed whitespace-pre-wrap font-sans pl-3 border-l-2 border-brand-lime/30">
                {tournament.rules}
              </p>
            </div>
          )}

          {/* Sede: si hay dirección se muestra con un link al mapa; si no, alcanza con la zona de arriba */}
          {tournament.venue_address && (
            <div className="flex flex-col gap-3">
              <h3 className="font-display tracking-wider text-sm text-foreground/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
                <MapPin className="w-4 h-4 text-brand-lime" />
                SEDE
              </h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.venue_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-action inline-flex items-center gap-2 text-foreground/80 hover:text-brand-lime text-sm pl-3 w-fit transition-colors"
              >
                {tournament.venue_address}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
