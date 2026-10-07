import { redirect } from 'next/navigation'
import { managePath } from '@/utils/tournament-manage'

// Ruta vieja de inscripciones: ahora es la pestaña "Inscripciones" de la
// pantalla de gestión. Queda como redirección para no romper links guardados.
export default async function InscripcionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(managePath(id, 'inscripciones'))
}
