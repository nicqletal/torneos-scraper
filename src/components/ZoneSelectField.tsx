import type { ZoneGroup } from '@/utils/zones'

interface ZoneSelectFieldProps {
  id?: string
  name: string
  groups: ZoneGroup[]
  defaultValue?: string | null
  required?: boolean
  placeholder?: string
  className?: string
}

// El <select> de la lista cerrada de zonas, con un <optgroup> por corredor.
// No tiene hooks ni consultas, así que sirve en el servidor (ZoneSelect, que
// trae las zonas) y dentro de formularios de cliente (TournamentForm).
export function ZoneSelectField({
  id,
  name,
  groups,
  defaultValue,
  required,
  placeholder = 'Elegí una zona',
  className = 'px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-white text-sm focus:outline-none focus:border-brand-lime transition-colors',
}: ZoneSelectFieldProps) {
  return (
    <select id={id} name={name} required={required} defaultValue={defaultValue ?? ''} className={`ui-input ${className}`}>
      <option value="" disabled={required}>{placeholder}</option>
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.zones.map((zone) => (
            <option key={zone.id} value={zone.id}>{zone.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
