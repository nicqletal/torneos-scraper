// PROTOTIPO descartable del ticket "Dónde vive Partidos en la app" (#41).
// Tres maneras de navegar el módulo Partidos, en /prototype/partidos?variant=A2|A|B|C.
// Datos falsos en memoria; nada de esto va a main.

import { PrototypeSwitcher } from '@/components/PrototypeSwitcher'
import { VariantA } from './_proto/VariantA'
import { VariantA2 } from './_proto/VariantA2'
import { VariantD } from './_proto/VariantD'
import { VariantE } from './_proto/VariantE'
import { VariantB } from './_proto/VariantB'
import { VariantC } from './_proto/VariantC'

const variants = [
  { key: 'E', name: 'Desktop, el silencio confirma' },
  { key: 'D', name: 'Celular, pocos toques' },
  { key: 'A2', name: 'A minimalista' },
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
  const variant = typeof query.variant === 'string' ? query.variant : 'E'

  return (
    <div className={`${variant === 'E' ? 'max-w-6xl' : 'max-w-4xl'} w-full mx-auto pb-24`}>
      {variant === 'E' && <VariantE />}
      {variant === 'D' && <VariantD />}
      {variant === 'A2' && <VariantA2 />}
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      <PrototypeSwitcher variants={variants} current={variant} />
    </div>
  )
}
