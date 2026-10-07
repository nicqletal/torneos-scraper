import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Trophy, Edit, Trash2 } from 'lucide-react'

/**
 * Página de panel para usuarios autenticados.
 * Muestra los torneos que el usuario creó y estadísticas básicas.
 * No requiere rol de admin – cualquier usuario con sesión puede verla.
 *
 * Reglas de negocio (docs/decisiones-casos-de-uso.md):
 * - El creador del torneo puede editar y eliminar sus propios torneos.
 * - Los demás usuarios sólo ven la ficha pública.
 */
export default async function PanelPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si no hay sesión, redirigir al login conservando la ruta original.
  if (!user) {
    redirect('/login?next=/panel')
  }

  // Traer los torneos del usuario (organizador = user.id)
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, title, sport_modality, start_date, status, price')
    .eq('organizer_id', user.id)

  if (error) {
    // En caso de error, redirigir al home con mensaje genérico.
    console.error('Error fetching user tournaments:', error)
    redirect('/')
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-brand-border pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-brand-lime flex items-center justify-center text-brand-bg">
          <Trophy className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-4xl font-display tracking-wider text-white uppercase leading-none">
            Mi panel
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Gestioná los torneos que publicaste y ve estadísticas básicas.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col items-center">
          <p className="text-3xl font-display font-bold text-white tracking-wider">
            {tournaments?.length ?? 0}
          </p>
          <p className="text-sm text-white/50 uppercase tracking-wider mt-0.5">Torneos creados</p>
        </div>
        {/* Podés añadir más tarjetas de estadística aquí (ej. inscripciones totales) */}
      </div>

      {/* Lista de torneos */}
      <div className="flex flex-col gap-4">
        {tournaments?.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-brand-surface border border-brand-border rounded-sm flex justify-between items-center"
          >
            <div>
              <h2 className="text-xl font-display text-white">{t.title}</h2>
              <p className="text-sm text-white/60">{t.sport_modality} • {new Date(t.start_date).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/editar-torneo/${t.id}`}
                className="inline-flex items-center gap-1.5 text-brand-lime hover:text-white transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Link>
              {/* Placeholder para eliminar – implementar later */}
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-brand-red hover:text-white transition-colors"
                // onClick={() => handleDelete(t.id)} // TODO: Implement delete action
              >
                <Trash2 className="w-4 h-4" />
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
