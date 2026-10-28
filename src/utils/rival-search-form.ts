import { isSportModality, type SportModality } from './modality.ts'

// Una franja: una fecha (en Buenos Aires) y un rango de horas enteras [from, to).
export type Slot = { date: string; from: number; to: number }

export type RivalSearchFields = { team_id: string; modality: SportModality; slots: Slot[] }
type RivalSearchFormResult = { ok: true; fields: RivalSearchFields } | { ok: false; error: string }

// El día y la hora de "ahora" en Buenos Aires: la fecha mínima y, si la franja
// es de hoy, la hora a partir de la cual puede empezar.
export type Today = { date: string; hour: number }

// Las franjas son siempre en hora de Buenos Aires, aunque el servidor corra en UTC.
export function buenosAiresToday(now: Date): Today {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { date: `${part('year')}-${part('month')}-${part('day')}`, hour: Number(part('hour')) }
}

// Cuántos días adelante se pueden cargar franjas: hoy y los 13 siguientes.
export const SEARCH_DAYS = 14

// Suma días a una fecha "AAAA-MM-DD". Se calcula en UTC para que el cambio de
// horario de la máquina no corra el día; la fecha ya es la de Buenos Aires.
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function isDate(value: string): boolean {
  // "2026-02-31" pasa el patrón, pero no vuelve igual al normalizarla.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && addDays(value, 0) === value
}

// Las mismas reglas valida save_rival_search en la base, que es la que manda.
function slotError(slot: Slot, today: Today): string | null {
  const { date, from, to } = slot
  if (!isDate(date) || date < today.date || date > addDays(today.date, SEARCH_DAYS - 1)) {
    return 'Las franjas tienen que ser de los próximos 14 días.'
  }
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 8 || to > 24 || to - from < 1) {
    return 'Cada franja va de 8 a 24, en horas enteras, y dura al menos 1 h.'
  }
  if (!isUpcoming(slot, today)) {
    return 'Una franja de hoy tiene que empezar en una hora que todavía no pasó.'
  }
  return null
}

export function parseRivalSearchForm(form: FormData, today: Today): RivalSearchFormResult {
  const teamId = form.get('team_id')
  const modality = form.get('modality')
  if (typeof teamId !== 'string' || !teamId) return { ok: false, error: 'Elegí el equipo.' }
  if (!isSportModality(modality)) return { ok: false, error: 'Elegí una modalidad válida.' }

  // Las franjas que la búsqueda ya tenía llegan como "fecha|desde|hasta".
  const slots: Slot[] = []
  for (const value of form.getAll('slot')) {
    const [date, from, to] = String(value).split('|')
    slots.push({ date, from: Number(from), to: Number(to) })
  }

  const day = form.get('day')
  if (typeof day === 'string' && day) {
    const slot = { date: day, from: Number(form.get('from')), to: Number(form.get('to')) }
    slots.push(slot)
    // Atajo "Repetir la semana que viene": la misma franja 7 días después,
    // como una franja suelta más (no queda nada recurrente guardado).
    if (form.get('repeat') === 'on') slots.push({ ...slot, date: addDays(slot.date, 7) })
  }

  for (const slot of slots) {
    const error = slotError(slot, today)
    if (error) return { ok: false, error }
  }

  slots.sort((a, b) => a.date.localeCompare(b.date) || a.from - b.from)
  // Ordenadas, alcanza con mirar cada una contra la anterior. Que una termine
  // a las 22 y la otra empiece a las 22 no es pisarse: los rangos son [desde, hasta).
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].date === slots[i - 1].date && slots[i].from < slots[i - 1].to) {
      return { ok: false, error: 'Hay franjas que se pisan: cada horario va una sola vez.' }
    }
  }

  return { ok: true, fields: { team_id: teamId, modality, slots } }
}

// Un tstzrange tal como lo devuelve la API, '["2026-10-30 23:00:00+00","2026-10-31 02:00:00+00")',
// leído como franja de Buenos Aires. Una franja nunca cruza la medianoche, así
// que alcanza con el día y la hora de inicio y la duración.
export function slotFromRange(range: string): Slot {
  const [start, end] = [...range.matchAll(/"([^"]+)"/g)].map(([, value]) => new Date(value.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')))
  const { date, hour } = buenosAiresToday(start)
  return { date, from: hour, to: hour + Math.round((end.getTime() - start.getTime()) / 3_600_000) }
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// "vie 30/10", el día como se muestra en el calendario y en las franjas.
export function dayLabel(date: string): string {
  const value = new Date(`${date}T00:00:00Z`)
  return `${WEEKDAYS[value.getUTCDay()]} ${value.getUTCDate()}/${value.getUTCMonth() + 1}`
}

// "vie 30/10, de 20 a 23"
export function slotLabel(slot: Slot): string {
  return `${dayLabel(slot.date)}, de ${slot.from} a ${slot.to}`
}

// El valor con que una franja vuelve en el formulario ("fecha|desde|hasta").
export function slotValue(slot: Slot): string {
  return `${slot.date}|${slot.from}|${slot.to}`
}

// Una franja que todavía no empezó: la única que se muestra, se puede proponer
// y vuelve con el formulario. Es la misma cuenta que hace la base (inicio > ahora).
export function isUpcoming(slot: Slot, today: Today): boolean {
  return slot.date > today.date || (slot.date === today.date && slot.from > today.hour)
}
