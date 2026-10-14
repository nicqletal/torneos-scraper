'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { parseTeamForm } from '@/utils/team-form'
import { parseCrest } from '@/utils/team-crest'
import { saveTeam } from '@/utils/supabase/team'

function backWithError(message: string): never {
  redirect(`/crear-equipo?error=${encodeURIComponent(message)}`)
}

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/crear-equipo')
  }

  const parsed = parseTeamForm(formData)
  if (!parsed.ok) backWithError(parsed.error)
  const crest = parseCrest(formData.get('crest'))
  if (!crest.ok) backWithError(crest.error)

  // create_team checks WhatsApp and the captaincy limit, and inserts the team
  // and its captain in a single transaction
  const { data: teamId, error } = await supabase.rpc('create_team', {
    p_name: parsed.fields.name,
    p_zone_id: parsed.fields.zone_id,
    p_modality: parsed.fields.modality,
    p_level: parsed.fields.level,
  })

  if (error) {
    console.error('Error al crear equipo:', error)
    backWithError(error.message || 'No se pudo crear el equipo')
  }

  revalidatePath('/')
  revalidatePath('/mis-equipos')
  if (crest.file) {
    const result = await saveTeam(supabase, teamId, parsed.fields, crest.file, false, process.env.NEXT_PUBLIC_SUPABASE_URL!)
    if (!result.ok) {
      redirect(`/equipos/${teamId}/editar?error=${encodeURIComponent('El equipo se creó. ' + result.error)}`)
    }
  }
  redirect(`/equipos/${teamId}`)
}
