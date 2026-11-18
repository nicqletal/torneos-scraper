import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Ban, Check, Link2, MessageCircle, X } from 'lucide-react'
import type { TournamentStatus } from '@/utils/tournament-status'
import { inscriptionErrorMessage, remainingSpots } from '@/utils/inscriptions'
import { managePath } from '@/utils/tournament-manage'
import { zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import { levelLabel } from '@/utils/teams'
import { whatsappLink } from '@/utils/whatsapp'
import { resolveRequestErrorMessage } from '@/utils/inscription-requests'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmButton } from '@/components/ConfirmButton'
import { TeamCrest } from '@/components/TeamCrest'
import { dangerButtonClass, errorTextClass, secondaryButtonClass } from '@/components/button-styles'
import { InscriptionForm } from './inscripciones/InscriptionForm'
import { TeamSearch } from './inscripciones/TeamSearch'
import {
  acceptInscriptionRequest,
  addInscription,
  rejectInscriptionRequest,
  removeInscription,
} from './inscripciones/actions'

interface InscripcionesTabProps {
  id: string
  name: string
  status: TournamentStatus
  count: number
  capacity: number | null
  // La búsqueda de equipos, que así queda en la URL.
  q: string | undefined
  // Lo dejan la baja de una inscripción y el alta vinculada al fallar.
  errorCode: string | undefined
  // Lo dejan aceptar y rechazar una solicitud al fallar.
  requestErrorCode: string | undefined
}

// Una fila de la gestión: por nombre (`team_name`) o vinculada (`teams`).
// El nombre de la vinculada sale del join, así sigue al equipo si se renombra.
interface InscriptionRow {
  id: string
  team_name: string | null
  team_id: string | null
  teams: { name: string; zones: ZoneLabelFields } | null
}

// Una Solicitud de inscripción pendiente, con lo que el organizador necesita
// para decidir. Todo lo del equipo es público (página del equipo).
interface RequestRow {
  id: string
  created_at: string
  teams: {
    id: string
    name: string
    crest_url: string | null
    level: string
    player_count: number
    zones: ZoneLabelFields
  }
}

// Botón de WhatsApp al capitán. El número sale de `tournament_captain_whatsapps`,
// que solo se lo da al organizador del torneo.
function CaptainWhatsapp({ whatsapp, teamName, tournamentName }: { whatsapp: string; teamName: string; tournamentName: string }) {
  return (
    <a
      href={whatsappLink(whatsapp, `Hola, te escribo por la inscripción de ${teamName} en "${tournamentName}" (Matchmaking).`)}
      target="_blank"
      rel="noopener noreferrer"
      className={secondaryButtonClass}
      aria-label={`WhatsApp del capitán de ${teamName}`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      WhatsApp
    </a>
  )
}

// Pestaña "Inscripciones" de la pantalla de gestión. Que el torneo es del que
// mira ya lo comprobó la página antes de renderizar esto.
export async function InscripcionesTab({ id, name, status, count, capacity, q, errorCode, requestErrorCode }: InscripcionesTabProps) {
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

  // Solicitudes pendientes, de la más vieja a la más nueva. Con el torneo
  // Finalizado ya no se aceptan, así que no se muestran.
  const { data: requestData } = await supabase
    .from('inscription_requests')
    .select('id, created_at, teams(id, name, crest_url, level, player_count, zones(name, corridors(name)))')
    .eq('tournament_id', id)
    .eq('status', 'pendiente')
    .order('created_at', { ascending: true })
  const requests = (requestData ?? []) as unknown as RequestRow[]

  // Faltas y conflictos de cada equipo que solicitó (vista pública).
  const { data: recordData } = requests.length > 0
    ? await supabase
        .from('team_record')
        .select('team_id, faults, conflicts')
        .in('team_id', requests.map((r) => r.teams.id))
    : { data: [] }
  const records = new Map(
    (recordData ?? []).map((r) => [r.team_id as string, r as { faults: number; conflicts: number }])
  )

  // WhatsApp del capitán actual de cada equipo con solicitud pendiente o
  // inscripción vinculada (vacío si el torneo finalizó).
  const { data: whatsappData } = await supabase.rpc('tournament_captain_whatsapps', { p_tournament_id: id })
  const whatsapps = new Map(
    ((whatsappData ?? []) as { team_id: string; whatsapp: string }[]).map((w) => [w.team_id, w.whatsapp])
  )

  const finished = status === 'finalizado'
  const full = remainingSpots(capacity, count) === 0
  const urlError = errorCode !== undefined ? inscriptionErrorMessage(errorCode) : null
  const requestError = requestErrorCode !== undefined ? resolveRequestErrorMessage(requestErrorCode) : null

  return (
    <div className="flex flex-col gap-8">
      {/* Con un error se muestra aunque ya no quede ninguna (el capitán retiró
          la última, o el torneo finalizó con la pestaña abierta): si no, el
          mensaje se perdería. */}
      {((!finished && requests.length > 0) || requestError) && (
        <div className="flex flex-col gap-3">
          <h2 className="font-display tracking-wider text-lg text-foreground uppercase border-b border-brand-border pb-2">
            Solicitudes
          </h2>
          <p className="text-foreground/70 text-xs leading-relaxed">
            Escribile al capitán para arreglar el pago. Aceptarla inscribe al equipo; rechazarla no se puede deshacer.
          </p>
          {requestError && (
            <p role="alert" className={`animate-enter ${errorTextClass}`}>
              {requestError}
            </p>
          )}
          <ol className="flex flex-col gap-2">
            {(finished ? [] : requests).map((request) => {
              const team = request.teams
              const record = records.get(team.id)
              const whatsapp = whatsapps.get(team.id)
              return (
                <li
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-brand-surface border border-brand-border rounded-sm"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <TeamCrest name={team.name} src={team.crest_url} />
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <Link
                        href={`/equipos/${team.id}`}
                        className="text-foreground font-semibold text-sm truncate hover:text-brand-lime transition-colors"
                      >
                        {team.name}
                      </Link>
                      <span className="text-[11px] font-mono uppercase text-foreground/70">
                        {zoneLabel(team.zones)} · {levelLabel(team.level)} · {team.player_count}{' '}
                        {team.player_count === 1 ? 'jugador' : 'jugadores'}
                      </span>
                      <span className="text-[11px] font-mono uppercase text-foreground/70">
                        {record?.faults ?? 0} {record?.faults === 1 ? 'falta' : 'faltas'} ·{' '}
                        {record?.conflicts ?? 0} {record?.conflicts === 1 ? 'conflicto' : 'conflictos'} · llegó{' '}
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {whatsapp && <CaptainWhatsapp whatsapp={whatsapp} teamName={team.name} tournamentName={name} />}
                    <form action={acceptInscriptionRequest}>
                      <input type="hidden" name="tournament_id" value={id} />
                      <input type="hidden" name="request_id" value={request.id} />
                      <SubmitButton
                        pendingLabel={<><Check className="w-3.5 h-3.5" />Aceptando…</>}
                        className={`${secondaryButtonClass} cursor-pointer`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aceptar
                      </SubmitButton>
                    </form>
                    <form action={rejectInscriptionRequest}>
                      <input type="hidden" name="tournament_id" value={id} />
                      <input type="hidden" name="request_id" value={request.id} />
                      <ConfirmButton
                        message={`¿Rechazar la solicitud de ${team.name}? No se puede deshacer: el equipo no va a poder volver a solicitar en este torneo.`}
                        className={`${dangerButtonClass} cursor-pointer`}
                      >
                        <X className="w-3.5 h-3.5" />
                        Rechazar
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

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
              // En mobile los botones (WhatsApp y Dar de baja) bajan juntos a
              // otra línea en vez de empujar el ancho de la página.
              <li
                key={inscription.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 bg-brand-surface border border-brand-border rounded-sm"
              >
                <span className="font-display text-xl text-brand-lime/40 font-bold w-8 shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {inscription.team_id !== null && inscription.teams ? (
                  <div className="flex-1 min-w-40 flex flex-col gap-0.5">
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
                  <span className="flex-1 min-w-40 text-foreground font-semibold text-sm">{inscription.team_name}</span>
                )}
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  {inscription.team_id !== null && inscription.teams && whatsapps.has(inscription.team_id) && (
                    <CaptainWhatsapp
                      whatsapp={whatsapps.get(inscription.team_id)!}
                      teamName={inscription.teams.name}
                      tournamentName={name}
                    />
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
                </div>
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
