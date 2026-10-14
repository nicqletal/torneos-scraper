import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageFrame } from './page-frame.ts'

test('marco: el panel de administración usa su propia sidebar', () => {
  assert.equal(pageFrame('/admin'), 'admin')
  assert.equal(pageFrame('/admin/seguridad'), 'admin')
  assert.equal(pageFrame('/admin/login'), 'admin')
})
test('marco: el resto del sitio, incluido el acceso, conserva la barra', () => {
  for (const path of ['/', '/torneos/abc', '/mis-equipos', '/administrador', '/login', '/login-otro']) assert.equal(pageFrame(path), 'site')
})
