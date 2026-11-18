import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
export default async function HelpPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('public_site_settings')
  const settings = data?.[0]
  return <main className="max-w-3xl w-full mx-auto flex flex-col gap-6"><h1 className="font-display text-4xl">{settings?.help_title ?? 'Ayuda y contacto'}</h1>{error && <p role="alert">No pudimos cargar los datos de contacto.</p>}{settings?.help_text && <p className="whitespace-pre-wrap">{settings.help_text}</p>}{settings?.support_email && <a className="text-brand-lime" href={`mailto:${settings.support_email}`}>{settings.support_email}</a>}{settings?.help_url?.startsWith('https://') && <a href={settings.help_url} target="_blank" rel="noopener noreferrer" className="text-brand-lime">Abrir enlace de ayuda</a>}<Link href="/soporte" className="ui-action text-brand-lime">Consultar a Soporte</Link><Link href="/" className="text-foreground/70">Volver al catálogo</Link></main>
}
