'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { parseSettings } from '@/utils/admin-forms'
export type SettingsState = { error?: string; success?: string }
export async function saveSettings(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  await requireAdmin()
  const parsed = parseSettings(form)
  if (!parsed.ok) return { error: parsed.error }
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_site_settings', parsed.fields)
  if (error) return { error: error.code === '40001' ? 'Otra persona cambió la configuración. Recargá antes de guardar.' : 'No pudimos guardar la configuración.' }
  revalidatePath('/admin/configuracion')
  revalidatePath('/soporte')
  revalidatePath('/ayuda')
  return { success: 'Configuración guardada. Recargá la página antes de volver a editar.' }
}
