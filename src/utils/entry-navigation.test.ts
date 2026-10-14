import { test } from 'node:test'
import assert from 'node:assert/strict'
import { catalogPath, entryDestination, loginDestination, guestCookieOptions } from './entry-navigation.ts'

test('entrada: una visita inicial sin sesión ni elección va al login', () => {
  assert.equal(entryDestination(false, undefined), '/login')
  for (const value of ['', 'true', 'admin', '0']) assert.equal(entryDestination(false, value), '/login')
})
test('entrada: sesión autenticada o elección de invitado llevan al catálogo', () => {
  assert.equal(entryDestination(true, undefined), '/torneos')
  assert.equal(entryDestination(false, '1'), '/torneos')
})
test('entrada: los links filtrados anteriores siguen públicos y conservan parámetros repetidos', () => {
  assert.equal(entryDestination(false, undefined, { modality: 'f5', zona: ['palermo', 'belgrano'], vacio: undefined }),
    '/torneos?modality=f5&zona=palermo&zona=belgrano')
  assert.equal(catalogPath({ nombre: 'Fútbol & amigos' }), '/torneos?nombre=F%C3%BAtbol+%26+amigos')
})
test('login: conserva el destino interno y evita volver al mismo formulario', () => {
  assert.equal(loginDestination('/mis-equipos'), '/mis-equipos')
  assert.equal(loginDestination('/equipos/uno/editar?error=x'), '/equipos/uno/editar?error=x')
  for (const value of [undefined, '/login', '/login/?modo=registro', '/login?next=/perfil', '//externo.com', '/\\externo.com', ['/', '/perfil']]) {
    assert.equal(loginDestination(value), '/torneos')
  }
})
test('invitado: cookie de navegación sin expiración persistente y sin credenciales', () => {
  assert.deepEqual(guestCookieOptions(false), { httpOnly: true, sameSite: 'lax', secure: false, path: '/' })
  assert.equal(guestCookieOptions(true).secure, true)
  assert.equal('maxAge' in guestCookieOptions(true), false)
  assert.equal('expires' in guestCookieOptions(true), false)
})
