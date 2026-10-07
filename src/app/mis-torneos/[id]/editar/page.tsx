import { redirect } from 'next/navigation'
import { managePath } from '@/utils/tournament-manage'

// Ruta vieja de edición: ahora es la pestaña "Datos" de la pantalla de gestión.
// Queda como redirección para no romper links guardados.
export default async function EditarTorneoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(managePath(id, 'datos'))
}
