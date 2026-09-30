import { test } from 'node:test'
import assert from 'node:assert/strict'
import { organizesSince, splitTournaments } from './organizer-page.ts'

test('organiza desde: mes y año de la fecha de alta de la cuenta', () => {
  assert.equal(organizesSince('2026-03-15T12:00:00Z'), 'Organiza desde marzo de 2026')
})

test('organiza desde: el mes se cuenta en Buenos Aires, no en UTC', () => {
  // 1/10 a la 1 de la mañana UTC es todavía 30/9 a las 22 en Buenos Aires.
  assert.equal(organizesSince('2026-10-01T01:00:00Z'), 'Organiza desde septiembre de 2026')
})

test('torneos: vigentes arriba por fecha de inicio, finalizados abajo del más reciente al más viejo', () => {
  const tournaments = [
    { id: 'final-viejo', status: 'finalizado' as const, start_date: '2025-03-01', end_date: '2025-04-01' },
    { id: 'en-curso', status: 'en_curso' as const, start_date: '2026-09-01', end_date: '2026-10-30' },
    { id: 'final-nuevo', status: 'finalizado' as const, start_date: '2026-06-01', end_date: '2026-07-01' },
    { id: 'abierto', status: 'abierto' as const, start_date: '2026-11-15', end_date: '2026-11-30' },
    { id: 'cerrado', status: 'cerrado' as const, start_date: '2026-10-05', end_date: '2026-10-20' },
  ]

  const { current, finished } = splitTournaments(tournaments)

  assert.deepEqual(current.map((t) => t.id), ['en-curso', 'cerrado', 'abierto'])
  assert.deepEqual(finished.map((t) => t.id), ['final-nuevo', 'final-viejo'])
})

test('torneos: sin torneos, las dos listas vacías', () => {
  assert.deepEqual(splitTournaments([]), { current: [], finished: [] })
})
