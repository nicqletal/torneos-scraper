import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { SubmitButton } from '@/components/SubmitButton'
import { adminDestination, adminAccessError } from '@/utils/admin-access'
import { loginAsAdmin } from './actions'

export default async function AdminLoginPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const next = adminDestination(params.next)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let error = adminAccessError(params.error)
  if (user) {
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')
    if (!roleError && isAdmin === true) redirect(next)
    error ??= adminAccessError(roleError ? 'unavailable' : 'denied')
  }
  const fieldClass = 'ui-input w-full px-3 py-3 bg-brand-bg border border-brand-border rounded-sm focus:border-brand-lime'
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <Link href="/login" className="ui-action inline-flex items-center gap-2 text-foreground/70 hover:text-brand-lime w-fit"><ArrowLeft className="w-4 h-4" aria-hidden="true" />Volver al acceso</Link>
      <div className="flex flex-col gap-3 border-b border-brand-border pb-5">
        <ShieldCheck className="w-10 h-10 text-brand-lime" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-lime">Equipo de Torneos Amateur BA</p>
        <h1 className="font-display text-5xl tracking-wide leading-none">Acceso de administrador</h1>
        <p className="text-base text-foreground/70">Ingresá con una cuenta que tenga el rol de administrador asignado. Este acceso no habilita permisos nuevos.</p>
      </div>
      {error && <p role="alert" className="p-4 border border-brand-red/40 bg-brand-red/5 rounded-sm text-brand-red text-sm">{error}</p>}
      <form action={loginAsAdmin} className="p-5 sm:p-6 flex flex-col gap-4 bg-brand-surface border border-brand-border rounded-sm">
        <input type="hidden" name="next" value={next} />
        <div className="flex flex-col gap-2"><label htmlFor="admin-email" className="ui-label">Email</label><input id="admin-email" name="email" type="email" autoComplete="username" required className={fieldClass} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="admin-password" className="ui-label">Contraseña</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required className={fieldClass} /></div>
        <SubmitButton pendingLabel="Verificando acceso…" className="ui-action press w-full justify-center gap-2 py-3 bg-brand-lime hover:bg-foreground text-brand-bg rounded-sm"><ShieldCheck className="w-4 h-4" aria-hidden="true" />Ingresar como administrador</SubmitButton>
      </form>
      <p className="text-sm text-foreground/60">Las cuentas se registran desde el acceso general. El rol se asigna manualmente en la base por una persona autorizada.</p>
      {user && <Link href="/torneos" className="ui-action text-brand-lime hover:text-foreground w-fit">Continuar en el catálogo con mi cuenta</Link>}
    </div>
  )
}
