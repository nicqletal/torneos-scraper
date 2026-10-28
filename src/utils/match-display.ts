// Cómo se muestra un partido en /partidos. La fase y el plazo los calcula la
// base (`match_phase`, `match_deadline`); acá solo se traduce a texto y color.
// Coordinado y Confirmado no son fases: son datos de `por_jugarse`.

import type { Slot } from './rival-search-form.ts'
import { noticeDate } from './notices.ts'

// Lo que devuelve `match_phase`.
export type MatchPhase = 'por_jugarse' | 'caido' | 'esperando_resultado' | 'jugado' | 'en_conflicto' | 'no_presentado'

// El color de la fase, como nombre: la pantalla lo pasa a sus tokens.
export type MatchTone = 'lime' | 'muted' | 'red'

export function matchPhaseBadge(phase: MatchPhase): { text: string; tone: MatchTone } {
  switch (phase) {
    case 'por_jugarse':
      return { text: 'Por jugarse', tone: 'lime' }
    case 'caido':
      return { text: 'Se cayó', tone: 'muted' }
    case 'esperando_resultado':
      return { text: 'Esperando resultado', tone: 'lime' }
    case 'jugado':
      return { text: 'Jugado', tone: 'muted' }
    case 'en_conflicto':
      return { text: 'En conflicto', tone: 'red' }
    case 'no_presentado':
      return { text: 'Falta', tone: 'red' }
  }
}

// Lo que la vista `match_details` trae de la coordinación y la confirmación
// previa, visto desde el equipo propio.
export type MatchCoordination = {
  phase: MatchPhase
  start_at: string
  venue: string | null
  venue_start_at: string | null
  coordinated_at: string | null
  going_at: string | null
  rival_going_at: string | null
  is_captain: boolean
  deadline: string | null
}

// "20:15", en Buenos Aires. La fila ya muestra el día.
export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

// El dato del momento de la fila: la cancha y la hora (cargadas, coordinadas
// o que faltan) y si los dos dijeron "Vamos", Confirmado.
export function matchRowDetail(match: MatchCoordination): string {
  const confirmed = match.going_at !== null && match.rival_going_at !== null
  const withConfirmed = (detail: string) => (confirmed ? `Confirmado · ${detail}` : detail)

  if (!match.venue || !match.venue_start_at) return withConfirmed('Falta cancha y hora')
  const venue = `${match.venue}, ${timeLabel(match.venue_start_at)}`
  if (!match.coordinated_at) return withConfirmed(`${venue} · a confirmar`)
  return confirmed ? `Confirmado · ${venue}` : `Coordinado · ${venue}`
}

// "Ver en el mapa": la búsqueda de la cancha en Google Maps.
export function mapsLink(venue: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
}

// "¿Van?": el capitán, mientras está abierta la confirmación previa (la base
// manda el plazo de un partido por jugarse solo desde 24 h antes) y si
// todavía no dijo "Vamos". Después de la hora de inicio, el plazo es el del
// resultado.
export function asksGoing(match: MatchCoordination): boolean {
  return match.is_captain && match.phase === 'por_jugarse' && match.deadline !== null && match.going_at === null
}

const HOUR = 3_600_000

// Desde 12 h antes de la hora de inicio, si el rival no dijo "Vamos". Pasa
// solo por el tiempo, así que no avisa: se ve al entrar.
export function goingNote(match: MatchCoordination, now: Date): string | null {
  const start = new Date(match.start_at).getTime()
  const open = match.phase === 'por_jugarse' && now.getTime() >= start - 12 * HOUR && now.getTime() < start
  return open && match.rival_going_at === null ? 'El rival todavía no confirmó' : null
}

// Las filas de "Tus partidos", por hora de inicio. Se compara como fecha, no
// como texto, porque la API puede devolver distintos husos.
export function sortByStart<T extends { start_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
}

// El próximo partido, el que va arriba en grande: el primero por jugarse.
export function nextMatch<T extends { start_at: string; phase: MatchPhase }>(rows: T[]): T | undefined {
  return sortByStart(rows).find((row) => row.phase === 'por_jugarse')
}

// Franja ocupada: se pisa con un partido del equipo (los dos como franjas de
// Buenos Aires, de un solo día). La base ya la saca de los compatibles; acá
// solo se marca en el panel para que el capitán sepa por qué.
export function isOccupied(slot: Slot, matches: Slot[]): boolean {
  return matches.some((m) => m.date === slot.date && slot.from < m.to && m.from < slot.to)
}

// Lo que la vista `match_details` trae de la caída y del pedido de común
// acuerdo, visto desde el equipo propio.
export type MatchDrop = {
  phase: MatchPhase
  start_at: string
  is_captain: boolean
  team_name: string
  rival_team_name: string
  drop_reason: string | null
  dropped_by_own: boolean | null
  drop_mutual: boolean
  drop_fault: boolean
  mutual_drop_reason: string | null
  mutual_drop_by_own: boolean | null
  mutual_drop_answered_at: string | null
  mutual_drop_accepted: boolean | null
}

// El dato del momento de un partido caído, con los nombres de los equipos
// (nunca "nosotros"): `Se cayó · lo tiró Los Rivales: "lluvia" · falta para
// Los Rivales`, o `Se cayó de común acuerdo: "lluvia"`.
export function dropDetail(match: MatchDrop): string {
  const reason = `"${match.drop_reason ?? ''}"`
  if (match.drop_mutual) return `Se cayó de común acuerdo: ${reason}`
  const by = match.dropped_by_own ? match.team_name : match.rival_team_name
  return `Se cayó · lo tiró ${by}: ${reason}${match.drop_fault ? ` · falta para ${by}` : ''}`
}

// Lo que ofrece el menú ⋯ de la fila: solo al capitán y antes de la hora de
// inicio. Con menos de 24 h, tirarlo suma falta y se puede pedir de común
// acuerdo (una sola vez por partido). La base decide la falta con la misma
// regla al tirarlo.
export function dropMenu(
  match: MatchDrop,
  now: Date
): { label: string; withFault: boolean; canAskMutual: boolean } | null {
  const start = new Date(match.start_at).getTime()
  if (!match.is_captain || match.phase !== 'por_jugarse' || now.getTime() >= start) return null
  const withFault = start - now.getTime() < 24 * HOUR
  return {
    label: withFault ? 'Tirar el partido (suma falta)' : 'Tirar el partido',
    withFault,
    canAskMutual: withFault && match.mutual_drop_reason === null,
  }
}

// El motivo de un pedido de común acuerdo que le toca responder al capitán
// (lo pidió el rival, nadie lo respondió y no llegó la hora de inicio), o null.
export function mutualDropToAnswer(match: MatchDrop, now: Date): string | null {
  const open = match.is_captain && match.phase === 'por_jugarse' && now.getTime() < new Date(match.start_at).getTime()
  return open && match.mutual_drop_by_own === false && match.mutual_drop_answered_at === null
    ? match.mutual_drop_reason
    : null
}

// Para quien pidió tirarlo de común acuerdo, mientras el partido sigue en pie.
export function mutualDropNote(match: MatchDrop): string | null {
  if (match.phase !== 'por_jugarse' || match.mutual_drop_by_own !== true) return null
  if (match.mutual_drop_answered_at === null) {
    return `Pediste tirarlo de común acuerdo: esperando a ${match.rival_team_name}`
  }
  return match.mutual_drop_accepted === false
    ? `${match.rival_team_name} rechazó tirarlo de común acuerdo: si lo tirás, suma falta`
    : null
}

// Lo que la vista `match_details` trae del resultado y del presentismo, visto
// desde el equipo propio. Los goles de cada lado vienen como los cargó ese lado
// ("Nosotros / Ellos"); `score_*` es el resultado con el que quedó Jugado.
export type MatchResult = {
  phase: MatchPhase
  is_captain: boolean
  team_name: string
  rival_team_name: string
  goals_for: number | null
  goals_against: number | null
  rival_goals_for: number | null
  rival_goals_against: number | null
  no_show_at: string | null
  rival_no_show_at: string | null
  went_at: string | null
  rival_went_at: string | null
  score_for: number | null
  score_against: number | null
  deadline: string | null
}

// "Real Floresta 3–1 Los Rivales": siempre con el equipo propio primero.
function scoreLine(match: MatchResult, own: number, rival: number): string {
  return `${match.team_name} ${own}–${rival} ${match.rival_team_name}`
}

// El dato del momento de un partido después de la hora de inicio, con los
// nombres de los equipos (nunca "nosotros"): qué cargó cada lado mientras se
// espera, o cómo terminó.
export function resultDetail(match: MatchResult): string {
  const team = match.team_name
  const rival = match.rival_team_name
  const own = match.goals_for !== null && match.goals_against !== null
  const theirs = match.rival_goals_for !== null && match.rival_goals_against !== null

  switch (match.phase) {
    case 'jugado':
      return match.score_for !== null && match.score_against !== null
        ? `Jugado · ${scoreLine(match, match.score_for, match.score_against)}`
        : 'Jugado, sin resultado'
    case 'en_conflicto': {
      // Primero el que dijo "no vinieron"; el otro lo negó con "fuimos" (o
      // cargando un resultado) o acusando de vuelta.
      const version = (noShow: string | null) => (noShow ? '"no vinieron"' : '"fuimos"')
      const [first, firstNoShow, second, secondNoShow] = match.no_show_at
        ? [team, match.no_show_at, rival, match.rival_no_show_at]
        : [rival, match.rival_no_show_at, team, match.no_show_at]
      return `En conflicto · ${first}: ${version(firstNoShow)} · ${second}: ${version(secondNoShow)}`
    }
    case 'no_presentado': {
      const absent = match.no_show_at ? rival : team
      return `${absent} no se presentó · falta para ${absent}`
    }
    default:
      if (match.no_show_at) return `${team} dice que ${rival} no vino · falta que responda`
      if (match.rival_no_show_at) return `${rival} dice que ${team} no fue`
      if (own && theirs) {
        return `No coinciden: ${team} cargó ${match.goals_for}–${match.goals_against}, ${rival} cargó ${match.rival_goals_against}–${match.rival_goals_for} (${team}–${rival})`
      }
      if (own) return `${team} cargó ${scoreLine(match, match.goals_for!, match.goals_against!)} · falta que ${rival} confirme`
      if (theirs) return `${rival} cargó ${scoreLine(match, match.rival_goals_against!, match.rival_goals_for!)}`
      return 'Falta cargar el resultado'
  }
}

// Cuándo vence el plazo de 48 h y qué pasa si vence así. Pasa solo por el
// tiempo, así que no avisa: se ve en la fila.
export function resultDeadlineNote(match: MatchResult): string | null {
  if (match.phase !== 'esperando_resultado' || !match.deadline) return null
  const own = match.goals_for !== null
  const theirs = match.rival_goals_for !== null
  let outcome: string
  if (match.rival_no_show_at) outcome = `si no responden, suma una falta para ${match.team_name}`
  else if (match.no_show_at) outcome = `si no responden, suma una falta para ${match.rival_team_name}`
  else if (own && theirs) outcome = 'si siguen sin coincidir, queda Jugado sin resultado'
  else if (theirs) outcome = 'si no lo corregís, queda ese resultado'
  else if (own) outcome = `si ${match.rival_team_name} no lo corrige, queda ese resultado`
  else outcome = 'si nadie carga nada, queda Jugado sin resultado'
  return `Hay tiempo hasta el ${noticeDate(match.deadline)}; ${outcome}`
}

// Lo que se le ofrece al capitán mientras se espera el resultado, o null:
//   load     cargar o corregir el resultado (el formulario "Nosotros / Ellos")
//   confirm  el resultado del rival, espejado, para confirmarlo con un botón
//            (también si no coincide con el propio)
//   noShow   el link chico "No vinieron"
//   went     responder "fuimos" a un "no vinieron" del rival
// La base valida lo mismo en cada RPC.
export function resultActions(
  match: MatchResult
): { load: string | null; confirm: { goals_for: number; goals_against: number } | null; noShow: boolean; went: boolean } | null {
  if (!match.is_captain || match.phase !== 'esperando_resultado' || match.no_show_at) return null
  if (match.rival_no_show_at) return { load: null, confirm: null, noShow: true, went: true }
  const own = match.goals_for !== null
  const theirs = match.rival_goals_for !== null && match.rival_goals_against !== null
  return {
    load: own || theirs ? 'Corregir' : 'Cargar resultado',
    confirm: theirs ? { goals_for: match.rival_goals_against!, goals_against: match.rival_goals_for! } : null,
    noShow: !own,
    went: false,
  }
}
