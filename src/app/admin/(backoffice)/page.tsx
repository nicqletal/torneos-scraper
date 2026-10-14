import Link from 'next/link'
import { ShieldCheck, Users, Trophy, ArrowRight } from 'lucide-react'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'

export default async function AdminPage() {
  // Second layer: the middleware already checked, but a direct request
  // (or a cached page) could skip it. This redirect is the real guard.
  await requireAdmin()

  const supabase = await createClient()

  // Counters for the dashboard. All three queries run in parallel.
  const [tournamentsRes, teamsRes, profilesRes] = await Promise.all([
    supabase.from('tournaments').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      label: 'Torneos',
      value: tournamentsRes.error ? 'No disponible' : tournamentsRes.count ?? 'No disponible',
      icon: Trophy,
    },
    {
      label: 'Equipos',
      value: teamsRes.error ? 'No disponible' : teamsRes.count ?? 'No disponible',
      icon: Users,
    },
    {
      label: 'Usuarios',
      value: profilesRes.error ? 'No disponible' : profilesRes.count ?? 'No disponible',
      icon: Users,
    },
  ]

  const sectionClass =
    'p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-3'

  return (
    <div className="max-w-6xl flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-brand-border pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-brand-lime flex items-center justify-center text-brand-bg">
          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-4xl font-display tracking-wider text-foreground uppercase leading-none">
            Resumen de la plataforma
          </h1>
          <p className="text-foreground/70 text-sm mt-1">
            Panel de administración · Torneos Amateur BA
          </p>
        </div>
      </div>
      {[tournamentsRes, teamsRes, profilesRes].some(result => result.error || result.count === null) && (
        <p role="alert" className="p-4 border border-brand-amber/40 bg-brand-amber/5 text-brand-amber text-sm rounded-sm">No pudimos cargar todos los contadores. Recargá la página para volver a intentarlo.</p>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-brand-surface border border-brand-border rounded-sm flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-sm bg-brand-bg border border-brand-border flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-brand-lime" />
            </div>
            <div>
              <p className="text-3xl font-sans font-bold text-foreground tracking-wider leading-none">
                {stat.value}
              </p>
              <p className="text-sm text-foreground/70 font-sans uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Etapas explícitas: no mostrar datos simulados de módulos aún pendientes. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={sectionClass}>
          <h2 className="text-xl font-display tracking-wider text-foreground uppercase flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-lime" />
            Seguridad y acceso
          </h2>
          <p className="text-sm text-foreground/70">
            Tu acceso fue verificado con la sesión de Supabase y el rol asignado en la base. La entrada diferenciada no concede permisos.
          </p>
          <Link href="/admin/seguridad" className="ui-action mt-2 text-brand-lime hover:text-foreground gap-2 w-fit">Ver acceso de mi cuenta <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </div>

        <div className={sectionClass}>
          <h2 className="text-xl font-display tracking-wider text-foreground uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-lime" />
            Próximas etapas
          </h2>
          <p className="text-sm text-foreground/70">
            La sidebar muestra el recorrido del backoffice. Usuarios, contenido, reportes, actividad, soporte, avisos y configuración se implementarán por etapas, con sus reglas y permisos definidos antes de habilitar acciones.
          </p>
          <p className="text-sm text-foreground/60">Las secciones marcadas como pendientes todavía no admiten gestión.</p>
        </div>
      </div>
    </div>
  )
}
