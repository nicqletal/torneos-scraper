import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Link2, Pencil, Trash2, Users } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { inscriptionErrorMessage, inscriptionsLabel, remainingSpots } from '@/utils/inscriptions'
import { zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import { SubmitButton } from '@/components/SubmitButton'
import { InscriptionForm } from './InscriptionForm'
import { TeamSearch } from './TeamSearch'
import { addInscription, removeInscription } from './actions'
import { BackLink } from '@/components/BackLink'

interface InscripcionesProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; q?: string }>
}

// Una fila de la gestión: por nombre (`team_name`) o vinculada (`teams`).
// El nombre de la vinculada sale del join, así sigue al equipo si se renombra.
interface InscriptionRow {
  id: string
  team_name: string | null
  team_id: string | null
  teams: { name: string; zones: ZoneLabelFields } | null
}

export default async function InscripcionesPage({ params, searchParams }: InscripcionesProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/mis-torneos/${id}/inscripciones`)
  }

  // Un torneo ajeno da 404, igual que uno que no existe. `status` e
  // `inscriptions_count` son columnas calculadas: hay que pedirlas.
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, capacity, status, inscriptions_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tournament) {
    notFound()
  }

  // La tabla, no la vista: es la gestión del organizador (policy de select).
  // El embed de `teams` trae nombre y zona de las vinculadas (lectura pública).
  const { data } = await supabase
    .from('inscriptions')
    .select('id, team_name, team_id, teams(name, zones(name, corridors(name)))')
    .eq('tournament_id', id)
    .order('created_at', { ascending: true })
  const inscriptions = (data ?? []) as unknown as InscriptionRow[]
  const linkedTeamIds = new Set(
    inscriptions.flatMap((i) => (i.team_id !== null ? [i.team_id] : []))
  )

  const status = tournament.status as TournamentStatus
  const count = tournament.inscriptions_count as number
  const capacity = tournament.capacity as number | null
  const remaining = remainingSpots(capacity, count)
  const finished = status === 'finalizado'
  const full = remaining === 0

  // `error` lo dejan el borrado y el alta vinculada al fallar; `q` es la
  // búsqueda de equipos, que así queda en la URL.
  const { error: errorCode, q } = await searchParams
  const urlError = errorCode !== undefined ? inscriptionErrorMessage(errorCode) : null

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <BackLink href="/mis-torneos" label="Mis torneos" />

      <div className="border-b border-brand-border pb-6 flex flex-col gap-3">
        <h1 className="text-5xl font-display tracking-widest font-bold text-white uppercase leading-none">
          Inscripciones
        </h1>
        <p className="text-white/60 text-xs tracking-wider uppercase font-mono">{tournament.name}</p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase">
          <span className={`px-2.5 py-1 border font-display font-bold tracking-widest rounded-sm ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-brand-border text-white/70 rounded-sm">
            <Users className="w-3.5 h-3.5 text-brand-lime" />
            {inscriptionsLabel(count, capacity)}
          </span>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 flex flex-col gap-4">
        <h2 className="font-display tracking-wider text-lg text-white uppercase border-b border-brand-border pb-2">
          Anotar un equipo
        </h2>
        <p className="text-white/50 text-xs leading-relaxed">
          Arreglá la inscripción con el capitán por WhatsApp y cargala acá: buscá su equipo en la app
          o, si no está, escribí el nombre.
        </p>

        {finished ? (
          <p className="text-[11px] font-mono uppercase text-white/50">
            Este torneo finalizó: sus inscripciones ya no cambian.
          </p>
        ) : full ? (
          <p className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase text-brand-amber">
            Cupo completo.
            <Link
              href={`/mis-torneos/${id}/editar`}
              className="inline-flex items-center gap-1 underline hover:text-white"
            >
              <Pencil className="w-3 h-3" />
              Subí el cupo desde Editar
            </Link>
            para anotar más equipos.
          </p>
        ) : (
          <>
            <TeamSearch tournamentId={id} q={q} linkedTeamIds={linkedTeamIds} />
            {urlError && (
              <p role="alert" className="animate-enter text-[11px] font-mono uppercase text-brand-red">
                {urlError}
              </p>
            )}
            <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
              <p className="text-[11px] font-mono uppercase text-white/50">Equipo que no está en la app</p>
              <InscriptionForm action={addInscription.bind(null, id)} />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display tracking-wider text-lg text-white uppercase border-b border-brand-border pb-2">
          Equipos anotados
        </h2>

        {urlError && (finished || full) && (
          <p role="alert" className="animate-enter text-[11px] font-mono uppercase text-brand-red">
            {urlError}
          </p>
        )}

        {inscriptions.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {inscriptions.map((inscription, index) => (
              <li
                key={inscription.id}
                className="flex items-center gap-3 px-4 py-3 bg-brand-surface border border-brand-border rounded-sm"
              >
                <span className="font-display text-xl text-brand-lime/40 font-bold w-8 shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {inscription.team_id !== null && inscription.teams ? (
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <Link
                      href={`/equipos/${inscription.team_id}`}
                      className="inline-flex items-center gap-1.5 text-white font-semibold text-sm truncate hover:text-brand-lime transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5 text-brand-lime shrink-0" />
                      {inscription.teams.name}
                    </Link>
                    <span className="text-[11px] font-mono uppercase text-white/50">
                      {zoneLabel(inscription.teams.zones)}
                    </span>
                  </div>
                ) : (
                  <span className="flex-1 text-white font-semibold text-sm">{inscription.team_name}</span>
                )}
                {!finished && (
                  <form action={removeInscription}>
                    <input type="hidden" name="tournament_id" value={id} />
                    <input type="hidden" name="id" value={inscription.id} />
                    <SubmitButton
                      pendingLabel={<><Trash2 className="w-3.5 h-3.5" />Borrando…</>}
                      className="press inline-flex items-center gap-1.5 px-3 py-2 border border-brand-border bg-brand-secondary text-white/80 hover:text-brand-red hover:border-brand-red text-xs font-display font-bold uppercase tracking-wider rounded-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Borrar
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="p-8 bg-brand-surface border border-dashed border-brand-border rounded-sm text-center text-white/50 text-sm">
            Todavía no hay equipos anotados.
          </p>
        )}
      </div>
    </div>
  )
}
