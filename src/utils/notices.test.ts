// Tests del texto y el link de cada aviso de la campanita. Corren con `pnpm test`.
// Un caso por disparador. Las horas se escriben en UTC y se leen en Buenos
// Aires (UTC-3): 2026-11-06T01:00Z es el jueves 5/11 a las 22:00.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noticeText, noticeLink, noticeDate } from './notices.ts'

// mié 4/11, de 20 a 22 (hora de Buenos Aires)
const range = { range_start: '2026-11-04T23:00:00Z', range_end: '2026-11-05T01:00:00Z' }
// jue 5/11 22:00
const deadline = '2026-11-06T01:00:00Z'

test('propuesta recibida: quién, cuándo, y hasta cuándo responder', () => {
  const params = { rival_name: 'Real Floresta', ...range, deadline }
  assert.equal(
    noticeText('proposal_received', params),
    'Te propusieron un partido: Real Floresta · mié 4/11, de 20 a 22. Respondé antes del jue 5/11 22:00 o la propuesta vence.'
  )
  assert.equal(noticeLink('proposal_received', params), '/partidos')
})

test('propuesta rechazada', () => {
  assert.equal(
    noticeText('proposal_rejected', { rival_name: 'Los Pibes' }),
    'Rechazaron tu propuesta: Los Pibes.'
  )
  assert.equal(noticeLink('proposal_rejected', { rival_name: 'Los Pibes' }), '/partidos')
})

test('partido acordado: a los dos planteles, con los dos nombres', () => {
  const params = { team_a: 'Real Floresta', team_b: 'Los Pibes', ...range }
  assert.equal(
    noticeText('match_agreed', params),
    'Partido acordado: Real Floresta vs Los Pibes · mié 4/11, de 20 a 22.'
  )
  assert.equal(noticeLink('match_agreed', params), '/partidos')
})

test('propuesta anulada por un partido superpuesto', () => {
  const params = { rival_name: 'Los Pibes', ...range }
  assert.equal(
    noticeText('proposal_annulled', params),
    'Se anuló tu propuesta con Los Pibes (mié 4/11, de 20 a 22): ya no tienen ese horario.'
  )
  assert.equal(noticeLink('proposal_annulled', params), '/partidos')
})

test('propuesta cancelada por franja sacada o búsqueda cancelada', () => {
  const params = { rival_name: 'Los Pibes', ...range }
  assert.equal(
    noticeText('proposal_cancelled', params),
    'Se canceló tu propuesta con Los Pibes (mié 4/11, de 20 a 22).'
  )
  assert.equal(noticeLink('proposal_cancelled', params), '/partidos')
})

test('confirmá cancha y hora', () => {
  const params = { rival_name: 'Los Pibes', venue: 'Cancha 3', start_at: '2026-11-04T23:30:00Z' }
  assert.equal(
    noticeText('venue_to_confirm', params),
    'Confirmá cancha y hora: Los Pibes cargó Cancha 3, mié 4/11 20:30.'
  )
  assert.equal(noticeLink('venue_to_confirm', params), '/partidos')
})

test('partido coordinado: con cancha y hora', () => {
  const params = { team_a: 'Real Floresta', team_b: 'Los Pibes', venue: 'Cancha 3', start_at: '2026-11-04T23:30:00Z' }
  assert.equal(
    noticeText('match_coordinated', params),
    'Partido coordinado: Real Floresta vs Los Pibes · Cancha 3, mié 4/11 20:30.'
  )
  assert.equal(noticeLink('match_coordinated', params), '/partidos')
})

test('se cayó el partido: con el motivo y, si suma falta, a quién', () => {
  const sinFalta = { team_a: 'Real Floresta', team_b: 'Los Pibes', reason: 'No llegamos a 5', fault_team_name: null }
  assert.equal(
    noticeText('match_dropped', sinFalta),
    'Se cayó el partido Real Floresta vs Los Pibes: «No llegamos a 5».'
  )
  const conFalta = { ...sinFalta, fault_team_name: 'Los Pibes' }
  assert.equal(
    noticeText('match_dropped', conFalta),
    'Se cayó el partido Real Floresta vs Los Pibes: «No llegamos a 5». Suma una falta a Los Pibes.'
  )
  assert.equal(noticeLink('match_dropped', conFalta), '/partidos')
})

test('piden tirar el partido de común acuerdo: hasta cuándo y qué pasa si no', () => {
  const params = { rival_name: 'Los Pibes', reason: 'Lluvia', deadline }
  assert.equal(
    noticeText('mutual_drop_requested', params),
    'Los Pibes pide tirar el partido de común acuerdo: «Lluvia». Respondé antes del jue 5/11 22:00 o el partido sigue en pie.'
  )
  assert.equal(noticeLink('mutual_drop_requested', params), '/partidos')
})

test('se cayó de común acuerdo', () => {
  const params = { team_a: 'Real Floresta', team_b: 'Los Pibes' }
  assert.equal(
    noticeText('mutual_drop_accepted', params),
    'Se cayó de común acuerdo el partido Real Floresta vs Los Pibes. No suma falta a nadie.'
  )
  assert.equal(noticeLink('mutual_drop_accepted', params), '/partidos')
})

test('rechazaron tirarlo de común acuerdo', () => {
  const params = { rival_name: 'Los Pibes' }
  assert.equal(
    noticeText('mutual_drop_rejected', params),
    'Los Pibes rechazó tirar el partido de común acuerdo.'
  )
  assert.equal(noticeLink('mutual_drop_rejected', params), '/partidos')
})

test('cargaron el resultado: desde el lado de quien lo recibe, con el plazo', () => {
  const params = { rival_name: 'Los Pibes', goals_for: 2, goals_against: 3, deadline }
  assert.equal(
    noticeText('result_to_confirm', params),
    'Los Pibes cargó el resultado: ustedes 2, Los Pibes 3. Confirmá o corregí antes del jue 5/11 22:00; si no, queda ese resultado.'
  )
  assert.equal(noticeLink('result_to_confirm', params), '/partidos')
})

test('cargaron el resultado: si no coincide con el propio, sin resultado si siguen distintos', () => {
  const params = { rival_name: 'Los Pibes', goals_for: 2, goals_against: 3, deadline: '2026-11-06T01:00:00+00:00', mismatch: true }
  assert.equal(
    noticeText('result_to_confirm', params),
    'Los Pibes cargó el resultado: ustedes 2, Los Pibes 3. No coincide con el de ustedes: confirmá o corregí antes del jue 5/11 22:00; si siguen distintos, queda Jugado sin resultado.'
  )
})

test('jugado: con el resultado', () => {
  const params = { team_a: 'Real Floresta', team_b: 'Los Pibes', goals_a: 3, goals_b: 2 }
  assert.equal(
    noticeText('match_played', params),
    'Jugado: Real Floresta 3 - 2 Los Pibes.'
  )
  assert.equal(noticeLink('match_played', params), '/partidos')
})

test('dicen que no fueron: hasta cuándo responder y qué pasa si no', () => {
  const params = { rival_name: 'Los Pibes', deadline }
  assert.equal(
    noticeText('no_show_reported', params),
    'Los Pibes dice que no fueron al partido. Respondé antes del jue 5/11 22:00 o suman una falta.'
  )
  assert.equal(noticeLink('no_show_reported', params), '/partidos')
})

test('partido en conflicto', () => {
  const params = { team_a: 'Real Floresta', team_b: 'Los Pibes' }
  assert.equal(
    noticeText('match_in_conflict', params),
    'Partido en conflicto: Real Floresta vs Los Pibes. Quedan las dos versiones en el historial.'
  )
  assert.equal(noticeLink('match_in_conflict', params), '/partidos')
})

test('ya podés ver tu calificación', () => {
  const params = { rival_name: 'Los Pibes' }
  assert.equal(
    noticeText('rating_revealed', params),
    'Ya podés ver tu calificación del partido contra Los Pibes.'
  )
  assert.equal(noticeLink('rating_revealed', params), '/partidos')
})

test('baja de torneo: el texto de las decisiones y link a la página del equipo', () => {
  const params = { tournament_name: 'Copa Palermo', team_id: 'aaaa-1', team_name: 'Real Floresta' }
  assert.equal(
    noticeText('tournament_withdrawn', params),
    "Se dio de baja el torneo 'Copa Palermo', en el que estaba anotado tu equipo Real Floresta. Hablá con el organizador por lo que hayas pagado."
  )
  assert.equal(noticeLink('tournament_withdrawn', params), '/equipos/aaaa-1')
})

test('un rango que termina a medianoche dice "a 24"', () => {
  const params = { rival_name: 'Los Pibes', range_start: '2026-11-05T00:00:00Z', range_end: '2026-11-05T03:00:00Z' }
  assert.equal(
    noticeText('proposal_cancelled', params),
    'Se canceló tu propuesta con Los Pibes (mié 4/11, de 21 a 24).'
  )
})

test('fecha del aviso en la campanita, en hora de Buenos Aires', () => {
  assert.equal(noticeDate(deadline), 'jue 5/11 22:00')
})
