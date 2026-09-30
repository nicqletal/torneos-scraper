import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Trash2, Plus, Trophy, MessageCircle } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { TournamentStatus, statusLabels } from '@/utils/tournament-status'

export default async function MisTorneosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/mis-torneos')
  }

  // Fetch only tournaments belonging to this user
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false } as any) // fallback if created_at is present, otherwise just let postgres sort

  async function handleDelete(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
    }

    revalidatePath('/mis-torneos')
    revalidatePath('/')
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-3 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Mis torneos</h1>
          <p className="text-white/60 text-sm mt-1">Gestiona y publica los torneos que organizas</p>
        </div>

        <Link
          href="/crear-torneo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Torneo
        </Link>
      </div>

      {tournaments && tournaments.length > 0 ? (
        <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="divide-y divide-white/10">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-white/5 transition-colors">
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">{tournament.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                    <span>{tournament.zone}</span>
                    <span>•</span>
                    <span className="capitalize">{tournament.sport_modality.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{statusLabels[tournament.status as TournamentStatus]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/torneos/${tournament.id}`}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                    title="Ver página"
                  >
                    <Trophy className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/mis-torneos/${tournament.id}/editar`}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>

                  <form action={handleDelete}>
                    <input type="hidden" name="id" value={tournament.id} />
                    <button
                      type="submit"
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Eliminar"
                      onClick={(e) => {
                        if (!confirm('¿Estás seguro de que quieres eliminar este torneo?')) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-16 border border-dashed border-white/20 bg-white/5 rounded-2xl text-center flex flex-col items-center justify-center">
          <Trophy className="w-12 h-12 text-white/20 mb-4 stroke-1" />
          <h3 className="text-xl font-bold text-white mb-2">Aún no publicaste torneos</h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Comienza a publicar y gestionar tus torneos de fútbol amateur de forma rápida.
          </p>
          <Link
            href="/crear-torneo"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            Publicar mi primer torneo
          </Link>
        </div>
      )}
    </div>
  )
}
