'use client'

import { useState } from 'react'
import { SHIFTS, dayName, type Shift } from '@/utils/rival-search-form'
import { chip, chipOff, chipOn, input } from './styles'

// Elegir cuándo puede jugar el equipo, en dos toques: el día (grilla de 14
// días, dos semanas de siete, como un calendario: se ve entera, sin scroll) y
// el turno (Mañana, Tarde, Noche). "Otro" abre las dos horas. Es un
// componente de cliente porque el turno tiene que llenar las horas; lo que se
// manda al servidor es lo de siempre: `day`, `from`, `to`.
export function SlotPicker({ days, today, nowHour }: { days: string[]; today: string; nowHour: number }) {
  const [day, setDay] = useState<string | null>(null)
  const [shift, setShift] = useState<Shift | 'otro'>('noche')
  const [custom, setCustom] = useState({ from: 20, to: 22 })

  const preset = SHIFTS.find((s) => s.value === shift)
  const from = preset ? preset.from : custom.from
  const to = preset ? preset.to : custom.to
  // Hoy, un turno que ya empezó no sirve: una franja de hoy arranca en una
  // hora que no pasó (la misma regla que valida el formulario).
  const isToday = day === today
  const shiftPassed = (start: number) => isToday && start <= nowHour

  const hours = Array.from({ length: 17 }, (_, i) => i + 8) // 8 a 24

  return (
    <div className="flex flex-col gap-5">
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold uppercase tracking-wider text-foreground/60 mb-2">Día</legend>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((d) => {
            const name = dayName(d, today)
            const [weekday, number] = name === 'Hoy' || name === 'Mañana' ? [name, d.slice(-2).replace(/^0/, '')] : name.split(' ')
            return (
              <label
                key={d}
                className={`cursor-pointer flex flex-col items-center justify-center h-14 sm:h-16 rounded-sm border select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-lime ${
                  day === d ? chipOn : chipOff
                }`}
              >
                <input type="radio" name="day" value={d} required className="sr-only" checked={day === d} onChange={() => setDay(d)} />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider leading-none">{weekday}</span>
                <span className="font-display text-xl sm:text-2xl leading-none mt-1">{number}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold uppercase tracking-wider text-foreground/60 mb-2">Hora</legend>
        <div className="grid grid-cols-4 gap-2">
          {SHIFTS.map((s) => {
            const disabled = shiftPassed(s.from)
            return (
              <button
                key={s.value}
                type="button"
                disabled={disabled}
                aria-pressed={shift === s.value}
                onClick={() => setShift(s.value)}
                className={`${chip} ${shift === s.value ? chipOn : chipOff} disabled:opacity-40 disabled:cursor-not-allowed flex-col !items-center gap-0 px-2 py-2`}
              >
                <span>{s.label}</span>
                <span className={`text-xs font-normal ${shift === s.value ? 'text-brand-bg/70' : 'text-foreground/50'}`}>
                  {s.from} a {s.to} h
                </span>
              </button>
            )
          })}
          <button type="button" aria-pressed={shift === 'otro'} onClick={() => setShift('otro')} className={`${chip} ${shift === 'otro' ? chipOn : chipOff} flex-col !items-center gap-0 px-2 py-2`}>
            <span>Otro</span>
            <span className={`text-xs font-normal ${shift === 'otro' ? 'text-brand-bg/70' : 'text-foreground/50'}`}>a elegir</span>
          </button>
        </div>
        {shift === 'otro' && (
          <div className="flex items-center gap-2 mt-2 text-foreground">
            <label className="flex items-center gap-2">
              <span>de</span>
              <select
                aria-label="Hora de inicio"
                value={custom.from}
                onChange={(e) => {
                  const f = Number(e.target.value)
                  setCustom({ from: f, to: Math.max(custom.to, f + 1) })
                }}
                className={input}
              >
                {hours.slice(0, -1).map((h) => (
                  <option key={h} value={h} disabled={shiftPassed(h)}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span>a</span>
              <select aria-label="Hora de fin" value={custom.to} onChange={(e) => setCustom({ ...custom, to: Number(e.target.value) })} className={input}>
                {hours.filter((h) => h > custom.from).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-foreground/60">h</span>
          </div>
        )}
      </fieldset>

      <label className="flex items-center gap-3 text-foreground/80 cursor-pointer">
        <input type="checkbox" name="repeat" className="accent-brand-lime w-5 h-5" />
        Repetir la semana que viene
      </label>
    </div>
  )
}
