'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TournamentCard, Tournament } from './TournamentCard'
import { useFavorites } from '@/hooks/useFavorites'
import { HelpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function FavoritesList() {
  const { favorites, isMounted } = useFavorites()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFavorites() {
      // COMENTARIO: Si no hay favoritos, no hacemos la consulta a la base de datos
      if (!isMounted || favorites.length === 0) {
        setTournaments([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const supabase = createClient()
      
      // COMENTARIO: Obtenemos los torneos que coincidan con los IDs en favoritos
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .in('id', favorites)
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error fetching favorite tournaments:', error)
      } else {
        setTournaments(data || [])
      }
      setIsLoading(false)
    }

    fetchFavorites()
  }, [favorites, isMounted])

  if (!isMounted || isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-brand-lime animate-spin" />
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div className="p-12 border border-brand-border bg-brand-surface text-center flex flex-col items-center justify-center rounded-sm">
        <div className="w-12 h-12 bg-brand-secondary border border-brand-border flex items-center justify-center mb-4">
          <HelpCircle className="w-6 h-6 text-brand-lime" />
        </div>
        <h3 className="text-xl font-bold font-display tracking-wider text-white mb-2 uppercase">
          Aún no tienes torneos favoritos
        </h3>
        <p className="text-white/50 max-w-sm text-xs leading-relaxed mb-6">
          Explorá los torneos disponibles y hacé clic en la estrella para guardarlos en esta lista.
        </p>
        <Link 
          href="/"
          className="px-6 py-2 bg-brand-lime hover:bg-white text-brand-bg text-xs font-bold uppercase tracking-wider rounded-sm transition-colors font-display shadow-sm"
        >
          Explorar Torneos
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tournaments.map((tournament, index) => (
        // COMENTARIO: Reutilizamos el componente TournamentCard para mostrar los torneos favoritos
        <TournamentCard 
          key={tournament.id} 
          tournament={tournament} 
          index={index} 
        />
      ))}
    </div>
  )
}
