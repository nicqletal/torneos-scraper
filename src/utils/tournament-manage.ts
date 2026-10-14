// Pantalla de gestión del torneo (`/mis-torneos/[id]`, segundo nivel del panel
// de organizador). La pestaña vive en `?tab=`, como los filtros del catálogo:
// así un link a "Inscripciones" es compartible y el buscador de equipos (`?q=`)
// convive con ella en la misma URL.
// Es TypeScript puro (sin Next ni Supabase) para poder testearlo con `pnpm test`.

export const MANAGE_TABS = [
  { value: 'datos', label: 'Datos' },
  { value: 'inscripciones', label: 'Inscripciones' },
] as const

export type ManageTab = (typeof MANAGE_TABS)[number]['value']

// Lo que venga en `?tab=`: cualquier cosa que no sea una pestaña abre Datos.
export function manageTab(raw: string | string[] | undefined): ManageTab {
  return MANAGE_TABS.find((tab) => tab.value === raw)?.value ?? 'datos'
}

// Ruta a una pestaña. `extra` son los parámetros de Inscripciones (`q`, la
// búsqueda de equipos, y `error`, el código que deja una acción al fallar);
// los vacíos no se escriben.
export function managePath(
  id: string,
  tab: ManageTab,
  extra: { q?: string; error?: string } = {}
): string {
  const params = new URLSearchParams({ tab })
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value)
  }
  return `/mis-torneos/${id}?${params}`
}

// Login que vuelve a la pestaña: la ruta va codificada para que su `?tab=` no
// se lea como un parámetro del login.
export function manageLoginPath(id: string, tab: ManageTab): string {
  return `/login?next=${encodeURIComponent(managePath(id, tab))}`
}
