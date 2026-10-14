import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminDestination, isProtectedAdminPath, adminAccessError } from './admin-access.ts'

test('administración: solo el login exacto queda fuera de la protección', () => {
  for (const path of ['/admin', '/admin/seguridad', '/admin/login/otra', '/admin/login-extra']) assert.equal(isProtectedAdminPath(path), true)
  for (const path of ['/admin/login', '/admin/login/', '/administrador', '/torneos']) assert.equal(isProtectedAdminPath(path), false)
})
test('administración: retorno solo a rutas del backoffice, sin bucles ni destinos externos', () => {
  assert.equal(adminDestination('/admin/seguridad?tab=cuenta'), '/admin/seguridad?tab=cuenta')
  for (const value of [undefined, '/perfil', '/admin/login', '/admin/login?next=/admin', '/administrador', '//externo.com', '/\\externo.com', ['/admin', '/perfil']]) {
    assert.equal(adminDestination(value), '/admin')
  }
})
test('administración: errores de acceso definidos, no mensajes arbitrarios de URL', () => {
  assert.equal(adminAccessError('denied'), 'Tu cuenta no tiene acceso al Panel de administración.')
  assert.equal(adminAccessError('<script>'), undefined)
  assert.equal(adminAccessError('toString'), undefined)
})
