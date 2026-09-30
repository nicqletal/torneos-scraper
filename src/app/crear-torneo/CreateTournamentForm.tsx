'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'

// Lo que devuelve la Server Action cuando no puede guardar: el mensaje y lo que
// el usuario había cargado, para volver a llenar el formulario.
export interface CreateTournamentState {
  error: string | null
  values: Record<string, string>
}

interface CreateTournamentFormProps {
  action: (state: CreateTournamentState, formData: FormData) => Promise<CreateTournamentState>
}

const inputClass =
  'px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors'

export function CreateTournamentForm({ action }: CreateTournamentFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null, values: {} })
  const v = state.values

  return (
    // `key` fuerza a React a volver a montar los campos con los valores devueltos:
    // un `defaultValue` nuevo no pisa lo que ya muestra un input montado.
    <form key={JSON.stringify(v)} action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <p role="alert" className="px-4 py-3 border border-red-500/30 bg-red-950/20 text-red-400 text-sm rounded-xl">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/70 font-medium">Nombre del torneo</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={v.name}
          placeholder="Ej: Copa Amistad Sabatina"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Modalidad</label>
          <select name="sport_modality" required defaultValue={v.sport_modality} className={inputClass}>
            <option value="futbol_5">Fútbol 5</option>
            <option value="futbol_7">Fútbol 7</option>
            <option value="futbol_8">Fútbol 8</option>
            <option value="futbol_11">Fútbol 11</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Zona / Ubicación</label>
          <input
            name="zone"
            type="text"
            required
            defaultValue={v.zone}
            placeholder="Ej: Palermo, CABA o Vicente López, GBA"
            className={inputClass}
          />
        </div>
      </div>

      {/* El estado del torneo sale de estas tres fechas y del cupo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Cierre de inscripción</label>
          <input
            name="inscription_deadline"
            type="date"
            required
            defaultValue={v.inscription_deadline}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Inicio</label>
          <input name="start_date" type="date" required defaultValue={v.start_date} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Fin</label>
          <input name="end_date" type="date" required defaultValue={v.end_date} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Precio (opcional)</label>
          <input name="price" type="number" defaultValue={v.price} placeholder="Ej: 45000" className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Moneda</label>
          <select name="price_currency" defaultValue={v.price_currency} className={inputClass}>
            <option value="ARS">ARS ($)</option>
            <option value="USD">USD (US$)</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Cupo (opcional)</label>
          <input
            name="capacity"
            type="number"
            min={1}
            step={1}
            defaultValue={v.capacity}
            placeholder="Ej: 16"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/70 font-medium">Descripción / Información General</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={v.description}
          placeholder="Detalles sobre premios, horarios, reglas, etc..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="h-px bg-white/10 w-full my-2" />

      <h3 className="text-sm font-bold text-emerald-400">Datos de Contacto</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">WhatsApp</label>
          <input
            name="contact_whatsapp"
            type="text"
            defaultValue={v.contact_whatsapp}
            placeholder="Ej: +5491112345678"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70 font-medium">Usuario Instagram (sin @)</label>
          <input
            name="contact_instagram"
            type="text"
            defaultValue={v.contact_instagram}
            placeholder="Ej: torneos.futbol"
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-zinc-950 font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
      >
        <Save className="w-5 h-5" />
        {pending ? 'Publicando…' : 'Publicar Torneo'}
      </button>
    </form>
  )
}
