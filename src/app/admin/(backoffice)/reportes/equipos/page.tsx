import Link from 'next/link'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
export default async function TeamReportsPage({ searchParams }: { searchParams: Promise<{ vista?: string; pagina?: string; ok?: string }> }) {
  await requireAdmin()
  const params = await searchParams, resolved = params.vista === 'resueltos'
  const n = Number(params.pagina), page = Number.isSafeInteger(n) && n > 0 && n <= 10000 ? n : 1
  const supabase = await createClient()
  let query = supabase.from('team_reports').select('id,team_name,reason,created_at,resolution', { count: 'exact' })
  query = resolved ? query.not('resolved_at', 'is', null) : query.is('resolved_at', null)
  const { data, error, count } = await query.order('created_at', { ascending: false }).order('id').range((page - 1) * 20, page * 20 - 1)
  const href = (p: number, closed = resolved) => `/admin/reportes/equipos?${new URLSearchParams({ pagina: String(p), vista: closed ? 'resueltos' : 'pendientes' })}`
  const labels: Record<string, string> = { violencia: 'Violencia o agresiones', cuenta_falsa: 'Cuenta falsa', abuso_calificaciones: 'Abuso de calificaciones' }
  return <div className="max-w-5xl flex flex-col gap-6"><h1 className="font-display text-4xl">Reportes de Equipos</h1><nav className="flex gap-5"><Link href="/admin/reportes" className="text-brand-lime">Torneos</Link><Link href={href(1, false)} className="text-brand-lime">Equipos pendientes</Link><Link href={href(1, true)} className="text-brand-lime">Equipos resueltos</Link></nav>
    {params.ok && <p role="status">Resolución guardada.</p>}{error ? <p role="alert">No pudimos cargar los reportes.</p> : <><p>{count ?? 0} reportes · Página {page}</p>{data?.length ? <ul className="flex flex-col gap-3">{data.map(row => <li key={row.id} className="p-5 border border-brand-border rounded-sm"><Link href={`/admin/reportes/equipos/${row.id}`} className="text-brand-lime font-semibold">{row.team_name}</Link><p>{labels[row.reason]} · {row.resolution ?? 'Pendiente'}</p></li>)}</ul> : <p>No hay reportes para esta vista.</p>}<nav aria-label="Páginas de reportes de Equipos" className="flex justify-between"><span>{page > 1 && <Link href={href(page - 1)}>Anterior</Link>}</span>{page * 20 < (count ?? 0) && <Link href={href(page + 1)}>Siguiente</Link>}</nav></>}
  </div>
}
