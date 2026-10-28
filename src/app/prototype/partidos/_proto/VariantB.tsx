'use client'

// PROTOTIPO · Variante B: Partidos vive dentro del equipo. No hay sección
// nueva en la barra: se entra por Mis equipos (cada equipo muestra cuántas
// cosas tiene pendientes) y todo pasa en la página del equipo, una debajo
// de la otra. El partido no tiene página propia: se abre en el lugar.

import { useState } from 'react'
import { ArrowLeft, Crown, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { myTeams, searches, proposals, matches, teamById } from './data'
import { FakeUrl, MatchActions, PublishSearchForm, StatusPill, btnPrimary, btnSecondary, btnLink } from './shared'


export function VariantB() {
  const [teamId, setTeamId] = useState<string | null>(null)
  const [openMatch, setOpenMatch] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [asPlayer, setAsPlayer] = useState(false)

  const pending = (id: string) =>
    matches.filter((m) => m.teamId === id && m.todo).length + proposals.filter((p) => p.teamId === id && p.direction === 'recibida' && p.status === 'Pendiente').length

  if (!teamId) {
    return (
      <div className="flex flex-col gap-6">
        <FakeUrl path="/mis-equipos" />
        <h1 className="text-5xl font-display tracking-wider uppercase leading-none border-b border-brand-border pb-4">Mis equipos</h1>
        <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
          {myTeams.map((t) => {
            const next = matches.filter((m) => m.teamId === t.id).sort((a, b) => a.sortKey - b.sortKey)[0]
            return (
              <li key={t.id}>
                <button className="w-full text-left p-4 flex items-center gap-4 hover:bg-brand-secondary cursor-pointer" onClick={() => { setTeamId(t.id); setAsPlayer(!t.isCaptain) }}>
                  <div className="w-12 h-12 rounded-sm bg-brand-secondary border border-brand-border flex items-center justify-center font-display text-xl text-brand-lime">{t.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}</div>
                  <div className="flex-1">
                    <p className="font-display text-xl tracking-wider uppercase flex items-center gap-2">
                      {t.name}
                      {t.isCaptain && <Crown className="w-4 h-4 text-brand-lime" />}
                    </p>
                    <p className="text-sm text-foreground/70">{next ? `Próximo: vs ${next.rival}, ${next.range}` : 'Sin partidos por jugarse'}</p>
                  </div>
                  {t.isCaptain && pending(t.id) > 0 && (
                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-sm bg-brand-amber text-brand-bg">{pending(t.id)} para hacer</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="text-sm text-foreground/60">La campanita lleva a la página del equipo, a la altura del partido o la propuesta.</p>
      </div>
    )
  }

  const team = teamById(teamId)
  const captainView = team.isCaptain && !asPlayer
  const teamMatches = matches.filter((m) => m.teamId === teamId).sort((a, b) => a.sortKey - b.sortKey)
  const received = proposals.filter((p) => p.teamId === teamId && p.direction === 'recibida')
  const sent = proposals.filter((p) => p.teamId === teamId && p.direction === 'enviada')
  const search = searches.find((s) => s.teamId === teamId)

  return (
    <div className="flex flex-col gap-8">
      <FakeUrl path={`/equipos/${teamId}${openMatch ? `#partido-${openMatch}` : ''}`} />
      <button className={btnLink + ' w-fit flex items-center gap-1'} onClick={() => { setTeamId(null); setOpenMatch(null); setPublishing(false) }}><ArrowLeft className="w-4 h-4" /> Mis equipos</button>

      <div className="flex items-center gap-5 border-b border-brand-border pb-6">
        <div className="w-24 h-24 rounded-sm bg-brand-secondary border border-brand-border flex items-center justify-center font-display text-4xl text-brand-lime">{team.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}</div>
        <div className="flex-1">
          <h1 className="text-5xl font-display tracking-wider uppercase leading-none">{team.name}</h1>
          <p className="text-sm text-foreground/70 uppercase mt-2">{team.zone} · {team.modality} · {team.level}</p>
          <p className="text-sm text-foreground/70 mt-1">Jugó 12 · 1 falta · ★ 4,3 (12)</p>
        </div>
        {team.isCaptain && (
          <label className="text-xs normal-case flex items-center gap-1 text-foreground/60"><input type="checkbox" checked={asPlayer} onChange={(e) => setAsPlayer(e.target.checked)} /> ver como jugador</label>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl tracking-wider uppercase">Partidos por jugarse</h2>
        <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
          {teamMatches.length === 0 && <li className="p-4 text-foreground/60">Sin partidos por jugarse.</li>}
          {teamMatches.map((m) => (
            <li key={m.id} id={`partido-${m.id}`}>
              <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-brand-secondary cursor-pointer" onClick={() => setOpenMatch(openMatch === m.id ? null : m.id)}>
                <div className="flex-1">
                  <p className="font-display text-xl tracking-wider uppercase">vs {m.rival} <span className="text-foreground/50 text-base">· {m.rivalZone}</span></p>
                  <p className="text-sm text-foreground/70">{m.range}</p>
                  {m.todo && captainView && <p className="text-sm text-brand-amber mt-1">→ {m.todo}</p>}
                </div>
                <StatusPill status={m.status} />
                {openMatch === m.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openMatch === m.id && (
                <div className="px-4 pb-4">
                  <MatchActions match={m} readOnly={!captainView} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {captainView ? (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl tracking-wider uppercase">Búsqueda de rival</h2>
              {!publishing && <button className={btnPrimary} onClick={() => setPublishing(true)}>{search ? 'Otra modalidad' : 'Buscar rival'}</button>}
            </div>
            {publishing && <PublishSearchForm teamName={team.name} onDone={() => setPublishing(false)} />}
            {search ? (
              <div className="grid sm:grid-cols-3 gap-3">
                {search.slots.map((slot) => (
                  <div key={slot.id} className={`p-4 border rounded-sm bg-brand-surface flex flex-col gap-2 ${slot.occupied ? 'border-brand-border opacity-60' : 'border-brand-border'}`}>
                    <p className="font-display tracking-wider uppercase">{search.modality} · {slot.label}</p>
                    {slot.occupied ? <p className="text-sm">Ocupada: tienen partido</p> : (
                      <ul className="flex flex-col gap-2">
                        {slot.compatibles.map((c) => (
                          <li key={c.team} className="text-sm flex flex-col gap-1">
                            <span>{c.team} <span className="text-foreground/50">· {c.closeness}</span></span>
                            <span className="text-xs text-foreground/60">{c.level} · {c.faltas90} faltas · {c.rating}</span>
                            {c.proposed ? <span className="text-xs text-brand-sky">Propuesta enviada</span> : <button className={btnLink + ' w-fit text-xs'}>Proponer {c.overlap}</button>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : !publishing && <p className="text-foreground/60 text-sm">No están buscando rival.</p>}
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            {[['Propuestas recibidas', received], ['Propuestas enviadas', sent]].map(([title, list]) => (
              <div key={title as string} className="flex flex-col gap-2">
                <h2 className="font-display text-xl tracking-wider uppercase">{title as string}</h2>
                <ul className="flex flex-col border border-brand-border divide-y divide-brand-border bg-brand-surface rounded-sm">
                  {(list as typeof received).length === 0 && <li className="p-4 text-sm text-foreground/60">Nada por acá.</li>}
                  {(list as typeof received).map((p) => (
                    <li key={p.id} className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between gap-2"><span>{p.rival} · {p.when}</span><StatusPill status={p.status} /></div>
                      {p.expires && <span className="text-xs text-foreground/60">{p.expires}</span>}
                      {p.status === 'Pendiente' && (p.direction === 'recibida'
                        ? <div className="flex gap-2"><button className={btnPrimary}>Aceptar</button><button className={btnSecondary}>Rechazar</button></div>
                        : <button className={btnLink + ' w-fit'}>Cancelar propuesta</button>)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      ) : (
        <p className="text-sm text-foreground/60 flex items-center gap-2"><Users className="w-4 h-4" /> Búsquedas y propuestas las ve solo el capitán.</p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl tracking-wider uppercase">Últimos partidos</h2>
        <p className="text-sm text-foreground/60">(historial público ya decidido: últimos 5 cerrados)</p>
      </section>
    </div>
  )
}
