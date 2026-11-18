import { Suspense } from 'react'
import { Filters } from '@/components/Filters'
import { TournamentList } from '@/components/TournamentList'
import { PublishTournamentLink } from '@/components/PublishTournamentLink'
import Link from 'next/link'
import { ArrowUpRight, Megaphone } from 'lucide-react'
import { PromotionNotice } from '@/components/PromotionNotice'
import { createClient } from '@/utils/supabase/server'

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

      <Link href="/mis-torneos?promocionar=1" className="group flex flex-col gap-4 border border-brand-lime/40 bg-brand-lime/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 hover:border-brand-lime transition-colors focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2">
        <div className="flex items-start gap-3">
          <Megaphone aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-brand-lime" />
          <div>
            <p className="font-display text-2xl uppercase tracking-wide text-foreground">Tu torneo merece un lugar destacado</p>
            <p className="mt-1 text-sm text-foreground/70">Conocé cómo se vería con promoción. Vista previa para organizadores.</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 font-display text-lg uppercase tracking-wide text-brand-lime">
          Promocioná tu torneo <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
        </span>
      </Link>

      <div className="catalog-layout flex min-w-0 flex-col gap-5">
        <Suspense fallback={<div className="h-20 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />}>
          <Filters />
        </Suspense>

        <Suspense fallback={
          <>
            <div className="catalog-toolbar h-16 animate-pulse border-b border-brand-border" />
            <div className="catalog-results">
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

      </div>

      {/* Captación de organizadores: al pie del catálogo, no en la barra */}
      <div className="border-t border-brand-border pt-6 flex justify-center">
        <PublishTournamentLink className="text-sm text-foreground/60 hover:text-brand-lime transition-colors" />
      </div>
      <Suspense fallback={null}><OrganizerPromotionNotice /></Suspense>
    </div>
  )
}

async function OrganizerPromotionNotice() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('tournaments').select('id').eq('user_id', user.id).neq('status', 'finalizado').order('start_date').limit(1).maybeSingle()
  if (!data) return null
  return <PromotionNotice userId={user.id} tournamentId={data.id} />
}
