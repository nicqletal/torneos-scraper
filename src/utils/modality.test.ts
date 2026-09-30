import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSportModality, modalityLabel } from './modality.ts'

test('modalidad: solo acepta los valores del enum', () => {
  assert.equal(isSportModality('futbol_5'), true)
  assert.equal(isSportModality('futbol_6'), false)
  assert.equal(isSportModality(null), false)
})

test('modalidad: nombre para la UI, y el valor crudo si no lo conoce', () => {
  assert.equal(modalityLabel('futbol_11'), 'Fútbol 11')
  assert.equal(modalityLabel('otra'), 'otra')
})
