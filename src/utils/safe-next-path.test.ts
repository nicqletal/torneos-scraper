import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeNextPath } from './safe-next-path.ts'

test('next: conserva rutas internas, query y hash', () => {
  assert.equal(safeNextPath('/perfil?next=/crear-equipo#whatsapp'), '/perfil?next=/crear-equipo#whatsapp')
  assert.equal(safeNextPath('/mis-torneos/../perfil'), '/perfil')
})

test('next: rechaza destinos externos, incluso barras invertidas y controles', () => {
  for (const value of ['https://example.com', '//example.com', '/\\example.com', '/\t/example.com', '/\n/example.com',
    '/.//example.com', '/perfil/..//example.com', '/perfil/%2e%2e//example.com', 'javascript:alert(1)']) {
    assert.equal(safeNextPath(value), '/', value)
  }
})

test('next: rechaza parámetros repetidos y valores que no son strings', () => {
  for (const value of [undefined, null, '', ['/perfil', '/admin'], new File(['x'], 'next'), 12]) {
    assert.equal(safeNextPath(value, '/perfil'), '/perfil')
  }
})
