'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// Abrir la campanita marca leídos los avisos que se ven. Los ids vienen del
// cliente y no son de confiar: `mark_notices_read` solo toca los propios.
export async function markNoticesRead(ids: string[]) {
  if (ids.length === 0) return

  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_notices_read', { p_ids: ids })

  // Si falla, el aviso sigue como no leído y se marca la próxima vez que se
  // abra la campanita: alcanza con el log.
  if (error) {
    console.error(error)
    return
  }

  // La campanita vive en el layout raíz: así el número rojo queda al día en
  // todas las páginas.
  revalidatePath('/', 'layout')
}
