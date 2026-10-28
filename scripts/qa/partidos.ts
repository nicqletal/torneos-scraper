// Escenarios QA de Partidos: arma en la base los casos que dependen de plazos
// que no se pueden esperar en el navegador (72 h, 48 h, 7 días, faltas en 90
// días). Ver "Plazos" en docs/diseno-partidos.md.
//
// Escribe los hechos directo en las tablas, con fechas hacia atrás y sin pasar
// por las RPC, con la `service_role key` de `.env.local`. Solo toca los datos
// de Partidos de los equipos QA (el de Caro y el del rival de prueba).
//
// Uso, desde la raíz del repo:
//   node --experimental-strip-types scripts/qa/partidos.ts limpiar
//   node --experimental-strip-types scripts/qa/partidos.ts propuesta-vencida
//   node --experimental-strip-types scripts/qa/partidos.ts dos-faltas
//   node --experimental-strip-types scripts/qa/partidos.ts bloqueado
//   node --experimental-strip-types scripts/qa/partidos.ts resultado-vencido
//   node --experimental-strip-types scripts/qa/partidos.ts resultados-distintos-vencidos
//   node --experimental-strip-types scripts/qa/partidos.ts no-vinieron-vencido
//   node --experimental-strip-types scripts/qa/partidos.ts sin-cargas-vencido
//   node --experimental-strip-types scripts/qa/partidos.ts vencimientos   (los cuatro juntos)
//   node --experimental-strip-types scripts/qa/partidos.ts calificacion-vencida
//   node --experimental-strip-types scripts/qa/partidos.ts historial
//
// Cada escenario empieza limpiando, así se puede correr las veces que haga
// falta. Las etapas siguientes suman escenarios a `SCENARIOS`.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { addDays, buenosAiresToday } from '../../src/utils/rival-search-form.ts'

// Lee un .env sin dependencias: `CLAVE=valor`, ignorando comentarios.
function loadEnv(path: string): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/)
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const env = { ...loadEnv('.env.local'), ...loadEnv('.env.test-users.local') }
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const CARO_TEAM = env.TEST_TEAM_ID
const RIVAL_TEAM = env.TEST_RIVAL_TEAM_ID
const QA_TEAMS = [CARO_TEAM, RIVAL_TEAM]
const QA_EMAILS = [
  env.TEST_USER_JUGADOR,
  env.TEST_USER_CAPITAN,
  env.TEST_USER_ORGANIZADOR,
  env.TEST_USER_ADMIN,
  env.TEST_USER_RIVAL,
]

const HOUR = 3_600_000

function check<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error
  return data
}

// Un rango [desde, hasta) de horas enteras de Buenos Aires (UTC-3, sin
// horario de verano), como lo arma `save_rival_search`.
function range(date: string, from: number, to: number): string {
  const at = (hour: number) => new Date(`${date}T00:00:00-03:00`).getTime() + hour * HOUR
  return `[${new Date(at(from)).toISOString()},${new Date(at(to)).toISOString()})`
}

// Borra búsquedas, franjas, propuestas, partidos y los avisos de Partidos de las
// cuentas QA. La baja de torneo no es de Partidos: esos avisos quedan.
async function clean() {
  const searches = check(await supabase.from('rival_searches').select('id').in('team_id', QA_TEAMS)) ?? []
  const searchIds = searches.map((s) => s.id)
  const slots = check(await supabase.from('search_slots').select('id').in('search_id', searchIds)) ?? []
  const slotIds = slots.map((s) => s.id)

  check(await supabase.from('proposals').delete().in('from_slot_id', slotIds))
  check(await supabase.from('proposals').delete().in('to_slot_id', slotIds))

  // Los partidos de los equipos QA, después de las propuestas que apuntan a
  // ellos. Sus `match_sides` se borran en cascada.
  const sides = check(await supabase.from('match_sides').select('match_id').in('team_id', QA_TEAMS)) ?? []
  check(await supabase.from('matches').delete().in('id', sides.map((s) => s.match_id)))
  check(await supabase.from('search_slots').delete().in('id', slotIds))
  check(await supabase.from('rival_searches').delete().in('id', searchIds))

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const qaUserIds = data.users.filter((u) => QA_EMAILS.includes(u.email ?? '')).map((u) => u.id)
  check(await supabase.from('notices').delete().in('user_id', qaUserIds).neq('kind', 'tournament_withdrawn'))
}

// Una búsqueda de Fútbol 5 con una franja, publicada hace `hoursAgo` horas.
async function publish(teamId: string, slotRange: string, hoursAgo: number): Promise<string> {
  const createdAt = new Date(Date.now() - hoursAgo * HOUR).toISOString()
  const search = check(
    await supabase.from('rival_searches').insert({ team_id: teamId, modality: 'futbol_5', created_at: createdAt }).select('id').single()
  )!
  const slot = check(await supabase.from('search_slots').insert({ search_id: search.id, range: slotRange }).select('id').single())!
  return slot.id
}

// Una falta de `teamId`: un partido contra el otro equipo QA que tiró solo
// hace `daysAgo` días, 1 h antes de empezar.
async function fault(teamId: string, daysAgo: number) {
  await dropped(teamId, daysAgo, 1, 'No llegamos (escenario QA)')
}

// Un partido contra el otro equipo QA que `teamId` tiró hace `daysAgo` días,
// `hoursBefore` horas antes de empezar (con menos de 24, suma falta salvo de
// común acuerdo).
async function dropped(teamId: string, daysAgo: number, hoursBefore: number, reason: string, mutual = false) {
  const droppedAt = Date.now() - daysAgo * 24 * HOUR
  const start = droppedAt + hoursBefore * HOUR
  const match = check(
    await supabase
      .from('matches')
      .insert({
        range: `[${new Date(start).toISOString()},${new Date(start + 2 * HOUR).toISOString()})`,
        dropped_at: new Date(droppedAt).toISOString(),
        drop_reason: reason,
        dropped_by_team_id: teamId,
        drop_mutual: mutual,
      })
      .select('id')
      .single()
  )!
  check(
    await supabase.from('match_sides').insert([
      { match_id: match.id, team_id: CARO_TEAM },
      { match_id: match.id, team_id: RIVAL_TEAM },
    ])
  )
}

// Lo que cargó un lado después del partido (las columnas de `match_sides`).
type SideFacts = { goals_for?: number; goals_against?: number; result_at?: string; no_show_at?: string; went_at?: string }

// Un partido ya jugado entre los dos equipos QA, de 2 h en horas enteras, que
// terminó `daysBack` días antes del último fin de hora de hace 49 h. Con
// `lastActionHoursAgo`, la última carga fue hace esas horas (y los hechos de
// cada lado llevan esa fecha); sin, nadie cargó nada.
async function pastMatch(daysBack: number, caro: SideFacts, rival: SideFacts, lastActionHoursAgo?: number): Promise<string> {
  const end = Math.floor((Date.now() - 49 * HOUR) / HOUR) * HOUR - daysBack * 24 * HOUR
  const match = check(
    await supabase
      .from('matches')
      .insert({
        range: `[${new Date(end - 2 * HOUR).toISOString()},${new Date(end).toISOString()})`,
        last_action_at: lastActionHoursAgo === undefined ? null : new Date(Date.now() - lastActionHoursAgo * HOUR).toISOString(),
      })
      .select('id')
      .single()
  )!
  check(
    await supabase.from('match_sides').insert([
      { match_id: match.id, team_id: CARO_TEAM, ...caro },
      { match_id: match.id, team_id: RIVAL_TEAM, ...rival },
    ])
  )
  return match.id
}

const ago49 = () => new Date(Date.now() - 49 * HOUR).toISOString()

// Los cuatro vencimientos de 48 h del resultado. Cada uno en otro día, para
// verlos juntos en "Tus partidos".
const pastResults = {
  // Nadie cargó nada y el partido terminó hace más de 49 h: Jugado sin resultado.
  sinCargas: () => pastMatch(0, {}, {}),
  // Caro cargó 3–1 hace 49 h y el rival no hizo nada: Jugado 3–1.
  resultado: () => pastMatch(1, { goals_for: 3, goals_against: 1, result_at: ago49() }, {}, 49),
  // Cargaron distinto (2–0 y 1–1) y la última carga fue hace 49 h: Jugado sin resultado.
  distintos: () =>
    pastMatch(
      2,
      { goals_for: 2, goals_against: 0, result_at: ago49() },
      { goals_for: 1, goals_against: 1, result_at: ago49() },
      49
    ),
  // Caro reportó "no vinieron" hace 49 h y el rival no respondió: falta del rival.
  noVinieron: () => pastMatch(3, { no_show_at: ago49() }, {}, 49),
}

const SCENARIOS: Record<string, () => Promise<string>> = {
  limpiar: async () => 'Sin datos de Partidos en las cuentas QA.',

  // Caro le propuso al rival hace 73 h, por un horario que todavía no empezó:
  // la propuesta está vencida. Caro ve "Tu propuesta venció" en el compatible
  // y puede volver a proponer; el rival no ve ninguna tarjeta.
  'propuesta-vencida': async () => {
    const day = addDays(buenosAiresToday(new Date()).date, 3)
    const caroSlot = await publish(CARO_TEAM, range(day, 20, 23), 74)
    const rivalSlot = await publish(RIVAL_TEAM, range(day, 21, 24), 74)
    check(
      await supabase.from('proposals').insert({
        from_slot_id: caroSlot,
        to_slot_id: rivalSlot,
        range: range(day, 21, 23),
        created_at: new Date(Date.now() - 73 * HOUR).toISOString(),
      })
    )
    return `Caro (${day}, de 20 a 23) le propuso al rival (de 21 a 24) hace 73 h: vencida.`
  },

  // El rival tiene 2 faltas en 90 días (hace 30 y 3 días): no está bloqueado
  // y aparece al final de los compatibles de Caro.
  'dos-faltas': async () => {
    const day = addDays(buenosAiresToday(new Date()).date, 3)
    await publish(CARO_TEAM, range(day, 20, 23), 1)
    await publish(RIVAL_TEAM, range(day, 21, 24), 1)
    await fault(RIVAL_TEAM, 30)
    await fault(RIVAL_TEAM, 3)
    return `El rival tiene 2 faltas recientes; los dos buscan rival el ${day}.`
  },

  // El equipo de Caro tiene 3 faltas en 90 días (hace 40, 20 y 2 días):
  // bloqueado hasta dentro de 28 días. No puede publicar, su búsqueda deja de
  // estar activa y la propuesta que le mandó al rival hace 1 h se le ve
  // cancelada al rival ("El equipo está bloqueado por faltas").
  bloqueado: async () => {
    const day = addDays(buenosAiresToday(new Date()).date, 3)
    const caroSlot = await publish(CARO_TEAM, range(day, 20, 23), 2)
    const rivalSlot = await publish(RIVAL_TEAM, range(day, 21, 24), 2)
    check(
      await supabase.from('proposals').insert({
        from_slot_id: caroSlot,
        to_slot_id: rivalSlot,
        range: range(day, 21, 23),
        created_at: new Date(Date.now() - HOUR).toISOString(),
      })
    )
    await fault(CARO_TEAM, 40)
    await fault(CARO_TEAM, 20)
    await fault(CARO_TEAM, 2)
    return `El equipo de Caro tiene 3 faltas recientes (bloqueado); le había propuesto al rival el ${day}, de 21 a 23.`
  },

  'resultado-vencido': async () => {
    await pastResults.resultado()
    return 'Caro cargó 3–1 hace 49 h y el rival no hizo nada: Jugado 3–1.'
  },

  'resultados-distintos-vencidos': async () => {
    await pastResults.distintos()
    return 'Cargaron 2–0 y 1–1 (desde cada lado) hace 49 h: Jugado sin resultado.'
  },

  'no-vinieron-vencido': async () => {
    await pastResults.noVinieron()
    return 'Caro reportó "no vinieron" hace 49 h y el rival no respondió: falta para el rival.'
  },

  'sin-cargas-vencido': async () => {
    await pastResults.sinCargas()
    return 'Partido sin cargas que terminó hace más de 49 h: Jugado sin resultado.'
  },

  vencimientos: async () => {
    for (const create of Object.values(pastResults)) await create()
    return 'Los cuatro vencimientos de 48 h: sin cargas, resultado cargado, resultados distintos y "no vinieron" sin respuesta.'
  },

  // Un partido sin cargas que quedó Jugado hace 8 días, y solo el rival
  // calificó a Caro (4 estrellas): vencidos los 7 días, Caro ve su
  // calificación sin haber calificado, y ya no puede calificar.
  'calificacion-vencida': async () => {
    const matchId = await pastMatch(8, {}, {})
    check(await supabase.from('ratings').insert({ match_id: matchId, team_id: RIVAL_TEAM, stars: 4 }))
    return 'Partido Jugado hace 8 días; solo el rival calificó a Caro (4 estrellas): ya se revela.'
  },

  // Un partido cerrado de cada tipo, para el historial de la página del
  // equipo. Del más nuevo al más viejo: caído de común acuerdo, caído con
  // falta del rival, falta del rival por no presentarse, en conflicto, Jugado
  // 3–1 (calificado por los dos) y, sexto, caído sin falta: no entra en los
  // últimos 5.
  historial: async () => {
    await dropped(CARO_TEAM, 2, 3, 'lluvia', true)
    await dropped(RIVAL_TEAM, 3, 2, 'nos faltan dos')
    await pastMatch(3, { no_show_at: ago49() }, {}, 49)
    await pastMatch(4, { no_show_at: ago49() }, { went_at: ago49() }, 49)
    const played = await pastMatch(
      5,
      { goals_for: 3, goals_against: 1, result_at: ago49() },
      { goals_for: 1, goals_against: 3, result_at: ago49() },
      49
    )
    check(
      await supabase.from('ratings').insert([
        { match_id: played, team_id: RIVAL_TEAM, stars: 4 },
        { match_id: played, team_id: CARO_TEAM, stars: 5 },
      ])
    )
    await dropped(CARO_TEAM, 12, 48, 'cambio de planes')
    return 'Seis partidos cerrados de Caro contra el rival: común acuerdo, caído con falta, no presentado, en conflicto, Jugado 3–1 (★4 para Caro) y caído sin falta.'
  },
}

const name = process.argv[2]
const scenario = SCENARIOS[name]
if (!scenario) {
  console.error(`Escenarios: ${Object.keys(SCENARIOS).join(', ')}`)
  process.exit(1)
}

await clean()
console.log(await scenario())
