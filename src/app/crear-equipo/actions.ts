'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isTeamLevel } from '@/utils/teams'
import { isSportModality } from '@/utils/modality'

function backWithError(message: string): never {
  redirect(`/crear-equipo?error=${encodeURIComponent(message)}`)
}

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/crear-equipo')
  }

  const name = ((formData.get('name') as string) || '').trim()
  const zoneId = (formData.get('zone_id') as string) || ''
  const modality = formData.get('modality')
  const level = formData.get('level')

  if (name.length < 2 || name.length > 50) backWithError('El nombre tiene que tener entre 2 y 50 caracteres')
  if (!zoneId) backWithError('Elegí la zona del equipo')
  if (!isSportModality(modality)) backWithError('Elegí una modalidad válida')
  if (!isTeamLevel(level)) backWithError('Elegí un nivel válido')

  // create_team checks WhatsApp and the captaincy limit, and inserts the team
  // and its captain in a single transaction
  const { data: teamId, error } = await supabase.rpc('create_team', {
    p_name: name,
    p_zone_id: zoneId,
    p_modality: modality,
    p_level: level,
  })

  if (error) {
    // P0001 = raise exception in create_team: the message is meant for the user
    if (error.code === 'P0001') backWithError(error.message)
    console.error(error)
    backWithError('No se pudo crear el equipo')
  }

  revalidatePath('/mis-equipos')
  redirect(`/equipos/${teamId}`)
}
