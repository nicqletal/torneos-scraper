import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTeamForm } from './team-form.ts'

function form(overrides: Record<string, string | File> = {}) {
  const value = new FormData()
  for (const [key, field] of Object.entries({ name: '  Los Pibes  ', zone_id: 'palermo', modality: 'futbol_7', level: 'intermedio', ...overrides })) value.set(key, field)
  return value
}

test('equipo: alta y edición validan y normalizan los mismos campos', () => {
  assert.deepEqual(parseTeamForm(form()), { ok: true, fields: { name: 'Los Pibes', zone_id: 'palermo', modality: 'futbol_7', level: 'intermedio' } })
})
test('equipo: rechaza nombre corto, largo o un archivo en lugar del nombre', () => {
  for (const name of [' ', 'A', 'a'.repeat(51), new File(['x'], 'nombre')]) assert.equal(parseTeamForm(form({ name })).ok, false)
})
test('equipo: exige zona, modalidad y nivel válidos', () => {
  const invalidFields: Array<Record<string, string>> = [{ zone_id: '' }, { modality: 'futbol_6' }, { level: 'profesional' }]
  for (const overrides of invalidFields) {
    assert.equal(parseTeamForm(form(overrides)).ok, false)
  }
})
test('equipo: no incluye permisos, estado ni escudo enviados por el cliente en los datos editables', () => {
  assert.deepEqual(parseTeamForm(form({ is_captain: 'true', dissolved_at: '2026-01-01', crest_url: 'https://example.com' })), parseTeamForm(form()))
})
