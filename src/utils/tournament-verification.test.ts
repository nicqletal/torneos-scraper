import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sortForPanel, verificationAge, verifyBlock } from './tournament-verification.ts'

const now = new Date('2026-09-30T15:00:00-03:00')
const daysAgo = (days: number, hours = 0) =>
  new Date(now.getTime() - (days * 24 + hours) * 60 * 60 * 1000).toISOString()

test('antigüedad: al día hasta los 29 días', () => {
  assert.deepEqual(verificationAge(daysAgo(0, 3), 'abierto', now), {
    days: 0, level: 'al_dia', label: 'Verificado hoy',
  })
  assert.deepEqual(verificationAge(daysAgo(1), 'abierto', now), {
    days: 1, level: 'al_dia', label: 'Verificado hace 1 día',
  })
  assert.equal(verificationAge(daysAgo(29, 23), 'abierto', now)?.level, 'al_dia')
})

test('antigüedad: ámbar a partir de los 30 días', () => {
  assert.deepEqual(verificationAge(daysAgo(30), 'cerrado', now), {
    days: 30, level: 'ambar', label: 'Verificado hace 30 días',
  })
  assert.equal(verificationAge(daysAgo(59, 23), 'en_curso', now)?.level, 'ambar')
})

test('antigüedad: rojo "sin confirmar" a partir de los 60 días', () => {
  assert.deepEqual(verificationAge(daysAgo(60), 'abierto', now), {
    days: 60, level: 'sin_confirmar', label: 'Sin confirmar · verificado hace 60 días',
  })
})

test('antigüedad: un Finalizado no tiene que verificarse', () => {
  assert.equal(verificationAge(daysAgo(90), 'finalizado', now), null)
})

test('panel: primero los de 30 días o más (del más viejo al más nuevo), después el resto como vino y al final los Finalizados', () => {
  const tournaments = [
    { id: 'al-dia-1', status: 'abierto' as const, verified_at: daysAgo(2) },
    { id: 'ambar', status: 'abierto' as const, verified_at: daysAgo(35) },
    { id: 'finalizado-viejo', status: 'finalizado' as const, verified_at: daysAgo(120) },
    { id: 'al-dia-2', status: 'cerrado' as const, verified_at: daysAgo(10) },
    { id: 'rojo', status: 'en_curso' as const, verified_at: daysAgo(70) },
  ]

  assert.deepEqual(
    sortForPanel(tournaments, now).map((t) => t.id),
    ['rojo', 'ambar', 'al-dia-1', 'al-dia-2', 'finalizado-viejo']
  )
})

test('"Sigue vigente" se apaga si el torneo se confirmó hoy', () => {
  assert.equal(verifyBlock(daysAgo(0, 3), 'abierto', now), 'confirmado_hoy')
  assert.equal(verifyBlock(daysAgo(0, 23), 'en_curso', now), 'confirmado_hoy')
})

test('"Sigue vigente" se apaga en un Finalizado, aunque lleve meses sin confirmar', () => {
  assert.equal(verifyBlock(daysAgo(90), 'finalizado', now), 'finalizado')
  assert.equal(verifyBlock(daysAgo(0, 1), 'finalizado', now), 'finalizado')
})

test('"Sigue vigente" está prendido desde el día siguiente a la última confirmación', () => {
  assert.equal(verifyBlock(daysAgo(1), 'abierto', now), null)
  assert.equal(verifyBlock(daysAgo(45), 'cerrado', now), null)
})
