import { createClient } from '@/utils/supabase/server'

interface ZoneRow {
  id: string
  name: string
  corridors: {
    id: string
    name: string
    regions: { id: string; name: string }
  }
}

interface ZoneSelectProps {
  id: string
  name: string
  defaultValue?: string | null
  required?: boolean
  placeholder?: string
}

// Closed list of zones, grouped by corridor (see "Zonas" in docs/decisiones-casos-de-uso.md).
export async function ZoneSelect({ id, name, defaultValue, required, placeholder = 'Elegí una zona' }: ZoneSelectProps) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('zones')
    .select('id, name, corridors(id, name, regions(id, name))')

  const zones = (data ?? []) as unknown as ZoneRow[]

  // One <optgroup> per corridor, ordered by region and then corridor name
  const groups = new Map<string, { label: string; sortKey: string; zones: ZoneRow[] }>()
  for (const zone of zones) {
    const corridor = zone.corridors
    const group = groups.get(corridor.id) ?? {
      label: corridor.name,
      sortKey: `${corridor.regions.name} ${corridor.name}`,
      zones: [],
    }
    group.zones.push(zone)
    groups.set(corridor.id, group)
  }
  const sortedGroups = [...groups.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'es'))

  return (
    <select
      id={id}
      name={name}
      required={required}
      defaultValue={defaultValue ?? ''}
      className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-white text-sm focus:outline-none focus:border-brand-lime transition-colors"
    >
      <option value="" disabled={required}>{placeholder}</option>
      {sortedGroups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.zones
            .sort((a, b) => a.name.localeCompare(b.name, 'es'))
            .map((zone) => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}
