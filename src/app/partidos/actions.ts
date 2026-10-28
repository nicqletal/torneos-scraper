'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { buenosAiresToday, parseRivalSearchForm } from '@/utils/rival-search-form'

// Vuelve al panel con el mismo equipo y modalidad, y el error si lo hubo.
function backToPanel(teamId: unknown, modality: unknown, error?: string): never {
  const params = new URLSearchParams()
  if (typeof teamId === 'string' && teamId) params.set('equipo', teamId)
  if (typeof modality === 'string' && modality) params.set('modalidad', modality)
  if (error) params.set('error', error)
  redirect(`/partidos?${params}`)
}

// Publicar, agregar o sacar franjas y cancelar son el mismo guardado: el
// formulario manda el conjunto completo de franjas que quedan, y vacío cancela.
export async function saveRivalSearch(formData: FormData) {
  const teamId = formData.get('team_id')
  const modality = formData.get('modality')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const parsed = parseRivalSearchForm(formData, buenosAiresToday(new Date()))
  if (!parsed.ok) backToPanel(teamId, modality, parsed.error)

  // La RPC repite cada validación y además exige capitán actual, equipo no
  // disuelto y WhatsApp en el perfil.
  const { error } = await supabase.rpc('save_rival_search', {
    p_team_id: parsed.fields.team_id,
    p_modality: parsed.fields.modality,
    p_slots: parsed.fields.slots,
  })

  if (error) backToPanel(teamId, modality, rpcErrorMessage(error, 'No se pudo guardar la búsqueda. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}

// Traduce el error de una RPC: P0001 = `raise exception` de la RPC, con un
// mensaje para el usuario; cualquier otro se loguea y se muestra uno genérico.
function rpcErrorMessage(error: { code: string; message: string }, fallback: string): string {
  if (error.code !== 'P0001') console.error(error)
  return error.code === 'P0001' ? `${error.message}.` : fallback
}

// "Proponer partido" en un compatible: la base calcula la parte en común de
// las dos franjas y avisa al capitán rival.
export async function sendProposal(formData: FormData) {
  const teamId = formData.get('team_id')
  const modality = formData.get('modality')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('send_proposal', {
    p_slot_id: String(formData.get('slot_id') ?? ''),
    p_rival_slot_id: String(formData.get('rival_slot_id') ?? ''),
  })
  if (error) backToPanel(teamId, modality, rpcErrorMessage(error, 'No se pudo mandar la propuesta. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}

// Rechazar (quien la recibe) o cancelar (quien la mandó) es la misma RPC con
// `p_accept` false: la base sabe de qué lado está cada uno.
export async function declineProposal(formData: FormData) {
  const teamId = formData.get('team_id')
  const modality = formData.get('modality')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('respond_proposal', {
    p_proposal_id: String(formData.get('proposal_id') ?? ''),
    p_accept: false,
  })
  if (error) backToPanel(teamId, modality, rpcErrorMessage(error, 'No se pudo responder la propuesta. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}
