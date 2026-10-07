import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { TOURNAMENT_FORM_COLUMNS, type TournamentInput } from '@/utils/tournament-form'
import { verificationAge, verifyBlock } from '@/utils/tournament-verification'
import { withdrawConfirmation } from '@/utils/tournament-withdraw'
import { inscriptionsLabel } from '@/utils/inscriptions'
import { MANAGE_TABS, manageLoginPath, managePath, manageTab } from '@/utils/tournament-manage'
import { BackLink } from '@/components/BackLink'
import { secondaryButtonClass } from '@/components/button-styles'
import { VerificationBadge } from '@/components/VerificationBadge'
import { VerifyButton } from '../VerifyButton'
import { WithdrawButton } from '../WithdrawButton'
import { DatosTab } from './DatosTab'
import { InscripcionesTab } from './InscripcionesTab'

interface GestionTorneoProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string | string[]; q?: string; error?: string }>
}

const keyLabelClass = 'text-white/40 text-[10px] uppercase tracking-wider font-mono'
const keyValueClass = 'font-semibold text-white text-sm'

// Pantalla de gestión del torneo: el segundo nivel del panel de organizador
// (ver "Cuenta y acceso" en docs/decisiones-casos-de-uso.md). Cabecera con los
// números clave, pestañas y la baja al final, aparte.
// La pestaña vive en `?tab=` y no en rutas hijas: es una sola página que lee
// `searchParams`, sin layout compartido, y el buscador de equipos (`?q=`) queda
// en la misma URL. Las rutas viejas `/editar` e `/inscripciones` redirigen acá.
export default async function GestionTorneoPage({ params, searchParams }: GestionTorneoProps) {
  const { id } = await params
  const { tab: rawTab, q, error: errorCode } = await searchParams
  const tab = manageTab(rawTab)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(manageLoginPath(id, tab))
  }

  // Un torneo ajeno da 404, igual que uno que no existe: no se confirma que
  // exista un torneo con ese id que no es tuyo. Un id que no es uuid hace
  // fallar la consulta, y también cae acá.
  // `status` e `inscriptions_count` son columnas calculadas: hay que pedirlas.
  const { data } = await supabase
    .from('tournaments')
    .select(`${TOURNAMENT_FORM_COLUMNS}, image_url, verified_at, status, inscriptions_count`)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) {
    notFound()
  }

  const { image_url, verified_at, status, inscriptions_count, ...formColumns } = data as TournamentInput & {
    image_url: string | null
    verified_at: string
    status: TournamentStatus
    inscriptions_count: number
  }

  const now = new Date()
  const age = verificationAge(verified_at, status, now)
  const formatDate = (date: string) =>
    format(new Date(date + 'T00:00:00'), 'd MMM yyyy', { locale: es })

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <BackLink href="/mis-torneos" label="Mis torneos" />

      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl md:text-5xl font-display tracking-widest font-bold text-white uppercase leading-none">
            {formColumns.name}
          </h1>
          <span className={`w-fit px-2.5 py-1 border text-[11px] uppercase font-display font-bold tracking-widest rounded-sm ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-brand-surface border border-brand-border rounded-sm">
          <div className="flex flex-col gap-1.5">
            <dt className={keyLabelClass}>{formColumns.capacity !== null ? 'Cupo' : 'Inscriptos'}</dt>
            <dd className={keyValueClass}>{inscriptionsLabel(inscriptions_count, formColumns.capacity)}</dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className={keyLabelClass}>Cierre de inscripción</dt>
            <dd className={keyValueClass}>{formatDate(formColumns.inscription_deadline)}</dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className={keyLabelClass}>Fechas</dt>
            <dd className={keyValueClass}>
              {formatDate(formColumns.start_date)} al {formatDate(formColumns.end_date)}
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className={keyLabelClass}>Última confirmación</dt>
            <dd className="text-[11px]">
              {age ? (
                <VerificationBadge age={age} className="px-2 py-1" />
              ) : (
                // Un Finalizado ya no tiene que confirmar que sigue en pie.
                <span className="font-mono uppercase text-white/50">Finalizó: ya no se confirma</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <VerifyButton id={id} block={verifyBlock(verified_at, status, now)} />
          <Link
            href={`/torneos/${id}`}
            className={secondaryButtonClass}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver ficha pública
          </Link>
        </div>
      </header>

      {/* Pestañas: son links, así cada una tiene su URL y andan sin JavaScript. */}
      <nav aria-label="Secciones del torneo" className="flex gap-1 border-b border-brand-border">
        {MANAGE_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={managePath(id, value)}
            aria-current={value === tab ? 'page' : undefined}
            className={`px-4 py-3 -mb-px border-b-2 font-display font-bold uppercase tracking-wider text-sm transition-colors ${
              value === tab
                ? 'border-brand-lime text-brand-lime'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === 'datos' ? (
        <DatosTab
          id={id}
          formColumns={formColumns}
          inscriptionsCount={inscriptions_count}
          hasFlyer={image_url !== null}
        />
      ) : (
        <InscripcionesTab
          id={id}
          status={status}
          count={inscriptions_count}
          capacity={formColumns.capacity}
          q={q}
          errorCode={errorCode}
        />
      )}

      {/* La baja va aparte, al final: no tiene vuelta atrás. Un Finalizado no
          se da de baja: queda como trayectoria. */}
      {status !== 'finalizado' && (
        <section className="mt-4 pt-6 border-t border-brand-border flex flex-col gap-3">
          <h2 className="font-display tracking-wider text-lg text-white uppercase">Dar de baja</h2>
          <p className="text-white/50 text-xs leading-relaxed max-w-xl">
            El torneo desaparece del catálogo y su ficha deja de existir. No se puede deshacer.
          </p>
          <WithdrawButton
            id={id}
            confirmMessage={withdrawConfirmation(formColumns.name, inscriptions_count)}
          />
        </section>
      )}
    </div>
  )
}
