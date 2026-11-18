import { notFound, redirect } from 'next/navigation'
import { ArrowUp, Eye, Megaphone } from 'lucide-react'
import { BackLink } from '@/components/BackLink'
import { TournamentCard, type Tournament } from '@/components/TournamentCard'
import { createClient } from '@/utils/supabase/server'
import { verificationAge } from '@/utils/tournament-verification'
import { ZONE_LABEL_EMBED } from '@/utils/zones'

export default async function TournamentPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?${new URLSearchParams({ next: `/mis-torneos/${id}/promocionar` })}`)

  // La vista previa usa datos públicos, pero pertenece al panel del Organizador.
  // Comprobar la titularidad aquí también impide abrirla con una URL ajena.
  const { data } = await supabase
    .from('tournaments')
    .select(`*, status, inscriptions_count, ${ZONE_LABEL_EMBED}`)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) notFound()

  const tournament = data as Tournament
  const verification = verificationAge(tournament.verified_at, tournament.status, new Date())

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <BackLink href={`/mis-torneos/${id}`} label="Gestionar torneo" />

      <header className="relative overflow-hidden border border-brand-border bg-brand-surface p-6 sm:p-9">
        <Megaphone aria-hidden="true" className="pointer-events-none absolute -right-6 -bottom-8 h-48 w-48 -rotate-12 text-brand-lime/5 sm:h-64 sm:w-64" />
        <div className="relative flex flex-col items-start gap-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 border border-brand-lime/40 bg-brand-lime/10 px-3 py-1.5 text-brand-lime">
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              Vista previa
            </span>
            <span className="border border-brand-border px-3 py-1.5 text-foreground/70">Próximamente</span>
          </div>
          <h1 className="max-w-2xl font-display text-4xl uppercase leading-none tracking-wide text-foreground sm:text-6xl">
            Dale a tu torneo<br />
            <span className="text-brand-lime">un lugar destacado.</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-foreground/75 sm:text-base">
            Así podría verse <strong className="text-foreground">{tournament.name}</strong> con promoción:
            un espacio antes del listado y una tarjeta que llama la atención.
          </p>
        </div>
      </header>

      {tournament.status === 'finalizado' && (
        <p className="border border-brand-border bg-brand-secondary p-4 text-sm leading-relaxed text-foreground/75">
          Este torneo está finalizado. La comparación muestra el formato de publicación; su estado se mantiene y no vuelve al catálogo.
        </p>
      )}

      <section aria-label="Comparación de la publicación" className="grid items-start gap-6 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground/60">Formato habitual</p>
            <h2 className="font-display text-3xl uppercase tracking-wide text-foreground">Publicación gratuita</h2>
            <p className="text-sm text-foreground/70">La presentación de tu tarjeta en el listado general.</p>
          </div>
          <div className="flex flex-col gap-4 border border-brand-border bg-brand-secondary/50 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">Todos los torneos</p>
            <TournamentCard tournament={tournament} index={0} verification={verification} showFavorite={false} />
            <p className="text-xs leading-relaxed text-foreground/60">El mismo formato que las tarjetas del catálogo.</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-wider text-brand-lime">Una nueva forma de aparecer</p>
            <h2 className="font-display text-3xl uppercase tracking-wide text-foreground">Con promoción</h2>
            <p className="text-sm text-foreground/70">Un espacio propio antes del listado general.</p>
          </div>
          <div className="flex flex-col gap-4 border border-brand-lime/40 bg-brand-lime/5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-lime">
                <Megaphone aria-hidden="true" className="h-4 w-4" />
                Torneos destacados
              </p>
              <span className="text-xs text-foreground/60">Espacio publicitario</span>
            </div>
            <TournamentCard tournament={tournament} index={0} verification={verification} promoted showFavorite={false} />
            <div className="flex items-center gap-2 border-t border-brand-border pt-4 text-xs text-foreground/65">
              <ArrowUp aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-lime" />
              Tu torneo destacado, antes del listado general.
            </div>
          </div>
          <div className="border border-dashed border-brand-border px-4 py-3 text-xs text-foreground/60">
            Todos los torneos · El listado continúa debajo
          </div>
        </div>
      </section>

      <section aria-label="Qué cambia con la promoción" className="grid gap-5 border-y border-brand-border py-6 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <ArrowUp aria-hidden="true" className="h-5 w-5 text-brand-lime" />
          <h2 className="font-display text-xl uppercase tracking-wide text-foreground">Un lugar destacado</h2>
          <p className="text-sm leading-relaxed text-foreground/70">Un bloque publicitario antes de los resultados del catálogo.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Megaphone aria-hidden="true" className="h-5 w-5 text-brand-lime" />
          <h2 className="font-display text-xl uppercase tracking-wide text-foreground">Una tarjeta distinta</h2>
          <p className="text-sm leading-relaxed text-foreground/70">Growth en celeste y Partner en ámbar, con etiqueta Promocionado para identificar la publicidad.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Eye aria-hidden="true" className="h-5 w-5 text-brand-lime" />
          <h2 className="font-display text-xl uppercase tracking-wide text-foreground">Tus datos a la vista</h2>
          <p className="text-sm leading-relaxed text-foreground/70">El estado, el precio y la verificación siguen visibles en tu tarjeta.</p>
        </div>
      </section>

      <aside className="flex flex-col gap-2 border border-brand-border bg-brand-surface p-5 sm:p-6">
        <p className="font-display text-xl uppercase tracking-wider text-foreground">Promociones · Próximamente</p>
        <p className="text-sm leading-relaxed text-foreground/70">
          Esta es una vista previa privada. La contratación todavía no está disponible y tu publicación sigue igual.
          Una promoción daría visibilidad publicitaria: no certifica al torneo ni garantiza consultas o inscripciones.
        </p>
      </aside>

      <section aria-labelledby="promotion-plans" className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-brand-lime">Planes de ejemplo · Próximamente</p>
          <h2 id="promotion-plans" className="mt-2 font-display text-3xl uppercase tracking-wide text-foreground sm:text-4xl">Una propuesta para cada organizador</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">Estos planes son ficticios y muestran una posible oferta futura. Los beneficios y las condiciones todavía no están definidos; no se pueden contratar.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { name: 'Starter', tagline: 'Dale el primer impulso', description: 'Para promocionar una edición de tu torneo.', benefits: ['Tarjeta con diseño destacado', 'Etiqueta Promocionado', 'Enlace a la ficha del torneo'], featured: false },
            { name: 'Growth', tagline: 'Un lugar antes del listado', description: 'Para darle más exposición a tu torneo.', benefits: ['Todo lo propuesto en Starter', 'Presencia en el bloque destacado', 'Espacio identificado como publicidad'], featured: true },
            { name: 'Partner', tagline: 'Pensado para seguir creciendo', description: 'Para organizadores con varias ediciones o torneos.', benefits: ['Todo lo propuesto en Growth', 'Propuesta para varios torneos propios', 'Planificación de la difusión con el organizador'], featured: false },
          ].map((plan) => (
            <article key={plan.name} className={`flex flex-col gap-5 border p-6 ${plan.name === 'Partner' ? 'border-brand-amber bg-brand-amber/5' : plan.featured ? 'border-brand-sky bg-brand-sky/5' : 'border-brand-border bg-brand-surface'}`}>
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground/60">{plan.tagline}</p>
                <h3 className="mt-2 font-display text-4xl uppercase tracking-wide text-foreground">{plan.name}</h3>
                <p className="mt-2 text-sm text-foreground/70">{plan.description}</p>
              </div>
              <p className="border-y border-brand-border py-4 font-display text-xl uppercase tracking-wide text-foreground">Precio a definir</p>
              <ul className="flex flex-1 flex-col gap-3 text-sm text-foreground/80">
                {plan.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2"><span aria-hidden="true" className="text-brand-lime">+</span>{benefit}</li>)}
              </ul>
              <p className="border border-brand-border px-3 py-2 text-center text-xs uppercase tracking-wider text-foreground/60">Plan de ejemplo · No disponible</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
