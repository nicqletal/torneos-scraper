import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/utils/admin'
import { createClient } from '@/utils/supabase/server'
import { SuspensionControls } from '@/components/SuspensionControls'
import { AdminUserAvatar } from '@/components/AdminUserAvatar'

export default async function AdminUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  await requireAdmin()
  const { id } = await params
  const state = await searchParams
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_user', { p_user_id: id })
  if (error) return <p role="alert" className="text-brand-red">No pudimos cargar el usuario. Volvé a intentar.</p>
  const user = data?.[0]
  if (!user) notFound()

  return <div className="max-w-3xl flex flex-col gap-8">
    <Link href="/admin/usuarios" className="ui-action gap-2 w-fit text-foreground/80 hover:text-brand-lime"><ArrowLeft className="w-4 h-4" aria-hidden="true" />Usuarios</Link>
    <div className="border-b border-brand-border pb-6">
      <p className="text-sm text-brand-lime font-semibold">Panel de administración · Usuarios</p>
      <h1 className="font-display text-4xl sm:text-5xl tracking-wide leading-none mt-2">Ficha de usuario</h1>
    </div>
    <section className="p-5 sm:p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-6">
      <div className="flex items-center gap-4"><AdminUserAvatar url={user.avatar_url} name={user.display_name} size={64} /><h2 className="text-2xl font-semibold">{user.display_name}</h2></div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div><dt className="text-sm text-foreground/60">Email</dt><dd className="break-all">{user.email}</dd></div>
        <div><dt className="text-sm text-foreground/60">Zona</dt><dd>{user.zone_name ?? 'Sin zona'}</dd></div>
        <div><dt className="text-sm text-foreground/60">Fecha de alta</dt><dd>{new Date(user.created_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'long', year: 'numeric' })}</dd></div>
      </dl>
    </section>
    {state.error && <p role="alert" className="text-brand-red">No se pudo aplicar el cambio. Revisá que no exista una Suspensión vigente y que el correo de soporte esté configurado.</p>}
    {state.ok && <p role="status" className="text-brand-lime">Cambio de Suspensión guardado.</p>}
    <SuspensionControls userId={id} name={user.display_name} />
  </div>
}
