'use client'

import { useActionState, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react'
import { FLYER_TYPES, parseFlyer } from '@/utils/tournament-flyer'
import { SPORT_MODALITIES } from '@/utils/modality'
import { VENUE_ADDRESS_REQUIRED } from '@/utils/tournament-form'
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
  stepByStep?: boolean
}

const labelClass = 'font-sans tracking-wider text-sm text-foreground/60 uppercase'
const hintClass = 'text-sm text-foreground/70 font-sans'
const inputClass =
  'px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-brand-lime transition-colors'

function Section({ title, children, hidden = false }: { title: string; children: React.ReactNode; hidden?: boolean }) {
  return (
    <fieldset hidden={hidden} className={hidden ? 'hidden' : 'flex min-w-0 flex-col gap-4'}>
      <legend className="w-full font-sans tracking-wider text-lg text-foreground uppercase border-b border-brand-border pb-2 mb-2">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="ui-label flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className={hintClass}>{hint}</span>}
    </label>
  )
}

const STEPS = [
  { title: 'El torneo', hint: 'Nombre, modalidad y sede' },
  { title: 'Contacto', hint: 'Cómo te encuentran los equipos' },
  { title: 'Fechas y cupo', hint: 'Cuándo se juega y cuánto cuesta' },
  { title: 'Flyer', hint: 'La imagen de tu torneo' },
  { title: 'Más información', hint: 'Descripción y reglamento' },
  { title: 'Revisar y guardar', hint: 'Confirmá los datos del torneo' },
]

export function TournamentForm({ action, submitLabel, pendingLabel, zoneGroups, initialValues = {}, confirmMessage, hasFlyer = false, stepByStep = false }: TournamentFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null, values: initialValues })
  const [flyerError, setFlyerError] = useState<string | null>(null)
  const v = state.values
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState(0)
  const [review, setReview] = useState(initialValues)

  function goToStep(next: number) {
    const form = formRef.current
    if (!form || pending) return
    if (next > step) {
      const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('fieldset:not([hidden]) input, fieldset:not([hidden]) select, fieldset:not([hidden]) textarea')
      for (const field of fields) if (!field.reportValidity()) return
      if (step === 1) {
        const whatsapp = form.elements.namedItem('contact_whatsapp') as HTMLInputElement
        const instagram = form.elements.namedItem('contact_instagram') as HTMLInputElement
        if (!whatsapp.value.trim() && !instagram.value.trim()) {
          whatsapp.setCustomValidity('Dejá al menos un contacto: WhatsApp o Instagram.')
          whatsapp.reportValidity()
          return
        }
      }
    }
    const values: Record<string, string> = {}
    new FormData(form).forEach((value, key) => { values[key] = typeof value === 'string' ? value : value.name })
    setReview(values)
    setStep(next)
  }

  return (
    // `key` fuerza a React a volver a montar los campos con los valores devueltos:
    // un `defaultValue` nuevo no pisa lo que ya muestra un input montado.
    <form
      key={JSON.stringify(v)}
      ref={formRef}
      noValidate={stepByStep}
      action={formAction}
      onInput={(e) => {
        const form = e.currentTarget
        for (const name of ['contact_whatsapp', 'contact_instagram']) {
          (form.elements.namedItem(name) as HTMLInputElement | null)?.setCustomValidity('')
        }
      }}
      onSubmit={(e) => {
        if (stepByStep) {
          if (step < STEPS.length - 1) {
            e.preventDefault()
            goToStep(step + 1)
            return
          }
          const fields = e.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')
          for (const field of fields) {
            if (!field.checkValidity()) {
              e.preventDefault()
              const sections = Array.from(e.currentTarget.querySelectorAll('fieldset'))
              setStep(sections.findIndex(section => section.contains(field)))
              requestAnimationFrame(() => field.reportValidity())
              return
            }
          }
        }
        // Cancelar el submit acá evita que se llame a la Server Action.
        if (confirmMessage && !confirm(confirmMessage)) e.preventDefault()
      }}
      className={stepByStep ? 'grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10' : 'flex flex-col gap-8'}
    >
      {stepByStep && (
        <nav aria-label="Pasos para gestionar el torneo" className="min-w-0 lg:sticky lg:top-24">
          <p className="mb-3 text-xs font-mono uppercase tracking-wider text-foreground/60">Datos del torneo · Paso {step + 1} de {STEPS.length}</p>
          <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {STEPS.map((item, index) => (
              <li key={item.title} className="shrink-0 lg:shrink">
                <button type="button" disabled={pending || index > step + 1} aria-current={step === index ? 'step' : undefined} onClick={() => goToStep(index)} className={`flex w-full items-center gap-3 border p-3 text-left transition-colors disabled:opacity-50 ${step === index ? 'border-brand-lime bg-brand-lime/5 text-brand-lime' : 'border-brand-border text-foreground/70 hover:border-brand-lime/50'}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-current text-sm">{index < step ? <Check aria-hidden="true" className="h-4 w-4" /> : index + 1}</span>
                  <span><span className="block font-display text-lg uppercase tracking-wide">{item.title}</span><span className="hidden text-xs text-foreground/60 lg:block">{item.hint}</span></span>
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-3 hidden text-xs leading-relaxed text-foreground/60 lg:block">Los cambios se guardan juntos al finalizar. Podés volver a los pasos anteriores para corregirlos.</p>
        </nav>
      )}
      <div className="flex min-w-0 flex-col gap-8">
      <Section title="El torneo" hidden={stepByStep && step !== 0}>
        <Field label="Nombre">
          <input name="name" type="text" required defaultValue={v.name} placeholder="Copa Amistad Sabatina" className={`ui-input ${inputClass}`} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Modalidad">
            <select name="sport_modality" required defaultValue={v.sport_modality} className={`ui-input ${inputClass}`}>
              {SPORT_MODALITIES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Zona">
            <ZoneSelectField name="zone_id" groups={zoneGroups} required defaultValue={v.zone_id} className={`ui-input ${inputClass}`} />
          </Field>
        </div>

        <Field label="Dirección de la sede" hint="Calle y altura de la cancha. En la ficha se abre en el mapa.">
          {/* El aviso del navegador dice lo mismo que la Server Action, y la
              regla también: `required` solo acepta una sede de puros espacios,
              que el servidor rechaza (hace `trim`); el `pattern` pide al menos
              un carácter que no sea espacio. */}
          <input
            name="venue_address"
            type="text"
            required
            pattern=".*\S.*"
            title={VENUE_ADDRESS_REQUIRED}
            defaultValue={v.venue_address}
            placeholder="Av. Santa Fe 3000, CABA"
            onInvalid={(e) => e.currentTarget.setCustomValidity(VENUE_ADDRESS_REQUIRED)}
            onInput={(e) => e.currentTarget.setCustomValidity('')}
            className={`ui-input ${inputClass}`}
          />
        </Field>
      </Section>

      <Section title="Contacto" hidden={stepByStep && step !== 1}>
        <p className={hintClass}>Dejá al menos uno: es por donde te van a escribir los equipos.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="WhatsApp" hint="Con código de área y sin el 15.">
            <input name="contact_whatsapp" type="tel" defaultValue={v.contact_whatsapp} placeholder="11 1234 5678" className={`ui-input ${inputClass}`} />
          </Field>
          <Field label="Instagram" hint="Solo el usuario.">
            <input name="contact_instagram" type="text" defaultValue={v.contact_instagram} placeholder="copa.palermo" className={`ui-input ${inputClass}`} />
          </Field>
        </div>
      </Section>

      {/* El estado del torneo sale de estas tres fechas y del cupo */}
      <Section title="Fechas y cupo" hidden={stepByStep && step !== 2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Cierre de inscripción">
            <input name="inscription_deadline" type="date" required defaultValue={v.inscription_deadline} className={`ui-input ${inputClass}`} />
          </Field>
          <Field label="Inicio">
            <input name="start_date" type="date" required defaultValue={v.start_date} className={`ui-input ${inputClass}`} />
          </Field>
          <Field label="Fin">
            <input name="end_date" type="date" required defaultValue={v.end_date} className={`ui-input ${inputClass}`} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Precio (opcional)" hint="Vacío: se muestra “Consultar”. 0: “Gratis”.">
            <input name="price" type="number" min={0} defaultValue={v.price} placeholder="45000" className={`ui-input ${inputClass}`} />
          </Field>
          <Field label="Cupo (opcional)" hint="Cantidad máxima de equipos.">
            <input name="capacity" type="number" min={1} step={1} defaultValue={v.capacity} placeholder="16" className={`ui-input ${inputClass}`} />
          </Field>
        </div>
      </Section>

      <Section title="Flyer (opcional)" hidden={stepByStep && step !== 3}>
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
            className={`ui-input ${`${inputClass} file:mr-3 file:px-3 file:py-1 file:border-0 file:rounded-sm file:bg-brand-lime file:text-brand-bg file:font-sans file:uppercase file:tracking-wider file:cursor-pointer`}`}
          />
        </Field>
        {flyerError && (
          <p role="alert" className="animate-enter text-sm text-brand-red">{flyerError}</p>
        )}
      </Section>

      <Section title="Más información (opcional)" hidden={stepByStep && step !== 4}>
        <Field label="Descripción">
          <textarea name="description" rows={4} defaultValue={v.description} placeholder="Premios, horarios, tercer tiempo…" className={`ui-input ${`${inputClass} resize-y`}`} />
        </Field>
        <Field label="Reglamento">
          <textarea name="rules" rows={4} defaultValue={v.rules} placeholder="Tarjetas, cambios, duración de los partidos…" className={`ui-input ${`${inputClass} resize-y`}`} />
        </Field>
      </Section>

      {stepByStep && step === 5 && (
        <section aria-label="Revisión del torneo" className="flex flex-col gap-5">
          <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">Revisá antes de guardar</h2>
          <p className={hintClass}>Comprobá los datos. Podés volver a cualquier paso anterior; todavía no guardaste los cambios.</p>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Torneo', review.name],
              ['Modalidad', SPORT_MODALITIES.find(item => item.value === review.sport_modality)?.label],
              ['Zona', zoneGroups.flatMap(group => group.zones).find(zone => zone.id === review.zone_id)?.name],
              ['Sede', review.venue_address],
              ['Contacto', [review.contact_whatsapp, review.contact_instagram].filter(Boolean).join(' · ')],
              ['Fechas', `${review.start_date} al ${review.end_date}`],
              ['Cierre de inscripción', review.inscription_deadline],
              ['Precio', review.price ? `$ ${review.price}` : 'Consultar'],
              ['Cupo', review.capacity || 'Sin cupo definido'],
              ['Flyer', review.flyer || (hasFlyer ? 'Se conserva el flyer actual' : 'Sin flyer')],
            ].map(([label, value]) => <div key={label} className="min-w-0 border border-brand-border bg-brand-bg p-4"><dt className="text-xs uppercase tracking-wide text-foreground/60">{label}</dt><dd className="mt-2 break-words text-sm font-semibold text-foreground">{value || 'Sin completar'}</dd></div>)}
          </dl>
        </section>
      )}

      {/* El error va pegado al botón: el formulario es largo y quien acaba de
          apretar "Publicar" está mirando acá abajo, no arriba de todo. */}
      {state.error && (
        <p role="alert" className="animate-enter px-4 py-3 border border-brand-red/40 bg-brand-red/5 text-brand-red text-sm rounded-sm">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border pt-5">
      {stepByStep && step > 0 && <button type="button" disabled={pending} onClick={() => goToStep(step - 1)} className="ui-action press inline-flex items-center gap-2 border border-brand-border px-4 py-3 text-sm text-foreground hover:border-brand-lime disabled:opacity-50"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Anterior</button>}
      {stepByStep && step < STEPS.length - 1 ? (
        <button key="next-step" type="button" disabled={pending} onClick={(event) => { event.preventDefault(); goToStep(step + 1) }} className="ui-action press ml-auto inline-flex items-center gap-2 bg-brand-lime px-5 py-3 font-bold text-brand-bg">Continuar<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
      ) : <button
        key="save-tournament"
        type="submit"
        disabled={pending}
        className="ui-action press ml-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-brand-lime hover:bg-foreground disabled:opacity-60 disabled:cursor-wait text-brand-bg font-display font-bold uppercase tracking-wider text-lg rounded-sm cursor-pointer"
      >
        <Save className="w-5 h-5" />
        {pending ? pendingLabel : submitLabel}
      </button>}
      </div>
      </div>
    </form>
  )
}
