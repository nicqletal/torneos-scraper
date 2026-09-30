// Validación y normalización del formulario de torneo, compartida por el alta y la edición.
// Es TypeScript puro (sin Next ni Supabase) para poder testearlo con `pnpm test`.
// Las mismas reglas están repetidas como `check` en la tabla: esto da el mensaje
// para el usuario; la base es la última defensa.

const MODALITIES = ['futbol_5', 'futbol_7', 'futbol_8', 'futbol_11'] as const

export interface TournamentInput {
  name: string
  sport_modality: (typeof MODALITIES)[number]
  zone: string
  inscription_deadline: string
  start_date: string
  end_date: string
  price: number | null
  capacity: number | null
  description: string | null
  rules: string | null
  venue_address: string | null
  contact_whatsapp: string | null
  contact_instagram: string | null
}

// Las columnas de `TournamentInput`, para leerlas de la base al editar. Son
// también las únicas que el organizador puede editar (grant de update en
// supabase/migrations/20260930000004_tournaments_update_form_columns.sql) y,
// junto con `user_id`, las únicas con las que puede crear (grant de insert en
// supabase/migrations/20260930000005_tournaments_verify.sql).
// Va en un solo literal porque supabase-js lo parsea para tipar el resultado.
export const TOURNAMENT_FORM_COLUMNS =
  'name, sport_modality, zone, inscription_deadline, start_date, end_date, price, capacity, description, rules, venue_address, contact_whatsapp, contact_instagram'

export type ParseResult = { ok: true; data: TournamentInput } | { ok: false; error: string }

// Lleva un WhatsApp argentino a 549 + código de área + número (10 dígitos),
// que es lo que espera wa.me. Devuelve null si no se puede.
// El "15" de celular se rechaza: después del código de área (11 15 1234 5678)
// no se sabe dónde termina el código, y sin código de área (15 1234 5678) falta
// el código. Ningún código de área argentino empieza con 15.
export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  let local: string | null = null
  if (digits.length === 13 && digits.startsWith('549')) local = digits.slice(3)
  else if (digits.length === 12 && digits.startsWith('54')) local = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) local = digits.slice(1)
  else if (digits.length === 10) local = digits

  if (!local || local.startsWith('15')) return null
  return '549' + local
}

// Deja solo el usuario: sin @, sin espacios alrededor y sin la URL del perfil.
export function normalizeInstagram(raw: string): string | null {
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '')

  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : null
}

export function parseTournamentForm(formData: FormData): ParseResult {
  const text = (key: string) => String(formData.get(key) ?? '').trim()
  const optional = (key: string) => text(key) || null
  const fail = (error: string): ParseResult => ({ ok: false, error })

  const name = text('name')
  if (!name) return fail('Poné el nombre del torneo.')

  const sport_modality = text('sport_modality') as TournamentInput['sport_modality']
  if (!MODALITIES.includes(sport_modality)) return fail('Elegí una modalidad.')

  const zone = text('zone')
  if (!zone) return fail('Poné la zona del torneo.')

  const inscription_deadline = text('inscription_deadline')
  const start_date = text('start_date')
  const end_date = text('end_date')
  if (!inscription_deadline || !start_date || !end_date) {
    return fail('Completá las fechas: cierre de inscripción, inicio y fin.')
  }
  // Las fechas llegan como AAAA-MM-DD, así que se pueden comparar como texto.
  if (inscription_deadline > start_date) {
    return fail('El cierre de inscripción no puede ser después del inicio.')
  }
  if (start_date > end_date) return fail('El fin no puede ser antes del inicio.')

  // Precio: vacío es "Consultar" (null) y 0 es "Gratis".
  const price = text('price') === '' ? null : Number(text('price'))
  if (price !== null && !(Number.isFinite(price) && price >= 0)) {
    return fail('El precio tiene que ser un número (0 si es gratis).')
  }

  const capacity = text('capacity') === '' ? null : Number(text('capacity'))
  if (capacity !== null && !(Number.isInteger(capacity) && capacity >= 1)) {
    return fail('El cupo tiene que ser un número entero de al menos 1.')
  }

  const whatsappRaw = text('contact_whatsapp')
  const instagramRaw = text('contact_instagram')
  if (!whatsappRaw && !instagramRaw) {
    return fail('Dejá al menos un contacto: WhatsApp o Instagram.')
  }

  const contact_whatsapp = whatsappRaw ? normalizeWhatsapp(whatsappRaw) : null
  if (whatsappRaw && !contact_whatsapp) {
    return fail('El WhatsApp no es válido. Escribilo con código de área y sin el 15, por ejemplo 11 1234 5678.')
  }

  const contact_instagram = instagramRaw ? normalizeInstagram(instagramRaw) : null
  if (instagramRaw && !contact_instagram) {
    return fail('El Instagram no es válido. Escribí solo el usuario, por ejemplo copa.palermo.')
  }

  return {
    ok: true,
    data: {
      name,
      sport_modality,
      zone,
      inscription_deadline,
      start_date,
      end_date,
      price,
      capacity,
      description: optional('description'),
      rules: optional('rules'),
      venue_address: optional('venue_address'),
      contact_whatsapp,
      contact_instagram,
    },
  }
}

// Edición: lleva un torneo guardado a los valores del formulario, para
// precargarlo. Es la vuelta de `parseTournamentForm`: sin cambios, el
// formulario devuelve el mismo torneo.
export function tournamentToFormValues(tournament: TournamentInput): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [key, value] of Object.entries(tournament)) {
    // Ojo con el precio: 0 ("Gratis") tiene que quedar "0", no vacío ("Consultar").
    values[key] = value === null ? '' : String(value)
  }
  // Se guarda como 549 + 10 dígitos, pero el formulario pide el número con
  // código de área y sin el 549, así que se muestra igual que se cargó.
  if (tournament.contact_whatsapp) values.contact_whatsapp = tournament.contact_whatsapp.slice(3)
  return values
}

// Al editar un torneo con equipos anotados, el organizador confirma el cambio
// porque los afecta. Sin equipos no hace falta preguntar.
export function editConfirmation(inscriptions: number): string | null {
  if (inscriptions === 0) return null
  const teams = inscriptions === 1 ? '1 equipo anotado' : `${inscriptions} equipos anotados`
  return `Hay ${teams}, ¿confirmás el cambio?`
}
