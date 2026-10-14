import { redirect } from 'next/navigation'

// El catálogo vive en `/`. Esta ruta queda solo para no romper links a
// `/torneos?…`: redirige conservando los filtros.
export default async function TournamentCatalogRedirect({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item)
  }
  redirect(query.size ? `/?${query}` : '/')
}
