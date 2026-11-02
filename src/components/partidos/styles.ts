// Clases que comparten las dos pantallas de Partidos (/partidos y
// /partidos/buscar). Son strings y no componentes para poder usarlas igual en
// <Link>, <button> y <SubmitButton>. Una sola acción primaria (lima) por
// tarjeta; el resto, borde o texto.

export const primaryButton =
  'ui-action press inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-brand-lime text-brand-bg font-display text-lg uppercase tracking-wider hover:bg-foreground'

export const secondaryButton =
  'ui-action press inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-brand-border bg-brand-secondary text-foreground hover:border-brand-lime hover:text-brand-lime'

export const dangerButton =
  'ui-action press inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-brand-red/50 text-brand-red hover:bg-brand-red hover:text-brand-bg'

// Link de texto, para lo que no es la acción principal de la tarjeta.
export const quietLink = 'ui-action text-foreground/70 hover:text-brand-lime underline underline-offset-4'
export const quietDangerLink = 'ui-action text-foreground/70 hover:text-brand-red underline underline-offset-4'

// Chip de opción (modalidad, equipo, día): prendido en lima, apagado en borde.
export const chip =
  'ui-action press px-4 py-2 rounded-sm border text-base cursor-pointer select-none whitespace-nowrap'
export const chipOn = 'border-brand-lime bg-brand-lime text-brand-bg'
export const chipOff = 'border-brand-border bg-brand-secondary text-foreground/80 hover:border-brand-lime hover:text-brand-lime'

export const input =
  'ui-input bg-brand-bg border border-brand-border rounded-sm px-3 text-foreground focus:border-brand-lime focus:outline-none'

export const card = 'p-5 border border-brand-border bg-brand-surface rounded-sm'
export const cardHighlight = 'p-5 border border-brand-lime/50 bg-brand-surface rounded-sm'

export const eyebrow = 'text-sm font-semibold uppercase tracking-wider text-foreground/60'
export const alert = 'p-3 border border-brand-red/40 bg-brand-red/5 text-brand-red rounded-sm text-sm'
