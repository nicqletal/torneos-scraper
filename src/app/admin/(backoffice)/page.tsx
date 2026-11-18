import Link from 'next/link'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
export default async function AdminPage(){
 await requireAdmin()
 const db=await createClient()
 const [tournaments,teams,users,reports,teamReports,support]=await Promise.all([
 db.from('tournaments').select('id',{count:'exact',head:true}),db.from('teams').select('id',{count:'exact',head:true}),db.from('profiles').select('id',{count:'exact',head:true}),
 db.from('tournament_reports').select('id',{count:'exact',head:true}).is('resolved_at',null),db.from('team_reports').select('id',{count:'exact',head:true}).is('resolved_at',null),db.from('support_threads').select('id',{count:'exact',head:true}).is('closed_at',null)])
 const stats=[['Torneos',tournaments,'/admin/contenido'],['Equipos',teams,'/admin/contenido?tab=equipos'],['Usuarios',users,'/admin/usuarios'],['Reportes de torneos pendientes',reports,'/admin/reportes'],['Reportes de Equipos pendientes',teamReports,'/admin/reportes/equipos'],['Consultas abiertas',support,'/admin/soporte']] as const
 return <div className="max-w-6xl flex flex-col gap-7"><header className="border-b border-brand-border pb-6"><p className="text-brand-lime">Panel de administración · Matchmaking</p><h1 className="font-display text-4xl sm:text-5xl mt-2">Resumen de la plataforma</h1></header><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{stats.map(([label,result,href])=><Link key={label} href={href} className="p-5 bg-brand-surface border border-brand-border rounded-sm hover:border-brand-lime"><span className="block text-3xl font-semibold">{result.error?'No disponible':result.count??'No disponible'}</span><span className="text-foreground/70">{label}</span></Link>)}</div>
 {stats.some(([,result])=>result.error)&&<p role="alert" className="text-brand-amber">No pudimos cargar todos los contadores. Recargá para intentar de nuevo.</p>}
 <section className="p-5 border border-brand-border rounded-sm"><h2 className="font-semibold text-xl">Operación diaria</h2><p className="text-foreground/70 my-3">Atendé los reportes y consultas pendientes. Cada resolución y cambio administrativo queda en el registro de actividad.</p><div className="flex flex-wrap gap-5"><Link href="/admin/actividad" className="text-brand-lime">Registro de actividad</Link><Link href="/admin/avisos" className="text-brand-lime">Avisos</Link><Link href="/admin/seguridad" className="text-brand-lime">Seguridad y acceso</Link><Link href="/admin/configuracion" className="text-brand-lime">Configuración</Link></div></section></div>
}
