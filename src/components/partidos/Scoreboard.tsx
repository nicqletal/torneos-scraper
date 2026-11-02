import { TeamCrest } from '@/components/TeamCrest'

// Un marcador de fútbol: el escudo y el nombre de cada equipo a los costados,
// y en el medio los goles (los números cargados, o los campos para cargarlos).
// Siempre el equipo propio a la izquierda, como en la tele.

type Side = { name: string; crest: string | null }

function TeamSide({ side }: { side: Side }) {
  return (
    <div className="min-w-0 flex flex-col items-center gap-2">
      <TeamCrest name={side.name} src={side.crest} />
      <span className="w-full text-center font-display text-sm sm:text-base uppercase tracking-wider leading-tight text-foreground line-clamp-2">{side.name}</span>
    </div>
  )
}

export function Scoreboard({ team, rival, children }: { team: Side; rival: Side; children: React.ReactNode }) {
  return (
    <div className="w-full grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-6">
      <TeamSide side={team} />
      <div className="flex items-center gap-2 sm:gap-3 pt-1">{children}</div>
      <TeamSide side={rival} />
    </div>
  )
}

// Los goles ya cargados, en grande.
export function Score({ own, rival }: { own: number; rival: number }) {
  return (
    <>
      <span className="w-14 sm:w-16 text-center font-display text-4xl sm:text-5xl leading-none text-foreground tabular-nums">{own}</span>
      <span className="font-display text-3xl text-foreground/40 leading-none">–</span>
      <span className="w-14 sm:w-16 text-center font-display text-4xl sm:text-5xl leading-none text-foreground tabular-nums">{rival}</span>
    </>
  )
}

const goalInput =
  'w-14 h-14 sm:w-16 sm:h-16 text-center font-display text-3xl sm:text-4xl bg-brand-bg border border-brand-border rounded-sm text-foreground focus:border-brand-lime focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

// Los dos campos de goles. El nombre del campo y el valor inicial de cada lado.
export function ScoreInputs({ own, rival }: { own: number | null; rival: number | null }) {
  const field = (name: string, label: string, value: number | null) => (
    <input
      name={name}
      aria-label={`Goles de ${label}`}
      type="number"
      inputMode="numeric"
      required
      min={0}
      max={99}
      step={1}
      placeholder="0"
      defaultValue={value ?? undefined}
      className={goalInput}
    />
  )
  return (
    <>
      {field('goals_for', 'nosotros', own)}
      <span className="font-display text-3xl text-foreground/40 leading-none">–</span>
      {field('goals_against', 'ellos', rival)}
    </>
  )
}
