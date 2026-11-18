import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSettings, parseSuspension, passwordError, validUuid } from './admin-forms.ts'
const user = '11111111-1111-4111-8111-111111111111'
function settings(url = 'https://example.org/ayuda') {
  const f = new FormData()
  for (const [key, value] of Object.entries({ support_email: 'equipo@example.org', help_title: 'Ayuda', help_text: 'Consultas', help_url: url, updated_at: '2026-11-17T12:00:00Z' })) f.set(key, value)
  return f
}
test('Configuración rechaza enlaces ejecutables, credenciales en URL y versiones inválidas', () => {
  for (const url of ['javascript:alert(1)', '//example.org', 'http://example.org', 'https://user:secret@example.org']) assert.equal(parseSettings(settings(url)).ok, false)
  const form = settings(); form.set('updated_at', 'ayer'); assert.equal(parseSettings(form).ok, false)
  assert.equal(parseSettings(settings()).ok, true)
  assert.equal(parseSettings(settings('')).ok, true)
})
test('Suspensión admite solamente duraciones acordadas y una cuenta explícita', () => {
  const form = new FormData(); form.set('user_id', user); form.set('reason', 'Conducta comprobada')
  for (const days of ['7', '30', 'indefinida']) { form.set('days', days); assert.equal(parseSuspension(form).ok, true) }
  for (const days of ['0', '-1', '31', '7.5', '']) { form.set('days', days); assert.equal(parseSuspension(form).ok, false) }
  form.set('days', '7'); form.set('user_id', 'otra cuenta'); assert.equal(parseSuspension(form).ok, false)
  assert.equal(validUuid(user), true)
})
test('Cambio de contraseña exige la actual, coincidencia y una clave diferente', () => {
  assert.ok(passwordError('', 'contraseñanueva', 'contraseñanueva'))
  assert.ok(passwordError('actual123', 'corta', 'corta'))
  assert.ok(passwordError('actual123', 'contraseñanueva', 'otra'))
  assert.ok(passwordError('actual123', 'actual123', 'actual123'))
  assert.equal(passwordError('actual123', 'contraseñanueva', 'contraseñanueva'), undefined)
})
