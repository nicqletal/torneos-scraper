import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SupportConversation } from '@/components/SupportConversation'

export default async function SupportThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; pagina?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/soporte')
  const state = await searchParams
  const number = Number(state.pagina)
  const page = Number.isSafeInteger(number) && number > 0 && number <= 10000 ? number : 1
  return <SupportConversation page={page} id={(await params).id} currentUserId={user.id} admin={false} error={state.error === '1'} />
}
