import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { validUuid } from '@/utils/admin-forms'
import { SubmitButton } from '@/components/SubmitButton'
import { resolveTeamReport } from '../actions'

type Review = { captain: { user_id: string; name: string } | null; comments: { match_id: string; stars: number; comment: string; created_at: string }[] }
export default async function TeamReportDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; error?: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!validUuid(id)) notFound()
  const supabase = await createClient(), filter = await searchParams
  const { data: report, error } = await supabase.from('team_reports').select('*').eq('id', id).maybeSingle()
  if (error) return <p role="alert">No pudimos cargar el reporte.</p>
  if (!report) notFound()
  const { data: review, error: reviewError } = report.team_id ? await supabase.rpc('admin_team_review', { p_team_id: report.team_id }) : { data: null, error: null }
  const context = review as Review | null
  const q = typeof filter.q === 'string' ? filter.q.trim().slice(0, 100) : ''
  const { data: users, error: userError } = q.length >= 2 ? await supabase.rpc('admin_search_users', { p_query: q }) : { data: [], error: null }
  return <article className="max-w-4xl flex flex-col gap-6"><Link href="/admin/reportes/equipos" className="text-brand-lime">Volver a reportes de Equipos</Link><h1 className="font-display text-4xl">{report.team_name}</h1><p>{report.reason} · {report.resolution ?? 'Pendiente'}</p><p className="whitespace-pre-wrap">{report.detail ?? 'Sin explicación adicional.'}</p>
    {report.team_id && <Link href={`/equipos/${report.team_id}`} className="text-brand-lime">Ver ficha e historial del Equipo</Link>}
    {reviewError ? <p role="alert">No pudimos cargar los antecedentes privados. Reintentá antes de resolver.</p> : <><p>Capitán actual: {context?.captain?.name ?? 'No disponible'}. No se selecciona automáticamente como responsable.</p><section className="p-5 border border-brand-border rounded-sm"><h2 className="text-xl font-semibold">Comentarios privados recibidos (hasta 50 recientes)</h2>{context?.comments.length ? context.comments.map((row, i) => <p key={`${row.match_id}-${i}`} className="mt-3 whitespace-pre-wrap">{row.stars} estrellas · {row.comment}</p>) : <p>Sin comentarios.</p>}</section></>}
    {filter.error && <p role="alert" className="text-brand-red">No pudimos resolver. Revisá la cuenta, el motivo y si ya tiene una Suspensión vigente. El correo de contacto debe estar configurado.</p>}
    {!report.resolution && !reviewError && <><form action={resolveTeamReport}><input type="hidden" name="report_id" value={id} /><input type="hidden" name="action" value="descartado" /><SubmitButton pendingLabel="Guardando…" className="ui-action p-3 border border-brand-border">Descartar este reporte</SubmitButton></form>
      <section className="flex flex-col gap-4"><h2 className="text-xl font-semibold">Identificar la cuenta responsable</h2><p>Revisá los hechos antes de elegir. La sanción afecta a esa cuenta y a los Equipos que actualmente capitanea; no se traslada automáticamente a un Capitán nuevo.</p><form method="get" className="flex flex-col gap-2"><label htmlFor="q">Buscar por nombre o email</label><input id="q" name="q" defaultValue={q} required minLength={2} maxLength={100} className="p-3 bg-brand-bg border border-brand-border" /><button className="ui-action text-brand-lime">Buscar cuenta</button></form>
      {userError ? <p role="alert">No pudimos buscar cuentas.</p> : users?.length ? <form action={resolveTeamReport} className="flex flex-col gap-4"><input type="hidden" name="report_id" value={id} /><input type="hidden" name="action" value="suspension" />{users.map((user: { user_id: string; display_name: string; email: string }) => <label key={user.user_id} className="flex gap-3 border border-brand-border p-3"><input type="radio" name="user_id" value={user.user_id} required /><span>{user.display_name} · {user.email} · <Link href={`/admin/usuarios/${user.user_id}`} className="text-brand-lime">Ver cuenta</Link></span></label>)}<label htmlFor="days">Duración</label><select id="days" name="days" className="p-3 bg-brand-bg border border-brand-border"><option value="7">7 días</option><option value="30">30 días</option><option value="indefinida">Indefinida</option></select><label htmlFor="reason">Motivo de la sanción y de la identificación del responsable</label><textarea id="reason" name="reason" required minLength={3} maxLength={500} rows={5} className="p-3 bg-brand-bg border border-brand-border" /><label className="flex gap-2"><input type="checkbox" name="confirm" required />Confirmo la cuenta responsable y las consecuencias de su Suspensión.</label><SubmitButton pendingLabel="Aplicando…" className="ui-action p-3 border border-brand-red text-brand-red">Suspender y resolver solo este reporte</SubmitButton></form> : q.length >= 2 && <p>No se encontraron cuentas.</p>}
    </section></>}
  </article>
}
