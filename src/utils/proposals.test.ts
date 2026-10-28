import { test } from 'node:test'
import assert from 'node:assert/strict'
import { proposalCardTitle, proposalStatusLabel } from './proposals.ts'

test('propuesta: la tarjeta recibida dice quién propone y el horario en común', () => {
  assert.equal(
    proposalCardTitle('Real Floresta', '["2026-11-03 23:00:00+00","2026-11-04 01:00:00+00")'),
    'Real Floresta te propone jugar · mar 3/11, de 20 a 22'
  )
})

test('propuesta: el último desenlace de una propuesta mandada, visto por quien la mandó', () => {
  assert.equal(proposalStatusLabel('vencida'), 'Tu propuesta venció')
  assert.equal(proposalStatusLabel('rechazada'), 'Rechazaron tu propuesta')
  assert.equal(proposalStatusLabel('franja_sacada'), 'Se canceló tu propuesta: se sacó la franja')
  assert.equal(proposalStatusLabel('busqueda_cancelada'), 'Se canceló tu propuesta: se canceló la búsqueda')
})

test('propuesta: cancelada por uno mismo o pendiente no deja nota', () => {
  assert.equal(proposalStatusLabel('cancelada'), null)
  assert.equal(proposalStatusLabel('pendiente'), null)
})
