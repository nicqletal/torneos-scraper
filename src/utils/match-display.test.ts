import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isOccupied, matchPhaseBadge, matchRowDetail, nextMatch, sortByStart } from './match-display.ts'

test('partido: por jugarse se muestra en lima', () => {
  assert.deepEqual(matchPhaseBadge('por_jugarse'), { text: 'Por jugarse', tone: 'lime' })
})

test('partido: sin coordinar, el dato del momento es que falta cancha y hora', () => {
  assert.equal(matchRowDetail({ phase: 'por_jugarse' }), 'Falta cancha y hora')
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
