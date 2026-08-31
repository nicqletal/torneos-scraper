import { FavoritesList } from '@/components/FavoritesList'
import { Star } from 'lucide-react'

export const metadata = {
  title: 'Mis Favoritos | Torneos Scraper',
  description: 'Tus torneos de fútbol amateur favoritos.',
}

export default function FavoritosPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Editorial Title Block */}
      <div className="border-b border-brand-border pb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-lime/10 border border-brand-lime/30 rounded-sm flex items-center justify-center">
            <Star className="w-6 h-6 text-brand-lime fill-brand-lime" />
          </div>
          <h1 className="text-5xl md:text-6xl font-display tracking-widest font-bold text-white uppercase leading-none">
            Mis Favoritos
          </h1>
        </div>
        <p className="text-white/60 text-xs md:text-sm tracking-wider uppercase font-mono mt-2">
          Lista de los torneos que guardaste para seguir de cerca
        </p>
      </div>

      <div className="w-full">
        {/* COMENTARIO: Renderizamos la lista de favoritos en el cliente */}
        <FavoritesList />
      </div>
    </div>
  )
}
