import { createClient } from '@/utils/supabase/server'
import { TournamentCard, Tournament } from './TournamentCard'
import { Trophy, HelpCircle } from 'lucide-react'
import { verificationAge } from '@/utils/tournament-verification'
import { ZONE_LABEL_EMBED } from '@/utils/zones'

interface TournamentListProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function TournamentList({ 
  searchParams 
}: TournamentListProps) {
  const supabase = await createClient()

  const awaitedParams = await searchParams

  // `status` es una columna calculada (función `public.status` en la base):
  // no viene con '*', hay que pedirla. La zona y su corredor vienen de la lista
  // cerrada. Los Finalizados nunca salen en el catálogo.
  let query = supabase
    .from('tournaments')
    .select(`*, status, ${ZONE_LABEL_EMBED}`)
    .neq('status', 'finalizado')

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
      <div className="p-8 border border-red-500/30 bg-red-950/20 text-center rounded-sm">
        <p className="text-red-400 font-display text-sm tracking-wider uppercase">
          Hubo un error al cargar los torneos deportivos.
        </p>
      </div>
    )
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="p-12 border border-brand-border bg-brand-surface text-center flex flex-col items-center justify-center rounded-sm">
        <div className="w-12 h-12 bg-brand-secondary border border-brand-border flex items-center justify-center mb-4">
          <HelpCircle className="w-6 h-6 text-brand-lime" />
        </div>
        <h3 className="text-xl font-bold font-display tracking-wider text-white mb-2 uppercase">
          No hay torneos registrados
        </h3>
        <p className="text-white/50 max-w-sm text-xs leading-relaxed">
          No encontramos torneos que coincidan con tus filtros. Probá cambiando las opciones en el panel lateral o limpiando los filtros de búsqueda.
        </p>
      </div>
    )
  }

  // La antigüedad se calcula acá, en el servidor, y la tarjeta (de cliente) la
  // recibe hecha: si la calculara la tarjeta, el "ahora" del servidor y el del
  // navegador podrían no coincidir al hidratar.
  const now = new Date()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tournaments.map((tournament: Tournament, index: number) => (
        <TournamentCard 
          key={tournament.id} 
          tournament={tournament} 
          index={index} 
          verification={verificationAge(tournament.verified_at, tournament.status, now)}
        />
      ))}
    </div>
  )
}
