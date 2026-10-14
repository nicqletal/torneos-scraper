import { test } from 'node:test'
import assert from 'node:assert/strict'
import { manageLoginPath, managePath, manageTab } from './tournament-manage.ts'

test('pestaña: sin ?tab o con un valor desconocido se abre Datos', () => {
  assert.equal(manageTab(undefined), 'datos')
  assert.equal(manageTab('cualquiera'), 'datos')
  assert.equal(manageTab(['inscripciones', 'datos']), 'datos')
})

test('pestaña: ?tab=inscripciones abre Inscripciones', () => {
  assert.equal(manageTab('inscripciones'), 'inscripciones')
  assert.equal(manageTab('datos'), 'datos')
})

test('ruta: la pestaña va en la URL, con la búsqueda y el error si los hay', () => {
  assert.equal(managePath('abc', 'datos'), '/mis-torneos/abc?tab=datos')
  assert.equal(
    managePath('abc', 'inscripciones', { q: 'los pibes', error: '23514' }),
    '/mis-torneos/abc?tab=inscripciones&q=los+pibes&error=23514'
  )
  assert.equal(managePath('abc', 'inscripciones', { q: '' }), '/mis-torneos/abc?tab=inscripciones')
})

test('ruta al login: la pestaña sobrevive adentro de `next`', () => {
  assert.equal(
    manageLoginPath('abc', 'inscripciones'),
    '/login?next=%2Fmis-torneos%2Fabc%3Ftab%3Dinscripciones'
  )
})
