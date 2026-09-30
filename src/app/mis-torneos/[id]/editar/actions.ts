'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { parseTournamentForm } from '@/utils/tournament-form'
import type { TournamentFormState } from '@/components/TournamentForm'

// Edición de torneo. El `id` llega atado con `.bind` desde la página, así que
// viaja por el cliente y no es de confiar: quién puede editar qué lo decide la
// base (policy de update + grant por columnas), no este código.
export async function updateTournament(
  id: string,
  _state: TournamentFormState,
  formData: FormData
): Promise<TournamentFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/mis-torneos/${id}/editar`)

  const values = Object.fromEntries(
    [...formData.entries()]
      .filter(([key]) => !key.startsWith('$ACTION'))
      .map(([key, value]) => [key, String(value)])
  )

  const parsed = parseTournamentForm(formData)
  if (!parsed.ok) return { error: parsed.error, values }

  // Solo van las columnas del formulario: `verified_at` no se toca, porque
  // editar no cuenta como verificar (y el grant tampoco lo permitiría).
  const { data, error } = await supabase
    .from('tournaments')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) {
    console.error(error)
    return { error: 'No pudimos guardar los cambios. Probá de nuevo.', values }
  }
  // RLS no tira error con un torneo ajeno o dado de baja: el update afecta 0 filas.
  if (data.length === 0) {
    return { error: 'Este torneo ya no existe o no es tuyo.', values }
  }

  revalidatePath('/')
  revalidatePath('/mis-torneos')
  revalidatePath(`/torneos/${id}`)
  redirect(`/torneos/${id}`)
}
