import { redirect } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { joinTeam } from './actions'

// Joining is a button and not a side effect of opening the page: chat apps and
// browsers prefetch links, and that must never add someone to a squad.
export default async function UnirsePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { token } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/unirse/${token}`)}`)
  }

  return (
    <div className="max-w-md w-full mx-auto p-8 border border-brand-border bg-brand-surface rounded-sm flex flex-col items-center gap-4 text-center">
      <UserPlus className="w-10 h-10 text-brand-lime" />
      <h1 className="text-3xl font-display tracking-wider text-white uppercase leading-none">Te invitaron a un equipo</h1>
      <p className="text-white/50 text-sm">Al unirte vas a formar parte del plantel y el capitán te va a ver en él.</p>

      {error && (
        <p className="w-full p-3 text-xs text-white border border-brand-border rounded-sm" role="alert">
          {error}
        </p>
      )}

      <form action={joinTeam.bind(null, token)} className="w-full">
        <button
          type="submit"
          className="w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-white text-brand-bg transition-colors font-display"
        >
          Unirme al equipo
        </button>
      </form>
    </div>
  )
}
