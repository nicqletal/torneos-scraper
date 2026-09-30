'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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
  revalidatePath('/mis-torneos')
  revalidatePath(`/torneos/${id}`)
}
