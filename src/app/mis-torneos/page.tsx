import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Eye, Pencil, Plus, Trophy, CheckCircle2, Users } from 'lucide-react'
import { TournamentStatus, statusLabels, statusStyles } from '@/utils/tournament-status'
import { sortForPanel, verificationAge } from '@/utils/tournament-verification'
import { withdrawConfirmation } from '@/utils/tournament-withdraw'
import { inscriptionsLabel } from '@/utils/inscriptions'
import { ZONE_LABEL_EMBED, zoneLabel, type ZoneLabelFields } from '@/utils/zones'
import { VerificationBadge } from '@/components/VerificationBadge'
import { verifyTournament } from './actions'
import { WithdrawButton } from './WithdrawButton'
import { SubmitButton } from '@/components/SubmitButton'

// Base de las acciones secundarias, sin color de hover: "Dar de baja" pone el
// suyo (rojo) y no tiene que competir con el lima de las demás.
const actionBaseClass =
  'press inline-flex items-center gap-1.5 px-3 py-2 border border-brand-border bg-brand-secondary text-white/80 text-xs font-display font-bold uppercase tracking-wider rounded-sm'
const actionClass = `${actionBaseClass} hover:text-brand-lime hover:border-brand-lime`

export default async function MisTorneosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/mis-torneos')
  }

  // `status` e `inscriptions_count` son columnas calculadas: hay que pedirlas.
  const { data, error } = await supabase
    .from('tournaments')
    .select(`id, name, ${ZONE_LABEL_EMBED}, sport_modality, capacity, verified_at, status, inscriptions_count`)
    .eq('user_id', user.id)
    .order('start_date', { ascending: true })

  if (error) {
    console.error(error)
    return (
      <div className="max-w-4xl mx-auto p-8 border border-brand-red/40 bg-brand-red/5 text-center rounded-sm">
        <p className="text-brand-red font-display text-sm tracking-wider uppercase">
          No pudimos cargar tus torneos. Probá de nuevo.
        </p>
      </div>
    )
  }

  const now = new Date()
  const tournaments = sortForPanel(
    // Sin tipos generados de la base, supabase-js tipa todo embed como lista;
    // `zones` es una sola porque el torneo tiene una FK a `zones`.
    (data ?? []).map((t) => ({
      ...t,
      status: t.status as TournamentStatus,
      inscriptions_count: t.inscriptions_count as number,
      zones: t.zones as unknown as ZoneLabelFields,
    })),
    now
  )

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-white/50 hover:text-brand-lime transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        <span>Volver al listado</span>
      </Link>

      <div className="border-b border-brand-border pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-display tracking-widest font-bold text-white uppercase leading-none">
            Mis torneos
          </h1>
          <p className="text-white/60 text-xs tracking-wider uppercase font-mono">
            Tocá “Sigue vigente” para que la gente sepa que el torneo está en pie.
          </p>
        </div>

        <Link
          href="/crear-torneo"
          className="press inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-lime hover:bg-white text-brand-bg font-display font-bold uppercase tracking-wider rounded-sm"
        >
          <Plus className="w-4 h-4" />
          Publicar torneo
        </Link>
      </div>

      {tournaments.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {tournaments.map((tournament) => {
            const age = verificationAge(tournament.verified_at, tournament.status, now)

            return (
              <li
                key={tournament.id}
                className="p-5 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-display font-bold tracking-wider text-white uppercase leading-tight">
                    {tournament.name}
                  </h2>
                  <p className="text-xs text-white/50 font-mono uppercase">
                    {zoneLabel(tournament.zones)} · {tournament.sport_modality.replace('futbol_', 'Fútbol ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase">
                  <span className={`px-2.5 py-1 border font-display font-bold tracking-widest rounded-sm ${statusStyles[tournament.status]}`}>
                    {statusLabels[tournament.status]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-brand-border text-white/70 rounded-sm">
                    <Users className="w-3.5 h-3.5 text-brand-lime" />
                    {inscriptionsLabel(tournament.inscriptions_count, tournament.capacity)}
                  </span>
                  {age && <VerificationBadge age={age} className="px-2.5 py-1" />}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-brand-border">
                  <Link href={`/torneos/${tournament.id}`} className={actionClass}>
                    <Eye className="w-3.5 h-3.5" />
                    Ver
                  </Link>
                  <Link href={`/mis-torneos/${tournament.id}/editar`} className={actionClass}>
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </Link>
                  <Link href={`/mis-torneos/${tournament.id}/inscripciones`} className={actionClass}>
                    <ClipboardList className="w-3.5 h-3.5" />
                    Inscripciones
                  </Link>

                  {/* Un Finalizado no se verifica ni se da de baja: queda como trayectoria. */}
                  {tournament.status !== 'finalizado' && (
                    <>
                      <form action={verifyTournament}>
                        <input type="hidden" name="id" value={tournament.id} />
                        <SubmitButton
                          pendingLabel={<><CheckCircle2 className="w-3.5 h-3.5" />Confirmando…</>}
                          className="press inline-flex items-center gap-1.5 px-3 py-2 bg-brand-lime hover:bg-white text-brand-bg text-xs font-display font-bold uppercase tracking-wider rounded-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sigue vigente
                        </SubmitButton>
                      </form>

                      <WithdrawButton
                        id={tournament.id}
                        confirmMessage={withdrawConfirmation(tournament.name, tournament.inscriptions_count)}
                        className={actionBaseClass}
                      />
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="p-12 bg-brand-surface border border-dashed border-brand-border rounded-sm text-center flex flex-col items-center gap-4">
          <Trophy className="w-12 h-12 text-brand-lime/40 stroke-1" />
          <h2 className="text-2xl font-display font-bold tracking-wider text-white uppercase">
            Todavía no publicaste torneos
          </h2>
          <p className="text-white/50 text-sm max-w-sm">
            Cargalo acá y los equipos te van a contactar por WhatsApp o Instagram.
          </p>
          <Link
            href="/crear-torneo"
            className="press px-6 py-3 bg-brand-lime hover:bg-white text-brand-bg font-display font-bold uppercase tracking-wider rounded-sm"
          >
            Cargar mi primer torneo
          </Link>
        </div>
      )}
    </div>
  )
}
