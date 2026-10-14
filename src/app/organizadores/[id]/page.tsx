import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, Calendar, MapPin, Trophy, Users } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { ZONE_LABEL_EMBED, zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import { organizesSince, splitTournaments } from '@/utils/organizer-page'
import { modalityLabel, type SportModality } from '@/utils/modality'
import { BackLink } from '@/components/BackLink'
import { avatarSrc } from '@/utils/profile-avatar'

// Página pública: la ve cualquiera, con o sin sesión. Por eso se piden solo
// las columnas que se muestran: ni el WhatsApp del perfil (vive aparte, en
// `profile_contacts`) ni el contacto de los torneos llegan a esta página.

interface OrganizerPageProps {
  params: Promise<{ id: string }>
}

interface OrganizerTournament {
  id: string
  name: string
  sport_modality: SportModality
  zones: ZoneLabelFields
  start_date: string
  end_date: string
  status: TournamentStatus
}

const formatDate = (date: string) =>
  format(new Date(date + 'T00:00:00'), "d MMM yyyy", { locale: es })

export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const supabase = await createClient()
  const { id } = await params

  // Un id que no es un uuid también da error: en los dos casos, 404.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`display_name, avatar_url, created_at, ${ZONE_LABEL_EMBED}`)
    .eq('id', id)
    .single()

  if (error || !profile) {
    notFound()
  }

  // `status` es una columna calculada: hay que pedirla explícitamente.
  const { data, error: tournamentsError } = await supabase
    .from('tournaments')
    .select(`id, name, sport_modality, ${ZONE_LABEL_EMBED}, start_date, end_date, status`)
    .eq('user_id', id)

  if (tournamentsError) {
    console.error(tournamentsError)
  }

  // Sin tipos generados de la base, supabase-js tipa todo embed como lista;
  // `zones` es una sola porque perfil y torneo tienen una FK a `zones`.
  const zone = profile.zones as unknown as ZoneLabelFields | null
  const avatarUrl = avatarSrc(profile.avatar_url, process.env.NEXT_PUBLIC_SUPABASE_URL!)
  const { current, finished } = splitTournaments(
    (data ?? []).map((t) => ({
      ...t,
      sport_modality: t.sport_modality as OrganizerTournament['sport_modality'],
      status: t.status as TournamentStatus,
      zones: t.zones as unknown as ZoneLabelFields,
    }))
  )

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <BackLink href="/" label="Volver al catálogo" />

      <div className="border-b border-brand-border pb-6 flex items-center gap-5">
        <div className="w-20 h-20 shrink-0 bg-brand-surface border border-brand-border rounded-sm overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-4xl font-bold text-brand-lime uppercase">
              {profile.display_name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="text-4xl md:text-5xl font-display tracking-widest font-bold text-foreground uppercase leading-none break-words">
            {profile.display_name}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-mono uppercase tracking-wider text-foreground/60">
            {zone && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-lime" />
                {zoneLabel(zone)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-lime" />
              {organizesSince(profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      {tournamentsError ? (
        <div className="p-8 border border-brand-red/40 bg-brand-red/5 text-center rounded-sm">
          <p className="text-brand-red font-sans text-sm tracking-wider uppercase">
            No pudimos cargar sus torneos. Probá de nuevo.
          </p>
        </div>
      ) : current.length === 0 && finished.length === 0 ? (
        <div className="p-12 border border-brand-border bg-brand-surface text-center flex flex-col items-center gap-4 rounded-sm">
          <div className="w-12 h-12 bg-brand-secondary border border-brand-border flex items-center justify-center">
            <Trophy className="w-6 h-6 text-brand-lime" />
          </div>
          <p className="text-xl font-bold font-sans tracking-wider text-foreground uppercase">
            Todavía no publicó torneos
          </p>
        </div>
      ) : (
        <>
          {current.length > 0 && (
            <TournamentSection title="Torneos vigentes" tournaments={current} />
          )}
          {finished.length > 0 && (
            <TournamentSection title="Trayectoria" tournaments={finished} muted />
          )}
        </>
      )}
    </div>
  )
}

// `muted`: los finalizados se ven más apagados, para que lo vigente mande.
function TournamentSection({ title, tournaments, muted = false }: { title: string; tournaments: OrganizerTournament[]; muted?: boolean }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display tracking-wider text-sm text-foreground/90 uppercase font-bold border-b border-brand-border pb-2">
        {title} <span className="text-foreground/70 font-mono">({tournaments.length})</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {tournaments.map((t) => (
          <li key={t.id}>
            <Link
              href={`/torneos/${t.id}`}
              className={`press p-4 border border-brand-border hover:border-brand-lime rounded-sm flex flex-col sm:flex-row sm:items-center gap-3 group ${
                muted ? 'bg-brand-secondary opacity-70 hover:opacity-100' : 'bg-brand-surface'
              }`}
            >
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 text-sm font-bold uppercase tracking-widest border font-sans rounded-sm ${statusStyles[t.status]}`}>
                    {statusLabels[t.status]}
                  </span>
                  <p className="text-lg font-sans font-bold tracking-wider text-foreground uppercase truncate">
                    {t.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-mono text-foreground/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-lime" />
                    {zoneLabel(t.zones)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-brand-lime" />
                    {modalityLabel(t.sport_modality)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-lime" />
                    {formatDate(t.start_date)} – {formatDate(t.end_date)}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-sans font-bold uppercase tracking-wider text-foreground/60 group-hover:text-brand-lime transition-colors">
                Ficha
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
