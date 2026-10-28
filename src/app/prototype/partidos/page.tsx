// PROTOTIPO descartable del ticket "Dónde vive Partidos en la app" (#41).
// Tres maneras de navegar el módulo Partidos, en /prototype/partidos?variant=A|B|C.
// Datos falsos en memoria; nada de esto va a main.

import { PrototypeSwitcher } from '@/components/PrototypeSwitcher'
import { VariantA } from './_proto/VariantA'
import { VariantB } from './_proto/VariantB'
import { VariantC } from './_proto/VariantC'

const variants = [
  { key: 'A', name: 'Sección Partidos con pestañas' },
  { key: 'B', name: 'Todo dentro del equipo' },
  { key: 'C', name: 'Bandeja de lo que te toca' },
]

export default async function PartidosPrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string | string[] }>
}) {
  const query = await searchParams
  const variant = typeof query.variant === 'string' ? query.variant : 'A'

  return (
    <div className="max-w-4xl w-full mx-auto pb-24">
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      <PrototypeSwitcher variants={variants} current={variant} />
    </div>
  )
}
