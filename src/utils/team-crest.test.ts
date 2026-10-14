import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CREST_MAX_BYTES, parseCrest, crestSrc, crestObjectPath } from './team-crest.ts'
const BASE = 'https://test.supabase.co'
const TEAM = '11111111-1111-1111-1111-111111111111'
const PREFIX = BASE + '/storage/v1/object/public/team-crests/'
const file = (type: string, size: number, name = 'escudo') => new File([new Uint8Array(size)], name, { type })

test('escudo: acepta JPG, PNG y WebP hasta 2 MB', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    const value = file(type, CREST_MAX_BYTES)
    assert.deepEqual(parseCrest(value), { ok: true, file: value })
  }
})
test('escudo: rechaza más de 2 MB, archivos vacíos y formatos no permitidos', () => {
  for (const value of [file('image/png', CREST_MAX_BYTES + 1), file('image/png', 0), file('image/svg+xml', 100, 'escudo.png'), file('application/pdf', 100), 'escudo']) {
    assert.equal(parseCrest(value).ok, false)
  }
})
test('escudo: dejar vacío el campo conserva el actual', () => {
  assert.deepEqual(parseCrest(null), { ok: true, file: null })
  assert.deepEqual(parseCrest(file('', 0, '')), { ok: true, file: null })
})
test('escudo: acepta el campo sin selección serializado como blob por una Server Action', async () => {
  // El formulario observado en Next llega con name="blob", size=0 y tipo octet-stream.
  const form = new FormData()
  form.append('crest', new Blob([], { type: 'application/octet-stream' }))
  const request = new Request('http://localhost/editar', { method: 'POST', body: form })
  const received = await request.formData()
  const value = received.get('crest')
  assert.ok(value instanceof File)
  assert.equal(value.name, 'blob')
  assert.equal(value.size, 0)
  assert.deepEqual(parseCrest(value), { ok: true, file: null })
})
test('escudo: no confunde un archivo seleccionado vacío o inválido con el campo opcional', () => {
  for (const value of [file('image/png', 0, 'escudo.png'), file('application/octet-stream', 0, 'escudo.jpg'), file('application/octet-stream', 1, 'blob')]) {
    assert.equal(parseCrest(value).ok, false)
  }
})
test('escudo: next/image solo recibe URLs del bucket propio', () => {
  const url = PREFIX + TEAM + '/nuevo'
  assert.equal(crestSrc(url, BASE), url)
  for (const value of [null, 'no es URL', PREFIX, BASE + '.example.com/storage/v1/object/public/team-crests/x', PREFIX + '../avatars/x']) {
    assert.equal(crestSrc(value, BASE), null)
  }
})
test('escudo: retirar archivos nunca usa una carpeta ajena o una ruta escapada', () => {
  assert.equal(crestObjectPath(PREFIX + TEAM + '/nuevo', BASE, TEAM), TEAM + '/nuevo')
  for (const value of [PREFIX + 'otro/nuevo', PREFIX + TEAM + '/../otro/nuevo', PREFIX + TEAM + '/%2Fotro', PREFIX + TEAM + '/carpeta/nuevo']) {
    assert.equal(crestObjectPath(value, BASE, TEAM), null)
  }
})
