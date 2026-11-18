import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createSupportThread } from './actions'

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/soporte')
  const { data, error } = await supabase.from('support_threads').select('id, subject, closed_at, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(50)
  const params = await searchParams
  return <div className="max-w-4xl mx-auto flex flex-col gap-7">
    <div className="border-b border-brand-border pb-5"><Link href="/ayuda" className="text-brand-lime">Ayuda y contacto</Link><h1 className="font-display text-4xl sm:text-5xl">Soporte</h1><p className="text-foreground/70 mt-2">Escribinos sobre el uso de la plataforma. Las Suspensiones no tienen apelación dentro de la app.</p></div>
    {params.error && <p role="alert" className="p-4 border border-brand-red/40 text-brand-red rounded-sm">No pudimos guardar la consulta. Revisá el asunto y el mensaje.</p>}
    <form action={createSupportThread} className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-4"><h2 className="text-xl font-semibold">Nueva consulta</h2><div className="flex flex-col gap-1"><label htmlFor="support-subject" className="ui-label">Asunto</label><input id="support-subject" name="subject" required minLength={3} maxLength={100} className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm" /></div><div className="flex flex-col gap-1"><label htmlFor="support-body" className="ui-label">Mensaje</label><textarea id="support-body" name="body" required maxLength={2000} rows={5} className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm" /></div><button type="submit" className="ui-action w-fit px-5 py-2.5 bg-brand-lime text-brand-bg rounded-sm">Enviar consulta</button></form>
    <section className="flex flex-col gap-3"><h2 className="text-xl font-semibold">Mis consultas</h2>{error ? <p role="alert" className="text-brand-red">No pudimos cargar tus consultas.</p> : data?.length ? <ul className="flex flex-col gap-3">{data.map(thread => <li key={thread.id}><Link href={`/soporte/${thread.id}`} className="p-4 bg-brand-surface border border-brand-border rounded-sm flex flex-col sm:flex-row sm:justify-between gap-2 hover:border-brand-lime"><span className="font-semibold">{thread.subject}</span><span className="text-sm text-foreground/70">{thread.closed_at ? 'Cerrada' : 'Abierta'} · {new Date(thread.updated_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</span></Link></li>)}</ul> : <p className="p-5 border border-brand-border rounded-sm">Todavía no abriste consultas.</p>}</section>
  </div>
}
