import type { SupabaseClient } from '@supabase/supabase-js'
import type { TeamFields } from '../team-form.ts'
import { crestObjectPath } from '../team-crest.ts'

type SaveTeamResult = { ok: true; cleanupFailed: boolean } | { ok: false; error: string }

// Subimos un objeto nuevo antes de guardar. Si el guardado falla, retiramos
// esa subida; el escudo anterior solo se retira después de guardar la URL.
export async function saveTeam(
  supabase: SupabaseClient, teamId: string, fields: TeamFields,
  crest: File | null, removeCrest: boolean, supabaseUrl: string,
): Promise<SaveTeamResult> {
  if (crest && removeCrest) return { ok: false, error: 'Elegí reemplazar el escudo o quitarlo, no ambas cosas.' }
  const changingCrest = !!crest || removeCrest
  const bucket = supabase.storage.from('team-crests')
  let previousUrl: string | null = null
  let newPath: string | null = null
  let newUrl: string | null = null

  if (changingCrest) {
    const { data, error } = await supabase.from('teams').select('crest_url, dissolved_at').eq('id', teamId).single()
    if (error || data.dissolved_at) return { ok: false, error: 'No se pudo cargar un equipo activo. Recargá la página.' }
    previousUrl = data.crest_url
    if (crest) {
      newPath = `${teamId}/${crypto.randomUUID()}`
      const { error: uploadError } = await bucket.upload(newPath, crest, { contentType: crest.type })
      if (uploadError) {
        console.error(uploadError)
        return { ok: false, error: 'No se pudo subir el escudo. Probá de nuevo.' }
      }
      newUrl = bucket.getPublicUrl(newPath).data.publicUrl
    }
  }

  let update = supabase.from('teams').update({ ...fields, ...(changingCrest ? { crest_url: newUrl } : {}) })
    .eq('id', teamId).is('dissolved_at', null)
  if (changingCrest) {
    update = previousUrl === null ? update.is('crest_url', null) : update.eq('crest_url', previousUrl)
  }
  // select+single detecta también 0 filas: otro capitán, disuelto o un escudo
  // reemplazado desde otra pestaña. RLS decide el permiso de la actualización.
  const { error } = await update.select('id').single()
  if (error) {
    console.error(error)
    if (newPath) {
      const { error: cleanupError } = await bucket.remove([newPath])
      if (cleanupError) console.error('No se pudo retirar la subida del escudo:', cleanupError)
    }
    return { ok: false, error: 'No se pudo guardar el equipo. Recargá la página y probá de nuevo.' }
  }

  const oldPath = changingCrest ? crestObjectPath(previousUrl, supabaseUrl, teamId) : null
  if (oldPath) {
    const { error: cleanupError } = await bucket.remove([oldPath])
    if (cleanupError) {
      console.error('No se pudo retirar el escudo anterior:', cleanupError)
      return { ok: true, cleanupFailed: true }
    }
  }
  return { ok: true, cleanupFailed: false }
}
