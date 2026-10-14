import { requireAdmin } from '@/utils/admin'
import { ShieldCheck, LockKeyhole } from 'lucide-react'

export default async function AdminSecurityPage() {
  // La comprobación también vive junto a los datos, no solo en el layout.
  const user = await requireAdmin()
  return (
    <div className="max-w-4xl flex flex-col gap-8">
      <div className="border-b border-brand-border pb-6 flex flex-col gap-3">
        <p className="text-sm text-brand-lime font-semibold">Panel de administración</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide leading-none">Seguridad y acceso</h1>
        <p className="text-base text-foreground/70">Estado de acceso de tu cuenta y límites de esta etapa.</p>
      </div>
      <section className="p-5 sm:p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-5" aria-labelledby="account-access">
        <h2 id="account-access" className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-brand-lime" aria-hidden="true" />Acceso confirmado</h2>
        <dl className="grid gap-4 text-base">
          <div><dt className="text-sm text-foreground/60">Cuenta actual</dt><dd className="break-all">{user.email ?? 'Sin email'}</dd></div>
          <div><dt className="text-sm text-foreground/60">Rol</dt><dd>Administrador, verificado en el servidor</dd></div>
          <div><dt className="text-sm text-foreground/60">Asignación del rol</dt><dd>Manual en la base. No se puede cambiar desde el perfil ni el formulario de acceso.</dd></div>
        </dl>
      </section>
      <section className="p-5 sm:p-6 border border-brand-border rounded-sm flex flex-col gap-4" aria-labelledby="access-controls">
        <h2 id="access-controls" className="text-xl font-semibold flex items-center gap-2"><LockKeyhole className="w-5 h-5 text-brand-lime" aria-hidden="true" />Controles de esta etapa</h2>
        <ul className="list-disc pl-5 space-y-3 text-base text-foreground/80">
          <li>Autenticación con la misma cuenta de Supabase del sitio.</li>
          <li>Comprobación de sesión y rol antes de mostrar datos del backoffice.</li>
          <li>Acceso denegado cuando la comprobación del rol falla.</li>
          <li>Destino de retorno limitado a rutas internas del backoffice.</li>
          <li>Cerrar sesión afecta solo este dispositivo.</li>
        </ul>
        <p className="text-sm text-foreground/60 border-t border-brand-border pt-4">MFA, gestión de sesiones, permisos granulares, suspensiones y registro de actividad requieren sus propias etapas. Esta pantalla no es una auditoría completa de seguridad.</p>
      </section>
    </div>
  )
}
