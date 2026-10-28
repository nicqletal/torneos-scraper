import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  asksGoing,
  canCoordinate,
  dropDetail,
  dropMenu,
  goingNote,
  historyRow,
  recordLine,
  isOccupied,
  mapsLink,
  matchPhaseBadge,
  matchRowDetail,
  mutualDropNote,
  mutualDropToAnswer,
  nextMatch,
  ratingRow,
  ratingSummary,
  resultActions,
  resultDeadlineNote,
  resultDetail,
  sortByStart,
  starsLabel,
  type MatchPhase,
} from './match-display.ts'

test('partido: por jugarse se muestra en lima', () => {
  assert.deepEqual(matchPhaseBadge('por_jugarse'), { text: 'Por jugarse', tone: 'lime' })
})

// Un partido del jue 5/11 de 20 a 22, sin coordinar ni confirmar.
const match = {
  phase: 'por_jugarse' as const,
  start_at: '2026-11-05T23:00:00+00:00',
  venue: null as string | null,
  venue_start_at: null as string | null,
  coordinated_at: null as string | null,
  going_at: null as string | null,
  rival_going_at: null as string | null,
  is_captain: true,
  deadline: null as string | null,
}
const loaded = { ...match, venue: 'Club Parque', venue_start_at: '2026-11-05T23:15:00+00:00' }

test('partido: sin cancha ni hora cargadas, el dato del momento es que faltan', () => {
  assert.equal(matchRowDetail(match), 'Falta cancha y hora')
})

test('partido: cargadas y sin confirmar, se muestran a confirmar, en hora de Buenos Aires', () => {
  assert.equal(matchRowDetail(loaded), 'Club Parque, 20:15 · a confirmar')
})

test('partido: confirmadas, el partido está Coordinado', () => {
  assert.equal(matchRowDetail({ ...loaded, coordinated_at: '2026-11-01T12:00:00+00:00' }), 'Coordinado · Club Parque, 20:15')
})

test('partido: si los dos dijeron Vamos, está Confirmado, con o sin cancha', () => {
  const going = { going_at: '2026-11-05T01:00:00+00:00', rival_going_at: '2026-11-05T02:00:00+00:00' }
  assert.equal(matchRowDetail({ ...loaded, ...going, coordinated_at: '2026-11-01T12:00:00+00:00' }), 'Confirmado · Club Parque, 20:15')
  assert.equal(matchRowDetail({ ...match, ...going }), 'Confirmado · Falta cancha y hora')
})

test('partido: "Ver en el mapa" busca la cancha en Google Maps', () => {
  assert.equal(mapsLink('Club Parque, Av. Rivadavia 123'), 'https://www.google.com/maps/search/?api=1&query=Club%20Parque%2C%20Av.%20Rivadavia%20123')
})

test('partido: cancha y hora se cargan o corrigen hasta el inicio del horario, aunque la hora coordinada sea más tarde', () => {
  // De 20 a 22 (23:00 a 01:00 UTC), coordinado a las 21.
  const coordinated = {
    ...loaded,
    range: '["2026-11-05 23:00:00+00","2026-11-06 01:00:00+00")',
    start_at: '2026-11-06T00:00:00+00:00',
    coordinated_at: '2026-11-01T12:00:00+00:00',
  }
  assert.equal(canCoordinate(coordinated, new Date('2026-11-05T22:59:00Z')), true)
  assert.equal(canCoordinate(coordinated, new Date('2026-11-05T23:30:00Z')), false, 'a las 20:30, ya no')
  assert.equal(canCoordinate({ ...coordinated, is_captain: false }, new Date('2026-11-05T22:59:00Z')), false, 'el plantel no')
  assert.equal(canCoordinate({ ...coordinated, phase: 'caido' }, new Date('2026-11-05T22:59:00Z')), false, 'un caído no')
})

test('partido: "¿Van?" lo ve el capitán mientras está abierta la confirmación previa y no dijo Vamos', () => {
  const open = { ...match, deadline: match.start_at }
  assert.equal(asksGoing(open), true)
  assert.equal(asksGoing(match), false, 'fuera de las 24 h previas, no')
  assert.equal(asksGoing({ ...open, is_captain: false }), false, 'el plantel no')
  assert.equal(asksGoing({ ...open, going_at: '2026-11-05T01:00:00+00:00' }), false, 'si ya dijo Vamos, no')
})

test('partido: desde 12 h antes, si el rival no dijo Vamos, "El rival todavía no confirmó"', () => {
  // La hora de inicio es 23:00 UTC: 12 h antes son las 11:00 UTC.
  assert.equal(goingNote(match, new Date('2026-11-05T11:00:00Z')), 'El rival todavía no confirmó')
  assert.equal(goingNote(match, new Date('2026-11-05T10:59:00Z')), null, 'con más de 12 h, todavía no')
  assert.equal(goingNote(match, new Date('2026-11-05T23:00:00Z')), null, 'desde la hora de inicio, ya no')
  assert.equal(goingNote({ ...match, rival_going_at: '2026-11-05T02:00:00+00:00' }, new Date('2026-11-05T20:00:00Z')), null, 'si el rival dijo Vamos, no')
})

test('partido: las filas van ordenadas por hora de inicio, sin importar el huso con que llegan', () => {
  const rows = [
    { id: 'tarde', start_at: '2026-11-05T23:00:00+00:00' },
    { id: 'temprano', start_at: '2026-11-05T19:00:00-03:00' },
    { id: 'antes', start_at: '2026-11-04T23:00:00+00:00' },
  ]
  assert.deepEqual(sortByStart(rows).map((r) => r.id), ['antes', 'temprano', 'tarde'])
})

test('partido: el próximo es el primero por jugarse, y no hay si no queda ninguno', () => {
  const rows = [
    { id: 'b', start_at: '2026-11-06T23:00:00+00:00', phase: 'por_jugarse' as const },
    { id: 'a', start_at: '2026-11-05T23:00:00+00:00', phase: 'por_jugarse' as const },
  ]
  assert.equal(nextMatch(rows)?.id, 'a')
  assert.equal(nextMatch([]), undefined)
})

test('partido: una franja se pisa con un partido si comparten alguna hora del mismo día', () => {
  const match = { date: '2026-11-05', from: 20, to: 23 }
  assert.equal(isOccupied({ date: '2026-11-05', from: 18, to: 21 }, [match]), true)
  assert.equal(isOccupied({ date: '2026-11-05', from: 18, to: 20 }, [match]), false, 'terminar a la hora en que empieza no es pisarse')
  assert.equal(isOccupied({ date: '2026-11-06', from: 20, to: 23 }, [match]), false)
  assert.equal(isOccupied({ date: '2026-11-05', from: 20, to: 23 }, []), false)
})

// Real Floresta (propio) vs Los Rivales, del jue 5/11 a las 20, sin caída ni
// pedido de común acuerdo.
const drop = {
  phase: 'por_jugarse' as MatchPhase,
  start_at: '2026-11-05T23:00:00+00:00',
  is_captain: true,
  team_name: 'Real Floresta',
  rival_team_name: 'Los Rivales',
  drop_reason: null as string | null,
  dropped_by_own: null as boolean | null,
  drop_mutual: false,
  drop_fault: false,
  mutual_drop_reason: null as string | null,
  mutual_drop_by_own: null as boolean | null,
  mutual_drop_answered_at: null as string | null,
  mutual_drop_accepted: null as boolean | null,
}
const hoursBefore = (hours: number) => new Date(new Date(drop.start_at).getTime() - hours * 3_600_000)

test('partido: caído se muestra apagado', () => {
  assert.deepEqual(matchPhaseBadge('caido'), { text: 'Se cayó', tone: 'muted' })
})

test('caída: tirado solo, dice quién, el motivo y a quién le suma la falta', () => {
  const dropped = { ...drop, phase: 'caido' as const, drop_reason: 'nos faltan dos', dropped_by_own: false, drop_fault: true }
  assert.equal(dropDetail(dropped), 'Se cayó · lo tiró Los Rivales: "nos faltan dos" · falta para Los Rivales')
  assert.equal(dropDetail({ ...dropped, dropped_by_own: true, drop_fault: false }), 'Se cayó · lo tiró Real Floresta: "nos faltan dos"')
})

test('caída: de común acuerdo, solo el motivo', () => {
  const mutual = { ...drop, phase: 'caido' as const, drop_reason: 'lluvia', dropped_by_own: true, drop_mutual: true }
  assert.equal(dropDetail(mutual), 'Se cayó de común acuerdo: "lluvia"')
})

test('caída: con más de 24 h, "Tirar el partido" sin falta y sin común acuerdo', () => {
  assert.deepEqual(dropMenu(drop, hoursBefore(25)), { label: 'Tirar el partido', withFault: false, canAskMutual: false })
  assert.deepEqual(dropMenu(drop, hoursBefore(24)), { label: 'Tirar el partido', withFault: false, canAskMutual: false })
})

test('caída: con menos de 24 h, suma falta y se puede pedir de común acuerdo', () => {
  assert.deepEqual(dropMenu(drop, hoursBefore(23.99)), {
    label: 'Tirar el partido (suma falta)',
    withFault: true,
    canAskMutual: true,
  })
})

test('caída: con el pedido ya hecho, no se vuelve a pedir', () => {
  const asked = { ...drop, mutual_drop_reason: 'lluvia', mutual_drop_by_own: true }
  assert.equal(dropMenu(asked, hoursBefore(5))?.canAskMutual, false)
})

test('caída: sin menú desde la hora de inicio, si cayó o si no es el capitán', () => {
  assert.equal(dropMenu(drop, hoursBefore(0)), null)
  assert.equal(dropMenu({ ...drop, phase: 'caido' }, hoursBefore(5)), null)
  assert.equal(dropMenu({ ...drop, is_captain: false }, hoursBefore(5)), null)
})

test('común acuerdo: el capitán rival responde un pedido sin responder, antes de la hora de inicio', () => {
  const asked = { ...drop, mutual_drop_reason: 'lluvia', mutual_drop_by_own: false }
  assert.equal(mutualDropToAnswer(asked, hoursBefore(5)), 'lluvia')
  assert.equal(mutualDropToAnswer({ ...asked, mutual_drop_by_own: true }, hoursBefore(5)), null)
  assert.equal(mutualDropToAnswer({ ...asked, mutual_drop_answered_at: '2026-11-05T10:00:00+00:00' }, hoursBefore(5)), null)
  assert.equal(mutualDropToAnswer({ ...asked, is_captain: false }, hoursBefore(5)), null)
  assert.equal(mutualDropToAnswer(asked, hoursBefore(0)), null)
})

test('común acuerdo: quien lo pidió ve si está esperando o si se lo rechazaron', () => {
  const asked = { ...drop, mutual_drop_reason: 'lluvia', mutual_drop_by_own: true }
  assert.equal(mutualDropNote(asked), 'Pediste tirarlo de común acuerdo: esperando a Los Rivales')
  assert.equal(
    mutualDropNote({ ...asked, mutual_drop_answered_at: '2026-11-05T10:00:00+00:00', mutual_drop_accepted: false }),
    'Los Rivales rechazó tirarlo de común acuerdo: si lo tirás, suma falta'
  )
  assert.equal(mutualDropNote(drop), null)
  assert.equal(mutualDropNote({ ...asked, phase: 'caido' }), null)
})

test('resultado: cada fase nueva tiene su cartel', () => {
  assert.deepEqual(matchPhaseBadge('esperando_resultado'), { text: 'Esperando resultado', tone: 'lime' })
  assert.deepEqual(matchPhaseBadge('jugado'), { text: 'Jugado', tone: 'muted' })
  assert.deepEqual(matchPhaseBadge('en_conflicto'), { text: 'En conflicto', tone: 'red' })
  assert.deepEqual(matchPhaseBadge('no_presentado'), { text: 'Falta', tone: 'red' })
})

// Real Floresta (el equipo propio) vs Los Rivales, esperando el resultado.
const waiting = {
  phase: 'esperando_resultado' as MatchPhase,
  is_captain: true,
  team_name: 'Real Floresta',
  rival_team_name: 'Los Rivales',
  goals_for: null as number | null,
  goals_against: null as number | null,
  rival_goals_for: null as number | null,
  rival_goals_against: null as number | null,
  no_show_at: null as string | null,
  rival_no_show_at: null as string | null,
  went_at: null as string | null,
  rival_went_at: null as string | null,
  score_for: null as number | null,
  score_against: null as number | null,
  deadline: '2026-11-08T01:00:00+00:00' as string | null,
}
const at = '2026-11-06T01:00:00+00:00'

test('resultado: el dato de la fila dice qué cargó cada lado, siempre con el equipo propio primero', () => {
  assert.equal(resultDetail(waiting), 'Falta cargar el resultado')
  assert.equal(resultDetail({ ...waiting, goals_for: 3, goals_against: 1 }),
    'Real Floresta cargó Real Floresta 3–1 Los Rivales · falta que Los Rivales confirme')
  assert.equal(resultDetail({ ...waiting, rival_goals_for: 1, rival_goals_against: 3 }),
    'Los Rivales cargó Real Floresta 3–1 Los Rivales')
  assert.equal(resultDetail({ ...waiting, goals_for: 1, goals_against: 0, rival_goals_for: 2, rival_goals_against: 2 }),
    'No coinciden: Real Floresta cargó 1–0, Los Rivales cargó 2–2 (Real Floresta–Los Rivales)')
})

test('resultado: "no vinieron" pendiente de respuesta, desde cada lado', () => {
  assert.equal(resultDetail({ ...waiting, no_show_at: at }), 'Real Floresta dice que Los Rivales no vino · falta que responda')
  assert.equal(resultDetail({ ...waiting, rival_no_show_at: at }), 'Los Rivales dice que Real Floresta no fue')
})

test('resultado: Jugado, con o sin resultado', () => {
  assert.equal(resultDetail({ ...waiting, phase: 'jugado', score_for: 0, score_against: 2 }), 'Jugado · Real Floresta 0–2 Los Rivales')
  assert.equal(resultDetail({ ...waiting, phase: 'jugado' }), 'Jugado, sin resultado')
})

test('resultado: en conflicto se ven las dos versiones; con falta, a quién', () => {
  assert.equal(resultDetail({ ...waiting, phase: 'en_conflicto', no_show_at: at, rival_went_at: at }),
    'En conflicto · Real Floresta: "no vinieron" · Los Rivales: "fuimos"')
  assert.equal(resultDetail({ ...waiting, phase: 'en_conflicto', no_show_at: at, rival_no_show_at: at }),
    'En conflicto · Real Floresta: "no vinieron" · Los Rivales: "no vinieron"')
  assert.equal(resultDetail({ ...waiting, phase: 'en_conflicto', rival_no_show_at: at, goals_for: 2, goals_against: 0 }),
    'En conflicto · Los Rivales: "no vinieron" · Real Floresta: "fuimos"')
  assert.equal(resultDetail({ ...waiting, phase: 'no_presentado', no_show_at: at }),
    'Los Rivales no se presentó · falta para Los Rivales')
  assert.equal(resultDetail({ ...waiting, phase: 'no_presentado', rival_no_show_at: at }),
    'Real Floresta no se presentó · falta para Real Floresta')
})

test('resultado: la fila dice cuándo vence el plazo y qué pasa si nadie hace nada', () => {
  assert.equal(resultDeadlineNote(waiting), 'Hay tiempo hasta el sáb 7/11 22:00; si nadie carga nada, queda Jugado sin resultado')
  assert.equal(resultDeadlineNote({ ...waiting, rival_goals_for: 1, rival_goals_against: 3 }),
    'Hay tiempo hasta el sáb 7/11 22:00; si no lo corregís, queda ese resultado')
  assert.equal(resultDeadlineNote({ ...waiting, rival_no_show_at: at }),
    'Hay tiempo hasta el sáb 7/11 22:00; si no responden, suma una falta para Real Floresta')
  assert.equal(resultDeadlineNote({ ...waiting, phase: 'jugado', deadline: null }), null)
})

test('resultado: sin nada cargado, el capitán carga o reporta "no vinieron"', () => {
  assert.deepEqual(resultActions(waiting), { load: 'Cargar resultado', confirm: null, noShow: true, went: false })
  assert.equal(resultActions({ ...waiting, is_captain: false }), null)
  assert.equal(resultActions({ ...waiting, phase: 'jugado' }), null)
})

test('resultado: con el resultado del rival, se confirma espejado o se corrige', () => {
  assert.deepEqual(resultActions({ ...waiting, rival_goals_for: 1, rival_goals_against: 3 }), {
    load: 'Corregir',
    confirm: { goals_for: 3, goals_against: 1 },
    noShow: true,
    went: false,
  })
})

test('resultado: con el propio cargado, solo se corrige; con "no vinieron" propio, se espera', () => {
  assert.deepEqual(resultActions({ ...waiting, goals_for: 3, goals_against: 1 }), { load: 'Corregir', confirm: null, noShow: false, went: false })
  assert.equal(resultActions({ ...waiting, no_show_at: at }), null)
})

test('resultado: acusado de no ir, responde "fuimos" o acusa de vuelta', () => {
  assert.deepEqual(resultActions({ ...waiting, rival_no_show_at: at }), { load: null, confirm: null, noShow: true, went: true })
})

test('partido: desde la hora de inicio ya no se pregunta "¿Van?", aunque haya plazo del resultado', () => {
  assert.equal(asksGoing({ ...match, phase: 'esperando_resultado', deadline: '2026-11-08T01:00:00+00:00' }), false)
})

test('resultado: si no coinciden, se puede confirmar el del rival (espejado) o corregir', () => {
  assert.deepEqual(resultActions({ ...waiting, goals_for: 2, goals_against: 0, rival_goals_for: 1, rival_goals_against: 1 }), {
    load: 'Corregir',
    confirm: { goals_for: 1, goals_against: 1 },
    noShow: false,
    went: false,
  })
})

test('calificación: las estrellas se dibujan llenas y vacías, sobre 5', () => {
  assert.equal(starsLabel(4), '★★★★☆')
  assert.equal(starsLabel(1), '★☆☆☆☆')
  assert.equal(starsLabel(5), '★★★★★')
})

// Un partido Jugado que se puede calificar hasta el jue 12/11 22:00.
const played = {
  phase: 'jugado' as MatchPhase,
  is_captain: true,
  team_name: 'Real Floresta',
  rival_team_name: 'Los Rivales',
  rating_deadline: '2026-11-13T01:00:00+00:00',
  rated_by_own: false as boolean | null,
  received_stars: null as number | null,
}
const beforeDeadline = new Date('2026-11-12T12:00:00Z')

test('calificación: el capitán que no calificó ve "Calificar" con el plazo', () => {
  assert.deepEqual(ratingRow(played, beforeDeadline), {
    canRate: true,
    note: 'Podés calificar a Los Rivales hasta el jue 12/11 22:00',
  })
})

test('calificación: después de calificar, espera la del rival sin ver nada', () => {
  assert.deepEqual(ratingRow({ ...played, rated_by_own: true }, beforeDeadline), {
    canRate: false,
    note: 'Calificaste a Los Rivales. La de Real Floresta se ve cuando califique Los Rivales o el jue 12/11 22:00',
  })
})

test('calificación: la recibida aparece cuando se revela, haya calificado o no', () => {
  assert.deepEqual(ratingRow({ ...played, rated_by_own: true, received_stars: 4 }, beforeDeadline), {
    canRate: false,
    note: 'Los Rivales calificó a Real Floresta: ★★★★☆',
  })
  const afterDeadline = new Date('2026-11-13T01:00:00Z')
  assert.deepEqual(ratingRow({ ...played, received_stars: 2 }, afterDeadline), {
    canRate: false,
    note: 'Los Rivales calificó a Real Floresta: ★★☆☆☆',
  })
})

test('calificación: vencido el plazo sin calificar ni recibir, no hay nada que mostrar', () => {
  assert.equal(ratingRow(played, new Date('2026-11-13T01:00:00Z')), null)
})

test('calificación: ni el plantel ni un partido que no está Jugado muestran nada', () => {
  assert.equal(ratingRow({ ...played, is_captain: false, rated_by_own: null }, beforeDeadline), null)
  assert.equal(ratingRow({ ...played, phase: 'en_conflicto', rating_deadline: null }, beforeDeadline), null)
})

// Una fila del historial de Real Floresta, la dueña de la página.
const history = {
  team_name: 'Real Floresta',
  played_on: '2026-10-24',
  phase: 'jugado' as MatchPhase,
  rival_team_name: 'La 12 FC',
  goals_for: null,
  goals_against: null,
  drop_reason: null,
  dropped_by_own: null,
  drop_mutual: false,
  drop_fault: false,
  own_said_no_show: false,
  rival_said_no_show: false,
  absent_own: null,
}

test('historial: la fecha va sin hora', () => {
  assert.equal(historyRow(history).date, 'sáb 24/10')
})

test('historial: un Jugado se cuenta desde el lado del dueño de la página', () => {
  assert.equal(historyRow({ ...history, goals_for: 3, goals_against: 1 }).outcome, 'Ganó 3–1')
  assert.equal(historyRow({ ...history, goals_for: 0, goals_against: 2 }).outcome, 'Perdió 0–2')
  assert.equal(historyRow({ ...history, goals_for: 1, goals_against: 1 }).outcome, 'Empató 1–1')
  assert.equal(historyRow(history).outcome, 'Jugado, sin resultado')
})

test('historial: un caído dice quién lo tiró, con su nombre, y si sumó falta', () => {
  const dropped = { ...history, phase: 'caido' as MatchPhase, drop_reason: 'nos faltan dos' }
  assert.equal(
    historyRow({ ...dropped, dropped_by_own: false, drop_fault: true }).outcome,
    'Se cayó · lo tiró La 12 FC: "nos faltan dos" · falta para La 12 FC'
  )
  assert.equal(historyRow({ ...dropped, dropped_by_own: true }).outcome, 'Se cayó · lo tiró Real Floresta: "nos faltan dos"')
  assert.equal(
    historyRow({ ...dropped, drop_reason: 'lluvia', dropped_by_own: true, drop_mutual: true }).outcome,
    'Se cayó de común acuerdo: "lluvia"'
  )
})

test('historial: un conflicto muestra las dos versiones, primero la de "no vinieron"', () => {
  const conflict = { ...history, phase: 'en_conflicto' as MatchPhase }
  assert.equal(
    historyRow({ ...conflict, own_said_no_show: true }).outcome,
    'En conflicto · Real Floresta: "no vinieron" · La 12 FC: "fuimos"'
  )
  assert.equal(
    historyRow({ ...conflict, rival_said_no_show: true }).outcome,
    'En conflicto · La 12 FC: "no vinieron" · Real Floresta: "fuimos"'
  )
  assert.equal(
    historyRow({ ...conflict, own_said_no_show: true, rival_said_no_show: true }).outcome,
    'En conflicto · Real Floresta: "no vinieron" · La 12 FC: "no vinieron"'
  )
})

test('historial: la falta por no presentarse nombra al ausente', () => {
  const noShow = { ...history, phase: 'no_presentado' as MatchPhase }
  assert.equal(historyRow({ ...noShow, absent_own: false }).outcome, 'La 12 FC no se presentó · falta para La 12 FC')
  assert.equal(historyRow({ ...noShow, absent_own: true }).outcome, 'Real Floresta no se presentó · falta para Real Floresta')
})

test('contador: jugados, faltas y conflictos con la cantidad de rivales distintos', () => {
  assert.equal(
    recordLine({ played: 12, faults: 1, conflicts: 2, conflict_rivals: 2 }),
    'Jugó 12 · 1 falta · 2 conflictos (con 2 rivales distintos)'
  )
  assert.equal(
    recordLine({ played: 5, faults: 3, conflicts: 2, conflict_rivals: 1 }),
    'Jugó 5 · 3 faltas · 2 conflictos (con 1 rival)'
  )
  assert.equal(recordLine({ played: 1, faults: 2, conflicts: 1, conflict_rivals: 1 }), 'Jugó 1 · 2 faltas · 1 conflicto (con 1 rival)')
})

test('contador: las faltas se muestran aunque sean 0; los conflictos, solo si hay', () => {
  assert.equal(recordLine({ played: 12, faults: 0, conflicts: 0, conflict_rivals: 0 }), 'Jugó 12 · 0 faltas')
  assert.equal(recordLine({ played: 0, faults: 0, conflicts: 0, conflict_rivals: 0 }), 'Jugó 0 · 0 faltas')
})

test('estrellas: promedio con un decimal y coma, y la cantidad', () => {
  assert.equal(ratingSummary(4.25, 12), '★ 4,3 (12)')
  assert.equal(ratingSummary(4, 1), '★ 4,0 (1)')
})

test('estrellas: sin calificaciones reveladas', () => {
  assert.equal(ratingSummary(null, 0), 'Sin calificaciones')
})
