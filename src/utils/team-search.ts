// Buscador de equipos para la inscripción vinculada (ver "Inscripciones" en
// docs/decisiones-casos-de-uso.md). TypeScript puro, testeado con `pnpm test`.
// La consulta la hace la página de inscripciones con `ilike` sobre `teams.name`.

export const TEAM_QUERY_MIN = 2

export type TeamQueryResult = { ok: true; query: string } | { ok: false; error: string | null }

// Lo que llega en `?q=`: sin espacios alrededor ni repetidos. Vacío no es un
// error (todavía no se buscó nada); muy corto, sí.
export function parseTeamQuery(raw: string | undefined): TeamQueryResult {
  const query = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!query) return { ok: false, error: null }
  if (query.length < TEAM_QUERY_MIN) {
    return { ok: false, error: `Escribí al menos ${TEAM_QUERY_MIN} letras del nombre.` }
  }
  return { ok: true, query }
}

// Patrón para `ilike`: "contiene". `%`, `_` y `\` son comodines del `like`,
// así que se escapan para que un equipo llamado "100%" se busque literal.
export function teamSearchPattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}
