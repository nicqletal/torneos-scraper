// Cómo se muestra un partido en /partidos. La fase y el plazo los calcula la
// base (`match_phase`, `match_deadline`); acá solo se traduce a texto y color.
// Coordinado y Confirmado no son fases: son datos de `por_jugarse`. Las demás
// fases y el resultado llegan con sus etapas.

import type { Slot } from './rival-search-form.ts'

// Lo que devuelve `match_phase` por ahora.
export type MatchPhase = 'por_jugarse'

// El color de la fase, como nombre: la pantalla lo pasa a sus tokens.
export type MatchTone = 'lime'

export function matchPhaseBadge(phase: MatchPhase): { text: string; tone: MatchTone } {
  switch (phase) {
    case 'por_jugarse':
      return { text: 'Por jugarse', tone: 'lime' }
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
