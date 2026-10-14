// Clases de Tailwind que se repiten entre pantallas. No son componentes: son
// strings, para poder ponerlos tanto en un <Link> como en un <button> o en
// <SubmitButton>. Lo propio de cada uso (`justify-center`, `cursor-pointer`,
// `disabled:`) se suma en el lugar.

// Botón secundario chico del panel: borde y fondo oscuros, texto apagado.
const secondaryButtonBase =
  'ui-action press inline-flex items-center gap-1.5 px-3 py-2 border border-brand-border bg-brand-secondary text-foreground/80 text-xs font-display font-bold uppercase tracking-wider rounded-sm'

// Acción neutra ("Gestionar", "Ver ficha pública"): al pasar el mouse, lima.
export const secondaryButtonClass = `${secondaryButtonBase} hover:text-brand-lime hover:border-brand-lime`

// Acción de baja ("Dar de baja"): al pasar el mouse, rojo de marca.
export const dangerButtonClass = `${secondaryButtonBase} hover:text-brand-red hover:border-brand-red`

// Mensaje de error debajo de un formulario o un botón.
export const errorTextClass = 'text-[11px] font-mono uppercase text-brand-red'
