import { isSportModality, type SportModality } from './modality.ts'
import { isTeamLevel, type TeamLevel } from './teams.ts'

export type TeamFields = { name: string; zone_id: string; modality: SportModality; level: TeamLevel }
type TeamFormResult = { ok: true; fields: TeamFields } | { ok: false; error: string }

export function parseTeamForm(form: FormData): TeamFormResult {
  const rawName = form.get('name')
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  const zoneId = form.get('zone_id')
  const modality = form.get('modality')
  const level = form.get('level')
  if (name.length < 2 || name.length > 50) return { ok: false, error: 'El nombre tiene que tener entre 2 y 50 caracteres.' }
  if (typeof zoneId !== 'string' || !zoneId.trim()) return { ok: false, error: 'Elegí la zona del equipo.' }
  if (!isSportModality(modality)) return { ok: false, error: 'Elegí una modalidad válida.' }
  if (!isTeamLevel(level)) return { ok: false, error: 'Elegí un nivel válido.' }
  return { ok: true, fields: { name, zone_id: zoneId.trim(), modality, level } }
}
