'use client'

import { useActionState, useState } from 'react'
import { Save } from 'lucide-react'
import { FLYER_TYPES, parseFlyer } from '@/utils/tournament-flyer'
import type { ZoneGroup } from '@/utils/zones'
import { ZoneSelectField } from './ZoneSelectField'

// Lo que devuelve la Server Action cuando no puede guardar: el mensaje y lo que
// el usuario había cargado, para volver a llenar el formulario.
export interface TournamentFormState {
  error: string | null
  values: Record<string, string>
}

interface TournamentFormProps {
  action: (state: TournamentFormState, formData: FormData) => Promise<TournamentFormState>
  submitLabel: string
  pendingLabel: string
  // La lista cerrada de zonas, que la página trae con getZoneGroups.
  zoneGroups: ZoneGroup[]
  // Edición: el torneo guardado, para precargar el formulario.
  initialValues?: Record<string, string>
  // Si viene, se pide confirmar antes de guardar (por ejemplo, con equipos anotados).
  confirmMessage?: string | null
  // Edición de un torneo que ya tiene flyer: dejar el campo vacío lo conserva.
  hasFlyer?: boolean
}

const labelClass = 'font-display tracking-wider text-sm text-white/60 uppercase'
const hintClass = 'text-[11px] text-white/40 font-mono'
const inputClass =
  'px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-lime transition-colors'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="w-full font-display tracking-wider text-lg text-white uppercase border-b border-brand-border pb-2 mb-2">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className={hintClass}>{hint}</span>}
    </label>
  )
}

export function TournamentForm({ action, submitLabel, pendingLabel, zoneGroups, initialValues = {}, confirmMessage, hasFlyer = false }: TournamentFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null, values: initialValues })
  const [flyerError, setFlyerError] = useState<string | null>(null)
  const v = state.values

  return (
    // `key` fuerza a React a volver a montar los campos con los valores devueltos:
    // un `defaultValue` nuevo no pisa lo que ya muestra un input montado.
    <form
      key={JSON.stringify(v)}
      action={formAction}
      onSubmit={(e) => {
        // Cancelar el submit acá evita que se llame a la Server Action.
        if (confirmMessage && !confirm(confirmMessage)) e.preventDefault()
      }}
      className="flex flex-col gap-8"
    >
      <Section title="El torneo">
        <Field label="Nombre">
          <input name="name" type="text" required defaultValue={v.name} placeholder="Copa Amistad Sabatina" className={inputClass} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Modalidad">
            <select name="sport_modality" required defaultValue={v.sport_modality} className={inputClass}>
              <option value="futbol_5">Fútbol 5</option>
              <option value="futbol_7">Fútbol 7</option>
              <option value="futbol_8">Fútbol 8</option>
              <option value="futbol_11">Fútbol 11</option>
            </select>
          </Field>

          <Field label="Zona">
            <ZoneSelectField name="zone_id" groups={zoneGroups} required defaultValue={v.zone_id} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* El estado del torneo sale de estas tres fechas y del cupo */}
      <Section title="Fechas y cupo">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Cierre de inscripción">
            <input name="inscription_deadline" type="date" required defaultValue={v.inscription_deadline} className={inputClass} />
          </Field>
          <Field label="Inicio">
            <input name="start_date" type="date" required defaultValue={v.start_date} className={inputClass} />
          </Field>
          <Field label="Fin">
            <input name="end_date" type="date" required defaultValue={v.end_date} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Precio (opcional)" hint="Vacío: se muestra “Consultar”. 0: “Gratis”.">
            <input name="price" type="number" min={0} defaultValue={v.price} placeholder="45000" className={inputClass} />
          </Field>
          <Field label="Cupo (opcional)" hint="Cantidad máxima de equipos.">
            <input name="capacity" type="number" min={1} step={1} defaultValue={v.capacity} placeholder="16" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Contacto">
        <p className={hintClass}>Dejá al menos uno: es por donde te van a escribir los equipos.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="WhatsApp" hint="Con código de área y sin el 15.">
            <input name="contact_whatsapp" type="tel" defaultValue={v.contact_whatsapp} placeholder="11 1234 5678" className={inputClass} />
          </Field>
          <Field label="Instagram" hint="Solo el usuario.">
            <input name="contact_instagram" type="text" defaultValue={v.contact_instagram} placeholder="copa.palermo" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Flyer (opcional)">
        <Field
          label="Imagen"
          hint={`JPG, PNG o WebP, hasta 3 MB.${hasFlyer ? ' Si no elegís otro, queda el que ya subiste.' : ''}`}
        >
          <input
            name="flyer"
            type="file"
            accept={FLYER_TYPES.join(',')}
            onChange={(e) => {
              // Mismo chequeo que la Server Action, para avisar antes de subir
              // 3 MB al servidor. Si no sirve, se vacía el campo.
              const flyer = parseFlyer(e.target.files?.[0] ?? null)
              setFlyerError(flyer.ok ? null : flyer.error)
              if (!flyer.ok) e.target.value = ''
            }}
            className={`${inputClass} file:mr-3 file:px-3 file:py-1 file:border-0 file:rounded-sm file:bg-brand-lime file:text-brand-bg file:font-display file:uppercase file:tracking-wider file:cursor-pointer`}
          />
        </Field>
        {flyerError && (
          <p role="alert" className="animate-enter text-sm text-brand-red">{flyerError}</p>
        )}
      </Section>

      <Section title="Más información (opcional)">
        <Field label="Descripción">
          <textarea name="description" rows={4} defaultValue={v.description} placeholder="Premios, horarios, tercer tiempo…" className={`${inputClass} resize-y`} />
        </Field>
        <Field label="Reglamento">
          <textarea name="rules" rows={4} defaultValue={v.rules} placeholder="Tarjetas, cambios, duración de los partidos…" className={`${inputClass} resize-y`} />
        </Field>
        <Field label="Dirección de la sede">
          <input name="venue_address" type="text" defaultValue={v.venue_address} placeholder="Av. Santa Fe 3000, CABA" className={inputClass} />
        </Field>
      </Section>

      {/* El error va pegado al botón: el formulario es largo y quien acaba de
          apretar "Publicar" está mirando acá abajo, no arriba de todo. */}
      {state.error && (
        <p role="alert" className="animate-enter px-4 py-3 border border-brand-red/40 bg-brand-red/5 text-brand-red text-sm rounded-sm">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="press inline-flex items-center justify-center gap-2 py-4 bg-brand-lime hover:bg-white disabled:opacity-60 disabled:cursor-wait text-brand-bg font-display font-bold uppercase tracking-wider text-lg rounded-sm cursor-pointer"
      >
        <Save className="w-5 h-5" />
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  )
}
