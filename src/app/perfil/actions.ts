'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { normalizeWhatsapp } from '@/utils/whatsapp'
import { safeNextPath } from '@/utils/safe-next-path'
import { parseAvatar } from '@/utils/profile-avatar'
import { saveProfile } from '@/utils/supabase/profile'

function backWithError(message: string, next: string | null): never {
  const nextParam = next ? `&next=${encodeURIComponent(next)}` : ''
  redirect(`/perfil?error=${encodeURIComponent(message)}${nextParam}`)
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/perfil')
  }

  const rawNext = formData.get('next')
  const next = rawNext ? safeNextPath(rawNext, '/perfil') : null

  const displayName = ((formData.get('display_name') as string) || '').trim()
  const zoneId = (formData.get('zone_id') as string) || null
  const whatsappInput = ((formData.get('whatsapp') as string) || '').trim()

  if (displayName.length < 2 || displayName.length > 50) {
    backWithError('El nombre tiene que tener entre 2 y 50 caracteres', next)
  }

  let whatsapp: string | null = null
  if (whatsappInput) {
    whatsapp = normalizeWhatsapp(whatsappInput)
    if (!whatsapp) {
      backWithError('El WhatsApp tiene que ser el código de área sin 0 y el número sin 15 (10 dígitos)', next)
    }
  }

  const avatar = parseAvatar(formData.get('avatar'))
  if (!avatar.ok) backWithError(avatar.error, next)

  const result = await saveProfile(supabase, user.id,
    { display_name: displayName, zone_id: zoneId }, avatar.file,
    process.env.NEXT_PUBLIC_SUPABASE_URL!)
  if (!result.ok) backWithError(result.error, next)

  revalidatePath('/')
  revalidatePath('/perfil')
  revalidatePath(`/organizadores/${user.id}`)

  const { error: contactError } = await supabase
    .from('profile_contacts')
    .update({ whatsapp })
    .eq('user_id', user.id)

  if (contactError) {
    console.error(contactError)
    backWithError('No se pudo guardar el WhatsApp', next)
  }

  revalidatePath('/perfil')
  if (result.cleanupFailed) {
    backWithError('El perfil se guardó, pero no se pudo retirar la foto anterior.', next)
  }
  redirect(next ?? '/perfil?ok=1')
}
