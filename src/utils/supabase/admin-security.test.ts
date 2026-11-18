import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verifyOwnPassword } from './admin-security.ts'
const id = '11111111-1111-4111-8111-111111111111'
test('contraseña incorrecta se rechaza con el SDK sin depender de la política de updateUser', async () => {
  const calls: string[] = []
  const fetcher: typeof fetch = async (input) => { calls.push(String(input)); return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) }
  assert.equal(await verifyOwnPassword('https://auth.example.org', 'anon-key', 'admin@example.org', 'incorrecta', id, fetcher), false)
  assert.equal(calls.length, 1)
  assert.ok(calls[0].includes('token?grant_type=password'))
})
test('verificación aislada termina solo su sesión temporal y no actualiza contraseña', async () => {
  const calls: { url: string; method: string }[] = []
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input); calls.push({ url, method: String(init?.method) })
    if (url.includes('/token?')) return new Response(JSON.stringify({ access_token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ0ZXN0In0.signature', refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user: { id, email: 'admin@example.org', aud: 'authenticated', created_at: new Date().toISOString() } }), { headers: { 'Content-Type': 'application/json' } })
    return new Response(null, { status: 204 })
  }
  assert.equal(await verifyOwnPassword('https://auth.example.org', 'anon-key', 'admin@example.org', 'correcta', id, fetcher), true)
  assert.ok(calls.some(call => call.url.includes('logout?scope=local')))
  assert.ok(calls.every(call => !call.url.includes('/user')))
})
