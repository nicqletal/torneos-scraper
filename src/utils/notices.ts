// Texto y link de cada aviso de la campanita. Ver "Avisos de Partidos" y
// "Campanita" en docs/decisiones-casos-de-uso.md.
//
// La base guarda el hecho (`kind`) y la foto de los datos del momento
// (`params`); acá se traduce a texto. Los avisos que abren un plazo traen
// `deadline` y dicen cuándo vence y qué pasa si no se responde, porque lo que
// vence solo por el tiempo no avisa.

// Los valores del enum `notice_kind` de la base (20261028000001_notices.sql).
export type NoticeKind =
  | 'proposal_received'
  | 'proposal_rejected'
  | 'match_agreed'
  | 'proposal_annulled'
  | 'proposal_cancelled'
  | 'venue_to_confirm'
  | 'match_coordinated'
  | 'match_dropped'
  | 'mutual_drop_requested'
  | 'mutual_drop_accepted'
  | 'mutual_drop_rejected'
  | 'result_to_confirm'
  | 'match_played'
  | 'no_show_reported'
  | 'match_in_conflict'
  | 'rating_revealed'
  | 'tournament_withdrawn'

// `params` es jsonb: cada disparador usa algunas de estas claves.
//   rival_name           el otro equipo, visto desde quien recibe el aviso
//   team_a, team_b       los dos equipos, en avisos que van a los dos planteles
//   range_start/_end     horario de la propuesta o del partido (ISO)
//   start_at, venue      hora exacta y cancha coordinadas
//   deadline             cuándo vence el plazo que abre el aviso (ISO)
export type NoticeParams = Record<string, string | number | null | undefined>

const TIME_ZONE = 'America/Argentina/Buenos_Aires'
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// Día, fecha y hora en Buenos Aires, armados a mano para no depender de cómo
// abrevia cada versión de Intl ("jue." vs "jue").
function parts(iso: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  )
  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)
  // Día de la semana de la fecha de Buenos Aires, no de la fecha UTC.
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return { weekday, day, month, hour: Number(values.hour), minute: values.minute as string }
}

// "jue 5/11"
function dayLabel(iso: string): string {
  const p = parts(iso)
  return `${p.weekday} ${p.day}/${p.month}`
}

// "jue 5/11 22:00"
export function noticeDate(iso: string): string {
  const p = parts(iso)
  return `${dayLabel(iso)} ${String(p.hour).padStart(2, '0')}:${p.minute}`
}

// "mar 4/11, de 20 a 22". Las franjas son de horas enteras y no cruzan la
// medianoche, así que un fin a las 00 es "a 24" del mismo día.
function rangeLabel(start: string, end: string): string {
  const endHour = parts(end).hour
  return `${dayLabel(start)}, de ${parts(start).hour} a ${endHour === 0 ? 24 : endHour}`
}

function str(params: NoticeParams, key: string): string {
  return String(params[key] ?? '')
}

export function noticeText(kind: NoticeKind, params: NoticeParams): string {
  const rival = str(params, 'rival_name')
  const teams = `${str(params, 'team_a')} vs ${str(params, 'team_b')}`
  const range = () => rangeLabel(str(params, 'range_start'), str(params, 'range_end'))
  const deadline = () => noticeDate(str(params, 'deadline'))
  const startAt = () => noticeDate(str(params, 'start_at'))

  switch (kind) {
    case 'proposal_received':
      return `Te propusieron un partido: ${rival} · ${range()}. Respondé antes del ${deadline()} o la propuesta vence.`
    case 'proposal_rejected':
      return `Rechazaron tu propuesta: ${rival}.`
    case 'match_agreed':
      return `Partido acordado: ${teams} · ${range()}.`
    case 'proposal_annulled':
      return `Se anuló tu propuesta con ${rival} (${range()}): ya no tienen ese horario.`
    case 'proposal_cancelled':
      return `Se canceló tu propuesta con ${rival} (${range()}).`
    case 'venue_to_confirm':
      return `Confirmá cancha y hora: ${rival} cargó ${str(params, 'venue')}, ${startAt()}.`
    case 'match_coordinated':
      return `Partido coordinado: ${teams} · ${str(params, 'venue')}, ${startAt()}.`
    case 'match_dropped': {
      const fault = params.fault_team_name ? ` Suma una falta a ${params.fault_team_name}.` : ''
      return `Se cayó el partido ${teams}: «${str(params, 'reason')}».${fault}`
    }
    case 'mutual_drop_requested':
      return `${rival} pide tirar el partido de común acuerdo: «${str(params, 'reason')}». Respondé antes del ${deadline()} o el partido sigue en pie.`
    case 'mutual_drop_accepted':
      return `Se cayó de común acuerdo el partido ${teams}. No suma falta a nadie.`
    case 'mutual_drop_rejected':
      return `${rival} rechazó tirar el partido de común acuerdo.`
    case 'result_to_confirm':
      return `${rival} cargó el resultado: ustedes ${str(params, 'goals_for')}, ${rival} ${str(params, 'goals_against')}. Confirmá o corregí antes del ${deadline()}; si no, queda ese resultado.`
    case 'match_played':
      return `Jugado: ${str(params, 'team_a')} ${str(params, 'goals_a')} - ${str(params, 'goals_b')} ${str(params, 'team_b')}.`
    case 'no_show_reported':
      return `${rival} dice que no fueron al partido. Respondé antes del ${deadline()} o suman una falta.`
    case 'match_in_conflict':
      return `Partido en conflicto: ${teams}. Quedan las dos versiones en el historial.`
    case 'rating_revealed':
      return `Ya podés ver tu calificación del partido contra ${rival}.`
    case 'tournament_withdrawn':
      return `Se dio de baja el torneo '${str(params, 'tournament_name')}', en el que estaba anotado tu equipo ${str(params, 'team_name')}. Hablá con el organizador por lo que hayas pagado.`
  }
}

// El link va a donde está el estado actual: todo lo de Partidos a /partidos;
// la baja de torneo a la página del equipo, porque la ficha ya devuelve 404.
export function noticeLink(kind: NoticeKind, params: NoticeParams): string {
  if (kind === 'tournament_withdrawn') return `/equipos/${str(params, 'team_id')}`
  return '/partidos'
}
