'use client'
import { useActionState } from 'react'
import { enrollAdminMfa, verifyAdminMfa, type EnrollmentState } from '@/app/admin/verificar/actions'
import { SubmitButton } from './SubmitButton'

export function AdminMfaEnrollment({ next }: { next: string }) {
  const [state, action] = useActionState<EnrollmentState, FormData>(enrollAdminMfa, {})
  return <div className="flex flex-col gap-5">
    {state.error && <p role="alert" className="text-brand-red">{state.error}</p>}
    {!state.factorId ? <form action={action}><SubmitButton pendingLabel="Preparando…" className="ui-action px-4 py-3 bg-brand-lime text-brand-bg rounded-sm">Configurar autenticador</SubmitButton></form> : <>
      <p>Escaneá este código con tu app de autenticación. Si perdés el acceso, una persona autorizada deberá verificar tu identidad para restablecerlo.</p>
      {/* QR SVG entregado por Auth para esta configuración. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={state.qr} width={220} height={220} alt="Código QR para configurar tu autenticador" className="bg-foreground p-3 rounded-sm" />
      <details><summary className="cursor-pointer">Ingresar clave manualmente</summary><p className="break-all font-mono py-3 select-all">{state.secret}</p></details>
      <form action={verifyAdminMfa} className="flex flex-col gap-3"><input type="hidden" name="factor_id" value={state.factorId} /><input type="hidden" name="next" value={next} /><label htmlFor="setup-code" className="ui-label">Código de seis dígitos</label><input id="setup-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} className="p-3 bg-brand-bg border border-brand-border rounded-sm" /><SubmitButton pendingLabel="Verificando…" className="ui-action px-4 py-3 bg-brand-lime text-brand-bg rounded-sm">Verificar y entrar</SubmitButton></form>
    </>}
  </div>
}
