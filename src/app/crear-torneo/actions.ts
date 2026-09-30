'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { parseTournamentForm } from '@/utils/tournament-form'
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

  const values = Object.fromEntries(
    [...formData.entries()]
      .filter(([key]) => !key.startsWith('$ACTION'))
      .map(([key, value]) => [key, String(value)])
  )

  const parsed = parseTournamentForm(formData)
  if (!parsed.ok) return { error: parsed.error, values }

  // user_id sale de la sesión, nunca del formulario. La policy de insert
  // (`auth.uid() = user_id`) lo vuelve a exigir en la base.
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single()

  if (error) {
    console.error(error)
    return { error: 'No pudimos publicar el torneo. Probá de nuevo.', values }
  }

  revalidatePath('/')
  revalidatePath('/mis-torneos')
  redirect(`/torneos/${data.id}?publicado=1`)
}
