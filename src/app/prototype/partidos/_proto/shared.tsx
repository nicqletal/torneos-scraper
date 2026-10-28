'use client'

// PROTOTIPO descartable. Piezas chicas que comparten las variantes: el
// contenido de la pantalla del partido es el mismo en las tres; lo que cambia
// es dónde vive y cómo se llega.

import { useState } from 'react'
import { MapPin, MessageCircle, Crown } from 'lucide-react'
import { type Match, teamById } from './data'

export const btnPrimary =
  'ui-action inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors font-display cursor-pointer'
export const btnSecondary =
  'ui-action inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm border border-brand-border text-foreground hover:border-brand-lime hover:text-brand-lime transition-colors font-display cursor-pointer'
export const btnLink = 'ui-action text-sm text-foreground/70 hover:text-brand-lime underline underline-offset-4 cursor-pointer'

// La "barra de direcciones" falsa: el punto del prototipo es ver qué ruta
// tendría cada pantalla.
export function FakeUrl({ path }: { path: string }) {
  return (
    <div className="font-mono text-xs text-foreground/60 border border-dashed border-brand-border rounded-sm px-3 py-1.5 w-fit">
      ruta: <span className="text-brand-sky">{path}</span>
    </div>
  )
}

export function TeamTag({ teamId }: { teamId: string }) {
  const team = teamById(teamId)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans tracking-wider uppercase border border-brand-border text-foreground/80 rounded-sm">
      {team.isCaptain && <Crown className="w-3 h-3 text-brand-lime" />}
      {team.name}
    </span>
  )
}

export function StatusPill({ status }: { status: string }) {
  const color =
    status === 'A coordinar' ? 'border-brand-amber text-brand-amber'
    : status === 'Coordinado' || status === 'Confirmado' ? 'border-brand-lime text-brand-lime'
    : status === 'Pendiente' ? 'border-brand-sky text-brand-sky'
    : 'border-brand-border text-foreground/70'
  return <span className={`px-2 py-0.5 text-xs font-sans tracking-wider uppercase border rounded-sm ${color}`}>{status}</span>
}

// El bloque de acción del partido según su estado. Interactivo solo en
// memoria, para sentir el recorrido.
export function MatchActions({ match, readOnly = false }: { match: Match; readOnly?: boolean }) {
  const [done, setDone] = useState<string | null>(null)
  const team = teamById(match.teamId)
  const isCaptain = team.isCaptain && !readOnly

  const header = (
    <div className="flex flex-col gap-1 text-sm">
      <p className="text-foreground/80">
        <span className="text-foreground/60">Rango acordado:</span> {match.range}
      </p>
      {match.venue && (
        <p className="text-foreground/80 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-lime" /> {match.venue} · {match.time}
          <a className={btnLink}>Ver en el mapa</a>
        </p>
      )}
      {isCaptain && (
        <p className="text-foreground/80 flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4 text-brand-lime" /> WhatsApp del capitán rival: {match.rivalWhatsapp}
        </p>
      )}
    </div>
  )

  if (!isCaptain) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <p className="text-sm text-foreground/60 border-l-2 border-brand-border pl-3">
          Sos del plantel: el capitán de {team.name} maneja este partido. Acá solo lo mirás.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <p className="text-sm text-brand-lime border-l-2 border-brand-lime pl-3">{done}</p>
        <button className={btnLink + ' w-fit'} onClick={() => setDone(null)}>(volver a probar)</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {header}

      {match.view === 'a-coordinar' && (
        <div className="flex flex-col gap-3 p-4 bg-brand-secondary border border-brand-border rounded-sm">
          <p className="font-display tracking-wider uppercase text-foreground">Cargá cancha y hora</p>
          <input className="ui-input" placeholder="Cancha (ej. Club Ciclón, Av. Rivadavia 9000)" />
          <select className="ui-input" defaultValue="">
            <option value="" disabled>Hora exacta</option>
            {['20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45'].map((h) => <option key={h}>{h}</option>)}
          </select>
          <button className={btnPrimary + ' w-fit'} onClick={() => setDone('Cargaste cancha y hora. Ahora le toca confirmar al rival.')}>Cargar</button>
        </div>
      )}

      {match.view === 'confirmar-cancha' && (
        <div className="flex flex-col gap-3 p-4 bg-brand-secondary border border-brand-amber/50 rounded-sm">
          <p className="font-display tracking-wider uppercase text-foreground">El rival cargó cancha y hora. ¿Está bien?</p>
          <div className="flex flex-wrap gap-2">
            <button className={btnPrimary} onClick={() => setDone('Partido coordinado.')}>Confirmar</button>
            <button className={btnSecondary} onClick={() => setDone('Corregiste cancha y hora. Ahora le toca confirmar al rival.')}>Corregir</button>
          </div>
        </div>
      )}

      {match.view === 'confirmacion-previa' && (
        <div className="flex flex-col gap-3 p-4 bg-brand-secondary border border-brand-lime/60 rounded-sm">
          <p className="font-display text-2xl tracking-wider uppercase text-foreground">¿Confirmás que van?</p>
          <p className="text-sm text-foreground/60">El rival todavía no confirmó.</p>
          <div className="flex flex-wrap gap-2">
            <button className={btnPrimary} onClick={() => setDone('Dijiste "Vamos". Si el rival también, queda Confirmado.')}>Vamos</button>
            <button className={btnSecondary} onClick={() => setDone('Dijiste "No vamos": el partido se cae y, como faltan menos de 24 h, suma una falta.')}>No vamos</button>
          </div>
        </div>
      )}

      {match.view === 'confirmar-resultado' && (
        <div className="flex flex-col gap-3 p-4 bg-brand-secondary border border-brand-amber/50 rounded-sm">
          <p className="font-display tracking-wider uppercase text-foreground">Barrio Unido cargó: Nosotros 1 – Ellos 2</p>
          <p className="text-sm text-foreground/60">Confirmá o corregí {match.deadline}.</p>
          <div className="flex flex-wrap gap-2">
            <button className={btnPrimary} onClick={() => setDone('Jugado, 1–2. Ya podés calificar al rival.')}>Es correcto</button>
            <button className={btnSecondary} onClick={() => setDone('Cargaste otro resultado. El rival tiene 48 h para corregir.')}>Corregir</button>
            <button className={btnLink} onClick={() => setDone('Reportaste "No vinieron". El rival tiene 48 h para responder.')}>No vinieron</button>
          </div>
        </div>
      )}

      {match.view === 'esperando-rival' && (
        <p className="text-sm text-foreground/60 border-l-2 border-brand-border pl-3">Nada que hacer por ahora.</p>
      )}

      {match.status !== 'Por cargar resultado' && (
        <button className={btnLink + ' w-fit text-brand-red'} onClick={() => setDone('Tiraste el partido (con motivo). Si faltan menos de 24 h, suma una falta, salvo que el rival acepte tirarlo de común acuerdo.')}>
          Tirar el partido
        </button>
      )}
    </div>
  )
}

// Formulario de publicar búsqueda, igual en las tres variantes.
export function PublishSearchForm({ teamName, onDone }: { teamName?: string; onDone: () => void }) {
  return (
    <div className="flex flex-col gap-4 p-5 bg-brand-surface border border-brand-border rounded-sm max-w-xl">
      {teamName ? (
        <p className="text-sm text-foreground/70">Equipo: <span className="text-foreground">{teamName}</span></p>
      ) : (
        <label className="flex flex-col gap-1">
          Equipo
          <select className="ui-input" defaultValue="rf">
            <option value="rf">Real Floresta</option>
            <option value="pj">Los Pibes del Jueves</option>
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1">
        Modalidad
        <select className="ui-input" defaultValue="Fútbol 5">
          <option>Fútbol 5</option><option>Fútbol 7</option><option>Fútbol 8</option>
        </select>
      </label>
      <div className="flex flex-col gap-2">
        <span className="field-label">Franjas (próximos 14 días)</span>
        <div className="flex flex-wrap gap-2 items-center">
          <input type="date" className="ui-input w-auto" />
          <select className="ui-input w-auto" defaultValue="20"><option>19</option><option>20</option><option>21</option></select>
          <span className="text-foreground/60">a</span>
          <select className="ui-input w-auto" defaultValue="22"><option>21</option><option>22</option><option>23</option></select>
          <label className="flex items-center gap-1 text-sm normal-case"><input type="checkbox" /> repetir 2 semanas</label>
        </div>
        <button className={btnLink + ' w-fit'}>+ Agregar franja</button>
      </div>
      <button className={btnPrimary + ' w-fit'} onClick={onDone}>Publicar búsqueda</button>
    </div>
  )
}
