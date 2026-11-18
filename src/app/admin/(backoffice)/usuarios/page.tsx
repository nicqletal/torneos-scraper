import Link from 'next/link'
import { Search, Users } from 'lucide-react'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { AdminUserAvatar } from '@/components/AdminUserAvatar'

type AdminUserResult = { user_id: string; display_name: string; avatar_url: string | null; zone_name: string | null; email: string }

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  await requireAdmin()
  const raw = (await searchParams).q
  const query = (typeof raw === 'string' ? raw : '').trim().slice(0, 100)
  const searched = query.length >= 2
  const supabase = await createClient()
  const result = searched ? await supabase.rpc('admin_search_users', { p_query: query }) : null

  return <div className="max-w-5xl flex flex-col gap-8">
    <div className="border-b border-brand-border pb-6">
      <p className="text-sm text-brand-lime font-semibold">Panel de administración</p>
      <h1 className="font-display text-4xl sm:text-5xl tracking-wide leading-none mt-2">Usuarios</h1>
      <p className="text-foreground/70 mt-2">Buscá una cuenta por nombre o email.</p>
    </div>
    <form method="get" className="flex flex-col sm:flex-row gap-3" role="search">
      <label htmlFor="user-search" className="sr-only">Nombre o email</label>
      <input id="user-search" name="q" type="search" defaultValue={query} minLength={2} maxLength={100} placeholder="Nombre o email" className="flex-1 px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm focus:outline-none focus:border-brand-lime" />
      <button type="submit" className="ui-action justify-center gap-2 px-5 py-2.5 bg-brand-lime text-brand-bg rounded-sm"><Search className="w-4 h-4" aria-hidden="true" />Buscar</button>
    </form>
    {!searched && <p className="p-6 border border-brand-border rounded-sm text-foreground/70">Ingresá al menos dos caracteres para buscar usuarios.</p>}
    {result?.error && <p role="alert" className="p-6 border border-brand-red/40 rounded-sm text-brand-red">No pudimos cargar los usuarios. Volvé a intentar.</p>}
    {searched && !result?.error && result?.data?.length === 0 && <p className="p-6 border border-brand-border rounded-sm text-foreground/70">No encontramos usuarios para «{query}».</p>}
    {!!result?.data?.length && <section aria-label="Resultados de usuarios" className="flex flex-col gap-3">
      <p className="text-sm text-foreground/60">Hasta 20 resultados. Refiná la búsqueda si no encontrás la cuenta.</p>
      {result.data.map((user: AdminUserResult) => <Link key={user.user_id} href={`/admin/usuarios/${user.user_id}`} className="p-4 bg-brand-surface border border-brand-border rounded-sm flex items-center gap-4 hover:border-brand-lime">
        <AdminUserAvatar url={user.avatar_url} name={user.display_name} />
        <span className="min-w-0 flex-1"><span className="block font-semibold truncate">{user.display_name}</span><span className="block text-sm text-foreground/70 break-all">{user.email}</span><span className="block text-sm text-foreground/60">{user.zone_name ?? 'Sin zona'}</span></span>
        <Users className="w-4 h-4 text-brand-lime shrink-0" aria-hidden="true" />
      </Link>)}
    </section>}
  </div>
}
