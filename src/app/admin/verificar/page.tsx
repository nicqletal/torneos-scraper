import Link from 'next/link'
import { requireAdminIdentity } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { adminDestination } from '@/utils/admin-access'
import { AdminMfaEnrollment } from '@/components/AdminMfaEnrollment'
import { SubmitButton } from '@/components/SubmitButton'
import { verifyAdminMfa } from './actions'
import { logout } from '@/app/login/actions'

export default async function VerifyAdminPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  await requireAdminIdentity()
  const params = await searchParams, next = adminDestination(params.next)
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  const verified = data?.totp.filter(factor => factor.status === 'verified') ?? []
  return <main className="max-w-lg w-full mx-auto p-6 flex flex-col gap-6">
    <h1 className="font-display text-4xl">Verificá tu acceso administrativo</h1><p>El panel requiere tu contraseña y un código de tu app de autenticación.</p>
    {params.error && <p role="alert" className="p-4 border border-brand-red text-brand-red">{params.error === 'registro' ? 'El código fue verificado, pero no pudimos registrar el acceso. Intentá nuevamente.' : 'El código no es válido o venció. Ingresá el código actual de tu app.'}</p>}
    {error ? <p role="alert">No pudimos consultar tus métodos de acceso. Recargá para volver a intentar.</p> : verified.length ? <form action={verifyAdminMfa} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} /><label htmlFor="factor" className="ui-label">Autenticador</label><select id="factor" name="factor_id" className="p-3 bg-brand-bg border border-brand-border">{verified.map(factor => <option key={factor.id} value={factor.id}>{factor.friendly_name ?? 'App de autenticación'}</option>)}</select>
      <label htmlFor="code" className="ui-label">Código de seis dígitos</label><input id="code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className="p-3 bg-brand-bg border border-brand-border" /><SubmitButton pendingLabel="Verificando…" className="ui-action px-4 py-3 bg-brand-lime text-brand-bg">Verificar y entrar</SubmitButton>
    </form> : <AdminMfaEnrollment next={next} />}
    <p className="text-sm text-foreground/70">Si perdiste tu autenticador, contactá a una persona autorizada del equipo para verificar tu identidad y restablecer el segundo factor.</p>
    <Link href="/" className="text-brand-lime">Volver al sitio</Link><form action={logout}><button className="ui-action text-foreground/70">Cerrar sesión en este dispositivo</button></form>
  </main>
}
