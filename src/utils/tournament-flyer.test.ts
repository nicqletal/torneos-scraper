// Tests del flyer: qué archivo se acepta y qué URL se muestra. Corren con `pnpm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { flyerSrc, parseFlyer } from './tournament-flyer.ts'

const MB = 1024 * 1024
const file = (type: string, size: number, name = 'flyer') =>
  new File([new Uint8Array(size)], name, { type })

test('flyer: acepta JPG, PNG y WebP de hasta 3 MB', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    const flyer = file(type, 3 * MB)
    assert.deepEqual(parseFlyer(flyer), { ok: true, file: flyer })
  }
})

test('flyer: más de 3 MB se rechaza con el límite en el mensaje', () => {
  assert.deepEqual(parseFlyer(file('image/png', 3 * MB + 1)), {
    ok: false,
    error: 'El flyer pesa más de 3 MB. Subí una imagen más liviana.',
  })
})

test('flyer: un tipo no admitido se rechaza', () => {
  for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', '']) {
    assert.deepEqual(parseFlyer(file(type, 1000)), {
      ok: false,
      error: 'El flyer tiene que ser JPG, PNG o WebP.',
    })
  }
})

test('flyer: sin archivo elegido no hay flyer, y no es un error', () => {
  // Un <input type="file"> vacío manda un archivo sin nombre y de 0 bytes.
  assert.deepEqual(parseFlyer(file('application/octet-stream', 0, '')), { ok: true, file: null })
  // En la Server Action de Next el archivo vacío llega con nombre "undefined".
  assert.deepEqual(parseFlyer(file('application/octet-stream', 0, 'undefined')), { ok: true, file: null })
  assert.deepEqual(parseFlyer(null), { ok: true, file: null })
})

const SUPABASE = 'https://abc.supabase.co'
const ID = '11111111-1111-1111-1111-111111111111'

test('flyer: se muestra el del bucket flyers de nuestro Supabase', () => {
  const url = `${SUPABASE}/storage/v1/object/public/flyers/${ID}?v=1727700000000`
  assert.equal(flyerSrc(url, SUPABASE), url)
})

test('flyer: sin flyer, o con una URL de otro lado, va el placeholder', () => {
  assert.equal(flyerSrc(null, SUPABASE), null)
  assert.equal(flyerSrc('https://evil.example/flyers/x.png', SUPABASE), null)
  // Mismo camino, pero otro host que empieza igual.
  assert.equal(flyerSrc(`${SUPABASE}.evil.example/storage/v1/object/public/flyers/${ID}`, SUPABASE), null)
  // Otro bucket del mismo Supabase.
  assert.equal(flyerSrc(`${SUPABASE}/storage/v1/object/public/avatars/${ID}`, SUPABASE), null)
})

test('flyer: una URL que sale del bucket con ../ va el placeholder', () => {
  assert.equal(flyerSrc(`${SUPABASE}/storage/v1/object/public/flyers/../avatars/${ID}`, SUPABASE), null)
  assert.equal(flyerSrc('no es una url', SUPABASE), null)
})

test('flyer: la URL de Supabase con / al final no cambia nada', () => {
  const url = `${SUPABASE}/storage/v1/object/public/flyers/${ID}?v=1`
  assert.equal(flyerSrc(url, `${SUPABASE}/`), url)
})
