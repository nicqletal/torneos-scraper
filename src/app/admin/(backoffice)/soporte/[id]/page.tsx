import { requireAdmin } from '@/utils/admin'
import { SupportConversation } from '@/components/SupportConversation'

export default async function AdminSupportThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const admin = await requireAdmin()
  return <SupportConversation id={(await params).id} currentUserId={admin.id} admin error={(await searchParams).error === '1'} />
}
