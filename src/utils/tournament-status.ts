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
  cerrado: 'text-brand-red border-brand-red/40 bg-brand-red/5',
  en_curso: 'text-brand-sky border-brand-sky/40 bg-brand-sky/5',
  finalizado: 'text-foreground/60 border-brand-border bg-white/5',
}

// Sobre un Flyer, el fondo del estado tiene que ser opaco para no depender
// del color o el contraste de la imagen que haya detrás.
export const photoStatusStyles: Record<TournamentStatus, string> = {
  abierto: 'border-l-brand-lime',
  cerrado: 'border-l-brand-red',
  en_curso: 'border-l-brand-sky',
  finalizado: 'border-l-brand-border',
}
