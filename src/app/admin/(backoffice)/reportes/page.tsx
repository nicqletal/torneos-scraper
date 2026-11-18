import Link from 'next/link'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { resolveTournamentReport } from './actions'

const reasons: Record<string, string> = { ya_no_existe: 'Ya no existe', datos_incorrectos: 'Datos incorrectos', no_es_torneo: 'No es un torneo' }

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ vista?: string; pagina?: string; error?: string; ok?: string; warning?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const resolved = params.vista === 'resueltos'
  const requestedPage = Number(params.pagina ?? '1')
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1
  const supabase = await createClient()
  let query = supabase.from('tournament_reports').select('id, tournament_id, tournament_name, reason, detail, created_at, resolution, resolved_at', { count: 'exact' })
  query = resolved ? query.not('resolved_at', 'is', null) : query.is('resolved_at', null)
  const { data, error, count } = await query.order('created_at', { ascending: false }).order('id').range((page - 1) * 20, page * 20 - 1)
  const contexts = new Map<string, { status: string; inscriptions_count: number }>()
  if (!resolved && data) {
    const ids = [...new Set(data.map(report => report.tournament_id).filter((id): id is string => !!id))]
    if (ids.length) {
      const { data: tournaments } = await supabase.from('tournaments').select('id, status, inscriptions_count').in('id', ids)
      for (const tournament of tournaments ?? []) contexts.set(tournament.id, tournament)
    }
  }
  const base = resolved ? '/admin/reportes?vista=resueltos' : '/admin/reportes'
  const pageLink = (value: number) => `${base}${resolved ? '&' : '?'}pagina=${value}`
  return <div className="max-w-5xl flex flex-col gap-7">
    <div className="border-b border-brand-border pb-6"><p className="text-sm text-brand-lime font-semibold">Panel de administración</p><h1 className="font-display text-4xl sm:text-5xl mt-2">Reportes de torneos</h1><p className="text-foreground/70 mt-2">Revisá los reportes y registrá una resolución.</p></div>
    <Link href="/admin/reportes/equipos" className="text-brand-lime">Ver reportes de Equipos</Link>
    <nav aria-label="Estado de reportes" className="flex gap-5"><Link href="/admin/reportes" aria-current={!resolved ? 'page' : undefined} className={!resolved ? 'text-brand-lime font-semibold' : 'text-foreground/70'}>Pendientes</Link><Link href="/admin/reportes?vista=resueltos" aria-current={resolved ? 'page' : undefined} className={resolved ? 'text-brand-lime font-semibold' : 'text-foreground/70'}>Resueltos</Link></nav>
    {params.error && <p role="alert" className="p-4 border border-brand-red/40 text-brand-red rounded-sm">{params.error === 'confirmacion' ? 'Escribí el nombre exacto del torneo para confirmar la baja.' : 'No pudimos resolver el reporte. Volvé a intentar.'}</p>}
    {params.ok === '1' && <p className="p-4 border border-brand-lime/40 rounded-sm">Resolución guardada.</p>}
    {params.warning === 'flyer' && <p role="alert" className="p-4 border border-brand-amber/40 text-brand-amber rounded-sm">El torneo se dio de baja, pero no pudimos retirar su flyer de Storage. Requiere limpieza manual.</p>}
    {error ? <p role="alert" className="text-brand-red">No pudimos cargar los reportes.</p> : <>
      <p className="text-sm text-foreground/60">{count ?? 0} reportes · Página {page}</p>
      {data?.length ? <div className="flex flex-col gap-4">{data.map(report => <article key={report.id} className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-4">
        <div><h2 className="text-xl font-semibold">{report.tournament_name}</h2><p className="text-sm text-foreground/70">{reasons[report.reason] ?? report.reason} · {new Date(report.created_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p></div>
        {report.detail && <p className="text-foreground/80 whitespace-pre-wrap">{report.detail}</p>}
        {report.tournament_id && <Link href={`/admin/contenido/torneos/${report.tournament_id}`} className="ui-action text-brand-lime w-fit">Ver torneo</Link>}
        {resolved ? <p className="text-sm text-foreground/70">Resolución: {report.resolution === 'baja_organizador' ? 'Baja del organizador' : report.resolution} · {report.resolved_at && new Date(report.resolved_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p> : <div className="flex flex-col gap-4 border-t border-brand-border pt-4">
          <div className="flex flex-wrap gap-3">{(['descartado', 'observado'] as const).map(action => <form key={action} action={resolveTournamentReport}><input type="hidden" name="report_id" value={report.id} /><input type="hidden" name="action" value={action} /><button className="ui-action px-4 py-2 border border-brand-border rounded-sm" type="submit">{action === 'descartado' ? 'Descartar este reporte' : 'Marcar Observado y resolver pendientes'}</button></form>)}</div>
          {contexts.get(report.tournament_id ?? '')?.status === 'finalizado' ? <p className="text-sm text-foreground/60">Un torneo Finalizado no admite Baja.</p> : !contexts.get(report.tournament_id ?? '') ? <p className="text-sm text-brand-red">No pudimos confirmar cuántos equipos hay anotados; recargá para intentar la Baja.</p> : <form action={resolveTournamentReport} className="flex flex-col gap-2 max-w-md"><input type="hidden" name="report_id" value={report.id} /><input type="hidden" name="action" value="baja" /><input type="hidden" name="expected_count" value={contexts.get(report.tournament_id ?? '')!.inscriptions_count} /><label htmlFor={`confirm-${report.id}`} className="text-sm">Para dar de baja «{report.tournament_name}», con {contexts.get(report.tournament_id ?? '')!.inscriptions_count} equipos anotados, escribí su nombre. La ficha y sus inscripciones dejarán de existir.</label><input id={`confirm-${report.id}`} name="confirm_name" required className="px-3 py-2 bg-brand-bg border border-brand-border rounded-sm" /><button type="submit" className="ui-action w-fit px-4 py-2 border border-brand-red text-brand-red rounded-sm">Dar de baja y resolver pendientes</button></form>}
        </div>}
      </article>)}</div> : <p className="p-6 border border-brand-border rounded-sm">No hay reportes {resolved ? 'resueltos' : 'pendientes'}.</p>}
      <nav aria-label="Páginas de reportes" className="flex justify-between"><span>{page > 1 && <Link href={pageLink(page - 1)} className="text-brand-lime">← Anterior</Link>}</span><span>{page * 20 < (count ?? 0) && <Link href={pageLink(page + 1)} className="text-brand-lime">Siguiente →</Link>}</span></nav>
    </>}
  </div>
}
