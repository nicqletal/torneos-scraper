import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { saveTeam } from './team.ts'
import type { TeamFields } from '../team-form.ts'

const BASE = 'https://test.supabase.co'
const TEAM = '11111111-1111-1111-1111-111111111111'
const OLD_PATH = TEAM + '/anterior'
const OLD_URL = BASE + '/storage/v1/object/public/team-crests/' + OLD_PATH
const FIELDS: TeamFields = { name: 'Los Pibes', zone_id: 'palermo', modality: 'futbol_7', level: 'intermedio' }
const PHOTO = new File(['imagen'], 'escudo.png', { type: 'image/png' })

function scenario(options: { previousUrl?: string | null; dissolved?: boolean; uploadFails?: boolean; saveFails?: boolean; cleanupFails?: boolean } = {}) {
  const calls: string[] = [], uploaded: string[] = [], removed: string[] = []
  const updates: Array<Record<string, unknown>> = [], filters: URLSearchParams[] = []
  const transport: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString())
    const method = init?.method ?? 'GET'
    if (url.pathname === '/rest/v1/teams' && method === 'GET') {
      calls.push('read')
      return Response.json({ crest_url: options.previousUrl === undefined ? OLD_URL : options.previousUrl,
        dissolved_at: options.dissolved ? '2026-10-14' : null })
    }
    if (url.pathname.startsWith('/storage/v1/object/team-crests/') && method === 'POST') {
      calls.push('upload')
      if (options.uploadFails) return Response.json({ message: 'upload failed' }, { status: 400 })
      const path = url.pathname.slice('/storage/v1/object/team-crests/'.length)
      uploaded.push(path)
      return Response.json({ Key: 'team-crests/' + path })
    }
    if (url.pathname === '/rest/v1/teams' && method === 'PATCH') {
      calls.push('save')
      filters.push(url.searchParams)
      if (options.saveFails) return Response.json({ message: 'zero rows', code: 'PGRST116' }, { status: 406 })
      updates.push(JSON.parse(String(init?.body)))
      return Response.json({ id: TEAM })
    }
    if (url.pathname === '/storage/v1/object/team-crests' && method === 'DELETE') {
      calls.push('remove')
      if (options.cleanupFails) return Response.json({ message: 'cleanup failed' }, { status: 400 })
      removed.push(...JSON.parse(String(init?.body)).prefixes)
      return Response.json([])
    }
    throw new Error('Unexpected request: ' + method + ' ' + url)
  }
  const client = createClient(BASE, 'test-key', { global: { fetch: transport },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  return { client, calls, uploaded, removed, updates, filters }
}

test('escudo: se guarda el nuevo antes de retirar el anterior', async () => {
  const s = scenario()
  assert.deepEqual(await saveTeam(s.client, TEAM, FIELDS, PHOTO, false, BASE), { ok: true, cleanupFailed: false })
  assert.deepEqual(s.calls, ['read', 'upload', 'save', 'remove'])
  assert.deepEqual(s.removed, [OLD_PATH])
  assert.match(s.uploaded[0], new RegExp('^' + TEAM + '/[0-9a-f-]{36}$'))
  assert.equal(s.filters[0].get('crest_url'), 'eq.' + OLD_URL)
  assert.equal(s.filters[0].get('dissolved_at'), 'is.null')
})
test('escudo: quitarlo guarda null antes de retirar el archivo', async () => {
  const s = scenario()
  assert.equal((await saveTeam(s.client, TEAM, FIELDS, null, true, BASE)).ok, true)
  assert.deepEqual(s.calls, ['read', 'save', 'remove'])
  assert.equal(s.updates[0].crest_url, null)
  assert.deepEqual(s.removed, [OLD_PATH])
})
test('escudo: sin cambios conserva el archivo y no toca Storage', async () => {
  const s = scenario()
  assert.equal((await saveTeam(s.client, TEAM, FIELDS, null, false, BASE)).ok, true)
  assert.deepEqual(s.calls, ['save'])
  assert.deepEqual(s.updates, [FIELDS])
})
test('escudo: un guardado rechazado retira solo la subida nueva', async (t) => {
  t.mock.method(console, 'error', () => {})
  const s = scenario({ saveFails: true })
  assert.equal((await saveTeam(s.client, TEAM, FIELDS, PHOTO, false, BASE)).ok, false)
  assert.deepEqual(s.removed, s.uploaded)
  assert.ok(!s.removed.includes(OLD_PATH))
  assert.deepEqual(s.updates, [])
})
test('escudo: un fallo de subida deja intactos los datos y el escudo actual', async (t) => {
  t.mock.method(console, 'error', () => {})
  const s = scenario({ uploadFails: true })
  assert.equal((await saveTeam(s.client, TEAM, FIELDS, PHOTO, false, BASE)).ok, false)
  assert.deepEqual(s.calls, ['read', 'upload'])
  assert.deepEqual(s.updates, [])
})
test('escudo: no se sube para un equipo ya disuelto ni cuando se pide subir y quitar a la vez', async () => {
  const s = scenario({ dissolved: true })
  assert.equal((await saveTeam(s.client, TEAM, FIELDS, PHOTO, false, BASE)).ok, false)
  assert.deepEqual(s.calls, ['read'])
  const conflicting = scenario()
  assert.equal((await saveTeam(conflicting.client, TEAM, FIELDS, PHOTO, true, BASE)).ok, false)
  assert.deepEqual(conflicting.calls, [])
})
test('escudo: jamás retira un archivo cuya URL corresponde a otro equipo', async () => {
  const s = scenario({ previousUrl: BASE + '/storage/v1/object/public/team-crests/otro/anterior' })
  assert.equal((await saveTeam(s.client, TEAM, FIELDS, PHOTO, false, BASE)).ok, true)
  assert.deepEqual(s.removed, [])
})
test('escudo: un fallo al retirar el anterior informa el problema y conserva lo guardado', async (t) => {
  t.mock.method(console, 'error', () => {})
  const s = scenario({ cleanupFails: true })
  assert.deepEqual(await saveTeam(s.client, TEAM, FIELDS, PHOTO, false, BASE), { ok: true, cleanupFailed: true })
  assert.equal(s.updates.length, 1)
})
