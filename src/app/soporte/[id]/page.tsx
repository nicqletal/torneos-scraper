import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SupportConversation } from '@/components/SupportConversation'

export default async function SupportThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/soporte')
  return <SupportConversation id={(await params).id} currentUserId={user.id} admin={false} error={(await searchParams).error === '1'} />
}
