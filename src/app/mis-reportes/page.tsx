import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const reasons: Record<string, string> = { ya_no_existe: 'Ya no existe', datos_incorrectos: 'Datos incorrectos', no_es_torneo: 'No es un torneo' }

export default async function MyReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/mis-reportes')
  const { data, error } = await supabase.from('tournament_reports').select('id, tournament_id, tournament_name, reason, detail, created_at, resolution').eq('reporter_id', user.id).order('created_at', { ascending: false }).limit(50)
  return <div className="max-w-3xl mx-auto flex flex-col gap-6"><h1 className="font-display text-4xl">Mis reportes</h1><p className="text-foreground/70">Reportes que hiciste sobre torneos.</p>
    {error ? <p role="alert" className="text-brand-red">No pudimos cargar tus reportes.</p> : data?.length ? <ul className="flex flex-col gap-3">{data.map(report => <li key={report.id} className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-2"><h2 className="text-xl font-semibold">{report.tournament_name}</h2><p className="text-sm text-foreground/70">{reasons[report.reason] ?? report.reason} · {new Date(report.created_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>{report.detail && <p className="whitespace-pre-wrap">{report.detail}</p>}<p className="text-sm text-brand-lime">{report.resolution ? report.resolution === 'baja_organizador' ? 'El organizador dio de baja el torneo' : `Resuelto: ${report.resolution}` : 'Pendiente'}</p>{report.tournament_id && <Link href={`/torneos/${report.tournament_id}`} className="ui-action text-brand-lime w-fit">Ver torneo</Link>}</li>)}</ul> : <p className="p-5 border border-brand-border rounded-sm">Todavía no hiciste reportes.</p>}
  </div>
}
