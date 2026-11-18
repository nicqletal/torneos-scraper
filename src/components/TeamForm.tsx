import { CreateTeamForm } from './CreateTeamForm'
import { getZoneGroups } from './ZoneSelect'
import type { TeamFields } from '@/utils/team-form'

// Alta y modificación comparten los mismos pasos y campos.
export async function TeamForm({ action, initial, crestUrl, submitLabel, disabled = false }: {
  action: (formData: FormData) => Promise<void>
  initial?: TeamFields
  crestUrl?: string | null
  submitLabel: string
  disabled?: boolean
}) {
  return <CreateTeamForm action={action} groups={await getZoneGroups()} initial={initial} crestUrl={crestUrl} submitLabel={submitLabel} disabled={disabled} />
}