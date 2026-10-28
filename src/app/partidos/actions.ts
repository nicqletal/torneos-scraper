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

  if (error) {
    // P0001 = raise exception de la RPC: el mensaje es para el usuario.
    if (error.code !== 'P0001') console.error(error)
    backToPanel(teamId, modality, error.code === 'P0001' ? `${error.message}.` : 'No se pudo guardar la búsqueda. Probá de nuevo.')
  }

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}
