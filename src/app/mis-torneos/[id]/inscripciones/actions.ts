'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { inscriptionErrorMessage, parseTeamName } from '@/utils/inscriptions'

// Lo que devuelve el alta cuando no puede guardar: el mensaje y el nombre que
// se había escrito, para no vaciar el campo.
export interface InscriptionFormState {
  error: string | null
  teamName: string
}

function revalidateTournament(id: string) {
  revalidatePath('/')
  revalidatePath('/mis-torneos')
  revalidatePath(`/mis-torneos/${id}/inscripciones`)
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

  if (!user) redirect(`/login?next=/mis-torneos/${tournamentId}/inscripciones`)

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

// Borrar una inscripción. Es un <form> con el id en un campo oculto, así que
// funciona sin JavaScript. Si falla (por ejemplo, el torneo finalizó a
// medianoche), vuelve a la página con el mensaje en la URL.
export async function removeInscription(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tournamentId = formData.get('tournament_id')
  const inscriptionId = formData.get('id')
  if (typeof tournamentId !== 'string' || typeof inscriptionId !== 'string') return

  if (!user) redirect(`/login?next=/mis-torneos/${tournamentId}/inscripciones`)

  const { error } = await supabase.rpc('remove_inscription', { p_inscription_id: inscriptionId })

  if (error) {
    console.error(error)
    redirect(`/mis-torneos/${tournamentId}/inscripciones?error=${error.code ?? ''}`)
  }

  revalidateTournament(tournamentId)
}
