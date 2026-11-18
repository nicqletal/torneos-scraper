'use client'
import { useActionState } from 'react'
import { changeAdminPassword } from '@/app/admin/(backoffice)/seguridad/actions'
import { SubmitButton } from './SubmitButton'
export function AdminPasswordForm() {
  const [state, action] = useActionState(changeAdminPassword, {})
  return <form action={action} className="flex flex-col gap-3 max-w-lg"><h2 className="font-semibold text-xl">Cambiar contraseña</h2>
    {state.error && <p role="alert" className="text-brand-red">{state.error}</p>}{state.success && <p role="status" className="text-brand-lime">{state.success}</p>}
    {[['current_password', 'Contraseña actual', 'current-password'], ['password', 'Contraseña nueva', 'new-password'], ['repeat', 'Repetir contraseña nueva', 'new-password']].map(([name, label, autocomplete]) => <div key={name} className="flex flex-col gap-2"><label htmlFor={name}>{label}</label><input id={name} name={name} type="password" autoComplete={autocomplete} required minLength={name === 'current_password' ? 1 : 8} maxLength={128} className="p-3 bg-brand-bg border border-brand-border rounded-sm" /></div>)}
    <SubmitButton pendingLabel="Guardando…" className="ui-action w-fit px-4 py-3 bg-brand-lime text-brand-bg rounded-sm">Cambiar contraseña</SubmitButton></form>
}
