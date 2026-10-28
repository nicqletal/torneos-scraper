import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  asksGoing,
  dropDetail,
  dropMenu,
  goingNote,
  isOccupied,
  mapsLink,
  matchPhaseBadge,
  matchRowDetail,
  mutualDropNote,
  mutualDropToAnswer,
  nextMatch,
  sortByStart,
  type MatchPhase,
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

// Real Floresta (propio) vs Los Rivales, del jue 5/11 a las 20, sin caída ni
// pedido de común acuerdo.
const drop = {
  phase: 'por_jugarse' as MatchPhase,
  start_at: '2026-11-05T23:00:00+00:00',
  is_captain: true,
  team_name: 'Real Floresta',
  rival_team_name: 'Los Rivales',
  drop_reason: null as string | null,
  dropped_by_own: null as boolean | null,
  drop_mutual: false,
  drop_fault: false,
  mutual_drop_reason: null as string | null,
  mutual_drop_by_own: null as boolean | null,
  mutual_drop_answered_at: null as string | null,
  mutual_drop_accepted: null as boolean | null,
}
const hoursBefore = (hours: number) => new Date(new Date(drop.start_at).getTime() - hours * 3_600_000)

test('partido: caído se muestra apagado', () => {
  assert.deepEqual(matchPhaseBadge('caido'), { text: 'Se cayó', tone: 'muted' })
})

test('caída: tirado solo, dice quién, el motivo y a quién le suma la falta', () => {
  const dropped = { ...drop, phase: 'caido' as const, drop_reason: 'nos faltan dos', dropped_by_own: false, drop_fault: true }
  assert.equal(dropDetail(dropped), 'Se cayó · lo tiró Los Rivales: "nos faltan dos" · falta para Los Rivales')
  assert.equal(dropDetail({ ...dropped, dropped_by_own: true, drop_fault: false }), 'Se cayó · lo tiró Real Floresta: "nos faltan dos"')
})

test('caída: de común acuerdo, solo el motivo', () => {
  const mutual = { ...drop, phase: 'caido' as const, drop_reason: 'lluvia', dropped_by_own: true, drop_mutual: true }
  assert.equal(dropDetail(mutual), 'Se cayó de común acuerdo: "lluvia"')
})

test('caída: con más de 24 h, "Tirar el partido" sin falta y sin común acuerdo', () => {
  assert.deepEqual(dropMenu(drop, hoursBefore(25)), { label: 'Tirar el partido', withFault: false, canAskMutual: false })
  assert.deepEqual(dropMenu(drop, hoursBefore(24)), { label: 'Tirar el partido', withFault: false, canAskMutual: false })
})

test('caída: con menos de 24 h, suma falta y se puede pedir de común acuerdo', () => {
  assert.deepEqual(dropMenu(drop, hoursBefore(23.99)), {
    label: 'Tirar el partido (suma falta)',
    withFault: true,
    canAskMutual: true,
  })
})

test('caída: con el pedido ya hecho, no se vuelve a pedir', () => {
  const asked = { ...drop, mutual_drop_reason: 'lluvia', mutual_drop_by_own: true }
  assert.equal(dropMenu(asked, hoursBefore(5))?.canAskMutual, false)
})

test('caída: sin menú desde la hora de inicio, si cayó o si no es el capitán', () => {
  assert.equal(dropMenu(drop, hoursBefore(0)), null)
  assert.equal(dropMenu({ ...drop, phase: 'caido' }, hoursBefore(5)), null)
  assert.equal(dropMenu({ ...drop, is_captain: false }, hoursBefore(5)), null)
})

test('común acuerdo: el capitán rival responde un pedido sin responder, antes de la hora de inicio', () => {
  const asked = { ...drop, mutual_drop_reason: 'lluvia', mutual_drop_by_own: false }
  assert.equal(mutualDropToAnswer(asked, hoursBefore(5)), 'lluvia')
  assert.equal(mutualDropToAnswer({ ...asked, mutual_drop_by_own: true }, hoursBefore(5)), null)
  assert.equal(mutualDropToAnswer({ ...asked, mutual_drop_answered_at: '2026-11-05T10:00:00+00:00' }, hoursBefore(5)), null)
  assert.equal(mutualDropToAnswer({ ...asked, is_captain: false }, hoursBefore(5)), null)
  assert.equal(mutualDropToAnswer(asked, hoursBefore(0)), null)
})

test('común acuerdo: quien lo pidió ve si está esperando o si se lo rechazaron', () => {
  const asked = { ...drop, mutual_drop_reason: 'lluvia', mutual_drop_by_own: true }
  assert.equal(mutualDropNote(asked), 'Pediste tirarlo de común acuerdo: esperando a Los Rivales')
  assert.equal(
    mutualDropNote({ ...asked, mutual_drop_answered_at: '2026-11-05T10:00:00+00:00', mutual_drop_accepted: false }),
    'Los Rivales rechazó tirarlo de común acuerdo: si lo tirás, suma falta'
  )
  assert.equal(mutualDropNote(drop), null)
  assert.equal(mutualDropNote({ ...asked, phase: 'caido' }), null)
})
