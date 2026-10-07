import { Shield, Users, Trophy, Flag, Search } from 'lucide-react'
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
      value: tournamentsRes.count ?? 0,
      icon: Trophy,
    },
    {
      label: 'Equipos',
      value: teamsRes.count ?? 0,
      icon: Users,
    },
    {
      label: 'Usuarios',
      value: profilesRes.count ?? 0,
      icon: Users,
    },
  ]

  const sectionClass =
    'p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-3'

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-brand-border pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-brand-lime flex items-center justify-center text-brand-bg">
          <Shield className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-4xl font-display tracking-wider text-white uppercase leading-none">
            Administración
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Panel de control del sitio
          </p>
        </div>
      </div>

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
              <p className="text-3xl font-display font-bold text-white tracking-wider leading-none">
                {stat.value}
              </p>
              <p className="text-sm text-white/50 font-mono uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder sections for future features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={sectionClass}>
          <h2 className="text-xl font-display tracking-wider text-white uppercase flex items-center gap-2">
            <Flag className="w-5 h-5 text-brand-lime" />
            Reportes pendientes
          </h2>
          <p className="text-sm text-white/50">
            Acá van a aparecer los reportes de torneos y equipos que necesiten revisión.
          </p>
          <div className="mt-2 py-8 border border-dashed border-brand-border rounded-sm flex items-center justify-center">
            <span className="text-white/30 text-sm font-mono uppercase tracking-wider">
              Sin reportes pendientes
            </span>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-xl font-display tracking-wider text-white uppercase flex items-center gap-2">
            <Search className="w-5 h-5 text-brand-lime" />
            Buscar usuario
          </h2>
          <p className="text-sm text-white/50">
            Buscá por nombre o email para ver el perfil completo de un usuario.
          </p>
          <div className="mt-2 py-8 border border-dashed border-brand-border rounded-sm flex items-center justify-center">
            <span className="text-white/30 text-sm font-mono uppercase tracking-wider">
              Próximamente
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
