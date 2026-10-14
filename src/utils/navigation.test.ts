import { test } from 'node:test'
import assert from 'node:assert/strict'
import { navigationItems, navigationIsActive } from './navigation.ts'

test('navbar: catálogo público y accesos privados con destino de retorno para invitados', () => {
  const items = navigationItems(false, false)
  assert.deepEqual(items.map(item => item.href), ['/torneos', '/login?next=%2Fmis-equipos', '/login?next=%2Fmis-torneos'])
})
test('navbar: una sesión común no expone el acceso de administración', () => {
  assert.deepEqual(navigationItems(true, false).map(item => item.href), ['/torneos', '/mis-equipos', '/mis-torneos'])
  assert.equal(navigationItems(false, true).some(item => item.id === 'admin'), false)
})
test('navbar: acceso de administración solo con sesión y rol confirmado', () => {
  assert.equal(navigationItems(true, true).find(item => item.id === 'admin')?.href, '/admin')
})
test('navbar: activo en la sección y sus fichas, sin confundir prefijos', () => {
  assert.equal(navigationIsActive('/mis-torneos/uno/editar', ['/mis-torneos']), true)
  assert.equal(navigationIsActive('/torneos/uno', ['/torneos']), true)
  assert.equal(navigationIsActive('/mis-equipos', ['/mis-equipos']), true)
  assert.equal(navigationIsActive('/mis-equipos-ajenos', ['/mis-equipos']), false)
  assert.equal(navigationIsActive('/login', ['/torneos']), false)
})
