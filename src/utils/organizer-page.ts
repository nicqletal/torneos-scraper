// Página pública del organizador (ver "Visibilidad" en docs/decisiones-casos-de-uso.md).
// Es TypeScript puro para poder testearlo con `pnpm test`; la consulta la hace la página.

import type { TournamentStatus } from './tournament-status'

// "Organiza desde septiembre de 2026", a partir de la fecha de alta de la cuenta.
// El mes se cuenta en Buenos Aires: una cuenta creada el 30/9 a las 22 h es de septiembre.
export function organizesSince(createdAt: string): string {
  const monthYear = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(createdAt))
  return `Organiza desde ${monthYear}`
}

interface TournamentDates {
  status: TournamentStatus
  start_date: string
  end_date: string
}

// Vigentes (Abierto, Cerrado, En curso) arriba, del que empieza antes al que
// empieza después; Finalizados abajo como trayectoria, del más reciente al más viejo.
// Las fechas son 'YYYY-MM-DD', así que se comparan como texto.
export function splitTournaments<T extends TournamentDates>(tournaments: T[]) {
  const current = tournaments
    .filter((t) => t.status !== 'finalizado')
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
  const finished = tournaments
    .filter((t) => t.status === 'finalizado')
    .sort((a, b) => b.end_date.localeCompare(a.end_date))
  return { current, finished }
}
