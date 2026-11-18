import { createClient } from '@/utils/supabase/server'
import { TournamentCard, Tournament, organizerImages } from './TournamentCard'
import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { PublishTournamentLink } from './PublishTournamentLink'
import { verificationAge } from '@/utils/tournament-verification'
import { ZONE_LABEL_EMBED } from '@/utils/zones'
import { TournamentCatalogControls } from './TournamentCatalogControls'
import { TournamentPagination, tournamentPageHref } from './TournamentPagination'
import { redirect } from 'next/navigation'

const PAGE_SIZES = [12, 24, 48] as const
type PageSize = (typeof PAGE_SIZES)[number]

function positiveInteger(value: string | string[] | undefined, fallback: number) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return fallback
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : fallback
}

interface TournamentListProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function TournamentList({ 
  searchParams 
}: TournamentListProps) {
  const supabase = await createClient()

  const awaitedParams = await searchParams

  const rawPage = awaitedParams.pagina
  const rawPageSize = awaitedParams.por_pagina
  const requestedPage = positiveInteger(awaitedParams.pagina, 1)
  const requestedPageSize = positiveInteger(awaitedParams.por_pagina, 12)
  const pageSize: PageSize = PAGE_SIZES.includes(requestedPageSize as PageSize) ? requestedPageSize as PageSize : 12
  const pageParamIsValid = rawPage === undefined || (typeof rawPage === 'string' && rawPage === String(requestedPage))
  const pageSizeParamIsValid = rawPageSize === undefined || (typeof rawPageSize === 'string' && rawPageSize === String(pageSize))

  const offset = (requestedPage - 1) * pageSize
  const knownOrganizerHandles = Object.keys(organizerImages)
  const makeCountQuery = (status: string | undefined, withOrganizerPhoto: boolean | undefined) => {
    let query = supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'finalizado')
    if (awaitedParams.modality) query = query.eq('sport_modality', awaitedParams.modality as string)
    if (status) query = query.eq('status', status)
    if (withOrganizerPhoto === true) query = query.in('contact_instagram', knownOrganizerHandles)
    if (withOrganizerPhoto === false) query = query.or(`contact_instagram.is.null,contact_instagram.not.in.(${knownOrganizerHandles.join(',')})`)
    return query
  }
  const makeRowsQuery = (status: string | undefined, withOrganizerPhoto: boolean | undefined) => {
    let query = supabase
      .from('tournaments')
      .select(`*, status, inscriptions_count, ${ZONE_LABEL_EMBED}`)
      .neq('status', 'finalizado')
    if (awaitedParams.modality) query = query.eq('sport_modality', awaitedParams.modality as string)
    if (status) query = query.eq('status', status)
    if (withOrganizerPhoto === true) query = query.in('contact_instagram', knownOrganizerHandles)
    if (withOrganizerPhoto === false) query = query.or(`contact_instagram.is.null,contact_instagram.not.in.(${knownOrganizerHandles.join(',')})`)
    return query.order('start_date', { ascending: true }).order('id', { ascending: true })
  }

  // `status` es una columna calculada y PostgREST no puede ordenarla. Primero
  // dividimos por estado y por perfiles de Instagram cuya foto está disponible
  // en la app; así las prioridades se mantienen entre páginas.
  let tournaments: Tournament[] = []
  let total = 0
  let error: { message: string } | null = null
  const selectedStatus = typeof awaitedParams.status === 'string' ? awaitedParams.status : undefined
  const cohorts = selectedStatus
    ? [{ status: selectedStatus, withOrganizerPhoto: true }, { status: selectedStatus, withOrganizerPhoto: false }]
    : [
        { status: 'abierto', withOrganizerPhoto: true },
        { status: 'abierto', withOrganizerPhoto: false },
        { status: undefined, withOrganizerPhoto: true, excludeOpen: true },
        { status: undefined, withOrganizerPhoto: false, excludeOpen: true },
      ]

  const cohortCounts = await Promise.all(cohorts.map(async cohort => {
    let query = makeCountQuery(cohort.status, cohort.withOrganizerPhoto)
    if (cohort.excludeOpen) query = query.neq('status', 'abierto')
    return query
  }))
  error = cohortCounts.find(result => result.error)?.error ?? null
  total = cohortCounts.reduce((sum, result) => sum + (result.count ?? 0), 0)

  let skip = offset
  let remaining = pageSize
  const pageQueries = cohorts.map((cohort, index) => {
    const cohortCount = cohortCounts[index].count ?? 0
    const cohortOffset = Math.min(skip, cohortCount)
    skip -= cohortOffset
    const take = Math.min(remaining, cohortCount - cohortOffset)
    remaining -= take
    return { cohort, cohortOffset, take }
  }).filter(page => page.take > 0)

  const pageResults = await Promise.all(pageQueries.map(async ({ cohort, cohortOffset, take }) => {
    let query = makeRowsQuery(cohort.status, cohort.withOrganizerPhoto)
    if (cohort.excludeOpen) query = query.neq('status', 'abierto')
    return query.range(cohortOffset, cohortOffset + take - 1)
  }))
  error = error ?? pageResults.find(result => result.error)?.error ?? null
  tournaments = pageResults.flatMap(result => (result.data ?? []) as Tournament[])

  if (error) {
    console.error('Error fetching tournaments:', error)
    return (
      <div className="p-8 border border-brand-red/40 bg-brand-red/5 text-center rounded-sm">
        <p className="text-brand-red font-sans text-sm tracking-wider uppercase">
          Hubo un error al cargar los torneos deportivos.
        </p>
      </div>
    )
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, pageCount)
  if (page !== requestedPage || !pageParamIsValid || !pageSizeParamIsValid) {
    redirect(tournamentPageHref({ ...awaitedParams, por_pagina: String(pageSize) }, page))
  }

  const hasActiveFilters = Boolean(awaitedParams.modality || awaitedParams.status)

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="p-8 sm:p-12 border border-brand-border bg-brand-surface text-center flex flex-col items-center justify-center rounded-sm">
        <div className="w-12 h-12 bg-brand-secondary border border-brand-border flex items-center justify-center mb-4">
          <HelpCircle className="w-6 h-6 text-brand-lime" />
        </div>
        <h3 className="text-xl font-bold font-display tracking-wider text-foreground mb-2 uppercase">
          {hasActiveFilters ? 'No hay torneos con estos filtros' : 'Todavía no hay torneos disponibles'}
        </h3>
        <p className="text-foreground/70 max-w-sm text-sm leading-relaxed">
          {hasActiveFilters
            ? 'Probá cambiar la modalidad o el estado de inscripción, o volvé a ver todos los torneos.'
            : 'Cuando haya un torneo vigente, va a aparecer acá. Si organizás uno, podés publicarlo para que lo encuentre tu zona.'}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {hasActiveFilters && (
            <Link href={pageSize === 12 ? '/' : `/?por_pagina=${pageSize}`} className="ui-action press rounded-sm border border-brand-border px-4 text-foreground hover:border-brand-lime hover:text-brand-lime">
              Ver todos los torneos
            </Link>
          )}
          <PublishTournamentLink className="ui-action press rounded-sm bg-brand-lime px-4 text-brand-bg hover:bg-foreground" />
        </div>
      </div>
    )
  }

  // La antigüedad se calcula acá, en el servidor, y la tarjeta (de cliente) la
  // recibe hecha: si la calculara la tarjeta, el "ahora" del servidor y el del
  // navegador podrían no coincidir al hidratar.
  const now = new Date()
  const firstResult = total === 0 ? 0 : offset + 1
  const lastResult = Math.min(offset + pageSize, total)
  const searchParamsForLinks = { ...awaitedParams, por_pagina: String(pageSize) }

  return (
    <>
      <div className="catalog-toolbar grid gap-4 border-b border-brand-border pb-4 xl:col-span-2">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center xl:grid-cols-[1fr_auto_1fr]">
          <p className="text-sm text-foreground/70" aria-live="polite">
            Mostrando {firstResult}–{lastResult} de {total} {total === 1 ? 'torneo' : 'torneos'}
          </p>
          <TournamentCatalogControls pageSize={pageSize} />
          <TournamentPagination page={page} pageCount={pageCount} searchParams={searchParamsForLinks} position="top" />
        </div>
      </div>
      <div className="catalog-results order-3 min-w-0 xl:order-none xl:col-start-2 xl:row-start-2">
        <div className="tournament-grid">
          {tournaments.map((tournament: Tournament, index: number) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              index={index}
              verification={verificationAge(tournament.verified_at, tournament.status, now)}
            />
          ))}
        </div>
        <TournamentPagination page={page} pageCount={pageCount} searchParams={searchParamsForLinks} position="bottom" />
      </div>
    </>
  )
}
