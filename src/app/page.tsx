import { Suspense } from 'react'
import { Filters } from '@/components/Filters'
import { TournamentList } from '@/components/TournamentList'
import { PublishTournamentLink } from '@/components/PublishTournamentLink'

interface HomeProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col gap-8">
      
      {/* Editorial Title Block */}
      <div className="border-b border-brand-border pb-6 flex flex-col gap-2">
        <h1 className="text-5xl md:text-6xl font-display tracking-widest font-bold text-foreground uppercase leading-none">
          Encontrá tu próximo torneo
        </h1>
        <p className="text-foreground/60 text-xs md:text-sm tracking-wider uppercase font-mono flex items-center gap-2">
          <span className="w-2 h-2 bg-brand-lime animate-pulse rounded-full" />
          Explorá torneos de fútbol amateur • Filtrá por zona • Armá tu plantel
        </p>
      </div>

      <div className="catalog-layout grid grid-cols-1 items-start gap-5 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-8">
        <Suspense fallback={
          <>
            <div className="catalog-toolbar h-16 animate-pulse border-b border-brand-border xl:col-span-2" />
            <div className="catalog-results order-3 xl:order-none xl:col-start-2 xl:row-start-2">
              <div className="tournament-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="tournament-card-skeleton bg-brand-surface border border-brand-border animate-pulse rounded-sm"
                />
              ))}
              </div>
            </div>
          </>
        }>
          <TournamentList searchParams={searchParams || {}} />
        </Suspense>

        <div className="order-2 xl:sticky xl:top-24 xl:order-none xl:col-start-1 xl:row-start-2">
          <Suspense fallback={<div className="h-11 rounded-sm border border-brand-border bg-brand-surface animate-pulse xl:h-28" />}>
            <Filters />
          </Suspense>
        </div>

      </div>

      {/* Captación de organizadores: al pie del catálogo, no en la barra */}
      <div className="border-t border-brand-border pt-6 flex justify-center">
        <PublishTournamentLink className="text-sm text-foreground/60 hover:text-brand-lime transition-colors" />
      </div>
    </div>
  )
}
