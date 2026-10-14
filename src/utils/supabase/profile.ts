import type { SupabaseClient } from '@supabase/supabase-js'
import { avatarObjectPath } from '../profile-avatar.ts'

type ProfileFields = { display_name: string; zone_id: string | null }
type ProfileResult = { ok: true; cleanupFailed: boolean } | { ok: false; error: string }

// Storage y Postgres no comparten una transacción. Guardamos primero la foto
// nueva y su URL; solo después retiramos la anterior. Si falla el guardado,
// intentamos retirar la subida nueva y conservamos la foto que ya estaba.
export async function saveProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: ProfileFields,
  avatar: File | null,
  supabaseUrl: string,
): Promise<ProfileResult> {
  const bucket = supabase.storage.from('avatars')
  let previousUrl: string | null = null
  let newPath: string | null = null
  let newUrl: string | undefined

  if (avatar) {
    const { data: previous, error } = await supabase.from('profiles')
      .select('avatar_url').eq('id', userId).single()
    if (error) {
      console.error(error)
      return { ok: false, error: 'No se pudo cargar el perfil. Probá de nuevo.' }
    }
    previousUrl = previous.avatar_url
    newPath = `${userId}/${crypto.randomUUID()}`
    const { error: uploadError } = await bucket.upload(newPath, avatar, { contentType: avatar.type })
    if (uploadError) {
      console.error(uploadError)
      return { ok: false, error: 'No se pudo subir la foto. Probá de nuevo.' }
    }
    newUrl = bucket.getPublicUrl(newPath).data.publicUrl
  }

  let update = supabase.from('profiles')
    .update({ ...fields, ...(newUrl ? { avatar_url: newUrl } : {}) }).eq('id', userId)
  if (avatar) {
    // Dos pestañas no pueden reemplazar la misma foto a la vez: la segunda
    // intenta retirar su subida y pide reintentar.
    update = previousUrl === null ? update.is('avatar_url', null) : update.eq('avatar_url', previousUrl)
  }
  const { error: saveError } = await update.select('id').single()
  if (saveError) {
    console.error(saveError)
    if (newPath) {
      const { error: cleanupError } = await bucket.remove([newPath])
      if (cleanupError) console.error('No se pudo retirar la subida nueva:', cleanupError)
    }
    return { ok: false, error: 'No se pudo guardar el perfil. Recargá la página y probá de nuevo.' }
  }

  const previousPath = avatar ? avatarObjectPath(previousUrl, supabaseUrl, userId) : null
  if (previousPath) {
    const { error } = await bucket.remove([previousPath])
    if (error) {
      console.error('No se pudo retirar la foto anterior:', error)
      return { ok: true, cleanupFailed: true }
    }
  }
  return { ok: true, cleanupFailed: false }
}
