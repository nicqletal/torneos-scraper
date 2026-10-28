import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buenosAiresToday, isUpcoming, parseRivalSearchForm, slotFromRange, slotLabel } from './rival-search-form.ts'

// Jueves 29/10/2026, 18:40 en Buenos Aires.
const today = { date: '2026-10-29', hour: 18 }

function form(fields: Array<[string, string]>) {
  const value = new FormData()
  for (const [key, field] of [['team_id', 'equipo-1'], ['modality', 'futbol_7'], ...fields]) value.append(key, field)
  return value
}

test('búsqueda: una franja nueva elegida en el calendario', () => {
  assert.deepEqual(parseRivalSearchForm(form([['day', '2026-10-30'], ['from', '20'], ['to', '23']]), today), {
    ok: true,
    fields: { team_id: 'equipo-1', modality: 'futbol_7', slots: [{ date: '2026-10-30', from: 20, to: 23 }] },
  })
})

function slotsOf(fields: Array<[string, string]>) {
  const result = parseRivalSearchForm(form(fields), today)
  assert.ok(result.ok, result.ok ? '' : result.error)
  return result.fields.slots
}

test('búsqueda: las franjas que ya tenía vuelven con el formulario y se suman a la nueva, ordenadas', () => {
  assert.deepEqual(slotsOf([['slot', '2026-11-02|9|11'], ['slot', '2026-10-31|20|22'], ['day', '2026-10-31'], ['from', '18'], ['to', '20']]), [
    { date: '2026-10-31', from: 18, to: 20 },
    { date: '2026-10-31', from: 20, to: 22 },
    { date: '2026-11-02', from: 9, to: 11 },
  ])
})

test('búsqueda: sin franjas el conjunto queda vacío (sacar la última o cancelar)', () => {
  assert.deepEqual(slotsOf([]), [])
})

function errorOf(fields: Array<[string, string]>) {
  const result = parseRivalSearchForm(form(fields), today)
  assert.equal(result.ok, false)
  return result.ok ? '' : result.error
}

test('búsqueda: la franja va de 8 a 24 con horas enteras y dura al menos 1 h', () => {
  assert.deepEqual(slotsOf([['day', '2026-10-30'], ['from', '8'], ['to', '9']]), [{ date: '2026-10-30', from: 8, to: 9 }])
  assert.deepEqual(slotsOf([['day', '2026-10-30'], ['from', '23'], ['to', '24']]), [{ date: '2026-10-30', from: 23, to: 24 }])
  for (const [from, to] of [['7', '9'], ['22', '25'], ['20', '20'], ['21', '20'], ['20.5', '22'], ['', '22'], ['veinte', '22']]) {
    assert.match(errorOf([['day', '2026-10-30'], ['from', from], ['to', to]]), /de 8 a 24/)
  }
})

test('búsqueda: también se validan las horas de las franjas que vuelven con el formulario', () => {
  assert.match(errorOf([['slot', '2026-10-30|20|26']]), /de 8 a 24/)
})

test('búsqueda: la fecha va de hoy a 13 días más (los próximos 14 días)', () => {
  assert.equal(slotsOf([['day', '2026-11-11'], ['from', '20'], ['to', '22']]).length, 1)
  for (const day of ['2026-11-12', '2026-10-28', '2026-13-01', '30/10/2026']) {
    assert.match(errorOf([['day', day], ['from', '20'], ['to', '22']]), /próximos 14 días/)
  }
})

test('búsqueda: si la franja es de hoy, empieza en una hora que todavía no pasó', () => {
  assert.equal(slotsOf([['day', '2026-10-29'], ['from', '19'], ['to', '21']]).length, 1)
  for (const from of ['18', '10']) {
    assert.match(errorOf([['day', '2026-10-29'], ['from', from], ['to', '21']]), /todavía no pasó/)
  }
})

test('búsqueda: rechaza franjas del mismo día que se pisan, pero acepta las que se tocan', () => {
  assert.match(errorOf([['slot', '2026-10-31|20|22'], ['day', '2026-10-31'], ['from', '21'], ['to', '23']]), /se pisan/)
  assert.match(errorOf([['slot', '2026-10-31|20|22'], ['day', '2026-10-31'], ['from', '20'], ['to', '22']]), /se pisan/)
  assert.equal(slotsOf([['slot', '2026-10-31|20|22'], ['day', '2026-10-31'], ['from', '22'], ['to', '23']]).length, 2)
  assert.equal(slotsOf([['slot', '2026-10-31|20|22'], ['day', '2026-11-01'], ['from', '20'], ['to', '22']]).length, 2)
})

test('búsqueda: "Repetir la semana que viene" suma la misma franja 7 días después, como franja suelta', () => {
  assert.deepEqual(slotsOf([['day', '2026-11-03'], ['from', '20'], ['to', '22'], ['repeat', 'on']]), [
    { date: '2026-11-03', from: 20, to: 22 },
    { date: '2026-11-10', from: 20, to: 22 },
  ])
})

test('búsqueda: la franja repetida también tiene que caer en los próximos 14 días', () => {
  assert.match(errorOf([['day', '2026-11-05'], ['from', '20'], ['to', '22'], ['repeat', 'on']]), /próximos 14 días/)
})

test('búsqueda: "hoy" es el día y la hora de Buenos Aires, aunque el servidor corra en UTC', () => {
  assert.deepEqual(buenosAiresToday(new Date('2026-10-29T21:40:00Z')), { date: '2026-10-29', hour: 18 })
  // 01:30 UTC del 30 todavía es el 29 a las 22:30 en Buenos Aires.
  assert.deepEqual(buenosAiresToday(new Date('2026-10-30T01:30:00Z')), { date: '2026-10-29', hour: 22 })
})

test('búsqueda: exige equipo y una modalidad válida', () => {
  for (const fields of [{ modality: 'futbol_7' }, { team_id: 'equipo-1', modality: 'futbol_6' }]) {
    const value = new FormData()
    for (const [key, field] of Object.entries(fields)) value.set(key, field)
    assert.equal(parseRivalSearchForm(value, today).ok, false)
  }
})

test('franja: el rango que devuelve la base se lee como fecha y horas de Buenos Aires', () => {
  assert.deepEqual(slotFromRange('["2026-10-30 23:00:00+00","2026-10-31 02:00:00+00")'), { date: '2026-10-30', from: 20, to: 23 })
  // La que termina a medianoche sigue siendo del mismo día, hasta las 24.
  assert.deepEqual(slotFromRange('["2026-10-31 00:00:00+00","2026-10-31 03:00:00+00")'), { date: '2026-10-30', from: 21, to: 24 })
})

test('franja: se muestra con el día de la semana, la fecha corta y las horas', () => {
  assert.equal(slotLabel({ date: '2026-10-30', from: 20, to: 23 }), 'vie 30/10, de 20 a 23')
  assert.equal(slotLabel({ date: '2026-11-04', from: 9, to: 11 }), 'mié 4/11, de 9 a 11')
})

test('franja: se muestra (y se puede editar) mientras no empezó', () => {
  assert.equal(isUpcoming({ date: '2026-10-29', from: 19, to: 21 }, today), true)
  assert.equal(isUpcoming({ date: '2026-10-29', from: 18, to: 21 }, today), false)
  assert.equal(isUpcoming({ date: '2026-10-28', from: 20, to: 22 }, today), false)
  assert.equal(isUpcoming({ date: '2026-10-30', from: 8, to: 9 }, today), true)
})
