import { createClient } from '@/utils/supabase/server'
import { suspendAccount, liftSuspension } from '@/app/admin/(backoffice)/usuarios/actions'
import { SubmitButton } from './SubmitButton'

export async function SuspensionControls({ userId, name }: { userId: string; name: string }) {
  const supabase = await createClient()
  const [{ data, error }, { data: protectedAccount, error: protectedError }] = await Promise.all([
    supabase.from('account_suspensions').select('id,starts_at,ends_at,reason,lifted_at,lift_reason,suspension_active').eq('user_id', userId).order('starts_at', { ascending: false }),
    supabase.rpc('admin_account_protected', { p_user_id: userId }),
  ])
  if (error || protectedError) return <p role="alert">No pudimos cargar las Suspensiones.</p>
  const active = data?.find(row => row.suspension_active)
  const field = 'p-3 bg-brand-bg border border-brand-border rounded-sm'
  return <section className="border border-brand-border rounded-sm p-5 flex flex-col gap-4"><h2 className="text-xl font-semibold">Suspensiones</h2>
    {protectedAccount ? <p>Esta cuenta es administrativa y no se puede suspender desde el panel.</p> : active ? <form action={liftSuspension} className="flex flex-col gap-3"><p className="text-brand-amber">Suspensión vigente: {active.reason}</p><p>{active.ends_at ? `Hasta ${new Date(active.ends_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}` : 'Duración indefinida'}</p><input type="hidden" name="id" value={active.id} /><input type="hidden" name="user_id" value={userId} /><label htmlFor="lift-reason">Motivo para levantarla</label><textarea id="lift-reason" name="reason" required minLength={3} maxLength={500} className={field} /><SubmitButton pendingLabel="Guardando…" className="ui-action w-fit p-3 border border-brand-lime text-brand-lime">Levantar Suspensión</SubmitButton></form> : <form action={suspendAccount} className="flex flex-col gap-3"><input type="hidden" name="user_id" value={userId} /><label htmlFor="suspension-days">Duración</label><select id="suspension-days" name="days" className={field}><option value="7">7 días</option><option value="30">30 días</option><option value="indefinida">Indefinida</option></select><label htmlFor="suspension-reason">Motivo</label><textarea id="suspension-reason" name="reason" required minLength={3} maxLength={500} className={field} /><label className="flex gap-2"><input name="confirm" type="checkbox" required />Confirmo la Suspensión de {name} y sus efectos sobre los Equipos que capitanea.</label><p className="text-sm text-foreground/70">Se cancelarán sus búsquedas y propuestas y caerán sus Partidos futuros sin Falta. Los resultados pendientes se pueden completar. Configurá primero el correo de contacto en Configuración.</p><SubmitButton pendingLabel="Aplicando…" className="ui-action w-fit p-3 border border-brand-red text-brand-red">Aplicar Suspensión</SubmitButton></form>}
    <h3 className="font-semibold">Historial</h3>{!data?.length ? <p>Sin Suspensiones.</p> : <ul className="flex flex-col gap-3">{data.map(row => <li key={row.id} className="border-t border-brand-border pt-3"><p>{row.reason}</p><p className="text-sm text-foreground/70">Desde {new Date(row.starts_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} · {row.lifted_at ? `Levantada: ${row.lift_reason}` : row.ends_at ? `Hasta ${new Date(row.ends_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}` : 'Indefinida'}</p></li>)}</ul>}
  </section>
}
