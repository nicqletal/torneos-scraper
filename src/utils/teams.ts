// Values of the sport_modality and team_level enums, with their UI labels.
// The order of TEAM_LEVELS matches the enum order in Postgres.

export const SPORT_MODALITIES = [
  { value: 'futbol_5', label: 'Fútbol 5' },
  { value: 'futbol_7', label: 'Fútbol 7' },
  { value: 'futbol_8', label: 'Fútbol 8' },
  { value: 'futbol_11', label: 'Fútbol 11' },
] as const

export const TEAM_LEVELS = [
  { value: 'recreativo', label: 'Recreativo' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'competitivo', label: 'Competitivo' },
] as const

export type SportModality = (typeof SPORT_MODALITIES)[number]['value']
export type TeamLevel = (typeof TEAM_LEVELS)[number]['value']

export function isSportModality(value: unknown): value is SportModality {
  return SPORT_MODALITIES.some((m) => m.value === value)
}

export function isTeamLevel(value: unknown): value is TeamLevel {
  return TEAM_LEVELS.some((l) => l.value === value)
}

export function modalityLabel(value: string): string {
  return SPORT_MODALITIES.find((m) => m.value === value)?.label ?? value
}

export function levelLabel(value: string): string {
  return TEAM_LEVELS.find((l) => l.value === value)?.label ?? value
}

export const MAX_CAPTAINCIES = 3
