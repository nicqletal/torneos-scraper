export const CREST_MAX_BYTES = 2 * 1024 * 1024
export const CREST_TYPES = ['image/jpeg', 'image/png', 'image/webp']
type CrestResult = { ok: true; file: File | null } | { ok: false; error: string }

export function parseCrest(value: FormDataEntryValue | null): CrestResult {
  if (value === null) return { ok: true, file: null }
  // Una Server Action puede serializar el input sin selección como un blob vacío.
  // No se debe subir ni reemplazar el escudo actual con ese marcador.
  if (value instanceof File && value.size === 0
    && (value.name === '' || (value.name === 'blob' && value.type === 'application/octet-stream'))) {
    return { ok: true, file: null }
  }
  if (!(value instanceof File) || value.size === 0 || !CREST_TYPES.includes(value.type)) {
    return { ok: false, error: 'El escudo tiene que ser JPG, PNG o WebP.' }
  }
  if (value.size > CREST_MAX_BYTES) return { ok: false, error: 'El escudo no puede pesar más de 2 MB.' }
  return { ok: true, file: value }
}

// crest_url es editable: filtramos las URLs antes de pasarlas a next/image.
export function crestSrc(value: string | null, supabaseUrl: string): string | null {
  if (!value || !URL.canParse(value)) return null
  const url = new URL(value)
  const prefix = '/storage/v1/object/public/team-crests/'
  if (url.origin !== new URL(supabaseUrl).origin || url.username || url.password
    || !url.pathname.startsWith(prefix) || url.pathname === prefix) return null
  return value
}

export function crestObjectPath(value: string | null, supabaseUrl: string, teamId: string): string | null {
  const src = crestSrc(value, supabaseUrl)
  if (!src) return null
  const path = new URL(src).pathname.slice('/storage/v1/object/public/team-crests/'.length)
  const [folder, filename, extra] = path.split('/')
  if (folder !== teamId || !filename || extra !== undefined || !/^[a-zA-Z0-9_-]+$/.test(filename)) return null
  return path
}
