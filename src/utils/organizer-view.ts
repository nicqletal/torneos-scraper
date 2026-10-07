// La vista de organizador depende solo de la ruta: se está en ella dentro del
// panel de organizador y sus pantallas, y en la vista de jugador en todo lo demás
// (ver "Cuenta y acceso" en docs/decisiones-casos-de-uso.md). No se guarda en
// ningún lado: un link al panel siempre abre la vista de organizador.

export const ORGANIZER_PANEL_PATH = '/mis-torneos'

const ORGANIZER_PREFIXES = [ORGANIZER_PANEL_PATH, '/crear-torneo']

export function isOrganizerView(pathname: string): boolean {
  return ORGANIZER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
