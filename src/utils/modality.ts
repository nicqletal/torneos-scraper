// Valores del enum sport_modality de Postgres, con su nombre para la UI.
// Los comparten torneos, equipos y búsquedas de rival: "misma modalidad" tiene
// que significar lo mismo en todos lados.

export const SPORT_MODALITIES = [
  { value: 'futbol_5', label: 'Fútbol 5' },
  { value: 'futbol_7', label: 'Fútbol 7' },
  { value: 'futbol_8', label: 'Fútbol 8' },
  { value: 'futbol_11', label: 'Fútbol 11' },
] as const

export type SportModality = (typeof SPORT_MODALITIES)[number]['value']

export function isSportModality(value: unknown): value is SportModality {
  return SPORT_MODALITIES.some((m) => m.value === value)
}

export function modalityLabel(value: string): string {
  return SPORT_MODALITIES.find((m) => m.value === value)?.label ?? value
}
