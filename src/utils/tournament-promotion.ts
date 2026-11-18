// Promociones de demostración para el pitch; no representan contrataciones.
export type PromotionPlan = 'growth' | 'partner'

export function demoPromotionPlan(tournament: { contact_instagram: string | null }): PromotionPlan | undefined {
  const handle = tournament.contact_instagram?.trim().replace(/^@/, '').toLowerCase()
  if (handle === 'areiafutbol') return 'partner'
  if (handle === 'liganunez') return 'growth'
}
