import { test } from 'node:test'
import assert from 'node:assert/strict'
import { coordinationTimes, parseCoordination } from './match-forms.ts'

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

// Un partido del jue 5/11, de 20 a 22.
const base = { match_id: 'm1', slot: '2026-11-05|20|22', venue: 'Club Parque', time: '20:15' }

test('coordinación: las horas van de a 15 min, desde el inicio del rango hasta antes del fin', () => {
  assert.deepEqual(coordinationTimes({ date: '2026-11-05', from: 20, to: 22 }), [
    '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45',
  ])
})

test('coordinación: cancha y hora válidas dan la hora exacta de Buenos Aires', () => {
  assert.deepEqual(parseCoordination(form({ ...base, venue: '  Club Parque  ' })), {
    ok: true,
    fields: { match_id: 'm1', venue: 'Club Parque', start_at: '2026-11-05T20:15:00-03:00' },
  })
})

test('coordinación: un rango que termina a las 24 llega hasta las 23:45 del mismo día', () => {
  const parsed = parseCoordination(form({ ...base, slot: '2026-11-05|22|24', time: '23:45' }))
  assert.equal(parsed.ok && parsed.fields.start_at, '2026-11-05T23:45:00-03:00')
})

test('coordinación: la cancha es obligatoria y de hasta 120 caracteres', () => {
  const error = { ok: false, error: 'La cancha va de 1 a 120 caracteres.' }
  assert.deepEqual(parseCoordination(form({ ...base, venue: '   ' })), error)
  assert.deepEqual(parseCoordination(form({ ...base, venue: 'x'.repeat(121) })), error)
  assert.equal(parseCoordination(form({ ...base, venue: 'x'.repeat(120) })).ok, true)
})

test('coordinación: la hora tiene que ser de a 15 min y caer en el rango, sin el fin', () => {
  const error = { ok: false, error: 'La hora va de a 15 minutos, dentro del horario del partido.' }
  assert.deepEqual(parseCoordination(form({ ...base, time: '20:10' })), error)
  assert.deepEqual(parseCoordination(form({ ...base, time: '22:00' })), error)
  assert.deepEqual(parseCoordination(form({ ...base, time: '19:45' })), error)
  assert.deepEqual(parseCoordination(form({ ...base, time: '' })), error)
})
