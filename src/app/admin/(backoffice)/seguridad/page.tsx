import { requireAdmin } from '@/utils/admin'
import { AdminPasswordForm } from '@/components/AdminPasswordForm'
import { SubmitButton } from '@/components/SubmitButton'
import { closeAdminSession } from './actions'
export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
 const user = await requireAdmin(), { error } = await searchParams
 return <div className="max-w-4xl flex flex-col gap-7"><div className="border-b border-brand-border pb-6"><p className="text-brand-lime">Panel de administración</p><h1 className="font-display text-4xl mt-2">Seguridad y acceso</h1></div>
 {error && <p role="alert" className="p-4 border border-brand-red text-brand-red">{error === 'confirmacion' ? 'Confirmá el cierre de todas tus sesiones.' : 'No pudimos completar la operación. Tu sesión no se dio por cerrada. Reintentá.'}</p>}
 <section className="p-5 bg-brand-surface border border-brand-border rounded-sm"><h2 className="font-semibold text-xl">Acceso verificado en dos pasos</h2><p className="mt-2 break-all">{user.email}</p><p className="text-foreground/70 mt-2">Rol y segundo factor comprobados. Si perdés el autenticador, una persona autorizada deberá verificar tu identidad para restablecerlo. Los roles se asignan manualmente.</p></section>
 <section className="p-5 border border-brand-border rounded-sm"><AdminPasswordForm /></section>
 <section className="p-5 border border-brand-border rounded-sm flex flex-col gap-5"><h2 className="font-semibold text-xl">Tus sesiones</h2><form action={closeAdminSession}><input type="hidden" name="scope" value="local" /><SubmitButton pendingLabel="Cerrando…" className="ui-action px-4 py-3 border border-brand-border">Cerrar sesión en este dispositivo</SubmitButton></form>
 <form action={closeAdminSession} className="flex flex-col gap-3"><input type="hidden" name="scope" value="global" /><label className="flex gap-3 items-start"><input name="confirm" type="checkbox" required className="mt-1" />Entiendo que tendré que ingresar nuevamente en todos mis dispositivos.</label><SubmitButton pendingLabel="Cerrando sesiones…" className="ui-action w-fit px-4 py-3 border border-brand-red text-brand-red">Cerrar todas las sesiones de mi cuenta</SubmitButton></form>
 <p className="text-sm text-foreground/60">El cierre impide renovar las sesiones. Un acceso ya emitido en otro dispositivo puede seguir vigente hasta su vencimiento.</p></section></div>
}