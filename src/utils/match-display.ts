// Cómo se muestra un partido en /partidos. La fase y el plazo los calcula la
// base (`match_phase`, `match_deadline`); acá solo se traduce a texto y color.
// Coordinado y Confirmado no son fases: son datos de `por_jugarse`. Las fases
// del resultado llegan con su etapa.

import type { Slot } from './rival-search-form.ts'

// Lo que devuelve `match_phase` por ahora.
export type MatchPhase = 'por_jugarse' | 'caido'

// El color de la fase, como nombre: la pantalla lo pasa a sus tokens.
export type MatchTone = 'lime' | 'muted'

export function matchPhaseBadge(phase: MatchPhase): { text: string; tone: MatchTone } {
  switch (phase) {
    case 'por_jugarse':
      return { text: 'Por jugarse', tone: 'lime' }
    case 'caido':
      return { text: 'Se cayó', tone: 'muted' }
  }
}

// Lo que la vista `match_details` trae de la coordinación y la confirmación
// previa, visto desde el equipo propio.
export type MatchCoordination = {
  phase: MatchPhase
  start_at: string
  venue: string | null
  venue_start_at: string | null
  coordinated_at: string | null
  going_at: string | null
  rival_going_at: string | null
  is_captain: boolean
  deadline: string | null
}

// "20:15", en Buenos Aires. La fila ya muestra el día.
export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

// El dato del momento de la fila: la cancha y la hora (cargadas, coordinadas
// o que faltan) y si los dos dijeron "Vamos", Confirmado.
export function matchRowDetail(match: MatchCoordination): string {
  const confirmed = match.going_at !== null && match.rival_going_at !== null
  const withConfirmed = (detail: string) => (confirmed ? `Confirmado · ${detail}` : detail)

  if (!match.venue || !match.venue_start_at) return withConfirmed('Falta cancha y hora')
  const venue = `${match.venue}, ${timeLabel(match.venue_start_at)}`
  if (!match.coordinated_at) return withConfirmed(`${venue} · a confirmar`)
  return confirmed ? `Confirmado · ${venue}` : `Coordinado · ${venue}`
}

// "Ver en el mapa": la búsqueda de la cancha en Google Maps.
export function mapsLink(venue: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
}

// "¿Van?": el capitán, mientras está abierta la confirmación previa (la base
// manda el plazo solo desde 24 h antes) y si todavía no dijo "Vamos".
export function asksGoing(match: MatchCoordination): boolean {
  return match.is_captain && match.deadline !== null && match.going_at === null
}

const HOUR = 3_600_000

// Desde 12 h antes de la hora de inicio, si el rival no dijo "Vamos". Pasa
// solo por el tiempo, así que no avisa: se ve al entrar.
export function goingNote(match: MatchCoordination, now: Date): string | null {
  const start = new Date(match.start_at).getTime()
  const open = match.phase === 'por_jugarse' && now.getTime() >= start - 12 * HOUR && now.getTime() < start
  return open && match.rival_going_at === null ? 'El rival todavía no confirmó' : null
}

// Las filas de "Tus partidos", por hora de inicio. Se compara como fecha, no
// como texto, porque la API puede devolver distintos husos.
export function sortByStart<T extends { start_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
}

// El próximo partido, el que va arriba en grande: el primero por jugarse.
export function nextMatch<T extends { start_at: string; phase: MatchPhase }>(rows: T[]): T | undefined {
  return sortByStart(rows).find((row) => row.phase === 'por_jugarse')
}

// Franja ocupada: se pisa con un partido del equipo (los dos como franjas de
// Buenos Aires, de un solo día). La base ya la saca de los compatibles; acá
// solo se marca en el panel para que el capitán sepa por qué.
export function isOccupied(slot: Slot, matches: Slot[]): boolean {
  return matches.some((m) => m.date === slot.date && slot.from < m.to && m.from < slot.to)
}

// Lo que la vista `match_details` trae de la caída y del pedido de común
// acuerdo, visto desde el equipo propio.
export type MatchDrop = {
  phase: MatchPhase
  start_at: string
  is_captain: boolean
  team_name: string
  rival_team_name: string
  drop_reason: string | null
  dropped_by_own: boolean | null
  drop_mutual: boolean
  drop_fault: boolean
  mutual_drop_reason: string | null
  mutual_drop_by_own: boolean | null
  mutual_drop_answered_at: string | null
  mutual_drop_accepted: boolean | null
}

// El dato del momento de un partido caído, con los nombres de los equipos
// (nunca "nosotros"): `Se cayó · lo tiró Los Rivales: "lluvia" · falta para
// Los Rivales`, o `Se cayó de común acuerdo: "lluvia"`.
export function dropDetail(match: MatchDrop): string {
  const reason = `"${match.drop_reason ?? ''}"`
  if (match.drop_mutual) return `Se cayó de común acuerdo: ${reason}`
  const by = match.dropped_by_own ? match.team_name : match.rival_team_name
  return `Se cayó · lo tiró ${by}: ${reason}${match.drop_fault ? ` · falta para ${by}` : ''}`
}

// Lo que ofrece el menú ⋯ de la fila: solo al capitán y antes de la hora de
// inicio. Con menos de 24 h, tirarlo suma falta y se puede pedir de común
// acuerdo (una sola vez por partido). La base decide la falta con la misma
// regla al tirarlo.
export function dropMenu(
  match: MatchDrop,
  now: Date
): { label: string; withFault: boolean; canAskMutual: boolean } | null {
  const start = new Date(match.start_at).getTime()
  if (!match.is_captain || match.phase !== 'por_jugarse' || now.getTime() >= start) return null
  const withFault = start - now.getTime() < 24 * HOUR
  return {
    label: withFault ? 'Tirar el partido (suma falta)' : 'Tirar el partido',
    withFault,
    canAskMutual: withFault && match.mutual_drop_reason === null,
  }
}

// El motivo de un pedido de común acuerdo que le toca responder al capitán
// (lo pidió el rival, nadie lo respondió y no llegó la hora de inicio), o null.
export function mutualDropToAnswer(match: MatchDrop, now: Date): string | null {
  const open = match.is_captain && match.phase === 'por_jugarse' && now.getTime() < new Date(match.start_at).getTime()
  return open && match.mutual_drop_by_own === false && match.mutual_drop_answered_at === null
    ? match.mutual_drop_reason
    : null
}

// Para quien pidió tirarlo de común acuerdo, mientras el partido sigue en pie.
export function mutualDropNote(match: MatchDrop): string | null {
  if (match.phase !== 'por_jugarse' || match.mutual_drop_by_own !== true) return null
  if (match.mutual_drop_answered_at === null) {
    return `Pediste tirarlo de común acuerdo: esperando a ${match.rival_team_name}`
  }
  return match.mutual_drop_accepted === false
    ? `${match.rival_team_name} rechazó tirarlo de común acuerdo: si lo tirás, suma falta`
    : null
}
