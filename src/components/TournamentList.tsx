import { createClient } from '@/utils/supabase/server'
import { TournamentCard, Tournament } from './TournamentCard'

export async function TournamentList({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const supabase = await createClient()

  const awaitedParams = await searchParams

  let query = supabase.from('tournaments').select('*')

  if (awaitedParams.modality) {
    query = query.eq('sport_modality', awaitedParams.modality as string)
  }
  
  if (awaitedParams.status) {
    query = query.eq('status', awaitedParams.status as string)
  }

  // Order by closest start_date first
  query = query.order('start_date', { ascending: true })

  const { data: tournaments, error } = await query

  if (error) {
    console.error('Error fetching tournaments:', error)
    return (
      <div className="p-8 border border-red-500/20 bg-red-500/10 rounded-xl text-center">
        <p className="text-red-400">Hubo un error al cargar los torneos.</p>
      </div>
    )
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="p-12 border border-white/10 bg-white/5 rounded-xl text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🏆</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No hay torneos</h3>
        <p className="text-white/50 max-w-sm">
          No encontramos torneos que coincidan con tus filtros. Probá cambiando las opciones o limpiando la búsqueda.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tournaments.map((tournament: Tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  )
}
