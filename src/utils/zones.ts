// Lista cerrada de zonas: región > corredor > zona (ver "Zonas" en docs/decisiones-casos-de-uso.md).
// Es TypeScript puro para poder testearlo con `pnpm test`; la consulta la hace ZoneSelect.

// Lo que devuelve `ZONE_COLUMNS` sobre la tabla `zones`.
export interface ZoneRow {
  id: string
  name: string
  corridors: {
    id: string
    name: string
    regions: { id: string; name: string }
  }
}

export const ZONE_COLUMNS = 'id, name, corridors(id, name, regions(id, name))'

export interface ZoneGroup {
  label: string
  zones: ZoneRow[]
}

// Un grupo por corredor (un <optgroup> en el selector), ordenados por región y
// después por corredor; dentro de cada uno, las zonas por nombre.
export function groupZonesByCorridor(zones: ZoneRow[]): ZoneGroup[] {
  const groups = new Map<string, ZoneGroup & { sortKey: string }>()
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

  return [...groups.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'es'))
    .map(({ label, zones }) => ({
      label,
      zones: [...zones].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    }))
}

// Embed de PostgREST para mostrar la zona desde un torneo o un equipo:
// `select(`*, ${ZONE_LABEL_EMBED}`)` trae `zones: ZoneLabelFields`.
export const ZONE_LABEL_EMBED = 'zones(name, corridors(name))'

export interface ZoneLabelFields {
  name: string
  corridors: { name: string }
}

// Cómo se muestra la zona de un torneo o un equipo: "Palermo · CABA Norte".
export function zoneLabel(zone: ZoneLabelFields): string {
  return `${zone.name} · ${zone.corridors.name}`
}
