import { ZoneSelect } from './ZoneSelect'
import { TeamCrest } from './TeamCrest'
import { SubmitButton } from './SubmitButton'
import { SPORT_MODALITIES } from '@/utils/modality'
import { TEAM_LEVELS } from '@/utils/teams'
import { CREST_TYPES } from '@/utils/team-crest'
import type { TeamFields } from '@/utils/team-form'

export function TeamForm({ action, initial, crestUrl, submitLabel }: {
  action: (formData: FormData) => Promise<void>
  initial?: TeamFields
  crestUrl?: string | null
  submitLabel: string
}) {
  const inputClass = 'ui-input px-3 py-3 bg-brand-bg border border-brand-border rounded-sm text-foreground focus:outline-none focus:border-brand-lime'
  return (
    <form action={action} className="p-5 sm:p-8 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="ui-label">Nombre del equipo</label>
        <input id="name" name="name" required minLength={2} maxLength={50} defaultValue={initial?.name}
          placeholder="Los Pibes de Palermo" className={`ui-input ${inputClass}`} />
        <p className="text-sm text-foreground/70">Puede repetirse: los equipos se distinguen por su zona.</p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="zone_id" className="ui-label">Zona</label>
        <ZoneSelect id="zone_id" name="zone_id" required defaultValue={initial?.zone_id} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="modality" className="ui-label">Modalidad habitual</label>
          <select id="modality" name="modality" required defaultValue={initial?.modality ?? ''} className={`ui-input ${inputClass}`}>
            <option value="" disabled>Elegí una modalidad</option>
            {SPORT_MODALITIES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="level" className="ui-label">Nivel</label>
          <select id="level" name="level" required defaultValue={initial?.level ?? ''} className={`ui-input ${inputClass}`}>
            <option value="" disabled>Elegí un nivel</option>
            {TEAM_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <fieldset className="flex flex-col gap-3 border-t border-brand-border pt-5">
        <legend className="ui-label">Escudo (opcional)</legend>
        {initial && <TeamCrest name={initial.name} src={crestUrl} size="lg" />}
        <label htmlFor="crest" className="ui-label">{crestUrl ? 'Reemplazar escudo' : 'Subir escudo'}</label>
        <input id="crest" name="crest" type="file" accept={CREST_TYPES.join(',')} className={`ui-input ${inputClass}`} aria-describedby="crest-hint" />
        <p id="crest-hint" className="text-sm text-foreground/70">
          JPG, PNG o WebP, hasta 2 MB. {initial && 'Si no elegís otro, conservás el escudo actual.'}
        </p>
        {crestUrl && (
          <label className="ui-label flex items-center gap-3 text-sm text-foreground min-h-11">
            <input type="checkbox" name="remove_crest" className="accent-brand-lime w-5 h-5" />
            Quitar el escudo actual
          </label>
        )}
      </fieldset>
      <SubmitButton pendingLabel="Guardando…" className="ui-action press inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-lime hover:bg-foreground text-brand-bg rounded-sm disabled:opacity-60">
        {submitLabel}
      </SubmitButton>
    </form>
  )
}
