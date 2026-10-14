export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type AvatarResult = { ok: true; file: File | null } | { ok: false; error: string }

// Vacío conserva la foto actual. La extensión del nombre no decide el formato.
export function parseAvatar(value: FormDataEntryValue | null): AvatarResult {
  if (value === null || (value instanceof File && value.name === '' && value.size === 0)) {
    return { ok: true, file: null }
  }
  if (!(value instanceof File) || !AVATAR_TYPES.includes(value.type) || value.size === 0) {
    return { ok: false, error: 'La foto tiene que ser JPG, PNG o WebP.' }
  }
  if (value.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: 'La foto no puede pesar más de 2 MB.' }
  }
  return { ok: true, file: value }
}

// profiles.avatar_url es editable por su usuario: una URL ajena nunca debe
// romper next/image. Solo mostramos fotos de nuestro bucket público.
export function avatarSrc(value: string | null, supabaseUrl: string): string | null {
  if (!value || !URL.canParse(value)) return null
  const url = new URL(value)
  const prefix = '/storage/v1/object/public/avatars/'
  if (url.origin !== new URL(supabaseUrl).origin || url.username || url.password
    || !url.pathname.startsWith(prefix) || url.pathname === prefix) return null
  return value
}

// El borrado es más restrictivo que la visualización: nunca toca otra carpeta
// ni confía en la extensión o la URL enviadas en un formulario.
export function avatarObjectPath(value: string | null, supabaseUrl: string, userId: string): string | null {
  const src = avatarSrc(value, supabaseUrl)
  if (!src) return null
  const path = new URL(src).pathname.slice('/storage/v1/object/public/avatars/'.length)
  const [folder, filename, extra] = path.split('/')
  if (folder !== userId || !filename || extra !== undefined || !/^[a-zA-Z0-9._-]+$/.test(filename)
    || filename === '.' || filename === '..') return null
  return path
}
