'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { parseTeamForm } from '@/utils/team-form'
import { parseCrest } from '@/utils/team-crest'
import { saveTeam } from '@/utils/supabase/team'

async function requireUser(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/equipos/${teamId}`)
  }

  return supabase
}

// P0001 = raise exception in the roster functions: the message is meant for the user
function backWithError(teamId: string, error: { code?: string; message: string }): never {
  if (error.code !== 'P0001') console.error(error)
  const message = error.code === 'P0001' ? error.message : 'No se pudo completar la acción'
  redirect(`/equipos/${teamId}?error=${encodeURIComponent(message)}`)
}

export async function regenerateInvite(teamId: string) {
  const supabase = await requireUser(teamId)

  // Only the captain of an active team can do this; the function checks it
  const { error } = await supabase.rpc('regenerate_team_invite', { p_team_id: teamId })
  if (error) backWithError(teamId, error)

  revalidatePath(`/equipos/${teamId}`)
}

export async function leaveTeam(teamId: string) {
  const supabase = await requireUser(teamId)

  const { error } = await supabase.rpc('leave_team', { p_team_id: teamId })
  if (error) backWithError(teamId, error)

  revalidatePath('/mis-equipos')
  revalidatePath(`/equipos/${teamId}`)
  redirect('/mis-equipos')
}

export async function removeMember(teamId: string, userId: string) {
  const supabase = await requireUser(teamId)

  const { error } = await supabase.rpc('remove_team_member', { p_team_id: teamId, p_user_id: userId })
  if (error) backWithError(teamId, error)

  revalidatePath(`/equipos/${teamId}`)
}

export async function transferCaptaincy(teamId: string, userId: string) {
  const supabase = await requireUser(teamId)

  const { error } = await supabase.rpc('transfer_captaincy', { p_team_id: teamId, p_user_id: userId })
  if (error) backWithError(teamId, error)

  revalidatePath('/mis-equipos')
  revalidatePath(`/equipos/${teamId}`)
}

export async function updateTeam(teamId: string, formData: FormData) {
  const supabase = await requireUser(teamId)
  function editError(message: string): never {
    redirect(`/equipos/${teamId}/editar?error=${encodeURIComponent(message)}`)
  }
  const { data: isCaptain, error: captainError } = await supabase.rpc('is_team_captain', { p_team_id: teamId })
  if (captainError || !isCaptain) backWithError(teamId, { code: 'P0001', message: 'Solo el capitán puede editar el equipo.' })

  const parsed = parseTeamForm(formData)
  if (!parsed.ok) editError(parsed.error)
  const crest = parseCrest(formData.get('crest'))
  if (!crest.ok) editError(crest.error)
  const result = await saveTeam(supabase, teamId, parsed.fields, crest.file,
    formData.get('remove_crest') === 'on', process.env.NEXT_PUBLIC_SUPABASE_URL!)
  if (!result.ok) editError(result.error)

  revalidatePath('/')
  revalidatePath('/mis-equipos')
  revalidatePath(`/equipos/${teamId}`)
  revalidatePath(`/equipos/${teamId}/editar`)
  if (result.cleanupFailed) editError('El equipo se guardó, pero no se pudo retirar el escudo anterior.')
  redirect(`/equipos/${teamId}?ok=editado`)
}

export async function dissolveTeam(teamId: string, formData: FormData) {
  const supabase = await requireUser(teamId)
  if (formData.get('confirm_dissolve') !== 'on') {
    backWithError(teamId, { code: 'P0001', message: 'Confirmá que entendés que la disolución es definitiva.' })
  }
  const { error } = await supabase.rpc('dissolve_team', { p_team_id: teamId })
  if (error) backWithError(teamId, error)
  revalidatePath('/')
  revalidatePath('/mis-equipos')
  revalidatePath('/crear-equipo')
  revalidatePath(`/equipos/${teamId}`)
  revalidatePath(`/equipos/${teamId}/editar`)
  redirect(`/equipos/${teamId}?ok=disuelto`)
}
