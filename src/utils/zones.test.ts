// Tests de la lista cerrada de zonas. Corren con el runner de Node: pnpm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupZonesByCorridor, zoneLabel, type ZoneRow } from './zones.ts'

const zone = (id: string, name: string, corridorId: string, corridor: string, region: string): ZoneRow => ({
  id,
  name,
  corridors: { id: corridorId, name: corridor, regions: { id: region.toLowerCase(), name: region } },
})

test('Zonas: se agrupan por corredor, ordenados por región y corredor, y las zonas por nombre', () => {
  const groups = groupZonesByCorridor([
    zone('moron', 'Morón', 'gba-oeste', 'GBA Oeste', 'GBA'),
    zone('san-isidro', 'San Isidro', 'gba-norte', 'GBA Norte', 'GBA'),
    zone('palermo', 'Palermo', 'caba-norte', 'CABA Norte', 'CABA'),
    zone('vicente-lopez', 'Vicente López', 'gba-norte', 'GBA Norte', 'GBA'),
    zone('belgrano', 'Belgrano', 'caba-norte', 'CABA Norte', 'CABA'),
  ])

  assert.deepEqual(
    groups.map((g) => [g.label, g.zones.map((z) => z.name)]),
    [
      ['CABA Norte', ['Belgrano', 'Palermo']],
      ['GBA Norte', ['San Isidro', 'Vicente López']],
      ['GBA Oeste', ['Morón']],
    ],
  )
})

test('Zonas: sin datos, no hay grupos', () => {
  assert.deepEqual(groupZonesByCorridor([]), [])
})

test('Zona: se muestra como "Zona · Corredor"', () => {
  assert.equal(zoneLabel({ name: 'Palermo', corridors: { name: 'CABA Norte' } }), 'Palermo · CABA Norte')
})
