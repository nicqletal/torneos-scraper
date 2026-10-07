'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { parseTournamentForm } from '@/utils/tournament-form'
import { parseFlyer } from '@/utils/tournament-flyer'
import { uploadFlyer } from '@/utils/supabase/flyer'
import { manageLoginPath, managePath } from '@/utils/tournament-manage'
import type { TournamentFormState } from '@/components/TournamentForm'

// Edición de torneo (pestaña "Datos" de la pantalla de gestión). El `id` llega
// atado con `.bind`, así que viaja por el cliente y no es de confiar: quién
// puede editar qué lo decide la base (policy de update + grant por columnas),
// no este código.
export async function updateTournament(
  id: string,
  _state: TournamentFormState,
  formData: FormData
): Promise<TournamentFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(manageLoginPath(id, 'datos'))

  // El flyer no vuelve al formulario: un <input type="file"> no se puede precargar.
  const values = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => !key.startsWith('$ACTION') && typeof value === 'string')
      .map(([key, value]) => [key, String(value)])
  )

  const parsed = parseTournamentForm(formData)
  if (!parsed.ok) return { error: parsed.error, values }

  // El navegador ya lo chequeó, pero no es de confiar. Sin archivo elegido,
  // queda el flyer que estaba.
  const flyer = parseFlyer(formData.get('flyer'))
  if (!flyer.ok) return { error: flyer.error, values }

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

  // Un flyer nuevo pisa el anterior (mismo objeto, `upsert`).
  if (flyer.file && !(await uploadFlyer(supabase, id, flyer.file))) {
    revalidatePath(`/torneos/${id}`)
    return { error: 'Guardamos los cambios, pero no pudimos subir el flyer. Probá de nuevo.', values }
  }

  revalidatePath('/')
  revalidatePath('/mis-torneos')
  revalidatePath(`/mis-torneos/${id}`)
  revalidatePath(`/torneos/${id}`)
  // Vuelve a la pantalla de gestión, de donde vino; la ficha pública se abre
  // con "Ver ficha pública" (ver "Cuenta y acceso" en las decisiones).
  redirect(managePath(id, 'datos'))
}
