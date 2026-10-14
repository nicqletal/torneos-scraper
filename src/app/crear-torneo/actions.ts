'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { parseTournamentForm } from '@/utils/tournament-form'
import { parseFlyer } from '@/utils/tournament-flyer'
import { uploadFlyer } from '@/utils/supabase/flyer'
import type { TournamentFormState } from '@/components/TournamentForm'

// Alta de torneo. Si algo no cierra, devuelve el error y lo cargado para que el
// formulario no se vacíe. La validación vive en `parseTournamentForm`, que es
// la misma que va a usar la edición.
export async function createTournament(
  _state: TournamentFormState,
  formData: FormData
): Promise<TournamentFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/crear-torneo')

  // El flyer no vuelve al formulario: un <input type="file"> no se puede precargar.
  const values = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => !key.startsWith('$ACTION') && typeof value === 'string')
      .map(([key, value]) => [key, String(value)])
  )

  const parsed = parseTournamentForm(formData)
  if (!parsed.ok) return { error: parsed.error, values }

  // El navegador ya lo chequeó, pero no es de confiar.
  const flyer = parseFlyer(formData.get('flyer'))
  if (!flyer.ok) return { error: flyer.error, values }

  // user_id sale de la sesión, nunca del formulario. La policy de insert
  // (`auth.uid() = user_id`) lo vuelve a exigir en la base.
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single()

  if (error) {
    console.error('Error al insertar torneo:', error)
    return { error: `No pudimos publicar el torneo: ${error.message ?? error.details ?? 'Error desconocido'}`, values }
  }

  // El flyer va después del insert: el objeto se llama como el id del torneo,
  // que antes no existe, y así un alta que falla no deja un archivo huérfano.
  // Si lo que falla es la subida, el torneo ya está publicado: se avisa en la
  // ficha y el flyer se puede subir de nuevo desde la pestaña Datos.
  const flyerFailed = flyer.file !== null && !(await uploadFlyer(supabase, data.id, flyer.file))

  revalidatePath('/')
  revalidatePath('/mis-torneos')
  redirect(`/torneos/${data.id}?publicado=1${flyerFailed ? '&flyer=fallo' : ''}`)
}
