import { requireAdmin } from '@/utils/admin'
import { AdminSidebar } from '@/components/AdminSidebar'

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <div className="min-h-screen md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
      <AdminSidebar email={user.email} />
      <section aria-label="Contenido de administración" className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</section>
    </div>
  )
}
