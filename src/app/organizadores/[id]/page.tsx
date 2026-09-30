import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, ArrowRight, Calendar, MapPin, Trophy, Users } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { ZONE_LABEL_EMBED, zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import { organizesSince, splitTournaments } from '@/utils/organizer-page'

// Página pública: la ve cualquiera, con o sin sesión. Por eso se piden solo
// las columnas que se muestran: ni el WhatsApp del perfil (vive aparte, en
// `profile_contacts`) ni el contacto de los torneos llegan a esta página.

interface OrganizerPageProps {
  params: Promise<{ id: string }>
}

interface OrganizerTournament {
  id: string
  name: string
  sport_modality: keyof typeof modalityLabels
  zones: ZoneLabelFields
  start_date: string
  end_date: string
  status: TournamentStatus
}

const modalityLabels = {
  futbol_5: 'Fútbol 5',
  futbol_7: 'Fútbol 7',
  futbol_8: 'Fútbol 8',
  futbol_11: 'Fútbol 11',
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
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-white/50 hover:text-brand-lime transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        <span>Volver al listado</span>
      </Link>

      <div className="border-b border-brand-border pb-6 flex items-center gap-5">
        <div className="w-20 h-20 shrink-0 bg-brand-surface border border-brand-border rounded-sm overflow-hidden flex items-center justify-center">
          {profile.avatar_url ? (
            // Todavía no hay bucket de fotos de perfil: cuando exista, pasar a
            // next/image y sumar su ruta a `remotePatterns` en next.config.ts.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-4xl font-bold text-brand-lime uppercase">
              {profile.display_name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="text-4xl md:text-5xl font-display tracking-widest font-bold text-white uppercase leading-none break-words">
            {profile.display_name}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono uppercase tracking-wider text-white/60">
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
          <p className="text-brand-red font-display text-sm tracking-wider uppercase">
            No pudimos cargar sus torneos. Probá de nuevo.
          </p>
        </div>
      ) : current.length === 0 && finished.length === 0 ? (
        <div className="p-12 border border-brand-border bg-brand-surface text-center flex flex-col items-center gap-4 rounded-sm">
          <div className="w-12 h-12 bg-brand-secondary border border-brand-border flex items-center justify-center">
            <Trophy className="w-6 h-6 text-brand-lime" />
          </div>
          <p className="text-xl font-bold font-display tracking-wider text-white uppercase">
            Todavía no publicó torneos
          </p>
        </div>
      ) : (
        <>
          {current.length > 0 && (
            <TournamentSection title="Torneos vigentes" tournaments={current} />
          )}
          {finished.length > 0 && (
            <TournamentSection title="Trayectoria" tournaments={finished} />
          )}
        </>
      )}
    </div>
  )
}

function TournamentSection({ title, tournaments }: { title: string; tournaments: OrganizerTournament[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display tracking-wider text-sm text-white/90 uppercase font-bold border-b border-brand-border pb-2">
        {title} <span className="text-white/40 font-mono">({tournaments.length})</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {tournaments.map((t) => (
          <li key={t.id}>
            <Link
              href={`/torneos/${t.id}`}
              className="p-4 bg-brand-surface border border-brand-border hover:border-brand-lime rounded-sm flex flex-col sm:flex-row sm:items-center gap-3 transition-colors group"
            >
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border font-display rounded-sm ${statusStyles[t.status]}`}>
                    {statusLabels[t.status]}
                  </span>
                  <p className="text-lg font-display font-bold tracking-wider text-white uppercase truncate">
                    {t.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-white/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-lime" />
                    {zoneLabel(t.zones)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-brand-lime" />
                    {modalityLabels[t.sport_modality]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-lime" />
                    {formatDate(t.start_date)} – {formatDate(t.end_date)}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-display font-bold uppercase tracking-wider text-white/60 group-hover:text-brand-lime">
                Ficha
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
