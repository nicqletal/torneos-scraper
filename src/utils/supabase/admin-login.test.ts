import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { authenticateAdmin } from './admin-login.ts'

function scenario(options: { credentialsFail?: boolean; role?: unknown; roleFails?: boolean } = {}) {
  const calls: string[] = []
  let credentials: Record<string, unknown> = {}
  let roleAuthorization: string | null = null
  const transport: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString())
    calls.push(url.pathname)
    if (url.pathname === '/auth/v1/token') {
      credentials = JSON.parse(String(init?.body))
      if (options.credentialsFail) return Response.json({ msg: 'Invalid credentials', code: 'invalid_credentials' }, { status: 400 })
      return Response.json({ access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600,
        user: { id: '11111111-1111-1111-1111-111111111111', aud: 'authenticated', email: 'admin@example.test', created_at: '2026-10-14T00:00:00Z', app_metadata: {}, user_metadata: {} } })
    }
    if (url.pathname === '/rest/v1/rpc/is_admin') {
      roleAuthorization = new Headers(init?.headers).get('authorization')
      return options.roleFails
        ? Response.json({ code: '42501', message: 'Denied' }, { status: 403 })
        : Response.json(options.role === undefined ? true : options.role)
    }
    throw new Error('Unexpected request: ' + url.pathname)
  }
  const client = createClient('https://test.supabase.co', 'test-key', {
    global: { fetch: transport }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return { client, calls, credentials: () => credentials, authorization: () => roleAuthorization }
}

test('login administrador: valida tipos y campos vacíos antes de llamar al proveedor', async () => {
  const s = scenario()
  for (const [email, password] of [[null, 'x'], [' ', 'x'], ['a@b.test', ''], ['a@b.test', new File(['x'], 'clave')]]) {
    assert.deepEqual(await authenticateAdmin(s.client, email, password), { ok: false, error: 'credentials' })
  }
  assert.deepEqual(s.calls, [])
})
test('login administrador: autentica y comprueba el rol con la nueva sesión', async () => {
  const s = scenario()
  assert.deepEqual(await authenticateAdmin(s.client, ' admin@example.test ', ' password '), { ok: true })
  assert.deepEqual(s.calls, ['/auth/v1/token', '/rest/v1/rpc/is_admin'])
  assert.equal(s.credentials().email, 'admin@example.test')
  assert.equal(s.credentials().password, ' password ')
  assert.equal(s.authorization(), 'Bearer test-access-token')
})
test('login administrador: credenciales inválidas no consultan ni asignan rol', async () => {
  const s = scenario({ credentialsFail: true })
  assert.deepEqual(await authenticateAdmin(s.client, 'a@b.test', 'password'), { ok: false, error: 'credentials' })
  assert.deepEqual(s.calls, ['/auth/v1/token'])
})
test('login administrador: usuario común no entra, pero conserva su sesión normal', async () => {
  const s = scenario({ role: false })
  assert.deepEqual(await authenticateAdmin(s.client, 'a@b.test', 'password'), { ok: false, error: 'denied' })
  assert.ok((await s.client.auth.getSession()).data.session)
  assert.deepEqual(s.calls, ['/auth/v1/token', '/rest/v1/rpc/is_admin'])
})
test('login administrador: falla cerrado si no se puede verificar el rol', async () => {
  const s = scenario({ roleFails: true })
  assert.deepEqual(await authenticateAdmin(s.client, 'a@b.test', 'password'), { ok: false, error: 'unavailable' })
})
test('login administrador: un valor no booleano del rol no concede acceso', async () => {
  for (const role of [null, 'true', 1]) {
    const s = scenario({ role })
    assert.deepEqual(await authenticateAdmin(s.client, 'a@b.test', 'password'), { ok: false, error: 'denied' })
  }
})
