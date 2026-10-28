// Los formularios de un partido en /partidos: un `parse…` por formulario. Las
// mismas reglas las valida cada RPC en la base, que es la que manda. Ver
// "Propuesta → partido" en docs/decisiones-casos-de-uso.md.

import type { Slot } from './rival-search-form.ts'

type Parsed<T> = { ok: true; fields: T } | { ok: false; error: string }

export type CoordinationFields = { match_id: string; venue: string; start_at: string }

// Las horas que se pueden elegir para un partido: de a 15 minutos, desde el
// inicio del rango (incluido) hasta su fin (excluido). De 20 a 22: de 20:00 a 21:45.
export function coordinationTimes(slot: Slot): string[] {
  const times: string[] = []
  for (let minutes = slot.from * 60; minutes < slot.to * 60; minutes += 15) {
    times.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`)
  }
  return times
}

// Cancha y hora exacta. El rango del partido llega como "fecha|desde|hasta"
// (el de la fila), y la hora como "HH:MM" de Buenos Aires (UTC-3, sin horario
// de verano), igual que arma los rangos `save_rival_search`.
export function parseCoordination(form: FormData): Parsed<CoordinationFields> {
  const matchId = String(form.get('match_id') ?? '')
  const venue = String(form.get('venue') ?? '').trim()
  const time = String(form.get('time') ?? '')
  const [date, from, to] = String(form.get('slot') ?? '').split('|')

  if (venue.length < 1 || venue.length > 120) {
    return { ok: false, error: 'La cancha va de 1 a 120 caracteres.' }
  }
  if (!coordinationTimes({ date, from: Number(from), to: Number(to) }).includes(time)) {
    return { ok: false, error: 'La hora va de a 15 minutos, dentro del horario del partido.' }
  }
  return { ok: true, fields: { match_id: matchId, venue, start_at: `${date}T${time}:00-03:00` } }
}

export type DropFields = { match_id: string; reason: string }

// El motivo para tirar el partido o pedir tirarlo de común acuerdo: texto
// libre de 1 a 140 caracteres. Queda visible en el historial público.
export function parseDropReason(form: FormData): Parsed<DropFields> {
  const matchId = String(form.get('match_id') ?? '')
  const reason = String(form.get('reason') ?? '').trim()

  if (reason.length < 1 || reason.length > 140) {
    return { ok: false, error: 'El motivo va de 1 a 140 caracteres.' }
  }
  return { ok: true, fields: { match_id: matchId, reason } }
}

export type ResultFields = { match_id: string; goals_for: number; goals_against: number }

// El resultado desde el lado propio, "Nosotros / Ellos": goles enteros de 0 a 99.
export function parseResult(form: FormData): Parsed<ResultFields> {
  const matchId = String(form.get('match_id') ?? '')
  const goals = ['goals_for', 'goals_against'].map((key) => String(form.get(key) ?? '').trim())

  if (!goals.every((g) => /^\d{1,2}$/.test(g))) {
    return { ok: false, error: 'Los goles van de 0 a 99.' }
  }
  return { ok: true, fields: { match_id: matchId, goals_for: Number(goals[0]), goals_against: Number(goals[1]) } }
}

export type RatingFields = { match_id: string; stars: number; comment: string | null }

// La calificación al rival: de 1 a 5 estrellas y un comentario opcional de
// hasta 500 caracteres, que solo lee el administrador.
export function parseRating(form: FormData): Parsed<RatingFields> {
  const matchId = String(form.get('match_id') ?? '')
  const stars = String(form.get('stars') ?? '').trim()
  const comment = String(form.get('comment') ?? '').trim()

  if (!/^[1-5]$/.test(stars)) {
    return { ok: false, error: 'Elegí de 1 a 5 estrellas.' }
  }
  if (comment.length > 500) {
    return { ok: false, error: 'El comentario va hasta 500 caracteres.' }
  }
  return { ok: true, fields: { match_id: matchId, stars: Number(stars), comment: comment || null } }
}
