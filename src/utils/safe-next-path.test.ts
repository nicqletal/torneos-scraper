import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeNextPath } from './safe-next-path.ts'

test('next: acepta rutas internas y conserva query y hash', () => {
  assert.equal(safeNextPath('/mis-torneos'), '/mis-torneos')
  assert.equal(safeNextPath('/mis-torneos/abc/editar'), '/mis-torneos/abc/editar')
  assert.equal(safeNextPath('/?zona=caba&modalidad=f5'), '/?zona=caba&modalidad=f5')
  assert.equal(safeNextPath('/torneos/1#contacto'), '/torneos/1#contacto')
})

test('next: rechaza URLs externas, incluso las que empiezan con /', () => {
  assert.equal(safeNextPath('https://sitio.com'), '/')
  assert.equal(safeNextPath('//sitio.com'), '/')
  assert.equal(safeNextPath('//sitio.com/mis-torneos'), '/')
  assert.equal(safeNextPath('/\\sitio.com'), '/')
  assert.equal(safeNextPath('javascript:alert(1)'), '/')
  assert.equal(safeNextPath('mis-torneos'), '/') // relativa sin barra: ambigua
})

test('next: vuelve al fallback cuando no viene o no es un string', () => {
  assert.equal(safeNextPath(undefined), '/')
  assert.equal(safeNextPath(null), '/')
  assert.equal(safeNextPath(''), '/')
  assert.equal(safeNextPath(['/a', '/b']), '/')
  assert.equal(safeNextPath(undefined, '/perfil'), '/perfil')
  assert.equal(safeNextPath('//sitio.com', '/perfil'), '/perfil')
})

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
