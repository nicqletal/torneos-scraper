'use client'

// PROTOTIPO · Variante D: pensada para el celular y para tocar poco. Una sola
// pantalla: arriba el próximo partido, después lo que te toca (cada cosa se
// resuelve en su tarjeta, sin entrar a otra página) y abajo la agenda. Buscar
// rival es una sola pregunta: ¿cuándo pueden?

import { useState } from 'react'
import { ArrowLeft, MapPin, MessageCircle, Check } from 'lucide-react'
import { matches, proposals, searches, teamById } from './data'
import { FakeUrl } from './shared'

const big =
  'press flex-1 min-h-12 rounded-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5'
const yes = big + ' bg-brand-lime text-brand-bg hover:bg-foreground'
const no = big + ' bg-brand-secondary text-foreground hover:bg-brand-border'
const link = 'press text-sm text-foreground/60 hover:text-foreground underline underline-offset-4 cursor-pointer'

export function VariantD() {
  const [screen, setScreen] = useState<'home' | 'buscar'>('home')

  return (
    // En la compu se ve como un celular, para juzgarla donde se va a usar
    <div className="flex flex-col items-center gap-4">
      <FakeUrl path={screen === 'home' ? '/partidos' : '/partidos/buscar'} />
      <div className="w-full max-w-sm min-h-[700px] border border-brand-border rounded-3xl p-4 pb-24 bg-brand-bg relative overflow-hidden">
        {screen === 'home' ? <Home onSearch={() => setScreen('buscar')} /> : <SearchRival onBack={() => setScreen('home')} />}
      </div>
    </div>
  )
}

function Home({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <NextMatch />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-foreground/50">Te toca</h2>
        <ProposalCard />
        <ResultCard />
        <VenueCard />
        <MissingVenueCard />
      </section>

      <Agenda />

      <div className="absolute bottom-4 left-4 right-4">
        <button className={yes + ' w-full min-h-14 text-lg shadow-2xl'} onClick={onSearch}>Buscar rival</button>
      </div>
    </div>
  )
}

function TeamLabel({ id }: { id: string }) {
  return <p className="text-xs uppercase tracking-wider text-foreground/50">{teamById(id).name}</p>
}

// El próximo partido, grande. Si es dentro de las 24 h, pregunta si van.
function NextMatch() {
  const m = matches.find((x) => x.id === 'm2')!
  const [answer, setAnswer] = useState<'vamos' | 'seguro' | 'cayo' | null>(null)

  return (
    <section className="rounded-xl bg-brand-surface p-4 flex flex-col gap-3">
      <TeamLabel id={m.teamId} />
      <div>
        <p className="text-foreground/60 text-sm">Mañana · {m.time}</p>
        <p className="font-display text-4xl tracking-wider uppercase leading-none mt-1">vs {m.rival}</p>
        <a className="text-sm text-foreground/70 flex items-center gap-1 mt-2"><MapPin className="w-4 h-4" /> {m.venue}</a>
      </div>

      {answer === null && (
        <>
          <p className="font-semibold">¿Van?</p>
          <div className="flex gap-2">
            <button className={yes} onClick={() => setAnswer('vamos')}>Vamos</button>
            <button className={no} onClick={() => setAnswer('seguro')}>No vamos</button>
          </div>
        </>
      )}
      {answer === 'vamos' && (
        <p className="animate-enter flex items-center gap-1.5 text-brand-lime"><Check className="w-4 h-4" /> Van. Falta que confirme {m.rival}.</p>
      )}
      {answer === 'seguro' && (
        <div className="animate-enter flex flex-col gap-2">
          <p className="text-sm">Faltan menos de 24 h: si no van, suman una falta.</p>
          <input className="ui-input" placeholder="¿Qué pasó? (lo ve el rival)" />
          <div className="flex gap-2">
            <button className={no + ' text-brand-red'} onClick={() => setAnswer('cayo')}>No vamos igual</button>
            <button className={no} onClick={() => setAnswer(null)}>Volver</button>
          </div>
        </div>
      )}
      {answer === 'cayo' && <p className="animate-enter text-foreground/70">Se cayó el partido. Le avisamos a {m.rival}.</p>}
    </section>
  )
}

function Card({ team, children }: { team: string; children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-brand-border p-4 flex flex-col gap-3">
      <TeamLabel id={team} />
      {children}
    </article>
  )
}

function Done({ text }: { text: string }) {
  return <p className="animate-enter flex items-center gap-1.5 text-brand-lime"><Check className="w-4 h-4" /> {text}</p>
}

function ProposalCard() {
  const p = proposals.find((x) => x.id === 'p1')!
  const [done, setDone] = useState<string | null>(null)
  return (
    <Card team={p.teamId}>
      <p><b>{p.rival}</b> quiere jugar el {p.when.replace(' · ', ', de ')}</p>
      {done ? <Done text={done} /> : (
        <div className="flex gap-2">
          <button className={yes} onClick={() => setDone('¡Partido! Ya podés hablar con su capitán.')}>Jugamos</button>
          <button className={no} onClick={() => setDone('Listo, le avisamos.')}>No</button>
        </div>
      )}
    </Card>
  )
}

// Confirmar el resultado es un sí o no; corregir abre los goles ahí mismo
function ResultCard() {
  const m = matches.find((x) => x.id === 'm3')!
  const [step, setStep] = useState<'ask' | 'fix' | 'done'>('ask')
  const [score, setScore] = useState({ us: 1, them: 2 })
  return (
    <Card team={m.teamId}>
      {step === 'done' ? <Done text={`Jugado, ${score.us}–${score.them}. ¡Gracias!`} /> : step === 'ask' ? (
        <>
          <p>¿Contra <b>{m.rival}</b> salió <b>1 a 2</b>?</p>
          <div className="flex gap-2">
            <button className={yes} onClick={() => setStep('done')}>Sí</button>
            <button className={no} onClick={() => setStep('fix')}>No</button>
          </div>
        </>
      ) : (
        <div className="animate-enter flex flex-col gap-3">
          <p>¿Cómo salió?</p>
          <div className="flex items-center justify-center gap-4">
            <Stepper label="Nosotros" value={score.us} onChange={(us) => setScore({ ...score, us })} />
            <span className="text-foreground/40">–</span>
            <Stepper label={m.rival} value={score.them} onChange={(them) => setScore({ ...score, them })} />
          </div>
          <button className={yes} onClick={() => setStep('done')}>Listo</button>
          <button className={link + ' w-fit self-center'}>No vinieron</button>
        </div>
      )}
    </Card>
  )
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-foreground/50 truncate max-w-24">{label}</span>
      <div className="flex items-center gap-2">
        <button className="press w-10 h-10 rounded-full bg-brand-secondary cursor-pointer" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <span className="font-display text-4xl w-8 text-center">{value}</span>
        <button className="press w-10 h-10 rounded-full bg-brand-secondary cursor-pointer" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  )
}

function VenueCard() {
  const m = matches.find((x) => x.id === 'm4')!
  const [done, setDone] = useState(false)
  return (
    <Card team={m.teamId}>
      <p><b>{m.rival}</b> propone jugar en <b>{m.venue}</b> a las <b>{m.time}</b> el {m.range.split(' · ')[0]}</p>
      {done ? <Done text="Coordinado." /> : (
        <div className="flex gap-2">
          <button className={yes} onClick={() => setDone(true)}>Dale</button>
          <button className={no}>Otra</button>
        </div>
      )}
    </Card>
  )
}

function MissingVenueCard() {
  const m = matches.find((x) => x.id === 'm1')!
  const [hour, setHour] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  return (
    <Card team={m.teamId}>
      <p>¿Dónde juegan con <b>{m.rival}</b> el {m.range.split(' · ')[0]}?</p>
      {done ? <Done text={`Listo. ${m.rival} lo confirma.`} /> : (
        <>
          <a className="press flex items-center gap-1.5 text-sm text-brand-lime w-fit"><MessageCircle className="w-4 h-4" /> Hablar con su capitán</a>
          <input className="ui-input" placeholder="Cancha" />
          <div className="flex flex-wrap gap-2">
            {['20:00', '20:30', '21:00', '21:30'].map((h) => (
              <button key={h} onClick={() => setHour(h)} className={`press px-3 min-h-10 rounded-full cursor-pointer ${hour === h ? 'bg-brand-lime text-brand-bg' : 'bg-brand-secondary'}`}>{h}</button>
            ))}
          </div>
          <button className={yes} disabled={!hour} onClick={() => setDone(true)}>Listo</button>
        </>
      )}
    </Card>
  )
}

// Lo demás, sin nada que hacer. Al tocar se abre ahí mismo.
function Agenda() {
  const [open, setOpen] = useState<string | null>(null)
  const rest = matches.filter((m) => m.id === 'm5')
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-sm text-foreground/50 mb-1">Después</h2>
      {rest.map((m) => (
        <div key={m.id} className="border-b border-brand-border">
          <button className="press w-full text-left py-3 flex justify-between cursor-pointer" onClick={() => setOpen(open === m.id ? null : m.id)}>
            <span>vs {m.rival} <span className="text-foreground/50 text-sm">· {teamById(m.teamId).name}</span></span>
            <span className="text-sm text-foreground/60">{m.range.split(' · ')[0]} {m.time}</span>
          </button>
          {open === m.id && (
            <div className="animate-enter pb-3 text-sm text-foreground/70 flex flex-col gap-1">
              <p className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {m.venue}</p>
              <p>Lo maneja el capitán de {teamById(m.teamId).name}.</p>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

const days = ['Hoy', 'Mié 28', 'Jue 29', 'Vie 30', 'Sáb 31', 'Dom 1', 'Lun 2', 'Mar 3', 'Mié 4', 'Jue 5', 'Vie 6', 'Sáb 7']
const hours = ['A la mañana', '18 a 20', '20 a 22', '22 a 24']

// Buscar rival: tocás días y horarios, y abajo aparecen los rivales. Lo
// publica al tocar "Buscar".
function SearchRival({ onBack }: { onBack: () => void }) {
  const [team, setTeam] = useState('rf')
  const [picked, setPicked] = useState<string[]>(['Mar 3'])
  const [hour, setHour] = useState('20 a 22')
  const [searched, setSearched] = useState(false)
  const [sent, setSent] = useState<string[]>(['Deportivo X'])

  const toggle = (d: string) => { setPicked(picked.includes(d) ? picked.filter((x) => x !== d) : [...picked, d]); setSearched(false) }
  const rivals = searches[0].slots
    .flatMap((s) => s.compatibles.map((c) => ({ ...c, day: s.label.split(' · ')[0] })))
    .filter((r) => picked.some((d) => r.day.startsWith(d)))

  return (
    <div className="flex flex-col gap-5">
      <button className="press flex items-center gap-1 text-foreground/60 w-fit cursor-pointer" onClick={onBack}><ArrowLeft className="w-4 h-4" /> Partidos</button>

      {/* Solo si sos capitán de más de un equipo */}
      <div className="flex gap-2">
        {['rf', 'pj'].map((id) => (
          <button key={id} onClick={() => setTeam(id)} className={`press px-3 min-h-9 rounded-full text-sm cursor-pointer ${team === id ? 'bg-foreground text-brand-bg' : 'bg-brand-secondary text-foreground/70'}`}>
            {teamById(id).name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl tracking-wider uppercase">¿Cuándo pueden?</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {days.map((d) => (
            <button key={d} onClick={() => toggle(d)} className={`press shrink-0 px-3 min-h-11 rounded-full cursor-pointer ${picked.includes(d) ? 'bg-brand-lime text-brand-bg' : 'bg-brand-secondary'}`}>{d}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {hours.map((h) => (
            <button key={h} onClick={() => { setHour(h); setSearched(false) }} className={`press px-3 min-h-11 rounded-full cursor-pointer ${hour === h ? 'bg-brand-lime text-brand-bg' : 'bg-brand-secondary'}`}>{h}</button>
          ))}
        </div>
        <p className="text-xs text-foreground/50">{teamById(team).modality} · <button className="underline cursor-pointer">cambiar</button></p>
      </div>

      {!searched ? (
        <button className={yes + ' min-h-14 text-lg'} disabled={picked.length === 0} onClick={() => setSearched(true)}>Buscar</button>
      ) : (
        <section className="animate-enter flex flex-col gap-2">
          <p className="text-sm text-foreground/60">Estos equipos también pueden. Y quedaste publicado: otros te pueden invitar a vos.</p>
          {rivals.length === 0 && <p className="text-foreground/60">Todavía nadie más puede esos días. Te avisamos si alguien te invita.</p>}
          {rivals.map((r) => (
            <div key={r.team} className="rounded-xl border border-brand-border p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.team}</p>
                <p className="text-xs text-foreground/60 truncate">{r.day} · {r.overlap} · {r.zone} · {r.rating}</p>
              </div>
              {sent.includes(r.team)
                ? <span className="text-sm text-foreground/50">Enviada</span>
                : <button className="press px-4 min-h-10 rounded-full bg-brand-lime text-brand-bg font-semibold cursor-pointer" onClick={() => setSent([...sent, r.team])}>Invitar</button>}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
