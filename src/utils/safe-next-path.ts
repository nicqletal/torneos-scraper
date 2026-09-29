// Validates a `next` param so redirects only go to internal routes.
// Checking startsWith('/') is not enough: "//evil.com" and "/\evil.com" are
// external for the browser. Resolving against a fixed origin and comparing
// the origin covers those and any other trick the URL parser accepts.
const BASE = 'http://internal.invalid'

export function safeNextPath(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string' || !next.startsWith('/')) return fallback

  try {
    const url = new URL(next, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
