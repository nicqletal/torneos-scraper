import Link from 'next/link'
import { Search } from 'lucide-react'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { teamSearchPattern } from '@/utils/team-search'
import { statusLabels, type TournamentStatus } from '@/utils/tournament-status'
import { modalityLabel } from '@/utils/modality'

type Filters = { tab?: string; q?: string; estado?: string; zona?: string; pagina?: string }
const PAGE_SIZE = 20
const tournamentStates = ['abierto', 'cerrado', 'en_curso', 'finalizado'] as const
const teamStates = ['activo', 'disuelto'] as const

function contentUrl(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.tab === 'equipos') params.set('tab', 'equipos')
  if (filters.q) params.set('q', filters.q)
  if (filters.estado) params.set('estado', filters.estado)
  if (filters.zona) params.set('zona', filters.zona)
  if (filters.pagina && filters.pagina !== '1') params.set('pagina', filters.pagina)
  return `/admin/contenido${params.size ? `?${params}` : ''}`
}

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin()
  const raw = await searchParams
  const tab = raw.tab === 'equipos' ? 'equipos' : 'torneos'
  const q = (typeof raw.q === 'string' ? raw.q : '').trim().replace(/\s+/g, ' ').slice(0, 100)
  const requestedState = typeof raw.estado === 'string' ? raw.estado : ''
  const estado = (tab === 'torneos' ? tournamentStates : teamStates).some(s => s === requestedState) ? requestedState : ''
  const requestedZone = typeof raw.zona === 'string' ? raw.zona : ''
  const pageNumber = typeof raw.pagina === 'string' ? Number(raw.pagina) : 1
  const pagina = Number.isSafeInteger(pageNumber) && pageNumber > 0 && pageNumber <= 10000 ? pageNumber : 1
  const supabase = await createClient()
  const zonesResult = await supabase.from('zones').select('id, name').order('name')
  const zona = zonesResult.data?.some(z => z.id === requestedZone) ? requestedZone : ''
  const from = (pagina - 1) * PAGE_SIZE

  const base = { tab, q, estado, zona }
  const result = tab === 'torneos'
    ? await (async () => {
        let query = supabase.from('tournaments').select('id, name, sport_modality, zone_id, status, start_date, zones(name)', { count: 'exact' })
        if (q) query = query.ilike('name', teamSearchPattern(q))
        if (estado) query = query.eq('status', estado)
        if (zona) query = query.eq('zone_id', zona)
        return query.order('created_at', { ascending: false }).order('id').range(from, from + PAGE_SIZE - 1)
      })()
    : await (async () => {
        let query = supabase.from('teams').select('id, name, modality, level, zone_id, dissolved_at, zones(name)', { count: 'exact' })
        if (q) query = query.ilike('name', teamSearchPattern(q))
        if (estado === 'activo') query = query.is('dissolved_at', null)
        if (estado === 'disuelto') query = query.not('dissolved_at', 'is', null)
        if (zona) query = query.eq('zone_id', zona)
        return query.order('created_at', { ascending: false }).order('id').range(from, from + PAGE_SIZE - 1)
      })()

  const total = result.count ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  return <div className="max-w-6xl flex flex-col gap-7">
    <div className="border-b border-brand-border pb-6"><p className="text-sm text-brand-lime font-semibold">Panel de administración</p><h1 className="font-display text-4xl sm:text-5xl tracking-wide mt-2">Torneos y equipos</h1><p className="text-foreground/70 mt-2">Consulta de contenido publicado en la plataforma.</p></div>
    <nav aria-label="Tipo de contenido" className="flex gap-2 border-b border-brand-border">
      {(['torneos', 'equipos'] as const).map(value => <Link key={value} href={contentUrl({ tab: value })} aria-current={tab === value ? 'page' : undefined} className={`px-4 py-3 font-semibold capitalize border-b-2 ${tab === value ? 'border-brand-lime text-brand-lime' : 'border-transparent text-foreground/70 hover:text-foreground'}`}>{value}</Link>)}
    </nav>
    <form method="get" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <input type="hidden" name="tab" value={tab} />
      <div className="flex flex-col gap-1"><label htmlFor="content-q" className="ui-label">Nombre</label><input id="content-q" name="q" defaultValue={q} maxLength={100} placeholder="Buscar por nombre" className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm" /></div>
      <div className="flex flex-col gap-1"><label htmlFor="content-state" className="ui-label">Estado</label><select id="content-state" name="estado" defaultValue={estado} className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm"><option value="">Todos</option>{tab === 'torneos' ? tournamentStates.map(s => <option key={s} value={s}>{statusLabels[s as TournamentStatus]}</option>) : teamStates.map(s => <option key={s} value={s}>{s === 'activo' ? 'Activo' : 'Disuelto'}</option>)}</select></div>
      <div className="flex flex-col gap-1"><label htmlFor="content-zone" className="ui-label">Zona</label><select id="content-zone" name="zona" defaultValue={zona} className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm"><option value="">Todas</option>{zonesResult.data?.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
      <button type="submit" className="ui-action justify-center gap-2 px-4 py-2.5 bg-brand-lime text-brand-bg rounded-sm"><Search className="w-4 h-4" aria-hidden="true" />Aplicar filtros</button>
    </form>
    {zonesResult.error && <p role="alert" className="text-brand-red">No pudimos cargar las zonas.</p>}
    {result.error ? <p role="alert" className="p-6 border border-brand-red/40 text-brand-red rounded-sm">No pudimos cargar el listado. Volvé a intentar.</p> : <>
      <p className="text-sm text-foreground/60">{total} {tab === 'torneos' ? 'torneos' : 'equipos'} · Página {pagina} de {pages}</p>
      {result.data?.length ? <ul className="flex flex-col gap-3">{result.data.map(item => <li key={item.id}><Link href={`/admin/contenido/${tab}/${item.id}`} className="p-4 bg-brand-surface border border-brand-border rounded-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 hover:border-brand-lime"><span className="font-semibold flex-1">{item.name}</span><span className="text-sm text-foreground/70">{(item.zones as unknown as { name: string } | null)?.name ?? 'Sin zona'}</span><span className="text-sm text-foreground/70">{tab === 'torneos' ? modalityLabel('sport_modality' in item ? item.sport_modality : '') : modalityLabel('modality' in item ? item.modality : '')}</span><span className="text-sm text-brand-lime font-semibold">{'status' in item ? statusLabels[item.status as TournamentStatus] : item.dissolved_at ? 'Disuelto' : 'Activo'}</span></Link></li>)}</ul> : <p className="p-6 border border-brand-border rounded-sm text-foreground/70">No hay resultados para estos filtros.</p>}
      <nav aria-label="Páginas" className="flex justify-between gap-3"><span>{pagina > 1 && <Link href={contentUrl({ ...base, pagina: String(pagina - 1) })} className="ui-action text-brand-lime">← Anterior</Link>}</span><span>{pagina < pages && <Link href={contentUrl({ ...base, pagina: String(pagina + 1) })} className="ui-action text-brand-lime">Siguiente →</Link>}</span></nav>
    </>}
  </div>
}
