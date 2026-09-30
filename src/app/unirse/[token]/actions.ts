'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function joinTeam(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/unirse/${token}`)}`)
  }

  // join_team validates the link (missing, expired or dissolved team give the
  // same error) and is a no-op when the user is already in the squad
  const { data: teamId, error } = await supabase.rpc('join_team', { p_token: token })

  if (error) {
    // P0001 = raise exception in join_team: the message is meant for the user
    if (error.code === 'P0001') {
      redirect(`/unirse/${token}?error=${encodeURIComponent(error.message)}`)
    }
    console.error(error)
    redirect(`/unirse/${token}?error=${encodeURIComponent('No se pudo unir al equipo')}`)
  }

  revalidatePath('/mis-equipos')
  redirect(`/equipos/${teamId}`)
}
