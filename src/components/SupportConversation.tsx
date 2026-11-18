import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { closeSupportThread, sendSupportMessage } from '@/app/soporte/actions'

export async function SupportConversation({ id, currentUserId, admin, error, page = 1 }: { id: string; currentUserId: string; admin: boolean; error?: boolean; page?: number }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: thread, error: threadError } = await supabase.from('support_threads').select('id, user_id, subject, closed_at, created_at').eq('id', id).maybeSingle()
  if (threadError) return <p role="alert" className="text-brand-red">No pudimos cargar la consulta.</p>
  if (!thread) notFound()
  if (!admin && thread.user_id !== currentUserId) notFound()
  const { data: messages, error: messagesError, count } = await supabase.from('support_messages').select('id, author_id, body, created_at', { count: 'exact' }).eq('thread_id', id).order('created_at', { ascending: false }).order('id').range((page - 1) * 50, page * 50 - 1)
  const { data: author } = admin ? await supabase.from('profiles').select('display_name').eq('id', thread.user_id).maybeSingle() : { data: null }
  const destination = admin ? '/admin/soporte' : '/soporte'

  return <div className="max-w-4xl flex flex-col gap-6">
    <Link href={destination} className="ui-action text-brand-lime w-fit">← Volver a Soporte</Link>
    <div className="border-b border-brand-border pb-5"><p className="text-sm text-brand-lime font-semibold">{admin ? 'Panel de administración · Soporte' : 'Soporte'}</p><h1 className="font-display text-4xl mt-2">{thread.subject}</h1><p className="text-foreground/70 mt-2">{thread.closed_at ? 'Cerrada' : 'Abierta'}{admin && author ? ` · ${author.display_name}` : ''}</p></div>
    {admin && <Link href={`/admin/usuarios/${thread.user_id}`} className="ui-action text-brand-lime w-fit">Ver usuario</Link>}
    {error && <p role="alert" className="p-4 border border-brand-red/40 text-brand-red rounded-sm">No pudimos guardar el cambio. Volvé a intentar.</p>}
    {messagesError ? <p role="alert" className="text-brand-red">No pudimos cargar los mensajes.</p> : <ol className="flex flex-col gap-3">{messages?.slice().reverse().map(message => <li key={message.id} className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-2"><div className="flex justify-between gap-3 text-sm"><span className="font-semibold text-brand-lime">{message.author_id === thread.user_id ? admin ? 'Usuario' : 'Vos' : message.author_id === currentUserId ? 'Vos · Administración' : 'Administración'}</span><time dateTime={message.created_at} className="text-foreground/60">{new Date(message.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short' })}</time></div><p className="whitespace-pre-wrap">{message.body}</p></li>)}</ol>}
    {!messagesError && <nav aria-label="Páginas de mensajes" className="flex justify-between"><span>{page > 1 && <Link href={`${destination}/${id}?pagina=${page-1}`} className="text-brand-lime">Mensajes más recientes</Link>}</span>{page * 50 < (count ?? 0) && <Link href={`${destination}/${id}?pagina=${page+1}`} className="text-brand-lime">Mensajes anteriores</Link>}</nav>}
    {!messagesError && (!admin || !thread.closed_at) && <form action={sendSupportMessage} className="p-5 border border-brand-border rounded-sm flex flex-col gap-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="context" value={admin ? 'admin' : 'user'} /><label htmlFor="support-reply" className="ui-label">{thread.closed_at ? 'Responder y reabrir consulta' : 'Nuevo mensaje'}</label><textarea id="support-reply" name="body" required maxLength={2000} rows={5} className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm" /><button type="submit" className="ui-action w-fit px-5 py-2.5 bg-brand-lime text-brand-bg rounded-sm">Enviar mensaje</button></form>}
    {!messagesError && !thread.closed_at && <form action={closeSupportThread}><input type="hidden" name="id" value={id} /><input type="hidden" name="context" value={admin ? 'admin' : 'user'} /><button type="submit" className="ui-action px-4 py-2 border border-brand-border rounded-sm text-foreground/70">Cerrar consulta</button></form>}
  </div>
}
