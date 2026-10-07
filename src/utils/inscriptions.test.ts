// Tests de la lógica de inscripciones y cupo. Corren con `pnpm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseTeamName,
  inscriptionErrorMessage,
  inscriptionsLabel,
  remainingSpots,
  isLastSpots,
} from './inscriptions.ts'

test('nombre del equipo: sin espacios alrededor ni repetidos', () => {
  assert.deepEqual(parseTeamName('  Los   Pibes '), { ok: true, name: 'Los Pibes' })
})

test('nombre del equipo: vacío, muy corto o muy largo', () => {
  assert.deepEqual(parseTeamName(''), { ok: false, error: 'Escribí el nombre del equipo.' })
  assert.deepEqual(parseTeamName('   '), { ok: false, error: 'Escribí el nombre del equipo.' })
  assert.deepEqual(parseTeamName(null), { ok: false, error: 'Escribí el nombre del equipo.' })
  assert.deepEqual(parseTeamName('X'), {
    ok: false,
    error: 'El nombre tiene que tener al menos 2 caracteres.',
  })
  assert.equal(parseTeamName('a'.repeat(50)).ok, true)
  assert.deepEqual(parseTeamName('a'.repeat(51)), {
    ok: false,
    error: 'El nombre puede tener hasta 50 caracteres.',
  })
})

test('errores de la base, con el mensaje de cada regla', () => {
  assert.equal(
    inscriptionErrorMessage('23514'),
    'El cupo está completo. Subí el cupo desde “Editar” para anotar más equipos.'
  )
  assert.equal(
    inscriptionErrorMessage('22023'),
    'Este torneo ya finalizó: sus inscripciones no cambian.'
  )
  assert.equal(inscriptionErrorMessage('42501'), 'Este torneo ya no existe o no es tuyo.')
  assert.equal(inscriptionErrorMessage('XX000'), 'No pudimos guardar el cambio. Probá de nuevo.')
  assert.equal(inscriptionErrorMessage(undefined), 'No pudimos guardar el cambio. Probá de nuevo.')
})

test('contador del panel: n/cupo equipos, o sin cupo', () => {
  assert.equal(inscriptionsLabel(3, 8), '3/8 equipos')
  assert.equal(inscriptionsLabel(0, 8), '0/8 equipos')
  assert.equal(inscriptionsLabel(1, null), '1 equipo · sin cupo')
  assert.equal(inscriptionsLabel(3, null), '3 equipos · sin cupo')
})

test('lugares que quedan: null sin cupo, nunca negativo', () => {
  assert.equal(remainingSpots(8, 3), 5)
  assert.equal(remainingSpots(null, 3), null)
  assert.equal(remainingSpots(2, 5), 0)
})

test('"Últimos cupos": solo en un Abierto con 2 lugares o menos', () => {
  assert.equal(isLastSpots('abierto', 8, 6), true)
  assert.equal(isLastSpots('abierto', 8, 7), true)
  assert.equal(isLastSpots('abierto', 8, 5), false)
  assert.equal(isLastSpots('abierto', null, 100), false)
  // Con el cupo completo el torneo ya está Cerrado: la etiqueta no se muestra.
  assert.equal(isLastSpots('cerrado', 8, 8), false)
  assert.equal(isLastSpots('en_curso', 8, 7), false)
})
