import { safeNextPath } from './safe-next-path.ts'

export const CATALOG_PATH = '/torneos'
export const GUEST_COOKIE = 'torneos-guest'
export type CatalogParams = Record<string, string | string[] | undefined>

export function catalogPath(params: CatalogParams = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, item)
    }
  }
  return query.size ? `${CATALOG_PATH}?${query}` : CATALOG_PATH
}

// Es una preferencia de navegación, nunca una comprobación de permisos.
export function entryDestination(hasSession: boolean, guest: string | undefined, params: CatalogParams = {}): string {
  const catalog = catalogPath(params)
  // Los links filtrados de la portada anterior siguen siendo públicos.
  return hasSession || guest === '1' || catalog !== CATALOG_PATH ? catalog : '/login'
}

export function loginDestination(next: unknown): string {
  const destination = safeNextPath(next, CATALOG_PATH)
  const pathname = new URL(destination, 'http://internal.invalid').pathname
  return pathname === '/login' || pathname === '/login/' ? CATALOG_PATH : destination
}

export function guestCookieOptions(isProduction: boolean) {
  return { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' } as const
}
