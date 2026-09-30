import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWhatsapp, toNationalNumber, whatsappLink } from './whatsapp.ts'

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

test('WhatsApp: el formulario muestra el número sin el 549', () => {
  assert.equal(toNationalNumber('5491112345678'), '1112345678')
  assert.equal(toNationalNumber('1234'), '1234')
})

test('WhatsApp: el link de wa.me lleva el mensaje codificado', () => {
  assert.equal(whatsappLink('5491112345678'), 'https://wa.me/5491112345678')
  assert.equal(whatsappLink('5491112345678', 'Hola, ¿hay lugar?'), 'https://wa.me/5491112345678?text=Hola%2C%20%C2%BFhay%20lugar%3F')
})
