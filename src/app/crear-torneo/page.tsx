import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Save } from 'lucide-react'

export default async function CrearTorneoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/crear-torneo')
  }

  // Server Action inline/inside file or external for submission
  async function handleSubmit(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autorizado')

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const sport_modality = formData.get('sport_modality') as any
    const zone = formData.get('zone') as string
    const priceRaw = formData.get('price')
    const price = priceRaw ? parseFloat(priceRaw as string) : null
    const price_currency = formData.get('price_currency') as string || 'ARS'
    const contact_whatsapp = formData.get('contact_whatsapp') as string
    const contact_instagram = formData.get('contact_instagram') as string
    const status = 'abierto'
    const start_date = new Date().toISOString().split('T')[0] // today's date placeholder

    const { error } = await supabase.from('tournaments').insert({
      name,
      description,
      sport_modality,
      zone,
      price,
      price_currency,
      contact_whatsapp,
      contact_instagram,
      status,
      start_date,
      user_id: user.id
    })

    if (error) {
      console.error(error)
      redirect('/crear-torneo?error=' + encodeURIComponent(error.message))
    }

    redirect('/mis-torneos')
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver al inicio
      </Link>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cargar nuevo torneo</h1>
            <p className="text-sm text-white/60">Completa los datos del torneo amateur para publicarlo en la app</p>
          </div>
        </div>

        <form action={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70 font-medium">Nombre del torneo</label>
            <input 
              name="name" 
              type="text" 
              required 
              placeholder="Ej: Copa Amistad Sabatina"
              className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70 font-medium">Modalidad</label>
              <select 
                name="sport_modality" 
                required
                className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
              >
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
                placeholder="Ej: Palermo, CABA o Vicente López, GBA"
                className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <label className="text-sm text-white/70 font-medium">Precio de inscripción (opcional)</label>
              <input 
                name="price" 
                type="number" 
                placeholder="Ej: 45000"
                className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70 font-medium">Moneda</label>
              <select 
                name="price_currency" 
                className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (US$)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70 font-medium">Descripción / Información General</label>
            <textarea 
              name="description" 
              rows={4}
              placeholder="Detalles sobre premios, horarios, reglas, etc..."
              className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors resize-none"
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
                placeholder="Ej: +5491112345678"
                className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70 font-medium">Usuario Instagram (sin @)</label>
              <input 
                name="contact_instagram" 
                type="text" 
                placeholder="Ej: torneos.futbol"
                className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-5 h-5" />
            Publicar Torneo
          </button>
        </form>
      </div>
    </div>
  )
}
