// Antigüedad de verificación (ver CONTEXT.md y "Verificación y Observado" en
// docs/decisiones-casos-de-uso.md): cuánto hace que el organizador tocó
// "Sigue vigente". A partir de 30 días se muestra en ámbar y a partir de 60,
// en rojo con "sin confirmar". Panel, catálogo y ficha usan esto para decir lo mismo.
import type { TournamentStatus } from './tournament-status'

export type VerificationLevel = 'al_dia' | 'ambar' | 'sin_confirmar'

export interface VerificationAge {
  days: number
  level: VerificationLevel
  label: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const AMBER_DAYS = 30
const UNCONFIRMED_DAYS = 60

// Días completos desde la verificación (24 h cada uno, sin mirar el calendario).
// Un Finalizado devuelve null: ya no tiene que confirmar que sigue en pie.
export function verificationAge(
  verifiedAt: string,
  status: TournamentStatus,
  now: Date
): VerificationAge | null {
  if (status === 'finalizado') return null

  const days = Math.max(0, Math.floor((now.getTime() - new Date(verifiedAt).getTime()) / DAY_MS))
  const ago =
    days === 0 ? 'Verificado hoy'
    : days === 1 ? 'Verificado hace 1 día'
    : `Verificado hace ${days} días`

  if (days >= UNCONFIRMED_DAYS) {
    return { days, level: 'sin_confirmar', label: `Sin confirmar · ${ago.toLowerCase()}` }
  }
  return { days, level: days >= AMBER_DAYS ? 'ambar' : 'al_dia', label: ago }
}

export const verificationStyles: Record<VerificationLevel, string> = {
  al_dia: 'text-foreground/70 border-brand-border',
  ambar: 'text-brand-amber border-brand-amber/40 bg-brand-amber/5',
  sin_confirmar: 'text-brand-red border-brand-red/40 bg-brand-red/5',
}

// Orden del panel del organizador: primero lo que pide atención (30 días o
// más sin verificar, del más viejo al más nuevo), después el resto en el orden
// en que vino, y al final los Finalizados, que ya no se verifican.
export function sortForPanel<T extends { status: TournamentStatus; verified_at: string }>(
  tournaments: T[],
  now: Date
): T[] {
  const rank = (t: T) => {
    const age = verificationAge(t.verified_at, t.status, now)
    if (age === null) return 2
    return age.level === 'al_dia' ? 1 : 0
  }

  // `sort` es estable: a igual rango y fecha, queda el orden de entrada.
  return [...tournaments].sort((a, b) => {
    const byRank = rank(a) - rank(b)
    if (byRank !== 0 || rank(a) !== 0) return byRank
    return new Date(a.verified_at).getTime() - new Date(b.verified_at).getTime()
  })
}

// Por qué "Sigue vigente" aparece apagado, o null si se puede tocar. "Hoy" es
// lo mismo que dice la etiqueta "Verificado hoy": menos de 24 h.
export type VerifyBlock = 'confirmado_hoy' | 'finalizado'

export function verifyBlock(
  verifiedAt: string,
  status: TournamentStatus,
  now: Date
): VerifyBlock | null {
  const age = verificationAge(verifiedAt, status, now)
  if (age === null) return 'finalizado'
  return age.days === 0 ? 'confirmado_hoy' : null
}
