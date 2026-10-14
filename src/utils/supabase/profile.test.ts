import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { saveProfile } from './profile.ts'

const SUPABASE = 'https://test.supabase.co'
const USER = '00000000-0000-0000-0000-00000000000a'
const OLD_PATH = `${USER}/anterior`
const OLD_URL = `${SUPABASE}/storage/v1/object/public/avatars/${OLD_PATH}`
const FIELDS = { display_name: 'Ana', zone_id: 'palermo' }
const PHOTO = new File(['imagen'], 'foto.png', { type: 'image/png' })

// Cliente real de Supabase con transporte HTTP local: se prueba el orden y
// los fallos de las operaciones sin conectar a una base ni a Storage reales.
function scenario(options: {
  previousUrl?: string | null; readFails?: boolean; uploadFails?: boolean;
  saveFails?: boolean; cleanupFails?: boolean;
} = {}) {
  const calls: string[] = []
  const uploaded: string[] = []
  const removed: string[] = []
  const updates: Array<Record<string, unknown>> = []
  const filters: URLSearchParams[] = []
  const transport: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString())
    const method = init?.method ?? 'GET'
    if (url.pathname === '/rest/v1/profiles' && method === 'GET') {
      calls.push('read')
      return options.readFails
        ? Response.json({ message: 'profile unavailable' }, { status: 500 })
        : Response.json({ avatar_url: options.previousUrl === undefined ? OLD_URL : options.previousUrl })
    }
    if (url.pathname.startsWith('/storage/v1/object/avatars/') && method === 'POST') {
      calls.push('upload')
      const path = url.pathname.slice('/storage/v1/object/avatars/'.length)
      if (options.uploadFails) return Response.json({ message: 'upload failed' }, { status: 400 })
      uploaded.push(path)
      return Response.json({ Key: `avatars/${path}` })
    }
    if (url.pathname === '/rest/v1/profiles' && method === 'PATCH') {
      calls.push('save')
      filters.push(url.searchParams)
      if (options.saveFails) return Response.json({ message: 'save failed', code: 'PGRST116' }, { status: 406 })
      updates.push(JSON.parse(String(init?.body)))
      return Response.json({ id: USER })
    }
    if (url.pathname === '/storage/v1/object/avatars' && method === 'DELETE') {
      calls.push('remove')
      if (options.cleanupFails) return Response.json({ message: 'cleanup failed' }, { status: 400 })
      removed.push(...JSON.parse(String(init?.body)).prefixes)
      return Response.json([])
    }
    throw new Error(`Unexpected request: ${method} ${url}`)
  }
  const client = createClient(SUPABASE, 'test-key', {
    global: { fetch: transport }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return { client, calls, uploaded, removed, updates, filters }
}

test('perfil: guarda la foto nueva antes de retirar la anterior', async () => {
  const s = scenario()
  assert.deepEqual(await saveProfile(s.client, USER, FIELDS, PHOTO, SUPABASE), { ok: true, cleanupFailed: false })
  assert.deepEqual(s.calls, ['read', 'upload', 'save', 'remove'])
  assert.deepEqual(s.removed, [OLD_PATH])
  assert.match(s.uploaded[0], new RegExp(`^${USER}/[0-9a-f-]{36}$`))
  assert.equal(s.updates[0].avatar_url, `${SUPABASE}/storage/v1/object/public/avatars/${s.uploaded[0]}`)
  assert.equal(s.filters[0].get('id'), `eq.${USER}`)
  assert.equal(s.filters[0].get('avatar_url'), `eq.${OLD_URL}`)
})

test('perfil: un fallo de guardado retira solo la subida nueva', async (t) => {
  t.mock.method(console, 'error', () => {})
  const s = scenario({ saveFails: true })
  assert.equal((await saveProfile(s.client, USER, FIELDS, PHOTO, SUPABASE)).ok, false)
  assert.deepEqual(s.calls, ['read', 'upload', 'save', 'remove'])
  assert.deepEqual(s.removed, s.uploaded)
  assert.deepEqual(s.updates, [])
  assert.ok(!s.removed.includes(OLD_PATH))
})

test('perfil: si falla la subida, no cambia el perfil ni retira su foto', async (t) => {
  t.mock.method(console, 'error', () => {})
  const s = scenario({ uploadFails: true })
  assert.equal((await saveProfile(s.client, USER, FIELDS, PHOTO, SUPABASE)).ok, false)
  assert.deepEqual(s.calls, ['read', 'upload'])
  assert.deepEqual(s.removed, [])
  assert.deepEqual(s.updates, [])
})

test('perfil: si no se puede leer la foto actual, no sube otra', async (t) => {
  t.mock.method(console, 'error', () => {})
  const s = scenario({ readFails: true })
  assert.equal((await saveProfile(s.client, USER, FIELDS, PHOTO, SUPABASE)).ok, false)
  assert.deepEqual(s.calls, ['read'])
})

test('perfil: sin una foto nueva, conserva la URL y no toca Storage', async () => {
  const s = scenario()
  assert.deepEqual(await saveProfile(s.client, USER, FIELDS, null, SUPABASE), { ok: true, cleanupFailed: false })
  assert.deepEqual(s.calls, ['save'])
  assert.deepEqual(s.updates, [FIELDS])
})

test('perfil: la primera foto exige que el perfil siga sin foto', async () => {
  const s = scenario({ previousUrl: null })
  assert.deepEqual(await saveProfile(s.client, USER, FIELDS, PHOTO, SUPABASE), { ok: true, cleanupFailed: false })
  assert.deepEqual(s.calls, ['read', 'upload', 'save'])
  assert.equal(s.filters[0].get('avatar_url'), 'is.null')
})

test('perfil: una URL anterior ajena nunca se usa para retirar archivos', async () => {
  const s = scenario({ previousUrl: `${SUPABASE}/storage/v1/object/public/avatars/otro-usuario/foto` })
  assert.equal((await saveProfile(s.client, USER, FIELDS, PHOTO, SUPABASE)).ok, true)
  assert.deepEqual(s.calls, ['read', 'upload', 'save'])
  assert.deepEqual(s.removed, [])
})

test('perfil: un fallo de limpieza conserva la foto nueva guardada e informa el problema', async (t) => {
  t.mock.method(console, 'error', () => {})
  const s = scenario({ cleanupFails: true })
  assert.deepEqual(await saveProfile(s.client, USER, FIELDS, PHOTO, SUPABASE), { ok: true, cleanupFailed: true })
  assert.equal(s.updates.length, 1)
  assert.deepEqual(s.removed, [])
})
