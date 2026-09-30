'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'

// Lo que devuelve la Server Action cuando no puede guardar: el mensaje y lo que
// el usuario había cargado, para volver a llenar el formulario.
export interface TournamentFormState {
  error: string | null
  values: Record<string, string>
}

interface TournamentFormProps {
  action: (state: TournamentFormState, formData: FormData) => Promise<TournamentFormState>
  submitLabel: string
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

export function TournamentForm({ action, submitLabel }: TournamentFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null, values: {} })
  const v = state.values

  return (
    // `key` fuerza a React a volver a montar los campos con los valores devueltos:
    // un `defaultValue` nuevo no pisa lo que ya muestra un input montado.
    <form key={JSON.stringify(v)} action={formAction} className="flex flex-col gap-8">
      {state.error && (
        <p role="alert" className="px-4 py-3 border border-red-500/30 bg-red-950/20 text-red-400 text-sm rounded-sm">
          {state.error}
        </p>
      )}

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
            <input name="zone" type="text" required defaultValue={v.zone} placeholder="Palermo" className={inputClass} />
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

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 py-4 bg-brand-lime hover:bg-white disabled:opacity-60 text-brand-bg font-display font-bold uppercase tracking-wider text-lg rounded-sm transition-colors cursor-pointer"
      >
        <Save className="w-5 h-5" />
        {pending ? 'Publicando…' : submitLabel}
      </button>
    </form>
  )
}
