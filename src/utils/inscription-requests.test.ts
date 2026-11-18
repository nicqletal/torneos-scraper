// Tests de lo que ve el capitán en la ficha del torneo, por cada uno de sus
// equipos. Corren con `pnpm test`. Ver "Solicitudes de inscripción" en
// docs/especificaciones-y-requerimientos/decisiones-casos-de-uso.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  captainRequestOptions,
  pendingRequestsLabel,
  requestErrorMessage,
  resolveRequestErrorMessage,
} from './inscription-requests.ts'

const pibes = { id: 'pibes', name: 'Los Pibes', dissolved: false }
const floresta = { id: 'floresta', name: 'Real Floresta', dissolved: false }
const disueltos = { id: 'disueltos', name: 'Disueltos FC', dissolved: true }

const open = { status: 'abierto' as const, acceptsRequests: true }

test('un equipo sin nada en el torneo puede solicitar si el torneo está Abierto y recibe solicitudes', () => {
  assert.deepEqual(
    captainRequestOptions(open, [pibes], new Set(), []),
    [{ team: pibes, state: { kind: 'can_request' } }]
  )
})

test('con el torneo Cerrado o las solicitudes apagadas, un equipo sin nada no muestra nada', () => {
  assert.deepEqual(captainRequestOptions({ status: 'cerrado', acceptsRequests: true }, [pibes], new Set(), []), [])
  assert.deepEqual(captainRequestOptions({ status: 'abierto', acceptsRequests: false }, [pibes], new Set(), []), [])
})

test('cada equipo muestra cómo quedó: pendiente, inscripto, rechazado o disuelto', () => {
  const options = captainRequestOptions(
    open,
    [pibes, floresta, disueltos],
    new Set(['floresta']),
    [{ id: 'r-1', team_id: 'pibes', status: 'pendiente' }]
  )
  assert.deepEqual(options, [
    { team: pibes, state: { kind: 'pending', requestId: 'r-1' } },
    { team: floresta, state: { kind: 'inscribed' } },
    { team: disueltos, state: { kind: 'unavailable', reason: 'Está disuelto' } },
  ])

  assert.deepEqual(
    captainRequestOptions(open, [pibes], new Set(), [{ id: 'r-2', team_id: 'pibes', status: 'rechazada' }]),
    [{ team: pibes, state: { kind: 'rejected' } }]
  )
})

test('la solicitud pendiente se sigue mostrando con el torneo Cerrado, y se puede retirar', () => {
  assert.deepEqual(
    captainRequestOptions({ status: 'en_curso', acceptsRequests: false }, [pibes], new Set(), [
      { id: 'r-1', team_id: 'pibes', status: 'pendiente' },
    ]),
    [{ team: pibes, state: { kind: 'pending', requestId: 'r-1' } }]
  )
})

test('con el torneo Finalizado la pendiente deja de contar', () => {
  assert.deepEqual(
    captainRequestOptions({ status: 'finalizado', acceptsRequests: true }, [pibes], new Set(), [
      { id: 'r-1', team_id: 'pibes', status: 'pendiente' },
    ]),
    [{ team: pibes, state: { kind: 'expired' } }]
  )
})

test('un equipo disuelto con el torneo Cerrado no muestra nada', () => {
  assert.deepEqual(captainRequestOptions({ status: 'cerrado', acceptsRequests: true }, [disueltos], new Set(), []), [])
})

test('los errores de las funciones de la base se muestran tal cual; los demás, genéricos', () => {
  assert.equal(
    requestErrorMessage({ code: '55000', message: 'Este torneo ya no recibe solicitudes: no está abierto' }),
    'Este torneo ya no recibe solicitudes: no está abierto.'
  )
  assert.equal(
    requestErrorMessage({ code: '23514', message: 'El cupo está completo: subí el cupo para anotar más equipos' }),
    'El cupo está completo: subí el cupo para anotar más equipos.'
  )
  assert.equal(
    requestErrorMessage({ code: '08006', message: 'connection failure' }),
    'No pudimos guardar el cambio. Probá de nuevo.'
  )
  assert.equal(requestErrorMessage({ message: 'fetch failed' }), 'No pudimos guardar el cambio. Probá de nuevo.')
})

test('contador de solicitudes pendientes: singular, plural y nada con cero', () => {
  assert.equal(pendingRequestsLabel(1), '1 solicitud')
  assert.equal(pendingRequestsLabel(3), '3 solicitudes')
  assert.equal(pendingRequestsLabel(0), null)
})

test('un capitán suspendido ve sus equipos deshabilitados, con el motivo', () => {
  assert.deepEqual(
    captainRequestOptions(open, [pibes], new Set(), [], true),
    [{ team: pibes, state: { kind: 'unavailable', reason: 'Tu cuenta está suspendida' } }]
  )
  // Lo que ya pasó se sigue mostrando, y puede retirar la pendiente.
  assert.deepEqual(
    captainRequestOptions(open, [pibes], new Set(), [{ id: 'r-1', team_id: 'pibes', status: 'pendiente' }], true),
    [{ team: pibes, state: { kind: 'pending', requestId: 'r-1' } }]
  )
})

test('aceptar o rechazar una solicitud que ya no está pendiente lo dice, en vez de hablar del torneo', () => {
  // El capitán la retiró (o se resolvió en otra pestaña) mientras el
  // organizador tenía la lista abierta: la base responde 42501.
  assert.equal(
    resolveRequestErrorMessage('42501'),
    'Esa solicitud ya no está pendiente: el capitán la retiró o ya se resolvió.'
  )
  // El resto, igual que la carga a mano (mismas reglas de `add_linked_inscription`).
  assert.equal(
    resolveRequestErrorMessage('23514'),
    'El cupo está completo. Subí el cupo desde la pestaña “Datos” para anotar más equipos.'
  )
  assert.equal(resolveRequestErrorMessage('22023'), 'Este torneo ya finalizó: sus inscripciones no cambian.')
  assert.equal(resolveRequestErrorMessage('desconocido'), 'No pudimos guardar el cambio. Probá de nuevo.')
})
