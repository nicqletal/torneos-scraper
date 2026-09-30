// Estado del torneo: lo calcula la base (función `public.status`), nadie lo elige.
// Acá solo vive cómo se muestra, para que catálogo, ficha y panel digan lo mismo.

export type TournamentStatus = 'abierto' | 'cerrado' | 'en_curso' | 'finalizado'

export const statusLabels: Record<TournamentStatus, string> = {
  abierto: 'Inscripción Abierta',
  cerrado: 'Inscripción Cerrada',
  en_curso: 'En Juego',
  finalizado: 'Torneo Finalizado',
}

export const statusStyles: Record<TournamentStatus, string> = {
  abierto: 'text-brand-lime border-brand-lime bg-brand-lime/5',
  cerrado: 'text-red-400 border-red-500/30 bg-red-950/20',
  en_curso: 'text-sky-400 border-sky-500/30 bg-sky-950/20',
  finalizado: 'text-zinc-500 border-zinc-700 bg-zinc-800/20',
}
