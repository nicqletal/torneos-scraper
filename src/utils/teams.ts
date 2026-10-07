// Values of the team_level enum, with their UI labels (sport_modality lives in modality.ts).
// The order of TEAM_LEVELS matches the enum order in Postgres.

export const TEAM_LEVELS = [
  { value: 'recreativo', label: 'Recreativo' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'competitivo', label: 'Competitivo' },
] as const

export type TeamLevel = (typeof TEAM_LEVELS)[number]['value']

export function isTeamLevel(value: unknown): value is TeamLevel {
  return TEAM_LEVELS.some((l) => l.value === value)
}

export function levelLabel(value: string): string {
  return TEAM_LEVELS.find((l) => l.value === value)?.label ?? value
}

export const MAX_CAPTAINCIES = 3
