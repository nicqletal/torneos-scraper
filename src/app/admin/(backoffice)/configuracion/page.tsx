import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { AdminSettingsForm } from '@/components/AdminSettingsForm'
export default async function AdminSettingsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from('site_settings').select('support_email,help_title,help_text,help_url,updated_at').eq('id', true).single()
  return <div className="max-w-3xl flex flex-col gap-6"><div className="border-b border-brand-border pb-5"><p className="text-brand-lime">Panel de administración</p><h1 className="font-display text-4xl mt-2">Configuración</h1><p className="text-foreground/70 mt-2">Contacto y ayuda de la plataforma.</p></div>{error || !data ? <p role="alert">No pudimos cargar la configuración. Volvé a intentar.</p> : <AdminSettingsForm settings={data} />}</div>
}
