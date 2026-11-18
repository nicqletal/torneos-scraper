'use client'
import { useActionState, useState } from 'react'
import { saveSettings } from '@/app/admin/(backoffice)/configuracion/actions'
import { SubmitButton } from './SubmitButton'
export type SiteSettings = { support_email: string; help_title: string; help_text: string; help_url: string; updated_at: string }
export function AdminSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState(saveSettings, {})
  const [values, setValues] = useState(settings)
  return <form action={action} className="flex flex-col gap-4">
    {state.error && <p role="alert" className="text-brand-red">{state.error}</p>}{state.success && <p role="status" className="text-brand-lime">{state.success}</p>}
    <input type="hidden" name="updated_at" value={settings.updated_at} />
    <label htmlFor="support_email" className="ui-label">Correo de contacto de soporte</label><input id="support_email" name="support_email" type="email" required maxLength={254} value={values.support_email} onChange={event => setValues({ ...values, support_email: event.target.value })} className="p-3 bg-brand-bg border border-brand-border rounded-sm" />
    <p className="text-sm text-foreground/60">Se muestra en Ayuda y en los Avisos de Suspensión. Configuralo antes de aplicar sanciones.</p>
    <label htmlFor="help_title" className="ui-label">Título de ayuda</label><input id="help_title" name="help_title" required maxLength={100} value={values.help_title} onChange={event => setValues({ ...values, help_title: event.target.value })} className="p-3 bg-brand-bg border border-brand-border rounded-sm" />
    <label htmlFor="help_text" className="ui-label">Texto de ayuda</label><textarea id="help_text" name="help_text" rows={6} maxLength={2000} value={values.help_text} onChange={event => setValues({ ...values, help_text: event.target.value })} className="p-3 bg-brand-bg border border-brand-border rounded-sm" />
    <label htmlFor="help_url" className="ui-label">Enlace de ayuda (opcional, HTTPS)</label><input id="help_url" name="help_url" type="url" maxLength={2048} value={values.help_url} onChange={event => setValues({ ...values, help_url: event.target.value })} className="p-3 bg-brand-bg border border-brand-border rounded-sm" />
    <SubmitButton pendingLabel="Guardando…" className="ui-action w-fit p-3 bg-brand-lime text-brand-bg rounded-sm">Guardar configuración</SubmitButton>
  </form>
}
