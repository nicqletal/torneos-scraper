// Cómo se muestra un partido en /partidos. La fase la calcula la base
// (`match_phase`); acá solo se traduce a texto y color. Primera versión: las
// demás fases y los datos de la coordinación y el resultado llegan con sus
// etapas.

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

// El dato del momento de la fila. Mientras no se coordine, falta cancha y hora.
export function matchRowDetail(match: { phase: MatchPhase }): string {
  switch (match.phase) {
    case 'por_jugarse':
      return 'Falta cancha y hora'
  }
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
