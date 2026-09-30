import { createClient } from '@/utils/supabase/server'
import { TournamentCard, Tournament } from './TournamentCard'
import { Trophy, HelpCircle } from 'lucide-react'

interface TournamentListProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function TournamentList({ 
  searchParams 
}: TournamentListProps) {
  const supabase = await createClient()
  const awaitedParams = await searchParams

  // Pedimos los torneos y también el conteo total para una futura botonera de paginación
  let query = supabase.from('tournaments').select('*', { count: 'exact' })

  // 1. APLICACIÓN DE FILTROS (Combinados con AND)
  if (awaitedParams.modality) {
    query = query.eq('sport_modality', awaitedParams.modality as string)
  }
  
  if (awaitedParams.zone) {
    query = query.eq('zone', awaitedParams.zone as string)
  }

  if (awaitedParams.precio_max) {
    query = query.lte('price', Number(awaitedParams.precio_max))
  }
  
  // 2. REGLA: Excluir finalizados por defecto
  if (awaitedParams.status) {
    query = query.eq('status', awaitedParams.status as string)
  } else {
    query = query.neq('status', 'finalizado')
  }

  // 3. REGLA: Ordenar por fecha de inicio ascendente
  query = query.order('start_date', { ascending: true })

  // 4. REGLA: Paginación de hasta 12 torneos
  const page = Number(awaitedParams.page) || 1
  const limit = 12
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query.range(from, to)

  // Ejecutamos la consulta final
  const { data: tournaments, error, count } = await query

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

  return (
    <div className="flex flex-col gap-8">
      {/* Grilla de Torneos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tournaments.map((tournament: Tournament, index: number) => (
          <TournamentCard 
            key={tournament.id} 
            tournament={tournament} 
            index={index} 
          />
        ))}
      </div>

      {/* Mini-indicador de resultados para la paginación */}
      {count && count > 12 && (
        <div className="text-center text-white/50 text-xs font-mono uppercase tracking-wider">
          Mostrando página {page} - {Math.min(page * limit, count)} de {count} torneos
        </div>
      )}
    </div>
  )
}