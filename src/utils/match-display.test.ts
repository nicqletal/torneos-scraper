import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  asksGoing,
  goingNote,
  isOccupied,
  mapsLink,
  matchPhaseBadge,
  matchRowDetail,
  nextMatch,
  sortByStart,
} from './match-display.ts'

test('partido: por jugarse se muestra en lima', () => {
  assert.deepEqual(matchPhaseBadge('por_jugarse'), { text: 'Por jugarse', tone: 'lime' })
})

// Un partido del jue 5/11 de 20 a 22, sin coordinar ni confirmar.
const match = {
  phase: 'por_jugarse' as const,
  start_at: '2026-11-05T23:00:00+00:00',
  venue: null as string | null,
  venue_start_at: null as string | null,
  coordinated_at: null as string | null,
  going_at: null as string | null,
  rival_going_at: null as string | null,
  is_captain: true,
  deadline: null as string | null,
}
const loaded = { ...match, venue: 'Club Parque', venue_start_at: '2026-11-05T23:15:00+00:00' }

test('partido: sin cancha ni hora cargadas, el dato del momento es que faltan', () => {
  assert.equal(matchRowDetail(match), 'Falta cancha y hora')
})

test('partido: cargadas y sin confirmar, se muestran a confirmar, en hora de Buenos Aires', () => {
  assert.equal(matchRowDetail(loaded), 'Club Parque, 20:15 · a confirmar')
})

test('partido: confirmadas, el partido está Coordinado', () => {
  assert.equal(matchRowDetail({ ...loaded, coordinated_at: '2026-11-01T12:00:00+00:00' }), 'Coordinado · Club Parque, 20:15')
})

test('partido: si los dos dijeron Vamos, está Confirmado, con o sin cancha', () => {
  const going = { going_at: '2026-11-05T01:00:00+00:00', rival_going_at: '2026-11-05T02:00:00+00:00' }
  assert.equal(matchRowDetail({ ...loaded, ...going, coordinated_at: '2026-11-01T12:00:00+00:00' }), 'Confirmado · Club Parque, 20:15')
  assert.equal(matchRowDetail({ ...match, ...going }), 'Confirmado · Falta cancha y hora')
})

test('partido: "Ver en el mapa" busca la cancha en Google Maps', () => {
  assert.equal(mapsLink('Club Parque, Av. Rivadavia 123'), 'https://www.google.com/maps/search/?api=1&query=Club%20Parque%2C%20Av.%20Rivadavia%20123')
})

test('partido: "¿Van?" lo ve el capitán mientras está abierta la confirmación previa y no dijo Vamos', () => {
  const open = { ...match, deadline: match.start_at }
  assert.equal(asksGoing(open), true)
  assert.equal(asksGoing(match), false, 'fuera de las 24 h previas, no')
  assert.equal(asksGoing({ ...open, is_captain: false }), false, 'el plantel no')
  assert.equal(asksGoing({ ...open, going_at: '2026-11-05T01:00:00+00:00' }), false, 'si ya dijo Vamos, no')
})

test('partido: desde 12 h antes, si el rival no dijo Vamos, "El rival todavía no confirmó"', () => {
  // La hora de inicio es 23:00 UTC: 12 h antes son las 11:00 UTC.
  assert.equal(goingNote(match, new Date('2026-11-05T11:00:00Z')), 'El rival todavía no confirmó')
  assert.equal(goingNote(match, new Date('2026-11-05T10:59:00Z')), null, 'con más de 12 h, todavía no')
  assert.equal(goingNote(match, new Date('2026-11-05T23:00:00Z')), null, 'desde la hora de inicio, ya no')
  assert.equal(goingNote({ ...match, rival_going_at: '2026-11-05T02:00:00+00:00' }, new Date('2026-11-05T20:00:00Z')), null, 'si el rival dijo Vamos, no')
})

test('partido: las filas van ordenadas por hora de inicio, sin importar el huso con que llegan', () => {
  const rows = [
    { id: 'tarde', start_at: '2026-11-05T23:00:00+00:00' },
    { id: 'temprano', start_at: '2026-11-05T19:00:00-03:00' },
    { id: 'antes', start_at: '2026-11-04T23:00:00+00:00' },
  ]
  assert.deepEqual(sortByStart(rows).map((r) => r.id), ['antes', 'temprano', 'tarde'])
})

test('partido: el próximo es el primero por jugarse, y no hay si no queda ninguno', () => {
  const rows = [
    { id: 'b', start_at: '2026-11-06T23:00:00+00:00', phase: 'por_jugarse' as const },
    { id: 'a', start_at: '2026-11-05T23:00:00+00:00', phase: 'por_jugarse' as const },
  ]
  assert.equal(nextMatch(rows)?.id, 'a')
  assert.equal(nextMatch([]), undefined)
})

test('partido: una franja se pisa con un partido si comparten alguna hora del mismo día', () => {
  const match = { date: '2026-11-05', from: 20, to: 23 }
  assert.equal(isOccupied({ date: '2026-11-05', from: 18, to: 21 }, [match]), true)
  assert.equal(isOccupied({ date: '2026-11-05', from: 18, to: 20 }, [match]), false, 'terminar a la hora en que empieza no es pisarse')
  assert.equal(isOccupied({ date: '2026-11-06', from: 20, to: 23 }, [match]), false)
  assert.equal(isOccupied({ date: '2026-11-05', from: 20, to: 23 }, []), false)
})
