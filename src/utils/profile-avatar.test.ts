import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AVATAR_MAX_BYTES, avatarObjectPath, avatarSrc, parseAvatar } from './profile-avatar.ts'

const SUPABASE = 'https://test.supabase.co'
const USER = '00000000-0000-0000-0000-00000000000a'
const OTHER = '00000000-0000-0000-0000-00000000000b'
const PREFIX = `${SUPABASE}/storage/v1/object/public/avatars/`
const file = (type: string, size: number, name = 'foto') => new File([new Uint8Array(size)], name, { type })

test('foto: admite JPG, PNG y WebP hasta 2 MB, sin depender de la extensión', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    const photo = file(type, AVATAR_MAX_BYTES, 'foto.sin-extension')
    assert.deepEqual(parseAvatar(photo), { ok: true, file: photo })
  }
})

test('foto: rechaza formatos no permitidos, incluso con extensión JPG', () => {
  for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', '']) {
    assert.equal(parseAvatar(file(type, 100, 'foto.jpg')).ok, false)
  }
  assert.equal(parseAvatar('foto.jpg').ok, false)
})

test('foto: rechaza más de 2 MB y archivos vacíos con nombre', () => {
  assert.deepEqual(parseAvatar(file('image/png', AVATAR_MAX_BYTES + 1)), {
    ok: false, error: 'La foto no puede pesar más de 2 MB.',
  })
  assert.equal(parseAvatar(file('image/png', 0)).ok, false)
})

test('foto: no elegir un archivo conserva la actual', () => {
  assert.deepEqual(parseAvatar(null), { ok: true, file: null })
  assert.deepEqual(parseAvatar(file('application/octet-stream', 0, '')), { ok: true, file: null })
})

test('foto: solo se muestran URLs del bucket público propio', () => {
  const url = `${PREFIX}${USER}/foto?v=1`
  assert.equal(avatarSrc(url, SUPABASE + '/'), url)
  for (const value of [null, 'no es URL', PREFIX, `${SUPABASE}.example.com/storage/v1/object/public/avatars/foto`,
    `${SUPABASE}/storage/v1/object/public/flyers/foto`, `${PREFIX}../flyers/foto`, 'data:image/png;base64,abc']) {
    assert.equal(avatarSrc(value, SUPABASE), null)
  }
})

test('foto: el borrado solo acepta archivos de la carpeta propia', () => {
  assert.equal(avatarObjectPath(`${PREFIX}${USER}/foto?v=1`, SUPABASE, USER), `${USER}/foto`)
  for (const value of [`${PREFIX}${OTHER}/foto`, `${PREFIX}${USER}/../${OTHER}/foto`,
    `${PREFIX}${USER}/%2e%2e/${OTHER}/foto`, `${PREFIX}${USER}/otra/foto`, `${PREFIX}${USER}/%2Ffoto`, null]) {
    assert.equal(avatarObjectPath(value, SUPABASE, USER), null)
  }
})
