'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowLeft, ArrowRight, Check, ImagePlus, MapPin, Shield, Users } from 'lucide-react'
import { ZoneSelectField } from './ZoneSelectField'
import { SubmitButton } from './SubmitButton'
import { SPORT_MODALITIES, modalityLabel } from '@/utils/modality'
import { TEAM_LEVELS, levelLabel } from '@/utils/teams'
import { CREST_TYPES, parseCrest } from '@/utils/team-crest'
import type { ZoneGroup } from '@/utils/zones'
import type { TeamFields } from '@/utils/team-form'

const STEPS = [
  { label: 'Identidad', hint: 'Nombre y escudo', title: 'Dale identidad al equipo', description: 'Elegí cómo se van a presentar en la cancha.' },
  { label: 'Forma de jugar', hint: 'Zona, modalidad y nivel', title: '¿Dónde y cómo juegan?', description: 'Estos datos ayudan a encontrar rivales compatibles.' },
  { label: 'Revisión', hint: 'Todo listo para crear', title: 'Así se va a ver tu equipo', description: 'Revisá los datos antes de dar el primer paso a la cancha.' },
]

const inputClass = 'ui-input w-full px-3 py-3 bg-brand-bg border border-brand-border rounded-lg text-foreground focus:outline-none focus:border-brand-lime'
const secondaryButton = 'ui-action press justify-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-foreground/80 hover:border-brand-lime hover:text-foreground'

// Mantiene todos los campos montados, incluido el archivo, al cambiar de paso.
// Solo el último paso envía la Server Action que crea el equipo.
export function CreateTeamForm({ action, groups, disabled = false, initial, crestUrl, submitLabel = initial ? 'Guardar cambios' : 'Crear equipo' }: {
  action: (formData: FormData) => Promise<void>
  groups: ZoneGroup[]
  disabled?: boolean
  initial?: TeamFields
  crestUrl?: string | null
  submitLabel?: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initial?.name ?? '')
  const [zoneId, setZoneId] = useState(initial?.zone_id ?? '')
  const [modality, setModality] = useState(initial?.modality ?? '')
  const [level, setLevel] = useState(initial?.level ?? '')
  const [removeCrest, setRemoveCrest] = useState(false)
  const [crestPreview, setCrestPreview] = useState<string | null>(null)
  const [crestName, setCrestName] = useState('')
  const [crestError, setCrestError] = useState('')

  useEffect(() => {
    return () => { if (crestPreview) URL.revokeObjectURL(crestPreview) }
  }, [crestPreview])

  const zone = groups.flatMap((group) => group.zones).find((item) => item.id === zoneId)
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('')

  function validateBefore(target: number) {
    for (let index = 0; index < target; index++) {
      const controls = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-step="${index}"] input, [data-step="${index}"] select`)
      const invalid = Array.from(controls ?? []).find((control) => !control.checkValidity())
      if (invalid) {
        setStep(index)
        // Primero muestra el paso para que el navegador pueda enfocar el campo.
        requestAnimationFrame(() => { invalid.focus(); invalid.reportValidity() })
        return false
      }
    }
    return true
  }

  function goToStep(target: number) {
    if (target > step && !validateBefore(target)) return
    setStep(target)
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
  }

  function chooseCrest(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    const result = parseCrest(file)
    event.target.setCustomValidity(result.ok ? '' : result.error)
    setCrestError(result.ok ? '' : result.error)
    setCrestName(file?.name ?? '')
    if (result.ok && result.file) setRemoveCrest(false)
    setCrestPreview(result.ok && result.file ? URL.createObjectURL(result.file) : null)
  }

  const displayedCrest = crestPreview ?? (!removeCrest ? crestUrl : null)
  const crest = displayedCrest
    ? <Image src={displayedCrest} alt="Escudo del equipo" width={96} height={96} unoptimized className="h-24 w-24 object-contain" />
    : <span aria-hidden className="flex h-24 w-24 items-center justify-center rounded-2xl border border-brand-lime/20 bg-brand-lime/5 font-display text-4xl text-brand-lime">{initials || <Shield className="h-10 w-10" />}</span>

  return (
    <form ref={formRef} action={action} noValidate onSubmit={(event) => {
      if (step < 2) {
        event.preventDefault()
        goToStep(step + 1)
      } else if (!validateBefore(2)) {
        event.preventDefault()
      }
    }}>
      <CreationFieldset disabled={disabled}>
        <aside className="min-w-0 lg:py-5">
          <p className="mb-4 hidden text-xs font-semibold uppercase tracking-widest text-foreground/50 lg:block">{initial ? 'Datos del equipo' : 'Armá tu equipo'}</p>
          <nav aria-label={initial ? 'Pasos para editar el equipo' : 'Pasos para crear el equipo'}>
            <ol className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
              {STEPS.map((item, index) => (
                <li key={item.label}>
                  <button type="button" onClick={() => goToStep(index)} aria-current={step === index ? 'step' : undefined}
                    className={`press flex h-full w-full flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center lg:flex-row lg:gap-3 lg:px-3 lg:py-4 lg:text-left ${step === index ? 'border-brand-lime/40 bg-brand-lime/5 text-foreground' : 'border-transparent text-foreground/60 hover:bg-brand-secondary hover:text-foreground'}`}>
                    <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step === index ? 'bg-brand-lime text-brand-bg' : index < step ? 'bg-brand-lime/10 text-brand-lime' : 'border border-brand-border'}`}>
                      {index < step ? <Check className="h-4 w-4" /> : `0${index + 1}`}
                    </span>
                    <span className="min-w-0"><span className="block text-xs font-semibold sm:text-sm">{item.label}</span><span className="mt-0.5 hidden text-xs text-foreground/50 lg:block">{initial && index === 2 ? 'Revisá antes de guardar' : item.hint}</span></span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-7 hidden border-t border-brand-border pt-5 lg:block">
            <Users aria-hidden className="mb-3 h-5 w-5 text-brand-lime" />
            <p className="text-sm font-semibold">{initial ? 'Actualizá tu equipo' : 'Vos llevás la cinta'}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/60">{initial ? 'Los cambios se guardan al finalizar. Podés volver a los pasos anteriores.' : 'Vas a ser el capitán. Cuando crees el equipo, podés invitar al resto del plantel con un link.'}</p>
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden rounded-3xl border border-brand-border bg-brand-surface">
          <div className="p-5 sm:p-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-lime" aria-live="polite">Paso {step + 1} de {STEPS.length} · {STEPS[step].label}</p>
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight text-foreground outline-none sm:text-4xl">{initial && step === 2 ? 'Revisá los cambios del equipo' : STEPS[step].title}</h2>
            <p className="mt-2 text-sm text-foreground/60">{initial && step === 2 ? 'Confirmá los datos antes de guardarlos.' : STEPS[step].description}</p>

            <section data-step="0" hidden={step !== 0} aria-label="Identidad" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-7">
                <div>
                  <label htmlFor="name" className="ui-label block">Nombre del equipo</label>
                  <input id="name" name="name" required minLength={2} maxLength={50} value={name} placeholder="Los Pibes de Palermo" aria-describedby="name-hint" className={`${inputClass} mt-2`}
                    onChange={(event) => {
                      setName(event.target.value)
                      event.target.setCustomValidity(event.target.value.trim().length < 2 ? 'El nombre tiene que tener entre 2 y 50 caracteres.' : '')
                    }} />
                  <p id="name-hint" className="mt-2 text-sm leading-relaxed text-foreground/60">Puede repetirse: los equipos se distinguen por su zona.</p>
                </div>
                <div>
                  <p className="ui-label">Escudo <span className="font-normal text-foreground/50">(opcional)</span></p>
                  <label className="relative mt-2 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-border bg-brand-bg/50 p-4 hover:border-brand-lime focus-within:border-brand-lime">
                    {crest}
                    <span className="flex items-center gap-2 text-sm font-semibold text-brand-lime"><ImagePlus aria-hidden className="h-4 w-4" />{crestPreview ? 'Cambiar imagen' : 'Elegir imagen'}</span>
                    <input id="crest" name="crest" type="file" accept={CREST_TYPES.join(',')} onChange={chooseCrest} aria-label="Elegir escudo del equipo" aria-describedby="crest-hint crest-error" aria-invalid={Boolean(crestError)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  </label>
                  {crestName && <p className="mt-2 truncate text-xs text-foreground/60" title={crestName}>{crestName}</p>}
                  {crestName && <button type="button" className="ui-action text-sm text-foreground/60 hover:text-brand-lime" onClick={() => {
                    const input = formRef.current?.querySelector<HTMLInputElement>('#crest')
                    if (input) { input.value = ''; input.setCustomValidity('') }
                    setCrestPreview(null); setCrestName(''); setCrestError('')
                  }}>Quitar imagen</button>}
                  <p id="crest-hint" className="mt-2 text-xs text-foreground/50">JPG, PNG o WebP · Hasta 2 MB</p>
                  {initial && <p className="mt-2 text-xs text-foreground/60">Sin una imagen nueva, se conserva el escudo actual.</p>}
                  {initial && crestUrl && <label className="ui-label mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="remove_crest" checked={removeCrest} onChange={(event) => {
                    setRemoveCrest(event.target.checked)
                    if (event.target.checked) {
                      const input = formRef.current?.querySelector<HTMLInputElement>('#crest')
                      if (input) { input.value = ''; input.setCustomValidity('') }
                      setCrestPreview(null); setCrestName(''); setCrestError('')
                    }
                  }} className="h-4 w-4 accent-brand-lime" />Quitar el escudo actual</label>}
                  <p id="crest-error" role="alert" className="mt-1 text-sm text-brand-red">{crestError}</p>
                </div>
              </div>
            </section>

            <section data-step="1" hidden={step !== 1} aria-label="Forma de jugar" className="mt-6 space-y-5" onChange={(event) => {
              if (event.target instanceof HTMLSelectElement && event.target.name === 'zone_id') setZoneId(event.target.value)
            }}>
              <div>
                <label htmlFor="zone_id" className="ui-label mb-2 block">Zona del equipo</label>
                <ZoneSelectField id="zone_id" name="zone_id" required groups={groups} defaultValue={initial?.zone_id} className={inputClass} />
              </div>
              <fieldset>
                <legend className="ui-label mb-2">Modalidad habitual</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SPORT_MODALITIES.map((item) => (
                    <label key={item.value} className="relative cursor-pointer">
                      <input type="radio" name="modality" value={item.value} required checked={modality === item.value} onChange={() => setModality(item.value)} className="peer sr-only" />
                      <span className="flex min-h-12 items-center justify-center rounded-lg border border-brand-border bg-brand-bg/50 px-2 py-3 text-sm text-foreground/70 peer-checked:border-brand-lime peer-checked:bg-brand-lime/5 peer-checked:text-brand-lime peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-lime">{item.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="ui-label mb-2">Nivel del equipo</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TEAM_LEVELS.map((item) => (
                    <label key={item.value} className="relative cursor-pointer">
                      <input type="radio" name="level" value={item.value} required checked={level === item.value} onChange={() => setLevel(item.value)} className="peer sr-only" />
                      <span className="flex min-h-12 items-center gap-2 rounded-lg border border-brand-border bg-brand-bg/50 px-3 py-3 text-sm text-foreground/70 peer-checked:border-brand-lime peer-checked:bg-brand-lime/5 peer-checked:text-brand-lime peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-lime"><span aria-hidden className={`h-3 w-3 shrink-0 rounded-full border ${level === item.value ? 'border-brand-lime bg-brand-lime' : 'border-foreground/40'}`} />{item.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section hidden={step !== 2} aria-label="Revisión" className="mt-6">
              <div className="rounded-2xl border border-brand-border bg-brand-bg/50 p-5">
                <div className="flex items-center gap-4">
                  {crest}
                  <div className="min-w-0">
                    <h3 className="break-words font-display text-3xl leading-tight">{name.trim()}</h3>
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground/60"><MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />{zone?.name} · {zone?.corridors.name}</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-brand-border pt-4 text-sm">
                  <div><dt className="text-foreground/50">Modalidad habitual</dt><dd className="mt-1 font-semibold">{modalityLabel(modality)}</dd></div>
                  <div><dt className="text-foreground/50">Nivel</dt><dd className="mt-1 font-semibold">{levelLabel(level)}</dd></div>
                </dl>
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm text-foreground/60"><Users aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-lime" />{initial ? 'Editar los datos no cambia el plantel ni la capitanía.' : 'Vas a ser el capitán y el primer integrante del plantel. Después podés invitar a tus jugadores.'}</p>
            </section>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-brand-border bg-brand-bg/20 px-5 py-4 sm:px-7">
            {step > 0 ? <button type="button" onClick={() => goToStep(step - 1)} className={secondaryButton}><ArrowLeft aria-hidden className="h-4 w-4" />Atrás</button> : <span className="text-xs text-foreground/50">El escudo es opcional</span>}
            {step < 2 ? (
              <button type="submit" className="ui-action press justify-center gap-2 rounded-lg bg-brand-lime px-5 py-3 text-brand-bg hover:bg-foreground">Continuar<ArrowRight aria-hidden className="h-4 w-4" /></button>
            ) : (
              <SubmitButton pendingLabel={initial ? 'Guardando cambios…' : 'Creando equipo…'} className="press gap-2 rounded-lg bg-brand-lime px-5 py-3 text-brand-bg hover:bg-foreground"><Check aria-hidden className="h-4 w-4" />{submitLabel}</SubmitButton>
            )}
          </div>
        </div>
      </CreationFieldset>
    </form>
  )
}

function CreationFieldset({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  const { pending } = useFormStatus()
  return <fieldset disabled={disabled || pending} aria-busy={pending} className="grid min-w-0 grid-cols-1 items-start gap-5 disabled:opacity-60 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-8">{children}</fieldset>
}
