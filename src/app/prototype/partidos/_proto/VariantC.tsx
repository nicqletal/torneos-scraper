'use client'

// PROTOTIPO · Variante C: Partidos como bandeja de "lo que te toca". Una sola
// lista con todo lo pendiente de todos tus equipos, cada cosa se resuelve en
// la misma tarjeta. Buscar rival es un recorrido aparte, de pasos
// (/partidos/buscar). La agenda de abajo junta todos los partidos por día.

import { useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { searches, proposals, matches } from './data'
import { FakeUrl, MatchActions, PublishSearchForm, StatusPill, TeamTag, btnPrimary, btnSecondary, btnLink } from './shared'


export function VariantC() {
  const [screen, setScreen] = useState<'bandeja' | 'buscar' | 'compatibles'>('bandeja')
  const [mine, setMine] = useState<'todo' | 'busquedas'>('todo')

  if (screen === 'buscar') {
    return (
      <div className="flex flex-col gap-6">
        <FakeUrl path="/partidos/buscar" />
        <button className={btnLink + ' w-fit flex items-center gap-1'} onClick={() => setScreen('bandeja')}><ArrowLeft className="w-4 h-4" /> Partidos</button>
        <h1 className="text-5xl font-display tracking-wider uppercase leading-none">Buscar rival</h1>
        <p className="text-sm text-foreground/60">Paso 1 de 2 · Equipo, modalidad y franjas</p>
        <PublishSearchForm onDone={() => setScreen('compatibles')} />
      </div>
    )
  }

  if (screen === 'compatibles') {
    const s = searches[0]
    // Todos los compatibles de la búsqueda en una lista, ya ordenados
    const all = s.slots.flatMap((slot) => slot.compatibles.map((c) => ({ ...c, slot: slot.label })))
    return (
      <div className="flex flex-col gap-6">
        <FakeUrl path={`/partidos/buscar/${s.id}`} />
        <button className={btnLink + ' w-fit flex items-center gap-1'} onClick={() => setScreen('bandeja')}><ArrowLeft className="w-4 h-4" /> Partidos</button>
        <div>
          <h1 className="text-5xl font-display tracking-wider uppercase leading-none">Rivales para Real Floresta</h1>
          <p className="text-sm text-foreground/60 mt-2">Paso 2 de 2 · {s.modality} · {s.slots.length} franjas · ordenados por cercanía, nivel y presentismo</p>
        </div>
        <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
          {all.map((c) => (
            <li key={c.team + c.slot} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="font-display text-xl tracking-wider uppercase">{c.team} <span className="text-foreground/50 text-base">· {c.zone}</span></p>
                <p className="text-sm text-foreground/70">{c.slot} → en común {c.overlap}</p>
                <p className="text-xs text-foreground/60 uppercase">{c.closeness} · {c.level} · {c.faltas90} faltas en 90 días · {c.rating}</p>
              </div>
              {c.proposed ? <span className="text-sm text-brand-sky">Propuesta enviada</span> : <button className={btnPrimary}>Proponer</button>}
            </li>
          ))}
        </ul>
        <p className="text-sm text-foreground/60">Franja del jue 5/11 ocupada: ya tienen partido.</p>
      </div>
    )
  }

  const todoMatches = matches.filter((m) => m.todo && m.teamId !== 'ab').sort((a, b) => a.sortKey - b.sortKey)
  const todoProposals = proposals.filter((p) => p.direction === 'recibida' && p.status === 'Pendiente')
  const waiting = proposals.filter((p) => p.direction === 'enviada' && p.status === 'Pendiente')
  const agenda = [...matches].sort((a, b) => a.sortKey - b.sortKey)

  return (
    <div className="flex flex-col gap-8">
      <FakeUrl path="/partidos" />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-5xl font-display tracking-wider uppercase leading-none">Partidos</h1>
          <p className="text-sm text-foreground/70 mt-2">Todo lo de tus equipos, empezando por lo que te toca.</p>
        </div>
        <button className={btnPrimary + ' w-fit'} onClick={() => setScreen('buscar')}><Search className="w-4 h-4" /> Buscar rival</button>
      </div>

      <div className="flex gap-2">
        <button className={mine === 'todo' ? btnPrimary : btnSecondary} onClick={() => setMine('todo')}>Bandeja</button>
        <button className={mine === 'busquedas' ? btnPrimary : btnSecondary} onClick={() => setMine('busquedas')}>Mis búsquedas</button>
      </div>

      {mine === 'busquedas' ? (
        <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
          {searches.map((s) => (
            <li key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex flex-col gap-1">
                <TeamTag teamId={s.teamId} />
                <p className="font-display text-xl tracking-wider uppercase">{s.modality} · {s.slots.length} franjas</p>
                <p className="text-sm text-foreground/70">{s.slots.map((x) => x.label).join(' / ')}</p>
              </div>
              <div className="flex gap-2">
                <button className={btnSecondary} onClick={() => setScreen('compatibles')}>Ver rivales</button>
                <button className={btnLink + ' text-brand-red'}>Cancelar</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-2xl tracking-wider uppercase text-brand-amber">Te toca ({todoMatches.length + todoProposals.length})</h2>
            {todoProposals.map((p) => (
              <article key={p.id} className="p-5 border border-brand-border bg-brand-surface rounded-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap"><TeamTag teamId={p.teamId} /><span className="text-xs text-foreground/60">{p.expires}</span></div>
                <p className="font-display text-xl tracking-wider uppercase">Te propusieron un partido: {p.rival} <span className="text-foreground/50 text-base">· {p.rivalZone}</span></p>
                <p className="text-sm text-foreground/70">{p.when}</p>
                <div className="flex gap-2"><button className={btnPrimary}>Aceptar</button><button className={btnSecondary}>Rechazar</button></div>
              </article>
            ))}
            {todoMatches.map((m) => (
              <article key={m.id} className="p-5 border border-brand-border bg-brand-surface rounded-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap"><TeamTag teamId={m.teamId} /><StatusPill status={m.status} /></div>
                <p className="font-display text-xl tracking-wider uppercase">{m.todo} · vs {m.rival}</p>
                <MatchActions match={m} />
              </article>
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl tracking-wider uppercase text-foreground/70">Esperando al rival</h2>
            <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
              {waiting.map((p) => (
                <li key={p.id} className="p-4 flex flex-wrap items-center gap-3 justify-between text-sm">
                  <span className="flex items-center gap-2"><TeamTag teamId={p.teamId} /> Propusiste a {p.rival} · {p.when}</span>
                  <span className="text-foreground/60">{p.expires} · <button className={btnLink}>Cancelar</button></span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl tracking-wider uppercase text-foreground/70">Agenda</h2>
            <ol className="flex flex-col gap-2">
              {agenda.map((m) => (
                <li key={m.id} className="grid grid-cols-[9rem_1fr] gap-4 items-start text-sm">
                  <span className="font-display tracking-wider uppercase text-brand-lime">{m.range.split(' · ')[0]}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <TeamTag teamId={m.teamId} /> vs {m.rival} · {m.time ?? m.range.split(' · ')[1]}{m.venue ? ` · ${m.venue}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}
