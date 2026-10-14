import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Ban, Link2 } from 'lucide-react'
import type { TournamentStatus } from '@/utils/tournament-status'
import { inscriptionErrorMessage, remainingSpots } from '@/utils/inscriptions'
import { managePath } from '@/utils/tournament-manage'
import { zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import { SubmitButton } from '@/components/SubmitButton'
import { dangerButtonClass, errorTextClass } from '@/components/button-styles'
import { InscriptionForm } from './inscripciones/InscriptionForm'
import { TeamSearch } from './inscripciones/TeamSearch'
import { addInscription, removeInscription } from './inscripciones/actions'

interface InscripcionesTabProps {
  id: string
  status: TournamentStatus
  count: number
  capacity: number | null
  // La búsqueda de equipos, que así queda en la URL.
  q: string | undefined
  // Lo dejan la baja de una inscripción y el alta vinculada al fallar.
  errorCode: string | undefined
}

// Una fila de la gestión: por nombre (`team_name`) o vinculada (`teams`).
// El nombre de la vinculada sale del join, así sigue al equipo si se renombra.
interface InscriptionRow {
  id: string
  team_name: string | null
  team_id: string | null
  teams: { name: string; zones: ZoneLabelFields } | null
}

// Pestaña "Inscripciones" de la pantalla de gestión. Que el torneo es del que
// mira ya lo comprobó la página antes de renderizar esto.
export async function InscripcionesTab({ id, status, count, capacity, q, errorCode }: InscripcionesTabProps) {
  const supabase = await createClient()

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

  const finished = status === 'finalizado'
  const full = remainingSpots(capacity, count) === 0
  const urlError = errorCode !== undefined ? inscriptionErrorMessage(errorCode) : null

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 flex flex-col gap-4">
        <h2 className="font-display tracking-wider text-lg text-foreground uppercase border-b border-brand-border pb-2">
          Anotar un equipo
        </h2>
        <p className="text-foreground/70 text-xs leading-relaxed">
          Arreglá la inscripción con el capitán por WhatsApp y cargala acá buscando su equipo en la app.
        </p>

        {finished ? (
          <p className="text-[11px] font-mono uppercase text-foreground/70">
            Este torneo finalizó: sus inscripciones ya no cambian.
          </p>
        ) : full ? (
          <p className="text-[11px] font-mono uppercase text-brand-amber">
            Cupo completo.{' '}
            <Link href={managePath(id, 'datos')} className="underline hover:text-foreground">
              Subí el cupo desde Datos
            </Link>{' '}
            para anotar más equipos.
          </p>
        ) : (
          <>
            <TeamSearch tournamentId={id} q={q} linkedTeamIds={linkedTeamIds} />
            {urlError && (
              <p role="alert" className={`animate-enter ${errorTextClass}`}>
                {urlError}
              </p>
            )}
            {/* La inscripción por nombre es el camino secundario: un link que
                despliega el campo. <details> lo hace sin JavaScript. */}
            <details className="group border-t border-brand-border pt-4">
              <summary className="w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs text-foreground/70 underline underline-offset-4 hover:text-brand-lime transition-colors">
                ¿El equipo no está en la app? Anotalo solo con el nombre
              </summary>
              <div className="pt-3">
                <InscriptionForm action={addInscription.bind(null, id)} />
              </div>
            </details>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display tracking-wider text-lg text-foreground uppercase border-b border-brand-border pb-2">
          Equipos anotados
        </h2>

        {urlError && (finished || full) && (
          <p role="alert" className={`animate-enter ${errorTextClass}`}>
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
                      className="inline-flex items-center gap-1.5 text-foreground font-semibold text-sm truncate hover:text-brand-lime transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5 text-brand-lime shrink-0" />
                      {inscription.teams.name}
                    </Link>
                    <span className="text-[11px] font-mono uppercase text-foreground/70">
                      {zoneLabel(inscription.teams.zones)}
                    </span>
                  </div>
                ) : (
                  <span className="flex-1 text-foreground font-semibold text-sm">{inscription.team_name}</span>
                )}
                {!finished && (
                  <form action={removeInscription}>
                    <input type="hidden" name="tournament_id" value={id} />
                    <input type="hidden" name="id" value={inscription.id} />
                    <SubmitButton
                      pendingLabel={<><Ban className="w-3.5 h-3.5" />Dando de baja…</>}
                      className={`${dangerButtonClass} cursor-pointer`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Dar de baja
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="p-8 bg-brand-surface border border-dashed border-brand-border rounded-sm text-center text-foreground/70 text-sm">
            Todavía no hay equipos anotados.
          </p>
        )}
      </div>
    </div>
  )
}
