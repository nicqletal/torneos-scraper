'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requestErrorMessage } from '@/utils/inscription-requests'

// Lo que devuelven las acciones del capitán: el mensaje si no se pudo.
export interface RequestFormState {
  error: string | null
}

function revalidateTournament(id: string) {
  revalidatePath('/')
  revalidatePath(`/torneos/${id}`)
  revalidatePath('/mis-torneos')
  revalidatePath(`/mis-torneos/${id}`)
}

// Solicitar inscripción. Los ids viajan por el cliente y no son de confiar:
// que quien llama sea el capitán, que el equipo y el torneo cumplan las reglas
// y el aviso al organizador los resuelve `request_inscription` en la base.
export async function requestInscription(
  _state: RequestFormState,
  formData: FormData
): Promise<RequestFormState> {
  const tournamentId = String(formData.get('tournament_id') ?? '')
  const teamId = String(formData.get('team_id') ?? '')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/torneos/${tournamentId}`)}`)

  const { error } = await supabase.rpc('request_inscription', {
    p_tournament_id: tournamentId,
    p_team_id: teamId,
  })
  if (error) {
    console.error(error)
    return { error: requestErrorMessage(error) }
  }

  revalidateTournament(tournamentId)
  return { error: null }
}

// Retirar la solicitud pendiente. `withdraw_inscription_request` comprueba
// que sea del equipo de quien llama y que siga pendiente.
export async function withdrawInscriptionRequest(
  _state: RequestFormState,
  formData: FormData
): Promise<RequestFormState> {
  const tournamentId = String(formData.get('tournament_id') ?? '')
  const requestId = String(formData.get('request_id') ?? '')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/torneos/${tournamentId}`)}`)

  const { error } = await supabase.rpc('withdraw_inscription_request', { p_request_id: requestId })
  if (error) {
    console.error(error)
    return { error: requestErrorMessage(error) }
  }

  revalidateTournament(tournamentId)
  return { error: null }
}
