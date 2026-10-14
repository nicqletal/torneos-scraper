// Inscripciones y cupo (ver "Inscripciones" en docs/decisiones-casos-de-uso.md).
// Es TypeScript puro (sin Next ni Supabase) para poder testearlo con `pnpm test`.
// Las reglas de verdad viven en la base (`add_inscription`, `remove_inscription`
// y el `check` del nombre): esto da el mensaje para el usuario.
import type { TournamentStatus } from './tournament-status.ts'

export const TEAM_NAME_MIN = 2
export const TEAM_NAME_MAX = 50

export type TeamNameResult = { ok: true; name: string } | { ok: false; error: string }

// Nombre de una inscripción por nombre: sin espacios alrededor ni repetidos,
// entre 2 y 50 caracteres (el mismo `check` que la tabla).
export function parseTeamName(raw: FormDataEntryValue | null): TeamNameResult {
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ')

  if (!name) return { ok: false, error: 'Escribí el nombre del equipo.' }
  if (name.length < TEAM_NAME_MIN) {
    return { ok: false, error: `El nombre tiene que tener al menos ${TEAM_NAME_MIN} caracteres.` }
  }
  if (name.length > TEAM_NAME_MAX) {
    return { ok: false, error: `El nombre puede tener hasta ${TEAM_NAME_MAX} caracteres.` }
  }
  return { ok: true, name }
}

// Mensaje para cada error de `add_inscription`, `add_linked_inscription` y
// `remove_inscription`, por su SQLSTATE: 23514 es el cupo completo, 22023 el
// torneo Finalizado y 42501 un torneo o una inscripción que no existe o no es
// del que llama. Los de la vinculada: P0002 el equipo no existe, 55000 está
// disuelto y 23505 ya está anotado en ese torneo.
// Un error sin SQLSTATE (por ejemplo, de red) viaja en la URL de la pestaña
// como UNKNOWN_INSCRIPTION_ERROR y muestra el mismo mensaje genérico que
// cualquier código que no esté en la lista.
export const UNKNOWN_INSCRIPTION_ERROR = 'desconocido'

// El código que deja una acción en `?error=` al fallar: el SQLSTATE o, si el
// error no trae uno, UNKNOWN_INSCRIPTION_ERROR (un `?error=` vacío no se
// escribe en la URL y el mensaje no aparecería).
export function inscriptionErrorCode(code: string | undefined): string {
  return code || UNKNOWN_INSCRIPTION_ERROR
}

export function inscriptionErrorMessage(code: string | undefined): string {
  switch (code) {
    case '23514':
      return 'El cupo está completo. Subí el cupo desde la pestaña “Datos” para anotar más equipos.'
    case '22023':
      return 'Este torneo ya finalizó: sus inscripciones no cambian.'
    case '42501':
      return 'Este torneo ya no existe o no es tuyo.'
    case 'P0002':
      return 'Ese equipo ya no existe.'
    case '55000':
      return 'Ese equipo está disuelto: no recibe inscripciones.'
    case '23505':
      return 'Ese equipo ya está anotado en este torneo.'
    case UNKNOWN_INSCRIPTION_ERROR:
    default:
      return 'No pudimos guardar el cambio. Probá de nuevo.'
  }
}

// Contador del panel: "3/8 equipos" o, sin cupo, "3 equipos · sin cupo".
export function inscriptionsLabel(inscriptions: number, capacity: number | null): string {
  if (capacity !== null) return `${inscriptions}/${capacity} equipos`
  return inscriptions === 1 ? '1 equipo · sin cupo' : `${inscriptions} equipos · sin cupo`
}

// Lugares que quedan; null si el torneo no tiene cupo.
export function remainingSpots(capacity: number | null, inscriptions: number): number | null {
  if (capacity === null) return null
  return Math.max(0, capacity - inscriptions)
}

// "Últimos cupos" es una etiqueta, no un estado: se muestra sobre un torneo
// Abierto cuando quedan 2 lugares o menos. Con el cupo completo el torneo ya
// está Cerrado, así que ahí no aparece.
export const LAST_SPOTS_THRESHOLD = 2

export function isLastSpots(
  status: TournamentStatus,
  capacity: number | null,
  inscriptions: number
): boolean {
  if (status !== 'abierto') return false
  const remaining = remainingSpots(capacity, inscriptions)
  return remaining !== null && remaining <= LAST_SPOTS_THRESHOLD
}
