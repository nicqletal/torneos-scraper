// Tests del buscador de equipos de la página de inscripciones. Corren con `pnpm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTeamQuery, teamSearchPattern } from './team-search.ts'

test('consulta: sin espacios alrededor ni repetidos', () => {
  assert.deepEqual(parseTeamQuery('  Real   Floresta '), { ok: true, query: 'Real Floresta' })
})

test('consulta: vacía o muy corta no busca', () => {
  assert.deepEqual(parseTeamQuery(undefined), { ok: false, error: null })
  assert.deepEqual(parseTeamQuery('   '), { ok: false, error: null })
  assert.deepEqual(parseTeamQuery('R'), {
    ok: false,
    error: 'Escribí al menos 2 letras del nombre.',
  })
})

test('patrón del ilike: contiene la consulta y escapa los comodines', () => {
  assert.equal(teamSearchPattern('Real'), '%Real%')
  assert.equal(teamSearchPattern('100%'), '%100\\%%')
  assert.equal(teamSearchPattern('a_b'), '%a\\_b%')
  assert.equal(teamSearchPattern('a\\b'), '%a\\\\b%')
})
