'use client'

// PROTOTIPO · La pantalla de Partidos, con dos juegos de reglas para comparar:
// - 'hoy': las reglas de docs/decisiones-casos-de-uso.md (el otro capitán
//   confirma cancha, hora y resultado; "¿Van?" 24 h antes).
// - 'silencio': lo que carga un capitán queda; el otro solo actúa si está mal.

import { useState } from 'react'
import { MapPin, MessageCircle, Check } from 'lucide-react'
import { matches, proposals, searches, teamById, type Match } from './data'
import { FakeUrl } from './shared'

const yes = 'press px-4 min-h-10 rounded-sm bg-brand-lime text-brand-bg font-semibold hover:bg-foreground cursor-pointer'
const no = 'press px-4 min-h-10 rounded-sm bg-brand-secondary text-foreground hover:bg-brand-border cursor-pointer'
const quiet = 'press text-sm text-foreground/50 hover:text-foreground underline-offset-4 hover:underline cursor-pointer'

export type Rules = 'hoy' | 'silencio'

export function VariantE({ rules }: { rules: Rules }) {
  return (
    <div className="flex flex-col gap-6">
      <FakeUrl path="/partidos" />
      <h1 className="text-5xl font-display tracking-wider uppercase leading-none">Partidos</h1>
      <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
        <div className="flex flex-col gap-10">
          <NextMatch rules={rules} />
          <Proposal />
          <MatchList rules={rules} />
        </div>
        <SearchPanel />
      </div>
    </div>
  )
}

function NextMatch({ rules }: { rules: Rules }) {
  const m = matches.find((x) => x.id === 'm2')!
  const [going, setGoing] = useState(false)
  return (
    <section className="rounded-sm bg-brand-surface p-6 flex flex-col gap-4">
      <p className="text-sm text-foreground/50">Próximo partido · {teamById(m.teamId).name}</p>
      <div>
        <p className="font-display text-5xl tracking-wider uppercase leading-none">vs {m.rival}</p>
        <p className="text-lg mt-2">Mañana, miércoles 28/10, a las {m.time}</p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-foreground/70">
        <a className="press flex items-center gap-1.5 hover:text-foreground cursor-pointer"><MapPin className="w-4 h-4" /> {m.venue}</a>
        <a className="press flex items-center gap-1.5 hover:text-foreground cursor-pointer"><MessageCircle className="w-4 h-4" /> WhatsApp de su capitán</a>
      </div>
      {rules === 'hoy' && !going ? (
        <div className="flex items-center gap-3">
          <span className="font-semibold">¿Van?</span>
          <button className={yes} onClick={() => setGoing(true)}>Vamos</button>
          <button className={no}>No vamos</button>
        </div>
      ) : rules === 'hoy' ? (
        <p className="animate-enter text-brand-lime flex items-center gap-1.5"><Check className="w-4 h-4" /> Van. Falta que confirme {m.rival}.</p>
      ) : (
        <button className={quiet + ' w-fit'}>No podemos ir</button>
      )}
    </section>
  )
}

// Lo único que espera una respuesta
function Proposal() {
  const p = proposals.find((x) => x.id === 'p1')!
  const [done, setDone] = useState<string | null>(null)
  return (
    <section className="rounded-sm border border-brand-lime/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <p className="text-lg"><b>{p.rival}</b> los invitó a jugar</p>
        <p className="text-foreground/60">Sábado 7/11, de 10 a 12 · {teamById(p.teamId).name}</p>
      </div>
      {done ? (
        <p className="animate-enter text-brand-lime flex items-center gap-1.5"><Check className="w-4 h-4" /> {done}</p>
      ) : (
        <div className="flex gap-2">
          <button className={yes} onClick={() => setDone('¡Partido!')}>Jugamos</button>
          <button className={no} onClick={() => setDone('Le avisamos.')}>No</button>
        </div>
      )}
    </section>
  )
}

// El resto son datos, no preguntas. Cada fila tiene a lo sumo un link.
function MatchList({ rules }: { rules: Rules }) {
  // Por fecha (en datos reales, por hora de inicio)
  const list = ['m3', 'm4', 'm5', 'm1'].map((id) => matches.find((m) => m.id === id)!)
  return (
    <section className="flex flex-col">
      <h2 className="text-sm text-foreground/50 mb-2">Tus partidos</h2>
      <ul className="flex flex-col divide-y divide-brand-border border-y border-brand-border">
        {list.map((m) => <Row key={m.id} m={m} rules={rules} />)}
      </ul>
    </section>
  )
}

function Row({ m, rules }: { m: Match; rules: Rules }) {
  const [confirmed, setConfirmed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [day] = m.range.split(' · ')
  const captain = teamById(m.teamId).isCaptain

  let detail: React.ReactNode
  let action: React.ReactNode = null
  const ask = (yesLabel: string, noLabel: string) =>
    confirmed
      ? <span className="animate-enter text-sm text-brand-lime">Listo</span>
      : <div className="flex gap-2"><button className={yes + ' min-h-9 text-sm'} onClick={() => setConfirmed(true)}>{yesLabel}</button><button className={no + ' min-h-9 text-sm'}>{noLabel}</button></div>

  if (rules === 'hoy' && m.view === 'confirmar-resultado') {
    detail = <>{m.rival} cargó <b>1 a 2</b>. ¿Está bien?</>
    action = ask('Sí', 'Corregir')
  } else if (rules === 'hoy' && m.view === 'confirmar-cancha') {
    detail = <>{m.rival} propuso {m.venue} · {m.time}</>
    action = ask('Confirmar', 'Cambiar')
  } else if (m.view === 'confirmar-resultado') {
    detail = <>Salió <b>1 a 2</b> <span className="text-foreground/50">(lo cargó {m.rival})</span></>
    action = <button className={quiet}>No fue así</button>
  } else if (!m.venue && !saved) {
    detail = <span className="text-brand-amber">Falta cancha y hora</span>
    action = captain && !editing ? <button className={quiet + ' text-brand-lime'} onClick={() => setEditing(true)}>Agregar</button> : null
  } else {
    detail = <>{saved ? 'Club Ciclón' : m.venue} · {saved ? '20:30' : m.time}</>
    action = captain ? <button className={quiet}>Cambiar</button> : <span className="text-sm text-foreground/40">Sos jugador</span>
  }

  return (
    <li className="py-4 flex flex-col gap-3">
      <div className="grid grid-cols-[6rem_1fr_auto] gap-4 items-baseline">
        <span className="text-foreground/60">{day}</span>
        <div className="min-w-0">
          <p>vs {m.rival} <span className="text-sm text-foreground/40">· {teamById(m.teamId).name}</span></p>
          <p className="text-sm text-foreground/70">{detail}</p>
        </div>
        {action}
      </div>
      {editing && (
        <div className="animate-enter ml-28 flex flex-wrap gap-2">
          <input className="ui-input flex-1 min-w-48" placeholder="Cancha" defaultValue="Club Ciclón" />
          <select className="ui-input w-28" defaultValue="20:30">{['20:00', '20:30', '21:00', '21:30'].map((h) => <option key={h}>{h}</option>)}</select>
          <button className={yes} onClick={() => { setSaved(true); setEditing(false) }}>Guardar</button>
        </div>
      )}
    </li>
  )
}

const twoWeeks = ['Mar 27', 'Mié 28', 'Jue 29', 'Vie 30', 'Sáb 31', 'Dom 1', 'Lun 2', 'Mar 3', 'Mié 4', 'Jue 5', 'Vie 6', 'Sáb 7', 'Dom 8', 'Lun 9']
const blocks = ['A la mañana', '18 a 20', '20 a 22', '22 a 24']

function SearchPanel() {
  const [team, setTeam] = useState('rf')
  const [picked, setPicked] = useState<string[]>([])
  const [block, setBlock] = useState('20 a 22')
  const [sent, setSent] = useState<string[]>([])

  const rivals = searches[0].slots
    .flatMap((s) => s.compatibles.map((c) => ({ ...c, day: s.label.split(' · ')[0] })))
    .filter((r) => picked.some((d) => r.day.startsWith(d)))

  return (
    <aside className="lg:sticky lg:top-24 rounded-sm border border-brand-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-3xl tracking-wider uppercase leading-none">Buscar rival</h2>
        <p className="text-sm text-foreground/60 mt-1">Marcá cuándo pueden y te mostramos quién también.</p>
      </div>

      <div className="flex gap-2">
        {['rf', 'pj'].map((id) => (
          <button key={id} onClick={() => setTeam(id)} className={`press px-3 min-h-9 rounded-full text-sm cursor-pointer ${team === id ? 'bg-foreground text-brand-bg' : 'bg-brand-secondary text-foreground/70'}`}>{teamById(id).name}</button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {twoWeeks.map((d) => {
          const [wd, n] = d.split(' ')
          const on = picked.includes(d)
          return (
            <button key={d} onClick={() => setPicked(on ? picked.filter((x) => x !== d) : [...picked, d])}
              className={`press aspect-square rounded-sm flex flex-col items-center justify-center cursor-pointer ${on ? 'bg-brand-lime text-brand-bg' : 'bg-brand-secondary hover:bg-brand-border'}`}>
              <span className="text-[10px] uppercase opacity-70">{wd}</span>
              <span className="font-semibold">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {blocks.map((b) => (
          <button key={b} onClick={() => setBlock(b)} className={`press px-3 min-h-9 rounded-full text-sm cursor-pointer ${block === b ? 'bg-brand-lime text-brand-bg' : 'bg-brand-secondary'}`}>{b}</button>
        ))}
      </div>

      {picked.length === 0 ? (
        <p className="text-sm text-foreground/50">Probá con el martes 3 o el sábado 7.</p>
      ) : (
        <div className="animate-enter flex flex-col gap-2">
          {rivals.length === 0 && <p className="text-sm text-foreground/60">Nadie más puede esos días todavía. Si alguien los invita, te avisamos.</p>}
          {rivals.map((r) => (
            <div key={r.team} className="flex items-center gap-3 py-2 border-b border-brand-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.team}</p>
                <p className="text-xs text-foreground/60 truncate">{r.day} · {r.overlap} · {r.zone} · {r.rating}</p>
              </div>
              {sent.includes(r.team)
                ? <span className="text-sm text-foreground/50">Invitado</span>
                : <button className={yes + ' min-h-9 text-sm'} onClick={() => setSent([...sent, r.team])}>Invitar</button>}
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
