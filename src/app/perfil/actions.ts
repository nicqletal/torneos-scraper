'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { normalizeWhatsapp } from '@/utils/whatsapp'
import { safeNextPath } from '@/utils/safe-next-path'

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

  const avatar = formData.get('avatar') as File | null
  let avatar_url: string | undefined = undefined

  if (avatar && avatar.size > 0) {
    if (avatar.size > 2 * 1024 * 1024) {
      backWithError('La foto no puede pesar más de 2 MB', next)
    }
    const ext = avatar.name.split('.').pop()
    const filePath = `${user.id}-${Date.now()}.${ext}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatar, { upsert: true })
      
    if (uploadError) {
      console.error(uploadError)
      backWithError('Error al subir la foto', next)
    }
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    avatar_url = publicUrl
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      display_name: displayName, 
      zone_id: zoneId,
      ...(avatar_url ? { avatar_url } : {})
    })
    .eq('id', user.id)

  if (profileError) {
    console.error(profileError)
    backWithError('No se pudo guardar el perfil', next)
  }

  const { error: contactError } = await supabase
    .from('profile_contacts')
    .update({ whatsapp })
    .eq('user_id', user.id)

  if (contactError) {
    console.error(contactError)
    backWithError('No se pudo guardar el WhatsApp', next)
  }

  revalidatePath('/perfil')
  redirect(next ?? '/perfil?ok=1')
}
