import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { ArrowLeft, Trophy } from 'lucide-react'
import { CreateTournamentForm, CreateTournamentState } from './CreateTournamentForm'

export default async function CrearTorneoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/crear-torneo')
  }

  // Server Action: valida las fechas y el cupo antes de insertar. Si algo no
  // cierra, devuelve el error y lo cargado para que el formulario no se vacíe.
  // Los `check` de la tabla repiten las mismas reglas como última defensa.
  async function createTournament(
    _state: CreateTournamentState,
    formData: FormData
  ): Promise<CreateTournamentState> {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autorizado')

    const values = Object.fromEntries(
      [...formData.entries()]
        .filter(([key]) => !key.startsWith('$ACTION'))
        .map(([key, value]) => [key, String(value)])
    )
    const fail = (error: string) => ({ error, values })

    const { inscription_deadline, start_date, end_date } = values
    if (!inscription_deadline || !start_date || !end_date) {
      return fail('Completá el cierre de inscripción, el inicio y el fin.')
    }
    // Las fechas llegan como AAAA-MM-DD, así que se pueden comparar como texto.
    if (inscription_deadline > start_date) {
      return fail('El cierre de inscripción no puede ser después del inicio.')
    }
    if (start_date > end_date) {
      return fail('El fin no puede ser antes del inicio.')
    }

    const capacity = values.capacity ? Number(values.capacity) : null
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
      return fail('El cupo tiene que ser un número entero de al menos 1.')
    }

    const { error } = await supabase.from('tournaments').insert({
      name: values.name,
      description: values.description,
      sport_modality: values.sport_modality,
      zone: values.zone,
      price: values.price ? parseFloat(values.price) : null,
      price_currency: values.price_currency || 'ARS',
      contact_whatsapp: values.contact_whatsapp,
      contact_instagram: values.contact_instagram,
      inscription_deadline,
      start_date,
      end_date,
      capacity,
      user_id: user.id,
    })

    if (error) {
      console.error(error)
      return fail('No pudimos publicar el torneo. Probá de nuevo.')
    }

    revalidatePath('/')
    revalidatePath('/mis-torneos')
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

        <CreateTournamentForm action={createTournament} />
      </div>
    </div>
  )
}
