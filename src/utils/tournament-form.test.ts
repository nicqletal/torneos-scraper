// Tests del formulario de torneo. Corren con el runner de Node, sin dependencias:
//   pnpm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeInstagram,
  parseTournamentForm,
  tournamentToFormValues,
  editConfirmation,
  type TournamentInput,
} from './tournament-form.ts'

test('Instagram: sin @, sin espacios y sin la URL', () => {
  assert.equal(normalizeInstagram('@copa.palermo'), 'copa.palermo')
  assert.equal(normalizeInstagram('  copa_palermo '), 'copa_palermo')
  assert.equal(normalizeInstagram('https://www.instagram.com/copa.palermo/'), 'copa.palermo')
  assert.equal(normalizeInstagram('copa palermo'), null)
})

function form(fields: Record<string, string>) {
  const data = new FormData()
  const base: Record<string, string> = {
    name: 'Copa Palermo',
    sport_modality: 'futbol_5',
    zone_id: 'palermo',
    inscription_deadline: '2026-11-10',
    start_date: '2026-11-15',
    end_date: '2026-11-30',
    contact_whatsapp: '11 1234 5678',
    ...fields,
  }
  for (const [key, value] of Object.entries(base)) data.set(key, value)
  return data
}

test('un formulario completo se convierte en la fila a insertar', () => {
  const result = parseTournamentForm(
    form({ price: '45000', capacity: '16', rules: ' Fair play ', venue_address: 'Av. Santa Fe 3000' })
  )
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.data, {
    name: 'Copa Palermo',
    sport_modality: 'futbol_5',
    zone_id: 'palermo',
    inscription_deadline: '2026-11-10',
    start_date: '2026-11-15',
    end_date: '2026-11-30',
    price: 45000,
    capacity: 16,
    description: null,
    rules: 'Fair play',
    venue_address: 'Av. Santa Fe 3000',
    contact_whatsapp: '5491112345678',
    contact_instagram: null,
  })
})

test('precio: vacío es "Consultar" (null) y 0 es "Gratis"', () => {
  const empty = parseTournamentForm(form({ price: '' }))
  const free = parseTournamentForm(form({ price: '0' }))
  assert.ok(empty.ok && empty.data.price === null)
  assert.ok(free.ok && free.data.price === 0)
})

test('errores con mensaje para el usuario', () => {
  const cases: [Record<string, string>, RegExp][] = [
    [{ name: '  ' }, /nombre/i],
    [{ sport_modality: 'futbol_9' }, /modalidad/i],
    [{ zone_id: '' }, /zona/i],
    [{ end_date: '' }, /fechas/i],
    [{ inscription_deadline: '2026-11-16' }, /cierre/i],
    [{ end_date: '2026-11-14' }, /fin/i],
    [{ price: '-1' }, /precio/i],
    [{ capacity: '0' }, /cupo/i],
    [{ capacity: '2.5' }, /cupo/i],
    [{ contact_whatsapp: '', contact_instagram: '' }, /contacto/i],
    [{ contact_whatsapp: '1234' }, /whatsapp/i],
    [{ contact_instagram: 'copa palermo' }, /instagram/i],
  ]
  for (const [fields, message] of cases) {
    const result = parseTournamentForm(form(fields))
    assert.equal(result.ok, false, JSON.stringify(fields))
    if (!result.ok) assert.match(result.error, message, JSON.stringify(fields))
  }
})

test('edición: un torneo guardado precarga el formulario y, sin cambios, vuelve igual', () => {
  const saved: TournamentInput = {
    name: 'Copa Palermo',
    sport_modality: 'futbol_7',
    zone_id: 'palermo',
    inscription_deadline: '2026-11-10',
    start_date: '2026-11-15',
    end_date: '2026-11-30',
    price: 0,
    capacity: 16,
    description: 'Con tercer tiempo',
    rules: null,
    venue_address: null,
    contact_whatsapp: '5491112345678',
    contact_instagram: 'copa.palermo',
  }

  const values = tournamentToFormValues(saved)
  // El WhatsApp se muestra como lo pide el formulario: código de área, sin el 549.
  assert.equal(values.contact_whatsapp, '1112345678')
  // Precio 0 ("Gratis") no se confunde con vacío ("Consultar").
  assert.equal(values.price, '0')
  assert.equal(values.rules, '')

  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  assert.deepEqual(parseTournamentForm(data), { ok: true, data: saved })
})

test('edición: vacíos y nulos se precargan como campos vacíos', () => {
  const values = tournamentToFormValues({
    name: 'Copa', sport_modality: 'futbol_5', zone_id: 'palermo',
    inscription_deadline: '2026-11-10', start_date: '2026-11-15', end_date: '2026-11-30',
    price: null, capacity: null, description: null, rules: null, venue_address: null,
    contact_whatsapp: null, contact_instagram: 'copa',
  })
  assert.equal(values.price, '')
  assert.equal(values.capacity, '')
  assert.equal(values.contact_whatsapp, '')
})

test('edición: se pide confirmar solo si hay equipos anotados', () => {
  assert.equal(editConfirmation(0), null)
  assert.equal(editConfirmation(1), 'Hay 1 equipo anotado, ¿confirmás el cambio?')
  assert.equal(editConfirmation(3), 'Hay 3 equipos anotados, ¿confirmás el cambio?')
})
