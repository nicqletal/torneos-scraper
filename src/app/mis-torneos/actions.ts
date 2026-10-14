'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { removeFlyer } from '@/utils/supabase/flyer'

// "Sigue vigente". El form del panel manda el id en un campo oculto, así que
// funciona sin JavaScript. El id viene del cliente y no es de confiar: que sea
// del dueño lo controla la función `verify_tournament` en la base, que además
// es la única que puede escribir `verified_at`.
export async function verifyTournament(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/mis-torneos')

  const id = formData.get('id')
  if (typeof id !== 'string') return
  const { error } = await supabase.rpc('verify_tournament', { tournament_id: id })

  // Solo falla con un torneo ajeno, dado de baja, Finalizado o un id trucho:
  // el panel no le ofrece ninguno de esos al dueño, así que alcanza con el log.
  if (error) {
    console.error(error)
    return
  }

  revalidatePath('/')
  revalidatePath('/torneos')
  revalidatePath('/mis-torneos')
  revalidatePath(`/torneos/${id}`)
}

// Baja. Recibe el id directo (no un FormData) porque la llama `WithdrawButton`
// después de confirmar, no un form. El id viene del cliente y no es de confiar:
// que sea del dueño y que el torneo no esté Finalizado lo controla la función
// `withdraw_tournament` en la base, que es la única que puede borrar torneos.
export async function withdrawTournament(id: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/mis-torneos')

  const { error } = await supabase.rpc('withdraw_tournament', { tournament_id: id })

  // El panel solo ofrece la baja en torneos propios no Finalizados, pero el
  // estado puede cambiar entre que se cargó la página y se tocó el botón (por
  // ejemplo, termina el torneo a medianoche). Ese mensaje sí se muestra.
  if (error) {
    console.error(error)
    return {
      error: error.code === '22023'
        ? 'Este torneo ya finalizó: queda en tu trayectoria y no se da de baja.'
        : 'No pudimos dar de baja el torneo. Probá de nuevo.',
    }
  }

  // El flyer se borra por la API de Storage, porque Postgres no puede borrar
  // archivos (ver supabase/migrations/20260930000007_tournament_flyers.sql).
  // Va después de la baja, así un torneo que no se pudo dar de baja no se
  // queda sin flyer; la policy de delete deja borrar el huérfano que subiste vos.
  await removeFlyer(supabase, id)

  revalidatePath('/')
  revalidatePath('/torneos')
  revalidatePath('/mis-torneos')
  revalidatePath(`/torneos/${id}`)
}
