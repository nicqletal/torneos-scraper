import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Users, Calendar, DollarSign, MessageCircle, Info, ExternalLink, UserRound, ScrollText, CheckCircle2, ImageOff, ClipboardList } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { priceLabel } from '@/utils/tournament-price'
import { ZONE_LABEL_EMBED, zoneLabel } from '@/utils/zones'
import { verificationAge } from '@/utils/tournament-verification'
import { VerificationBadge } from '@/components/VerificationBadge'
import { TournamentFlyer } from '@/components/TournamentFlyer'
import { hasFlyer } from '@/utils/tournament-flyer'
import { modalityLabel } from '@/utils/modality'
import { whatsappLink } from '@/utils/whatsapp'
import { inscriptionsLabel, isLastSpots } from '@/utils/inscriptions'
import { LastSpotsBadge } from '@/components/LastSpotsBadge'
import { BackLink } from '@/components/BackLink'

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
    .select(`*, status, inscriptions_count, ${ZONE_LABEL_EMBED}`)
    .eq('id', id)
    .single()

  if (error || !tournament) {
    notFound()
  }

  // El nombre del organizador enlaza a su página pública. `user_id` apunta a
  // auth.users (no a profiles), así que no se puede embeber: va en una consulta aparte.
  const { data: organizer } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', tournament.user_id)
    .maybeSingle()

  const status = tournament.status as TournamentStatus
  const verification = verificationAge(tournament.verified_at, status, new Date())
  const inscriptionsCount = tournament.inscriptions_count as number
  const lastSpots = isLastSpots(status, tournament.capacity, inscriptionsCount)

  // Los inscriptos son públicos, solo por su nombre: salen de la vista
  // `tournament_inscriptions`, no de la tabla (ver "Visibilidad"). `team_id`
  // viene en las vinculadas, para enlazar a la página pública del equipo.
  const { data: inscriptions } = await supabase
    .from('tournament_inscriptions')
    .select('id, team_name, team_id')
    .eq('tournament_id', id)
    .order('created_at', { ascending: true })

  // Recién publicado desde /crear-torneo: se le muestra al organizador cómo lo
  // ve la gente. Solo al dueño, por si comparte el link con el ?publicado=1.
  const { data: { user } } = await supabase.auth.getUser()
  const query = await searchParams
  const isOwner = user?.id === tournament.user_id
  const justPublished = query.publicado === '1' && isOwner
  // El alta salió pero la subida del flyer no (ver crear-torneo/actions.ts).
  const flyerFailed = justPublished && query.flyer === 'fallo'

  const formatDate = (date: string) =>
    format(new Date(date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })

  const defaultWhatsappMessage = `Hola, vengo de Torneos Scraper. Me interesa el torneo "${tournament.name}"!`

  // La ficha se arma en bloques porque el orden cambia según haya flyer o no
  // (ver el `return`). Se usa `hasFlyer`, igual que <TournamentFlyer>: un
  // `image_url` que no es de nuestro bucket cuenta como "sin flyer".
  const withFlyer = hasFlyer(tournament.image_url)

  // Estado y "Últimos cupos": van sobre el flyer, o arriba del título si no hay.
  const statusBadges = (
    <>
      <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border font-display rounded-sm ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
      {lastSpots && <LastSpotsBadge className="px-3 py-1.5 text-xs" />}
    </>
  )

  // Título y chips: zona, modalidad, organizador (link a su página pública) y verificación
  const header = (
    <div className="border-b border-brand-border pb-4">
      <h1 className="text-4xl md:text-5xl font-display font-bold tracking-wider text-foreground uppercase mb-4 leading-tight">
        {tournament.name}
      </h1>
      
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-brand-lime rounded-sm uppercase">
          <MapPin className="w-3.5 h-3.5" />
          {zoneLabel(tournament.zones)}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-brand-lime rounded-sm uppercase">
          <Users className="w-3.5 h-3.5" />
          {modalityLabel(tournament.sport_modality)}
        </span>
        {organizer && (
          <Link
            href={`/organizadores/${tournament.user_id}`}
            className="press flex items-center gap-1.5 px-3 py-1 border border-brand-border bg-brand-secondary/40 text-foreground/80 hover:text-brand-lime hover:border-brand-lime rounded-sm uppercase"
          >
            <UserRound className="w-3.5 h-3.5 text-brand-lime" />
            <span className="sr-only">Organizador: </span>
            {organizer.display_name}
          </Link>
        )}
        {verification && <VerificationBadge age={verification} className="px-3 py-1" />}
      </div>
    </div>
  )

  // Precio, fechas y cupo
  const pricing = (
    <div className="p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-5">
      
      <div>
        <span className="text-foreground/60 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
          <DollarSign className="w-3.5 h-3.5 text-brand-lime" />
          PRECIO DE INSCRIPCIÓN
        </span>
        <p className="text-4xl font-bold text-foreground font-mono leading-none">
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
            <span className="text-foreground/60 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-lime" />
              {label}
            </span>
            <p className="font-semibold text-foreground text-sm">{formatDate(date)}</p>
          </div>
        ))}

        {/* Con cupo: "3/8 equipos"; sin cupo, cuántos hay anotados */}
        <div>
          <span className="text-foreground/60 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
            <Users className="w-3.5 h-3.5 text-brand-lime" />
            {tournament.capacity ? 'CUPO' : 'INSCRIPTOS'}
          </span>
          <p className="font-semibold text-foreground text-sm">
            {inscriptionsLabel(inscriptionsCount, tournament.capacity)}
          </p>
        </div>
      </div>
    </div>
  )

  // Contacto: es donde termina el flujo (la app no inscribe), así que va
  // justo después de precio y fechas, sin tener que leer el reglamento.
  const contact = (
    <div className="flex flex-col sm:flex-row gap-4">
      {tournament.contact_whatsapp && (
        <a
          href={whatsappLink(tournament.contact_whatsapp, defaultWhatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 py-4 px-6 press bg-brand-lime hover:bg-foreground text-brand-bg font-display font-bold uppercase tracking-wider text-sm rounded-sm shadow-md cursor-pointer"
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
          className="flex-1 inline-flex items-center justify-center gap-2 py-4 px-6 press bg-brand-surface border border-brand-border hover:bg-brand-secondary hover:border-brand-lime text-foreground hover:text-brand-lime font-display font-bold uppercase tracking-wider text-sm rounded-sm shadow-md cursor-pointer"
        >
          <ExternalLink className="w-4.5 h-4.5" />
          Ver Instagram
        </a>
      )}

      {!tournament.contact_whatsapp && !tournament.contact_instagram && (
        <div className="w-full py-4 px-6 bg-brand-surface border border-brand-border text-center rounded-sm text-foreground/30 text-xs font-mono uppercase">
          El organizador no suministró datos de contacto directo.
        </div>
      )}
    </div>
  )

  // Equipos inscriptos: solo los nombres, para que quien busca sepa quién juega
  const teams = inscriptions && inscriptions.length > 0 && (
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-sm text-foreground/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
          <ClipboardList className="w-4 h-4 text-brand-lime" />
          EQUIPOS ANOTADOS
        </h3>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3 border-l-2 border-brand-lime/30">
          {inscriptions.map((inscription, index) => (
            <li key={inscription.id} className="flex items-center gap-2 text-sm text-foreground/80">
              <span className="font-display text-brand-lime/50 font-bold w-6 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              {inscription.team_id ? (
                <Link
                  href={`/equipos/${inscription.team_id}`}
                  className="hover:text-brand-lime underline decoration-brand-lime/30 underline-offset-4 transition-colors"
                >
                  {inscription.team_name}
                </Link>
              ) : (
                inscription.team_name
              )}
            </li>
          ))}
        </ol>
      </div>
  )

  // Descripción
  const description = tournament.description && (
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-sm text-foreground/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
          <Info className="w-4 h-4 text-brand-lime" />
          SOBRE EL TORNEO
        </h3>
        <p className="text-foreground/70 text-sm leading-relaxed whitespace-pre-wrap font-sans pl-3 border-l-2 border-brand-lime/30">
          {tournament.description}
        </p>
      </div>
  )

  // Reglamento
  const rules = tournament.rules && (
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-sm text-foreground/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
          <ScrollText className="w-4 h-4 text-brand-lime" />
          REGLAMENTO
        </h3>
        <p className="text-foreground/70 text-sm leading-relaxed whitespace-pre-wrap font-sans pl-3 border-l-2 border-brand-lime/30">
          {tournament.rules}
        </p>
      </div>
  )

  // Sede: si hay dirección se muestra con un link al mapa; si no, alcanza con la zona de arriba
  const venue = tournament.venue_address && (
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-sm text-foreground/90 uppercase flex items-center gap-2 font-bold border-b border-brand-border pb-2">
          <MapPin className="w-4 h-4 text-brand-lime" />
          SEDE
        </h3>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.venue_address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-foreground/80 hover:text-brand-lime text-sm pl-3 w-fit transition-colors"
        >
          {tournament.venue_address}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
  )

  return (
    <div className={`${withFlyer ? 'max-w-5xl' : 'max-w-3xl'} mx-auto flex flex-col gap-8`}>
      
      {/* Barra de dueño: lo único que cambia en la ficha para el organizador
          del torneo. Editar, inscripciones y baja viven en la pantalla de gestión. */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 border border-brand-border bg-brand-surface rounded-sm text-xs font-display font-bold uppercase tracking-wider">
          <span className="text-foreground/60">Este torneo es tuyo</span>
          <span aria-hidden="true" className="text-foreground/30">·</span>
          <Link href={`/mis-torneos/${tournament.id}`} className="text-brand-lime hover:text-foreground transition-colors">
            Gestionar
          </Link>
        </div>
      )}

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
            <Link href={`/mis-torneos/${tournament.id}`} className="underline hover:text-foreground">
              Probá de nuevo desde Gestionar
            </Link>
            .
          </p>
        </div>
      )}

      {/* Return link */}
      <BackLink href="/" label="Volver al catálogo" />

      {withFlyer ? (
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

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {statusBadges}
            </div>
          </div>

          {/* Info Content (Right Column) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {header}
            {pricing}
            {contact}
            {teams}
            {description}
            {rules}
            {venue}
          </div>
        </div>
      ) : (
        // Sin flyer no hay columna izquierda ni placeholder: una sola columna.
        // El contacto es el fin del flujo, así que va apenas se sabe cuánto
        // sale, cuándo y dónde se juega; la descripción, los anotados y el
        // reglamento quedan debajo, para el que quiere leer más.
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {statusBadges}
          </div>
          {header}
          {pricing}
          {venue}
          {contact}
          {description}
          {teams}
          {rules}
        </div>
      )}
    </div>
  )
}
