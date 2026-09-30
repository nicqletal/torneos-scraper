// El flyer del torneo: qué archivo se acepta y qué URL se muestra.
// Es TypeScript puro (sin Next ni Supabase) para poder testearlo con `pnpm test`.
// Lo usan el formulario (para avisar antes de mandar) y las Server Actions (que
// no confían en el navegador). El bucket `flyers` repite las dos reglas en
// Storage: esto da el mensaje para el usuario; Storage es la última defensa.

export const FLYER_MAX_BYTES = 3 * 1024 * 1024
export const FLYER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type FlyerResult = { ok: true; file: File | null } | { ok: false; error: string }

// Recibe lo que manda el campo `flyer` del formulario. Sin archivo elegido no
// hay flyer, y no es un error: el flyer es opcional y, al editar, dejarlo
// vacío conserva el que ya estaba.
export function parseFlyer(value: FormDataEntryValue | null): FlyerResult {
  // Un <input type="file"> vacío manda un archivo sin nombre y de 0 bytes.
  if (!(value instanceof File) || (value.size === 0 && value.name === '')) {
    return { ok: true, file: null }
  }
  if (!FLYER_TYPES.includes(value.type)) {
    return { ok: false, error: 'El flyer tiene que ser JPG, PNG o WebP.' }
  }
  if (value.size > FLYER_MAX_BYTES) {
    return { ok: false, error: 'El flyer pesa más de 3 MB. Subí una imagen más liviana.' }
  }
  return { ok: true, file: value }
}

// La URL del flyer para mostrar, o null para el placeholder de marca.
// `image_url` la escribe el dueño del torneo, así que podría apuntar a
// cualquier lado; `next/image` tira error con un host que no está en
// `remotePatterns` (next.config.ts), y eso rompería el catálogo entero. Por eso
// solo se muestra si es del bucket `flyers` de nuestro Supabase. Se compara la
// URL ya parseada, no el texto: `new URL` resuelve los `../` que la sacarían
// del bucket.
export function flyerSrc(imageUrl: string | null, supabaseUrl: string): string | null {
  if (!imageUrl || !URL.canParse(imageUrl)) return null
  const url = new URL(imageUrl)
  const ours = url.origin === new URL(supabaseUrl).origin
    && url.pathname.startsWith('/storage/v1/object/public/flyers/')
  return ours ? imageUrl : null
}
