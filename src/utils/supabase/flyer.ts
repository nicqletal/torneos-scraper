import type { SupabaseClient } from '@supabase/supabase-js'

// Subida y borrado del flyer, compartidos por el alta, la edición y la baja.
// Usan el cliente del usuario (no la service_role), así que las policies de
// `storage.objects` (supabase/migrations/20260930000007_tournament_flyers.sql)
// deciden: solo el dueño del torneo escribe `flyers/<id del torneo>`.

// Sube el flyer y guarda su URL en el torneo. `upsert` pisa el anterior, así
// que editar con un flyer nuevo reemplaza el objeto en vez de sumar otro.
// Devuelve si salió todo bien.
export async function uploadFlyer(supabase: SupabaseClient, tournamentId: string, file: File) {
  const bucket = supabase.storage.from('flyers')

  const { error: uploadError } = await bucket.upload(tournamentId, file, {
    upsert: true,
    contentType: file.type,
  })
  if (uploadError) {
    console.error(uploadError)
    return false
  }

  // El objeto se llama siempre igual; `?v=` cambia con cada subida para que el
  // navegador y el CDN no sigan mostrando el flyer anterior.
  const { data: { publicUrl } } = bucket.getPublicUrl(tournamentId)
  const { error: updateError } = await supabase
    .from('tournaments')
    .update({ image_url: `${publicUrl}?v=${Date.now()}` })
    .eq('id', tournamentId)

  if (updateError) {
    console.error(updateError)
    return false
  }
  return true
}

// Borra el flyer de un torneo dado de baja. Si no tenía, no pasa nada.
export async function removeFlyer(supabase: SupabaseClient, tournamentId: string) {
  const { error } = await supabase.storage.from('flyers').remove([tournamentId])
  if (error) console.error(error)
}
