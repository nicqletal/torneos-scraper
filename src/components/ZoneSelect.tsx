import { createClient } from '@/utils/supabase/server'
import { ZONE_COLUMNS, groupZonesByCorridor, type ZoneGroup, type ZoneRow } from '@/utils/zones'
import { ZoneSelectField } from './ZoneSelectField'

interface ZoneSelectProps {
  id: string
  name: string
  defaultValue?: string | null
  required?: boolean
  placeholder?: string
}

// Closed list of zones, grouped by corridor (see "Zonas" in docs/decisiones-casos-de-uso.md).
// Un formulario de cliente no puede renderizar este componente async: su
// página llama a getZoneGroups y le pasa los grupos a ZoneSelectField.
export async function getZoneGroups(): Promise<ZoneGroup[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('zones').select(ZONE_COLUMNS)
  return groupZonesByCorridor((data ?? []) as unknown as ZoneRow[])
}

export async function ZoneSelect({ id, name, defaultValue, required, placeholder }: ZoneSelectProps) {
  return (
    <ZoneSelectField
      id={id}
      name={name}
      groups={await getZoneGroups()}
      defaultValue={defaultValue}
      required={required}
      placeholder={placeholder}
    />
  )
}
