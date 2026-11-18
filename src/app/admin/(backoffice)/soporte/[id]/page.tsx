import { requireAdmin } from '@/utils/admin'
import { SupportConversation } from '@/components/SupportConversation'

export default async function AdminSupportThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; pagina?: string }> }) {
  const admin = await requireAdmin()
  const state = await searchParams
  const number = Number(state.pagina)
  const page = Number.isSafeInteger(number) && number > 0 && number <= 10000 ? number : 1
  return <SupportConversation page={page} id={(await params).id} currentUserId={admin.id} admin error={state.error === '1'} />
}
