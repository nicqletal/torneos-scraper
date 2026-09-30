import { test } from 'node:test'
import assert from 'node:assert/strict'
import { priceLabel } from './tournament-price.ts'

test('precio: vacío es "Consultar", 0 es "Gratis" y el resto va con separador de miles', () => {
  assert.equal(priceLabel(null), 'Consultar')
  assert.equal(priceLabel(0), 'Gratis')
  assert.equal(priceLabel(45000), '$45.000')
})
