'use client'

// PROTOTIPO · Variante A: "Partidos" es una sección propia de la app, al lado
// de Mis equipos y Mis torneos. Arriba se elige el equipo (si capitaneás
// más de uno) y abajo hay tres pestañas: Buscar rival, Propuestas, Partidos.
// Cada partido tiene su página: /partidos/[id].

import { useState } from 'react'
import { ArrowLeft, Bell, Plus, ChevronDown } from 'lucide-react'
import { myTeams, searches, proposals, matches, notices, teamById } from './data'
import { FakeUrl, MatchActions, PublishSearchForm, StatusPill, btnPrimary, btnSecondary, btnLink } from './shared'


type Tab = 'buscar' | 'propuestas' | 'partidos'

export function VariantA() {
  const [teamId, setTeamId] = useState('rf')
  const [tab, setTab] = useState<Tab>('partidos')
  const [matchId, setMatchId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [openSlot, setOpenSlot] = useState<string | null>('f1')
  const [bellOpen, setBellOpen] = useState(false)

  const team = teamById(teamId)
  const teamMatches = matches.filter((m) => m.teamId === teamId).sort((a, b) => a.sortKey - b.sortKey)
  const teamProposals = proposals.filter((p) => p.teamId === teamId)
  const teamSearches = searches.filter((s) => s.teamId === teamId)
  const pendingCount = (id: string) =>
    matches.filter((m) => m.teamId === id && m.todo).length + proposals.filter((p) => p.teamId === id && p.direction === 'recibida' && p.status === 'Pendiente').length

  const match = matches.find((m) => m.id === matchId)

  // Barra de la app simulada: link "Partidos" y campanita al lado del menú
  const navStrip = (
    <div className="flex items-center justify-between border border-brand-border bg-brand-secondary rounded-sm px-4 py-2">
      <div className="flex gap-5 text-sm font-display tracking-wider uppercase">
        <span className="text-foreground/60">Torneos</span>
        <span className="text-brand-lime border-b-2 border-brand-lime">Partidos</span>
        <span className="text-foreground/60">Mis equipos</span>
      </div>
      <div className="relative">
        <button className="relative cursor-pointer" onClick={() => setBellOpen(!bellOpen)} aria-label="Avisos">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-2 bg-brand-red text-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
        </button>
        {bellOpen && (
          <ul className="absolute right-0 mt-2 w-80 z-20 bg-brand-surface border border-brand-border rounded-sm divide-y divide-brand-border shadow-2xl">
            {notices.map((n, i) => (
              <li key={i}>
                <button
                  className="text-left w-full p-3 text-sm hover:bg-brand-secondary cursor-pointer"
                  onClick={() => { if (n.matchId) { setTeamId(matches.find((m) => m.id === n.matchId)!.teamId); setMatchId(n.matchId) } else { setTab('propuestas') } setBellOpen(false) }}
                >
                  <span className={n.unread ? 'text-foreground' : 'text-foreground/60'}>{n.text}</span>
                  <span className="block text-xs text-foreground/50 mt-1">{n.when}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  if (match) {
    return (
      <div className="flex flex-col gap-6">
        {navStrip}
        <FakeUrl path={`/partidos/${match.id}`} />
        <button className={btnLink + ' w-fit flex items-center gap-1'} onClick={() => setMatchId(null)}><ArrowLeft className="w-4 h-4" /> Volver a Partidos</button>
        <div className="border-b border-brand-border pb-4">
          <p className="text-sm text-foreground/60 uppercase">{teamById(match.teamId).name} vs</p>
          <h1 className="text-4xl font-display tracking-wider uppercase">{match.rival} <span className="text-foreground/50 text-2xl">· {match.rivalZone}</span></h1>
          <div className="mt-2"><StatusPill status={match.status} /></div>
        </div>
        <MatchActions match={match} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {navStrip}
      <FakeUrl path={`/partidos?equipo=${teamId}&ver=${tab}`} />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-5xl font-display tracking-wider uppercase leading-none">Partidos</h1>
          <label className="mt-3 flex items-center gap-2 text-sm">
            Equipo
            <span className="relative">
              <select className="ui-input pr-8 w-auto appearance-none" value={teamId} onChange={(e) => { setTeamId(e.target.value); setMatchId(null) }}>
                {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isCaptain ? '' : ' (jugador)'}{pendingCount(t.id) ? ` · ${pendingCount(t.id)} pendientes` : ''}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </span>
          </label>
        </div>
        {team.isCaptain && (
          <button className={btnPrimary + ' w-fit'} onClick={() => { setTab('buscar'); setPublishing(true) }}><Plus className="w-4 h-4" /> Buscar rival</button>
        )}
      </div>

      <div className="flex gap-1 border-b border-brand-border">
        {([['partidos', `Partidos (${teamMatches.length})`], ['propuestas', `Propuestas (${teamProposals.filter((p) => p.status === 'Pendiente').length})`], ['buscar', 'Buscar rival']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setPublishing(false) }} className={`px-4 py-2 font-display tracking-wider uppercase cursor-pointer -mb-px border-b-2 ${tab === key ? 'border-brand-lime text-brand-lime' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'partidos' && (
        <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
          {teamMatches.length === 0 && <li className="p-6 text-foreground/60">Sin partidos por jugarse.</li>}
          {teamMatches.map((m) => (
            <li key={m.id}>
              <button className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-brand-secondary cursor-pointer" onClick={() => setMatchId(m.id)}>
                <div className="flex-1">
                  <p className="font-display text-xl tracking-wider uppercase">vs {m.rival} <span className="text-foreground/50 text-base">· {m.rivalZone}</span></p>
                  <p className="text-sm text-foreground/70">{m.range}{m.time ? ` · ${m.time} en ${m.venue}` : ''}</p>
                  {m.todo && team.isCaptain && <p className="text-sm text-brand-amber mt-1">→ {m.todo}</p>}
                </div>
                <StatusPill status={m.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === 'propuestas' && (
        <div className="grid md:grid-cols-2 gap-6">
          {(['recibida', 'enviada'] as const).map((dir) => (
            <section key={dir} className="flex flex-col gap-2">
              <h2 className="font-display text-xl tracking-wider uppercase">{dir === 'recibida' ? 'Recibidas' : 'Enviadas'}</h2>
              <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
                {teamProposals.filter((p) => p.direction === dir).map((p) => (
                  <li key={p.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-lg tracking-wider uppercase">{p.rival} <span className="text-foreground/50 text-sm">· {p.rivalZone}</span></p>
                      <StatusPill status={p.status} />
                    </div>
                    <p className="text-sm text-foreground/70">{p.when}{p.expires ? ` · ${p.expires}` : ''}</p>
                    {p.status === 'Pendiente' && team.isCaptain && (
                      <div className="flex gap-2">
                        {dir === 'recibida'
                          ? <><button className={btnPrimary}>Aceptar</button><button className={btnSecondary}>Rechazar</button></>
                          : <button className={btnSecondary}>Cancelar propuesta</button>}
                      </div>
                    )}
                  </li>
                ))}
                {teamProposals.filter((p) => p.direction === dir).length === 0 && <li className="p-4 text-foreground/60 text-sm">Nada por acá.</li>}
              </ul>
            </section>
          ))}
        </div>
      )}

      {tab === 'buscar' && (publishing || teamSearches.length === 0) && team.isCaptain && (
        <PublishSearchForm teamName={team.name} onDone={() => setPublishing(false)} />
      )}

      {tab === 'buscar' && !publishing && teamSearches.map((s) => (
        <section key={s.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wider uppercase">Búsqueda · {s.modality}</h2>
            {team.isCaptain && <div className="flex gap-3"><button className={btnLink}>Agregar franja</button><button className={btnLink + ' text-brand-red'}>Cancelar búsqueda</button></div>}
          </div>
          <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
            {s.slots.map((slot) => (
              <li key={slot.id} className="p-4 flex flex-col gap-3">
                <button className="flex items-center justify-between cursor-pointer text-left" onClick={() => setOpenSlot(openSlot === slot.id ? null : slot.id)}>
                  <span className="font-display text-lg tracking-wider uppercase">{slot.label}</span>
                  <span className="text-sm text-foreground/60">{slot.occupied ? 'Ocupada: tienen partido' : `${slot.compatibles.length} compatibles`}</span>
                </button>
                {openSlot === slot.id && !slot.occupied && (
                  <ul className="flex flex-col gap-2 pl-3 border-l-2 border-brand-lime">
                    {slot.compatibles.map((c) => (
                      <li key={c.team} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                        <div>
                          <p className="text-foreground">{c.team} <span className="text-foreground/50">· {c.zone} ({c.closeness})</span></p>
                          <p className="text-xs text-foreground/60 uppercase">{c.level} · {c.faltas90} faltas en 90 días · {c.rating} · en común {c.overlap}</p>
                        </div>
                        {c.proposed ? <span className="text-sm text-brand-sky">Propuesta enviada</span> : team.isCaptain && <button className={btnSecondary}>Proponer {c.overlap}</button>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
