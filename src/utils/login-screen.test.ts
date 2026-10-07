import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loginHref, loginScreen } from './login-screen.ts'

test('sin modo y con next a la portada: Iniciar sesión, sin aviso', () => {
  assert.deepEqual(loginScreen(undefined, '/'), { mode: 'login', showPublishNotice: false })
})

test('sin modo y con next al Panel de organizador: Crear cuenta con aviso', () => {
  assert.deepEqual(loginScreen(undefined, '/mis-torneos'), { mode: 'signup', showPublishNotice: true })
})

test('cuenta como Panel de organizador: /mis-torneos y lo que cuelga, y /crear-torneo', () => {
  for (const next of ['/mis-torneos/abc/inscripciones', '/mis-torneos?orden=fecha', '/crear-torneo', '/crear-torneo#sede']) {
    assert.deepEqual(loginScreen(undefined, next), { mode: 'signup', showPublishNotice: true }, next)
  }
})

test('no cuenta como Panel de organizador: otras rutas, aunque se parezcan', () => {
  for (const next of ['/mis-equipos', '/crear-equipo', '/torneos/abc', '/mis-torneos-viejos', '/perfil?volver=/mis-torneos']) {
    assert.deepEqual(loginScreen(undefined, next), { mode: 'login', showPublishNotice: false }, next)
  }
})

test('modo explícito de ingreso con next al panel: Iniciar sesión, sin aviso', () => {
  assert.deepEqual(loginScreen('ingreso', '/mis-torneos'), { mode: 'login', showPublishNotice: false })
})

test('modo explícito de registro con next al panel: Crear cuenta con aviso', () => {
  assert.deepEqual(loginScreen('registro', '/crear-torneo'), { mode: 'signup', showPublishNotice: true })
})

test('modo explícito de registro con otro next: Crear cuenta, sin aviso', () => {
  assert.deepEqual(loginScreen('registro', '/crear-equipo'), { mode: 'signup', showPublishNotice: false })
})

test('un modo desconocido o repetido en la URL se ignora', () => {
  assert.deepEqual(loginScreen('cualquiera', '/'), { mode: 'login', showPublishNotice: false })
  assert.deepEqual(loginScreen(['ingreso', 'registro'], '/mis-torneos'), { mode: 'signup', showPublishNotice: true })
})

test('el link a la otra pantalla lleva el modo explícito y conserva el next', () => {
  assert.equal(loginHref('login', '/mis-torneos'), '/login?modo=ingreso&next=%2Fmis-torneos')
  assert.equal(loginHref('signup', '/equipos/abc?tab=1'), '/login?modo=registro&next=%2Fequipos%2Fabc%3Ftab%3D1')
})

test('el link a Iniciar sesión desde el aviso no vuelve a caer en Crear cuenta', () => {
  const url = new URL(loginHref('login', '/mis-torneos'), 'http://internal.invalid')
  const screen = loginScreen(url.searchParams.get('modo'), url.searchParams.get('next') ?? '/')
  assert.deepEqual(screen, { mode: 'login', showPublishNotice: false })
})
