// Solicitudes de inscripción: lo que ve el capitán en la ficha del torneo, por
// cada uno de sus equipos (ver "Solicitudes de inscripción" en
// docs/especificaciones-y-requerimientos/decisiones-casos-de-uso.md).
// Es TypeScript puro (sin Next ni Supabase) para poder testearlo con `pnpm test`.
// Las reglas de verdad viven en la base (`request_inscription` y compañía):
// esto decide qué mostrar.
import type { TournamentStatus } from './tournament-status.ts'
import { inscriptionErrorMessage } from './inscriptions.ts'

export interface CaptainTeam {
  id: string
  name: string
  dissolved: boolean
}

// Una fila de `inscription_requests` que el capitán ve por RLS.
export interface TeamRequest {
  id: string
  team_id: string
  status: 'pendiente' | 'rechazada'
}

export type RequestState =
  | { kind: 'can_request' }
  | { kind: 'pending'; requestId: string }
  | { kind: 'inscribed' }
  | { kind: 'rejected' }
  // La pendiente de un torneo Finalizado: ya no la acepta nadie.
  | { kind: 'expired' }
  // No puede solicitar, y se dice por qué (equipo disuelto o cuenta suspendida).
  | { kind: 'unavailable'; reason: string }

export interface RequestOption {
  team: CaptainTeam
  state: RequestState
}

// Lo que pasó con cada equipo en el torneo se muestra siempre: inscripto,
// pendiente o rechazado. Lo que todavía no pasó (solicitar, o que un equipo
// disuelto no puede) solo tiene sentido si el torneo está Abierto y recibe
// solicitudes; si no, ese equipo no aparece.
export function captainRequestOptions(
  tournament: { status: TournamentStatus; acceptsRequests: boolean },
  teams: CaptainTeam[],
  inscribedTeamIds: Set<string>,
  requests: TeamRequest[],
  // El capitán tiene una Suspensión vigente: no puede solicitar con ningún equipo.
  suspended = false
): RequestOption[] {
  const receiving = tournament.status === 'abierto' && tournament.acceptsRequests

  return teams.flatMap((team): RequestOption[] => {
    const request = requests.find((r) => r.team_id === team.id)

    if (inscribedTeamIds.has(team.id)) return [{ team, state: { kind: 'inscribed' } }]
    if (request?.status === 'rechazada') return [{ team, state: { kind: 'rejected' } }]
    if (request?.status === 'pendiente') {
      return tournament.status === 'finalizado'
        ? [{ team, state: { kind: 'expired' } }]
        : [{ team, state: { kind: 'pending', requestId: request.id } }]
    }
    if (!receiving) return []
    if (team.dissolved) return [{ team, state: { kind: 'unavailable', reason: 'Está disuelto' } }]
    if (suspended) return [{ team, state: { kind: 'unavailable', reason: 'Tu cuenta está suspendida' } }]
    return [{ team, state: { kind: 'can_request' } }]
  })
}

// Los SQLSTATE con los que las funciones de solicitudes (y
// `add_linked_inscription`, que usa aceptar) rechazan algo que el usuario
// puede entender. Su mensaje está escrito para mostrarse; cualquier otro error
// (red, base caída) da uno genérico.
const USER_FACING_CODES = new Set(['42501', '23505', '55000', 'P0002', '22023', '23514'])

export function requestErrorMessage(error: { code?: string; message: string }): string {
  if (error.code && USER_FACING_CODES.has(error.code)) return `${error.message}.`
  return 'No pudimos guardar el cambio. Probá de nuevo.'
}

// El error de aceptar o rechazar, en la sección Solicitudes del organizador.
// Aceptar usa `add_linked_inscription`, así que casi todo se dice igual que en
// la carga a mano. La excepción es 42501: ahí no es que el torneo no sea suyo
// (la página ya lo comprobó), sino que la solicitud dejó de estar pendiente
// porque el capitán la retiró o se resolvió en otra pestaña.
export function resolveRequestErrorMessage(code: string | undefined): string {
  if (code === '42501') return 'Esa solicitud ya no está pendiente: el capitán la retiró o ya se resolvió.'
  return inscriptionErrorMessage(code)
}

// Contador de "Mis torneos" y de la pestaña Inscripciones; sin pendientes no se muestra.
export function pendingRequestsLabel(count: number): string | null {
  if (count === 0) return null
  return count === 1 ? '1 solicitud' : `${count} solicitudes`
}
