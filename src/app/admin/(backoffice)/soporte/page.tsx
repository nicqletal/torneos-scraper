import Link from 'next/link'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ estado?: string; pagina?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const estado = params.estado === 'abierta' || params.estado === 'cerrada' ? params.estado : ''
  const requestedPage = Number(params.pagina ?? '1')
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1
  const supabase = await createClient()
  let query = supabase.from('support_threads').select('id, user_id, subject, closed_at, updated_at', { count: 'exact' })
  if (estado === 'abierta') query = query.is('closed_at', null)
  if (estado === 'cerrada') query = query.not('closed_at', 'is', null)
  const { data, error, count } = await query.order('updated_at', { ascending: false }).order('id').range((page - 1) * 20, page * 20 - 1)
  const userIds = [...new Set((data ?? []).map(thread => thread.user_id))]
  const names = new Map<string, string>()
  if (userIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds)
    for (const profile of profiles ?? []) names.set(profile.id, profile.display_name)
  }
  const pageUrl = (value: number) => `/admin/soporte?${new URLSearchParams({ ...(estado ? { estado } : {}), pagina: String(value) })}`
  return <div className="max-w-5xl flex flex-col gap-7"><div className="border-b border-brand-border pb-6"><p className="text-sm text-brand-lime font-semibold">Panel de administración</p><h1 className="font-display text-4xl sm:text-5xl mt-2">Soporte</h1><p className="text-foreground/70 mt-2">Consultas de usuarios sobre la plataforma.</p></div>
    <nav aria-label="Estado de consultas" className="flex flex-wrap gap-4">{[['', 'Todas'], ['abierta', 'Abiertas'], ['cerrada', 'Cerradas']].map(([value, label]) => <Link key={value} href={value ? `/admin/soporte?estado=${value}` : '/admin/soporte'} aria-current={estado === value ? 'page' : undefined} className={estado === value ? 'text-brand-lime font-semibold' : 'text-foreground/70'}>{label}</Link>)}</nav>
    {error ? <p role="alert" className="text-brand-red">No pudimos cargar las consultas.</p> : <><p className="text-sm text-foreground/60">{count ?? 0} consultas · Página {page}</p>{data?.length ? <ul className="flex flex-col gap-3">{data.map(thread => <li key={thread.id}><Link href={`/admin/soporte/${thread.id}`} className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col sm:flex-row sm:justify-between gap-2 hover:border-brand-lime"><span><span className="block font-semibold">{thread.subject}</span><span className="text-sm text-foreground/60">{names.get(thread.user_id) ?? 'Usuario no disponible'}</span></span><span className="text-sm text-foreground/70">{thread.closed_at ? 'Cerrada' : 'Abierta'} · {new Date(thread.updated_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</span></Link></li>)}</ul> : <p className="p-5 border border-brand-border rounded-sm">No hay consultas para este filtro.</p>}<nav aria-label="Páginas de soporte" className="flex justify-between"><span>{page > 1 && <Link href={pageUrl(page - 1)} className="text-brand-lime">← Anterior</Link>}</span><span>{page * 20 < (count ?? 0) && <Link href={pageUrl(page + 1)} className="text-brand-lime">Siguiente →</Link>}</span></nav></>}
  </div>
}
