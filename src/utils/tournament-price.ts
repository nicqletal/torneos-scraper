// Cómo se muestra el precio de un torneo (ver "Formulario" en docs/decisiones-casos-de-uso.md):
// sin precio cargado es "Consultar" y 0 es "Gratis".
export function priceLabel(price: number | null): string {
  if (price === null) return 'Consultar'
  if (price === 0) return 'Gratis'
  return '$' + price.toLocaleString('es-AR')
}
