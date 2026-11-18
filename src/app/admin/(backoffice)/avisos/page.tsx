import Link from 'next/link'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { noticeText, noticeLink, type NoticeKind } from '@/utils/notices'
import { teamSearchPattern } from '@/utils/team-search'
export default async function AdminNotices({ searchParams }: { searchParams: Promise<{ destinatario?: string; estado?: string; pagina?: string }> }) {
 await requireAdmin()
 const p=await searchParams, recipient=String(p.destinatario??'').trim().slice(0,100), state=['leido','sin_leer'].includes(String(p.estado))?p.estado:''
 const n=Number(p.pagina), page=Number.isSafeInteger(n)&&n>0&&n<=10000?n:1
 const db=await createClient()
 let ids:string[]|null=null, lookupError=false
 if(recipient){const {data,error}=await db.from('profiles').select('id').ilike('display_name',teamSearchPattern(recipient));ids=data?.map(row=>row.id)??[];lookupError=!!error}
 let query=db.from('notices').select('id,user_id,kind,params,created_at,read_at',{count:'exact'})
 if(ids)query=query.in('user_id',ids.length?ids:['00000000-0000-0000-0000-000000000000'])
 if(state==='leido')query=query.not('read_at','is',null)
 if(state==='sin_leer')query=query.is('read_at',null)
 const {data,error,count}=lookupError?{data:null,error:true,count:null}:await query.order('created_at',{ascending:false}).order('id').range((page-1)*20,page*20-1)
 const names=new Map<string,string>()
 const userIds=[...new Set((data??[]).map(row=>row.user_id))]
 if(userIds.length){const {data:profiles}=await db.from('profiles').select('id,display_name').in('id',userIds);for(const u of profiles??[])names.set(u.id,u.display_name)}
 const href=(value:number)=>`/admin/avisos?${new URLSearchParams({destinatario:recipient,estado:state??'',pagina:String(value)})}`
 return <div className="max-w-5xl flex flex-col gap-6"><h1 className="font-display text-4xl">Avisos</h1><p>Avisos automáticos de la plataforma y su estado de lectura.</p><form method="get" className="flex flex-wrap gap-3"><label>Destinatario<input name="destinatario" defaultValue={recipient} maxLength={100} className="block p-3 bg-brand-bg border border-brand-border" /></label><label>Lectura<select name="estado" defaultValue={state} className="block p-3 bg-brand-bg border border-brand-border"><option value="">Todos</option><option value="leido">Leídos</option><option value="sin_leer">Sin leer</option></select></label><button className="ui-action p-3 text-brand-lime">Aplicar filtros</button></form>
 {error?<p role="alert">No pudimos cargar los Avisos.</p>:<><p>{count??0} Avisos · Página {page}</p>{data?.length?<ul className="flex flex-col gap-3">{data.map(row=><li key={row.id} className="p-5 border border-brand-border rounded-sm flex flex-col gap-2"><Link href={`/admin/usuarios/${row.user_id}`} className="text-brand-lime">{names.get(row.user_id)??'Usuario no disponible'}</Link><p>{noticeText(row.kind as NoticeKind,row.params)}</p><p className="text-sm text-foreground/70">{new Date(row.created_at).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})} · {row.read_at?'Leído':'Sin leer'}</p><Link href={noticeLink(row.kind as NoticeKind,row.params)} className="text-brand-lime">Abrir destino del Aviso</Link></li>)}</ul>:<p>No hay Avisos para estos filtros.</p>}<nav aria-label="Páginas de Avisos" className="flex justify-between"><span>{page>1&&<Link href={href(page-1)}>Anterior</Link>}</span>{page*20<(count??0)&&<Link href={href(page+1)}>Siguiente</Link>}</nav></>}
 </div>
}