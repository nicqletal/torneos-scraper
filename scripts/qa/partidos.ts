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
  const droppedAt = Date.now() - daysAgo * 24 * HOUR
  const match = check(
    await supabase
      .from('matches')
      .insert({
        range: `[${new Date(droppedAt + HOUR).toISOString()},${new Date(droppedAt + 3 * HOUR).toISOString()})`,
        dropped_at: new Date(droppedAt).toISOString(),
        drop_reason: 'No llegamos (escenario QA)',
        dropped_by_team_id: teamId,
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
}

const name = process.argv[2]
const scenario = SCENARIOS[name]
if (!scenario) {
  console.error(`Escenarios: ${Object.keys(SCENARIOS).join(', ')}`)
  process.exit(1)
}

await clean()
console.log(await scenario())
