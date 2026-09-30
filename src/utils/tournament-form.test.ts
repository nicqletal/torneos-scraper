// Tests del formulario de torneo. Corren con el runner de Node, sin dependencias:
//   pnpm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWhatsapp, normalizeInstagram, parseTournamentForm } from './tournament-form.ts'

test('WhatsApp: acepta las formas en que la gente lo escribe y lo deja en 549 + 10 dígitos', () => {
  assert.equal(normalizeWhatsapp('+54 9 11 1234-5678'), '5491112345678')
  assert.equal(normalizeWhatsapp('5491112345678'), '5491112345678')
  assert.equal(normalizeWhatsapp('11 1234 5678'), '5491112345678')
  assert.equal(normalizeWhatsapp('011 1234-5678'), '5491112345678')
  assert.equal(normalizeWhatsapp('+54 11 1234 5678'), '5491112345678')
  assert.equal(normalizeWhatsapp('(0221) 423-4567'), '5492214234567')
})

test('WhatsApp: rechaza lo que no se puede llevar a 549 + 10 dígitos', () => {
  assert.equal(normalizeWhatsapp('1234'), null)
  assert.equal(normalizeWhatsapp('11 15 1234 5678'), null) // con el 15: ambiguo
  assert.equal(normalizeWhatsapp('15 1234 5678'), null) // celular sin código de área
  assert.equal(normalizeWhatsapp('015 1234 5678'), null)
  assert.equal(normalizeWhatsapp('+1 415 555 0100'), null)
})

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
    zone: 'Palermo',
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
    zone: 'Palermo',
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
    [{ zone: '' }, /zona/i],
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
