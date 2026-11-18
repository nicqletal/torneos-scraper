'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Star } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { ZONE_LABEL_EMBED } from '@/utils/zones'
import { verificationAge } from '@/utils/tournament-verification'
import { TournamentCard, type Tournament } from '@/components/TournamentCard'
import { TournamentCatalogControls } from '@/components/TournamentCatalogControls'
import { TournamentPagination } from '@/components/TournamentPagination'
import { useFavorites } from '@/hooks/useFavorites'

export default function FavoritesPage() {
  const { ids } = useFavorites()
  const params = useSearchParams()
  const pageSize = [12, 24, 48].includes(Number(params.get('por_pagina'))) ? Number(params.get('por_pagina')) as 12 | 24 | 48 : 12
  const requestedPage = Math.max(1, Number(params.get('pagina')) || 1)
  const [rows, setRows] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    if (!ids.length) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    createClient().from('tournaments').select(`*, status, inscriptions_count, ${ZONE_LABEL_EMBED}`).in('id', ids).then(({ data, error: queryError }) => {
      if (!active) return
      setRows((data ?? []) as Tournament[])
      setError(Boolean(queryError))
      setLoading(false)
    })
    return () => { active = false }
  }, [ids.join('|')])

  const ordered = useMemo(() => {
    const byId = new Map(rows.map((row) => [row.id, row]))
    return ids.flatMap((id) => byId.has(id) ? [byId.get(id)!] : [])
  }, [ids, rows])
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const pageRows = ordered.slice((page - 1) * pageSize, page * pageSize)
  const linkParams = Object.fromEntries(params.entries())

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex items-center gap-3 border-b border-brand-border pb-5">
        <Star aria-hidden="true" className="h-6 w-6 fill-brand-lime text-brand-lime" />
        <div><h1 className="font-display text-4xl uppercase text-foreground">Favoritos</h1><p className="text-sm text-foreground/60">Torneos guardados en este dispositivo.</p></div>
      </header>
      {loading ? <p className="text-sm text-foreground/60">Cargando Favoritos…</p> : error ? <p role="alert">No pudimos cargar tus Favoritos.</p> : ordered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-brand-border bg-brand-surface p-10 text-center">
          <Star aria-hidden="true" className="h-9 w-9 text-foreground/35" />
          <h2 className="font-semibold">Todavía no guardaste Torneos</h2>
          <Link href="/" className="ui-action press rounded-sm bg-brand-lime px-4 text-brand-bg">Volver al catálogo</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 border-b border-brand-border pb-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-foreground/70">Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, ordered.length)} de {ordered.length} Torneos</p>
            <TournamentCatalogControls pageSize={pageSize} />
          </div>
          <TournamentPagination page={page} pageCount={pageCount} searchParams={linkParams} position="top" />
          <div className="tournament-grid">{pageRows.map((tournament, index) => <TournamentCard key={tournament.id} tournament={tournament} index={index} verification={verificationAge(tournament.verified_at, tournament.status, new Date())} />)}</div>
          <TournamentPagination page={page} pageCount={pageCount} searchParams={linkParams} position="bottom" />
        </>
      )}
    </main>
  )
}
