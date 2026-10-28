// PROTOTIPO descartable del ticket "Dónde vive Partidos en la app" (#41).
// Una pantalla de Partidos con dos juegos de reglas, para elegir:
// /prototype/partidos?variant=1 (reglas de hoy) o ?variant=2 (el silencio confirma).
// Las variantes anteriores (A, A2, B, C, D) quedan en la historia de esta rama.

import { PrototypeSwitcher } from '@/components/PrototypeSwitcher'
import { VariantE } from './_proto/VariantE'

const variants = [
  { key: '1', name: 'Reglas de hoy: el otro confirma' },
  { key: '2', name: 'El silencio confirma' },
]

export default async function PartidosPrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string | string[] }>
}) {
  const query = await searchParams
  const variant = query.variant === '2' ? '2' : '1'

  return (
    <div className="max-w-6xl w-full mx-auto pb-24">
      <VariantE rules={variant === '1' ? 'hoy' : 'silencio'} />
      <PrototypeSwitcher variants={variants} current={variant} />
    </div>
  )
}
