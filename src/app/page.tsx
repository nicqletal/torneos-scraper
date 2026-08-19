import { Suspense } from 'react'
import { Filters } from '@/components/Filters'
import { TournamentList } from '@/components/TournamentList'

export default async function Home(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Encontrá tu próximo torneo</h1>
        <p className="text-white/60 text-lg">
          Explorá torneos de fútbol amateur, filtrá por zona y armá tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar de Filtros */}
        <div className="lg:col-span-3 sticky top-24">
          <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
            <Filters />
          </Suspense>
        </div>

        {/* Listado Principal */}
        <div className="lg:col-span-9">
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
              ))}
            </div>
          }>
            <TournamentList searchParams={searchParams || {}} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
