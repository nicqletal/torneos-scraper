'use client'

// PROTOTIPO · Variante A2: la A, en minimalista. Dos pestañas en vez de
// tres (las propuestas recibidas van a "Te toca"; las enviadas se ven en su
// franja), un solo botón lima por pantalla y el partido muestra solo su
// próximo paso.

import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, MapPin, MessageCircle } from 'lucide-react'
import { myTeams, searches, proposals, matches, teamById, type Match } from './data'
import { FakeUrl } from './shared'

const primary =
  'press ui-action justify-center px-5 rounded-sm bg-brand-lime text-brand-bg hover:bg-foreground cursor-pointer'
const ghost =
  'press ui-action justify-center px-4 rounded-sm border border-brand-border text-foreground hover:border-foreground/60 cursor-pointer'
const quiet = 'press ui-action text-foreground/60 hover:text-foreground cursor-pointer'

type Tab = 'partidos' | 'buscar'

// En la lista, el próximo paso en dos o tres palabras; el detalle va en la
// página del partido.
const shortTodo: Record<string, string> = {
  'a-coordinar': 'Cargá cancha y hora',
  'confirmar-cancha': 'Confirmá cancha y hora',
  'confirmacion-previa': '¿Confirmás que van?',
  'confirmar-resultado': 'Confirmá el resultado',
}

export function VariantA2() {
  const [teamId, setTeamId] = useState('rf')
  const [tab, setTab] = useState<Tab>('partidos')
  const [matchId, setMatchId] = useState<string | null>(null)
  const [pickingTeam, setPickingTeam] = useState(false)

  const team = teamById(teamId)
  const match = matches.find((m) => m.id === matchId)
  const hasPending = (id: string) =>
    teamById(id).isCaptain &&
    (matches.some((m) => m.teamId === id && m.todo) ||
      proposals.some((p) => p.teamId === id && p.direction === 'recibida' && p.status === 'Pendiente'))

  if (match) return <MatchPage match={match} onBack={() => setMatchId(null)} />

  return (
    <div className="flex flex-col gap-8">
      <FakeUrl path={`/partidos${teamId !== 'rf' ? `?equipo=${teamId}` : ''}${tab === 'buscar' ? (teamId !== 'rf' ? '&' : '?') + 'ver=buscar' : ''}`} />

      <header className="flex flex-col gap-1">
        <h1 className="text-5xl font-display tracking-wider uppercase leading-none">Partidos</h1>
        {/* Solo aparece si estás en más de un equipo */}
        <div className="relative">
          <button className={quiet + ' gap-1 -ml-0.5'} onClick={() => setPickingTeam(!pickingTeam)}>
            {team.name}
            {!team.isCaptain && <span className="text-foreground/40 font-normal">· jugador</span>}
            <ChevronDown className="w-4 h-4" />
          </button>
          {pickingTeam && (
            <ul className="animate-enter absolute z-20 mt-1 w-64 bg-brand-surface border border-brand-border rounded-sm py-1 shadow-2xl">
              {myTeams.map((t) => (
                <li key={t.id}>
                  <button
                    className="press w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-brand-secondary cursor-pointer"
                    onClick={() => { setTeamId(t.id); setPickingTeam(false); if (!t.isCaptain) setTab('partidos') }}
                  >
                    <span className={t.id === teamId ? 'text-brand-lime' : ''}>{t.name}</span>
                    {hasPending(t.id) && <span className="w-2 h-2 rounded-full bg-brand-lime" aria-label="Tiene pendientes" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {team.isCaptain && (
        <nav className="flex gap-6 border-b border-brand-border -mt-4">
          {([['partidos', 'Partidos'], ['buscar', 'Buscar rival']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`press ui-action -mb-px border-b-2 cursor-pointer ${tab === key ? 'border-brand-lime text-foreground' : 'border-transparent text-foreground/50 hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {tab === 'partidos' ? (
        <MatchesTab teamId={teamId} onOpen={setMatchId} />
      ) : (
        <SearchTab teamId={teamId} />
      )}
    </div>
  )
}

function MatchesTab({ teamId, onOpen }: { teamId: string; onOpen: (id: string) => void }) {
  const team = teamById(teamId)
  const teamMatches = matches.filter((m) => m.teamId === teamId).sort((a, b) => a.sortKey - b.sortKey)
  const actionable = team.isCaptain ? teamMatches.filter((m) => m.todo) : []
  const rest = teamMatches.filter((m) => !actionable.includes(m))
  const received = team.isCaptain
    ? proposals.filter((p) => p.teamId === teamId && p.direction === 'recibida' && p.status === 'Pendiente')
    : []
  const [answered, setAnswered] = useState<Record<string, string>>({})

  return (
    <div className="flex flex-col gap-10">
      {(actionable.length > 0 || received.length > 0) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-foreground/50">Te toca</h2>
          <ul className="flex flex-col divide-y divide-brand-border border-y border-brand-border">
            {received.map((p) => (
              <li key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="w-2 h-2 rounded-full bg-brand-lime shrink-0 hidden sm:block" />
                <div className="flex-1">
                  <p>Te propusieron jugar</p>
                  <p className="text-sm text-foreground/60">{p.rival} · {p.when}</p>
                </div>
                {answered[p.id] ? (
                  <span className="animate-enter text-sm text-foreground/60">{answered[p.id]}</span>
                ) : (
                  <div className="flex gap-2">
                    <button className={ghost} onClick={() => setAnswered({ ...answered, [p.id]: 'Rechazada' })}>Rechazar</button>
                    <button className={ghost + ' border-brand-lime text-brand-lime'} onClick={() => setAnswered({ ...answered, [p.id]: 'Aceptada: ya es un partido' })}>Aceptar</button>
                  </div>
                )}
              </li>
            ))}
            {actionable.map((m) => (
              <MatchRow key={m.id} match={m} onOpen={onOpen} highlight />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-foreground/50">Próximos</h2>
        {rest.length === 0 ? (
          <p className="text-foreground/60 py-4">Nada más por ahora.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-brand-border border-y border-brand-border">
            {rest.map((m) => <MatchRow key={m.id} match={m} onOpen={onOpen} />)}
          </ul>
        )}
      </section>
    </div>
  )
}

function MatchRow({ match, onOpen, highlight = false }: { match: Match; onOpen: (id: string) => void; highlight?: boolean }) {
  const [day, hours] = match.range.split(' · ')
  return (
    <li>
      <button className="press w-full text-left py-4 flex items-center gap-4 cursor-pointer group" onClick={() => onOpen(match.id)}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${highlight ? 'bg-brand-lime' : 'bg-transparent'}`} />
        <div className="flex-1 min-w-0">
          <p className="truncate">{highlight ? shortTodo[match.view] : `vs ${match.rival}`}</p>
          <p className="text-sm text-foreground/60 truncate">
            {highlight ? `vs ${match.rival} · ` : ''}{day} · {match.time ?? hours}{!highlight ? ` · ${match.status}` : ''}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground transition-colors" />
      </button>
    </li>
  )
}

function SearchTab({ teamId }: { teamId: string }) {
  const search = searches.find((s) => s.teamId === teamId)
  const [open, setOpen] = useState<string | null>(null)
  const [sent, setSent] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)

  if (!search) {
    return publishing ? (
      <form className="animate-enter flex flex-col gap-5 max-w-md" onSubmit={(e) => { e.preventDefault(); setPublishing(false) }}>
        <label className="flex flex-col gap-1.5">
          Modalidad
          <select className="ui-input" defaultValue={teamById(teamId).modality}><option>Fútbol 5</option><option>Fútbol 7</option></select>
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="field-label">¿Cuándo pueden jugar?</span>
          <div className="flex gap-2">
            <input type="date" className="ui-input flex-1" />
            <select className="ui-input" defaultValue="20"><option>19</option><option>20</option><option>21</option></select>
            <select className="ui-input" defaultValue="22"><option>21</option><option>22</option><option>23</option></select>
          </div>
          <button type="button" className={quiet + ' w-fit text-sm'}>+ Otro día</button>
        </div>
        <button className={primary + ' w-fit'}>Publicar búsqueda</button>
      </form>
    ) : (
      <div className="flex flex-col items-start gap-4 py-8">
        <p className="text-foreground/70 max-w-sm">Decí cuándo pueden jugar y te mostramos equipos con horario en común.</p>
        <button className={primary} onClick={() => setPublishing(true)}>Buscar rival</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground/50">{search.modality} · tus franjas</p>
      <ul className="flex flex-col divide-y divide-brand-border border-y border-brand-border">
        {search.slots.map((slot) => (
          <li key={slot.id}>
            <button
              disabled={slot.occupied}
              className="press w-full py-4 flex items-center justify-between text-left cursor-pointer disabled:cursor-default"
              onClick={() => setOpen(open === slot.id ? null : slot.id)}
            >
              <span className={slot.occupied ? 'text-foreground/40' : ''}>{slot.label}</span>
              <span className="text-sm text-foreground/50 flex items-center gap-1">
                {slot.occupied ? 'Ya tienen partido' : `${slot.compatibles.length} ${slot.compatibles.length === 1 ? 'rival' : 'rivales'}`}
                {!slot.occupied && <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open === slot.id ? 'rotate-180' : ''}`} />}
              </span>
            </button>
            {open === slot.id && (
              <ul className="animate-enter flex flex-col gap-1 pb-4">
                {slot.compatibles.map((c) => {
                  const isSent = c.proposed || sent.includes(slot.id + c.team)
                  return (
                    <li key={c.team} className="flex items-center gap-4 pl-4 py-2 border-l border-brand-border">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{c.team}</p>
                        <p className="text-sm text-foreground/60 truncate">
                          {c.closeness} · {c.level} · {c.rating}
                          {c.faltas90 > 0 && <span className="text-brand-amber"> · {c.faltas90} falta</span>}
                        </p>
                      </div>
                      {isSent ? (
                        <span className="animate-enter text-sm text-foreground/50">Enviada</span>
                      ) : (
                        <button className={ghost} onClick={() => setSent([...sent, slot.id + c.team])}>Proponer {c.overlap}</button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-6">
        <button className={quiet + ' text-sm'}>+ Agregar franja</button>
        <button className={quiet + ' text-sm'}>Cancelar búsqueda</button>
      </div>
    </div>
  )
}

// La página del partido: arriba quién y cuándo, después un único próximo
// paso, los datos útiles y, al final y discreto, tirarlo.
function MatchPage({ match, onBack }: { match: Match; onBack: () => void }) {
  const [done, setDone] = useState<string | null>(null)
  const isCaptain = teamById(match.teamId).isCaptain
  const [day, hours] = match.range.split(' · ')

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <FakeUrl path={`/partidos/${match.id}`} />
      <button className={quiet + ' w-fit gap-1 -ml-1'} onClick={onBack}><ArrowLeft className="w-4 h-4" /> Partidos</button>

      <header className="flex flex-col gap-1">
        <p className="text-sm text-foreground/50">{teamById(match.teamId).name} vs</p>
        <h1 className="text-5xl font-display tracking-wider uppercase leading-none">{match.rival}</h1>
        <p className="text-foreground/70">{day} · {match.time ?? `entre ${hours}`} · {match.status}</p>
      </header>

      {isCaptain && match.view !== 'esperando-rival' && (
        <section className="p-5 rounded-sm bg-brand-surface border border-brand-border flex flex-col gap-4">
          {done ? (
            <p className="animate-enter text-brand-lime">{done}</p>
          ) : (
            <NextStep match={match} onDone={setDone} />
          )}
        </section>
      )}

      <dl className="flex flex-col divide-y divide-brand-border border-y border-brand-border">
        <div className="py-3 flex items-center gap-3">
          <MapPin className="w-4 h-4 text-foreground/50" />
          <dd className="flex-1">{match.venue ?? <span className="text-foreground/50">Cancha sin cargar</span>}</dd>
          {match.venue && <a className={quiet + ' text-sm'}>Ver en el mapa</a>}
        </div>
        {isCaptain && (
          <div className="py-3 flex items-center gap-3">
            <MessageCircle className="w-4 h-4 text-foreground/50" />
            <dd className="flex-1">Capitán de {match.rival}</dd>
            <a className={quiet + ' text-sm'}>Escribir por WhatsApp</a>
          </div>
        )}
      </dl>

      {isCaptain && match.status !== 'Por cargar resultado' && (
        <button className={quiet + ' w-fit text-sm hover:text-brand-red'}>Tirar el partido</button>
      )}
      {!isCaptain && <p className="text-sm text-foreground/50">El capitán maneja el partido; vos lo seguís desde acá.</p>}
    </div>
  )
}

function NextStep({ match, onDone }: { match: Match; onDone: (msg: string) => void }) {
  switch (match.view) {
    case 'a-coordinar':
      return (
        <>
          <div>
            <p className="font-semibold">¿Dónde y a qué hora?</p>
            <p className="text-sm text-foreground/60">Arreglalo por WhatsApp y cargalo; el rival lo confirma.</p>
          </div>
          <input className="ui-input" placeholder="Cancha" />
          <select className="ui-input" defaultValue="">
            <option value="" disabled>Hora</option>
            {['20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45'].map((h) => <option key={h}>{h}</option>)}
          </select>
          <button className={primary + ' w-fit'} onClick={() => onDone('Listo. Le avisamos al rival para que confirme.')}>Guardar</button>
        </>
      )
    case 'confirmar-cancha':
      return (
        <>
          <div>
            <p className="font-semibold">El rival propuso {match.venue}, {match.time}</p>
            <p className="text-sm text-foreground/60">Si está bien, confirmalo.</p>
          </div>
          <div className="flex gap-2">
            <button className={primary} onClick={() => onDone('Partido coordinado.')}>Confirmar</button>
            <button className={ghost} onClick={() => onDone('Cambiaste cancha u hora. Ahora confirma el rival.')}>Cambiar</button>
          </div>
        </>
      )
    case 'confirmacion-previa':
      return (
        <>
          <div>
            <p className="font-semibold">¿Confirmás que van?</p>
            <p className="text-sm text-foreground/60">El rival todavía no confirmó.</p>
          </div>
          <div className="flex gap-2">
            <button className={primary} onClick={() => onDone('Anotado. Si el rival también confirma, queda Confirmado.')}>Vamos</button>
            <button className={ghost} onClick={() => onDone('El partido se cayó. Como faltaban menos de 24 h, suma una falta.')}>No vamos</button>
          </div>
        </>
      )
    case 'confirmar-resultado':
      return (
        <>
          <div>
            <p className="font-semibold">{match.rival} cargó: {teamById(match.teamId).name} 1 – 2 {match.rival}</p>
            <p className="text-sm text-foreground/60">Respondé {match.deadline}.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button className={primary} onClick={() => onDone('Jugado, 1–2. Ya podés calificar al rival.')}>Es correcto</button>
            <button className={ghost} onClick={() => onDone('Cargaste otro resultado. El rival tiene 48 h para corregir.')}>Corregir</button>
            <button className={quiet + ' text-sm ml-2'} onClick={() => onDone('Reportaste que no vinieron. Tienen 48 h para responder.')}>No vinieron</button>
          </div>
        </>
      )
    default:
      return null
  }
}
