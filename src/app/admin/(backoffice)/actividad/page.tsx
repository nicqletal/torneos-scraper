import Link from 'next/link'
import { Search } from 'lucide-react'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { teamSearchPattern } from '@/utils/team-search'

const actions = {
  descartar_reporte: 'Descartó un reporte',
  observar_torneo: 'Marcó Observado',
  baja_torneo: 'Dio de baja un torneo',
  quitar_observado: 'Quitó Observado',
  resolver_reporte_equipo: 'Resolvió un reporte de Equipo',
  suspender_cuenta: 'Suspendió una cuenta',
  levantar_suspension: 'Levantó una Suspensión',
  respuesta_soporte: 'Respondió una consulta de soporte',
  cierre_soporte: 'Cerró una consulta de soporte',
  configuracion_actualizada: 'Actualizó Configuración',
  mfa_verificado: 'Verificó el segundo factor',
  contrasena_actualizada: 'Cambio de contraseña',
  cierre_sesion_solicitado: 'Solicitó cerrar la sesión actual',
  cierre_global_solicitado: 'Solicitó cerrar todas sus sesiones',
} as const

type Params = { accion?: string | string[]; torneo?: string | string[]; pagina?: string | string[] }

function pageUrl(action: string, tournament: string, page: number) {
  const params = new URLSearchParams()
  if (action) params.set('accion', action)
  if (tournament) params.set('torneo', tournament)
  if (page > 1) params.set('pagina', String(page))
  return `/admin/actividad${params.size ? `?${params}` : ''}`
}

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin()
  const raw = await searchParams
  const requestedAction = typeof raw.accion === 'string' ? raw.accion : ''
  const action = Object.hasOwn(actions, requestedAction) ? requestedAction : ''
  const tournament = (typeof raw.torneo === 'string' ? raw.torneo : '').trim().replace(/\s+/g, ' ').slice(0, 100)
  const requestedPage = typeof raw.pagina === 'string' ? Number(raw.pagina) : 1
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1

  const supabase = await createClient()
  let query = supabase.from('admin_actions').select('id, actor_id, action, tournament_id, tournament_name, note, created_at, resource_type, resource_id, resource_label, result, metadata', { count: 'exact' })
  if (action) query = query.eq('action', action)
  if (tournament) query = query.ilike('tournament_name', teamSearchPattern(tournament))
  const { data, error, count } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20 - 1)

  const names = new Map<string, string>()
  const actorIds = [...new Set((data ?? []).map(item => item.actor_id))]
  if (actorIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', actorIds)
    for (const profile of profiles ?? []) names.set(profile.id, profile.display_name)
  }

  return <div className="max-w-6xl flex flex-col gap-7">
    <div className="border-b border-brand-border pb-6"><p className="text-sm text-brand-lime font-semibold">Panel de administración</p><h1 className="font-display text-4xl sm:text-5xl tracking-wide mt-2">Registro de actividad</h1><p className="text-foreground/70 mt-2">Decisiones y cambios administrativos, con su autor y resultado.</p></div>

    <form method="get" className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
      <div className="flex flex-col gap-1"><label htmlFor="activity-action" className="ui-label">Acción</label><select id="activity-action" name="accion" defaultValue={action} className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm"><option value="">Todas</option>{Object.entries(actions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="flex flex-col gap-1"><label htmlFor="activity-tournament" className="ui-label">Torneo</label><input id="activity-tournament" name="torneo" defaultValue={tournament} maxLength={100} placeholder="Buscar por nombre" className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm" /></div>
      <button type="submit" className="ui-action justify-center gap-2 px-4 py-2.5 bg-brand-lime text-brand-bg rounded-sm"><Search className="w-4 h-4" aria-hidden="true" />Aplicar filtros</button>
    </form>

    {error ? <p role="alert" className="p-5 border border-brand-red/40 text-brand-red rounded-sm">No pudimos cargar el registro de actividad. Volvé a intentar.</p> : <>
      <p className="text-sm text-foreground/60">{count ?? 0} acciones · Página {page}</p>
      {data?.length ? <ol className="flex flex-col gap-3">{data.map(item => <li key={item.id} className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"><h2 className="font-semibold text-lg">{actions[item.action as keyof typeof actions] ?? item.action}</h2><time dateTime={item.created_at} className="text-sm text-foreground/60">{new Date(item.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short' })}</time></div>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm"><div><dt className="text-foreground/60">Administrador</dt><dd><Link href={`/admin/usuarios/${item.actor_id}`} className="text-brand-lime hover:underline">{names.get(item.actor_id) ?? 'Cuenta no disponible'}</Link> <span className="text-foreground/50">· {item.actor_id.slice(0, 8)}</span></dd></div><div><dt className="text-foreground/60">Recurso</dt><dd>{item.tournament_id ? <Link href={`/admin/contenido/torneos/${item.tournament_id}`} className="text-brand-lime hover:underline">{item.tournament_name}</Link> : item.resource_label || item.tournament_name || item.resource_type}</dd></div></dl>
        <p>{item.result === 'requested' ? 'Solicitud registrada' : item.result === 'failed' ? 'Falló' : 'Completado'}</p>
        {Object.keys(item.metadata ?? {}).length > 0 && <details><summary>Datos de la decisión</summary><pre className="text-sm whitespace-pre-wrap break-all">{JSON.stringify(item.metadata, null, 2)}</pre></details>}
        {item.note && <div className="text-sm"><span className="text-foreground/60">Motivo: </span><span className="whitespace-pre-wrap">{item.note}</span></div>}
      </li>)}</ol> : <p className="p-6 border border-brand-border rounded-sm text-foreground/70">No hay acciones para estos filtros.</p>}
      <nav aria-label="Páginas del registro" className="flex justify-between gap-3"><span>{page > 1 && <Link href={pageUrl(action, tournament, page - 1)} className="ui-action text-brand-lime">← Anterior</Link>}</span><span>{page * 20 < (count ?? 0) && <Link href={pageUrl(action, tournament, page + 1)} className="ui-action text-brand-lime">Siguiente →</Link>}</span></nav>
    </>}
  </div>
}
