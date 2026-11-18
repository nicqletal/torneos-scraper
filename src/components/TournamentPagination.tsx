import Link from 'next/link'

type SearchParams = Record<string, string | string[] | undefined>

export function tournamentPageHref(searchParams: SearchParams, page: number) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'pagina' || key === 'page') continue
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item)
    }
  }
  if (page > 1) params.set('pagina', String(page))
  const query = params.toString()
  return query ? `/?${query}` : '/'
}

function visiblePages(currentPage: number, pageCount: number) {
  const candidates = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1])
  return [...candidates].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b)
}

export function TournamentPagination({ page, pageCount, searchParams, position }: {
  page: number
  pageCount: number
  searchParams: SearchParams
  position: 'top' | 'bottom'
}) {
  if (pageCount <= 1) return null

  const pages = visiblePages(page, pageCount)
  let previous = 0

  return (
    <nav aria-label={`Paginación de torneos${position === 'bottom' ? ', final' : ''}`} className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={tournamentPageHref(searchParams, page - 1)} scroll={false} className="ui-action press rounded-sm border border-brand-border px-3 text-sm text-foreground hover:border-brand-lime hover:text-brand-lime">
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className="ui-action rounded-sm border border-brand-border/60 px-3 text-sm text-foreground/35">Anterior</span>
      )}

      {pages.map((number) => {
        const gap = number - previous
        const link = number === page ? (
          <span key={number} aria-current="page" aria-label={`Página ${number}, actual`} className="ui-action min-w-11 justify-center rounded-sm border border-brand-lime bg-brand-lime px-3 text-sm font-bold text-brand-bg">
            {number}
          </span>
        ) : (
          <Link key={number} href={tournamentPageHref(searchParams, number)} scroll={false} aria-label={`Página ${number}`} className="ui-action press min-w-11 justify-center rounded-sm border border-brand-border px-3 text-sm text-foreground hover:border-brand-lime hover:text-brand-lime">
            {number}
          </Link>
        )

        const gapMarker = gap > 1 ? <span key={`gap-${number}`} aria-hidden="true" className="px-1 text-foreground/50">…</span> : null
        previous = number
        return <span key={`page-${number}`} className="contents">{gapMarker}{link}</span>
      })}

      {page < pageCount ? (
        <Link href={tournamentPageHref(searchParams, page + 1)} scroll={false} className="ui-action press rounded-sm border border-brand-border px-3 text-sm text-foreground hover:border-brand-lime hover:text-brand-lime">
          Siguiente
        </Link>
      ) : (
        <span aria-disabled="true" className="ui-action rounded-sm border border-brand-border/60 px-3 text-sm text-foreground/35">Siguiente</span>
      )}
    </nav>
  )
}
