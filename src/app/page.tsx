import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { entryDestination, GUEST_COOKIE, type CatalogParams } from '@/utils/entry-navigation'

export default async function Home({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  const supabase = await createClient()
  const [{ data: { user } }, cookieStore, params] = await Promise.all([
    supabase.auth.getUser(), cookies(), searchParams,
  ])
  redirect(entryDestination(Boolean(user), cookieStore.get(GUEST_COOKIE)?.value, params))
}
