// Tests del texto de confirmación de la baja. Corren con `pnpm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withdrawConfirmation } from './tournament-withdraw.ts'

test('confirmación de baja: dice el nombre y a cuántos equipos afecta', () => {
  assert.equal(
    withdrawConfirmation('Copa Palermo', 3),
    '¿Dar de baja “Copa Palermo” con 3 equipos anotados? No se puede deshacer.'
  )
  assert.equal(
    withdrawConfirmation('Copa Palermo', 1),
    '¿Dar de baja “Copa Palermo” con 1 equipo anotado? No se puede deshacer.'
  )
})

test('confirmación de baja: sin equipos anotados también se pide', () => {
  assert.equal(
    withdrawConfirmation('Copa Palermo', 0),
    '¿Dar de baja “Copa Palermo” sin equipos anotados? No se puede deshacer.'
  )
})
