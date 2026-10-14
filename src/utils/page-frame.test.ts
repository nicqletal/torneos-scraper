import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageFrame } from './page-frame.ts'

test('marco: los accesos no muestran navbar ni footer', () => {
  for (const path of ['/login', '/login/', '/admin/login', '/admin/login/']) assert.equal(pageFrame(path), 'access')
})
test('marco: el panel usa su propia sidebar, el sitio conserva la navbar', () => {
  assert.equal(pageFrame('/admin'), 'admin')
  assert.equal(pageFrame('/admin/seguridad'), 'admin')
  for (const path of ['/torneos', '/mis-equipos', '/administrador', '/login-otro']) assert.equal(pageFrame(path), 'site')
})
