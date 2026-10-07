'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { inscriptionErrorCode, inscriptionErrorMessage, parseTeamName } from '@/utils/inscriptions'
import { manageLoginPath, managePath } from '@/utils/tournament-manage'

// Lo que devuelve el alta cuando no puede guardar: el mensaje y el nombre que
// se había escrito, para no vaciar el campo.
export interface InscriptionFormState {
  error: string | null
  teamName: string
}

function revalidateTournament(id: string) {
  revalidatePath('/')
  revalidatePath('/mis-torneos')
  revalidatePath(`/mis-torneos/${id}`)
  revalidatePath(`/torneos/${id}`)
}

// Alta por nombre. El `id` llega atado con `.bind` desde la página, así que
// viaja por el cliente y no es de confiar: que el torneo sea del que llama, que
// no esté Finalizado y que haya lugar en el cupo lo decide `add_inscription`
// en la base, que es la única que puede escribir en `inscriptions`.
export async function addInscription(
  tournamentId: string,
  _state: InscriptionFormState,
  formData: FormData
): Promise<InscriptionFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(manageLoginPath(tournamentId, 'inscripciones'))

  const teamName = String(formData.get('team_name') ?? '')
  const parsed = parseTeamName(teamName)
  if (!parsed.ok) return { error: parsed.error, teamName }

  const { error } = await supabase.rpc('add_inscription', {
    p_tournament_id: tournamentId,
    p_team_name: parsed.name,
  })

  if (error) {
    console.error(error)
    return { error: inscriptionErrorMessage(error.code), teamName }
  }

  revalidateTournament(tournamentId)
  return { error: null, teamName: '' }
}

// Alta vinculada: el organizador eligió un equipo del buscador. Es un <form>
// con los ids en campos ocultos, así que funciona sin JavaScript. Que el
// torneo sea del que llama, que el equipo exista y no esté disuelto, que no
// esté ya anotado y que haya cupo lo decide `add_linked_inscription` en la
// base. Si falla, vuelve a la pestaña con el código en la URL, conservando la
// búsqueda para que el organizador vea el error al lado de lo que eligió.
export async function addLinkedInscription(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tournamentId = formData.get('tournament_id')
  const teamId = formData.get('team_id')
  const q = formData.get('q')
  if (typeof tournamentId !== 'string' || typeof teamId !== 'string') return

  if (!user) redirect(manageLoginPath(tournamentId, 'inscripciones'))

  const { error } = await supabase.rpc('add_linked_inscription', {
    p_tournament_id: tournamentId,
    p_team_id: teamId,
  })

  if (error) {
    console.error(error)
    redirect(
      managePath(tournamentId, 'inscripciones', {
        q: typeof q === 'string' ? q : undefined,
        error: inscriptionErrorCode(error.code),
      })
    )
  }

  revalidateTournament(tournamentId)
  // Con el equipo anotado, la búsqueda ya cumplió: vuelve a la lista limpia.
  redirect(managePath(tournamentId, 'inscripciones'))
}

// Dar de baja una inscripción. Es un <form> con el id en un campo oculto, así que
// funciona sin JavaScript. Si falla (por ejemplo, el torneo finalizó a
// medianoche), vuelve a la pestaña con el mensaje en la URL.
export async function removeInscription(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tournamentId = formData.get('tournament_id')
  const inscriptionId = formData.get('id')
  if (typeof tournamentId !== 'string' || typeof inscriptionId !== 'string') return

  if (!user) redirect(manageLoginPath(tournamentId, 'inscripciones'))

  const { error } = await supabase.rpc('remove_inscription', { p_inscription_id: inscriptionId })

  if (error) {
    console.error(error)
    redirect(managePath(tournamentId, 'inscripciones', { error: inscriptionErrorCode(error.code) }))
  }

  revalidateTournament(tournamentId)
}
