import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isOrganizerView } from './organizer-view.ts'

test('vista de organizador: el panel y sus pantallas', () => {
  assert.equal(isOrganizerView('/mis-torneos'), true)
  assert.equal(isOrganizerView('/mis-torneos/abc-123/editar'), true)
  assert.equal(isOrganizerView('/crear-torneo'), true)
})

test('vista de jugador: la portada y todo lo demás', () => {
  assert.equal(isOrganizerView('/'), false)
  assert.equal(isOrganizerView('/torneos/abc-123'), false)
  assert.equal(isOrganizerView('/organizadores/abc-123'), false) // página pública, la ve el jugador
  assert.equal(isOrganizerView('/mis-equipos'), false)
  assert.equal(isOrganizerView('/perfil'), false)
})

test('vista de organizador: no alcanza con que la ruta empiece parecido', () => {
  assert.equal(isOrganizerView('/mis-torneos-viejos'), false)
})
