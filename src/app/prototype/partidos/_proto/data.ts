// PROTOTIPO descartable (ticket "Dónde vive Partidos en la app", #41).
// Datos falsos en memoria: no hay base, no hay Server Actions.

export type Level = 'Recreativo' | 'Intermedio' | 'Competitivo'

export interface Team {
  id: string
  name: string
  zone: string
  modality: string
  level: Level
  isCaptain: boolean
}

export const myTeams: Team[] = [
  { id: 'rf', name: 'Real Floresta', zone: 'Floresta', modality: 'Fútbol 5', level: 'Intermedio', isCaptain: true },
  { id: 'pj', name: 'Los Pibes del Jueves', zone: 'Caballito', modality: 'Fútbol 7', level: 'Recreativo', isCaptain: true },
  { id: 'ab', name: 'Atlético Boedo', zone: 'Boedo', modality: 'Fútbol 5', level: 'Competitivo', isCaptain: false },
]

export interface Compatible {
  team: string
  zone: string
  closeness: 'Misma zona' | 'Mismo corredor' | 'Misma región'
  level: Level
  faltas90: number
  rating: string
  overlap: string
  proposed?: boolean
}

export interface Slot {
  id: string
  label: string
  occupied?: boolean
  compatibles: Compatible[]
}

export interface Search {
  id: string
  teamId: string
  modality: string
  slots: Slot[]
}

export const searches: Search[] = [
  {
    id: 's1',
    teamId: 'rf',
    modality: 'Fútbol 5',
    slots: [
      {
        id: 'f1',
        label: 'Mar 3/11 · 20 a 22',
        compatibles: [
          { team: 'Deportivo X', zone: 'Floresta', closeness: 'Misma zona', level: 'Intermedio', faltas90: 0, rating: '★ 4,6 (9)', overlap: '20 a 22', proposed: true },
          { team: 'La Bombonera de Luro', zone: 'Villa Luro', closeness: 'Mismo corredor', level: 'Intermedio', faltas90: 1, rating: '★ 4,1 (5)', overlap: '21 a 22' },
          { team: 'Barrio Unido', zone: 'Flores', closeness: 'Misma región', level: 'Competitivo', faltas90: 0, rating: 'Sin calificaciones', overlap: '20 a 22' },
        ],
      },
      { id: 'f2', label: 'Jue 5/11 · 19 a 23', occupied: true, compatibles: [] },
      {
        id: 'f3',
        label: 'Sáb 7/11 · 10 a 13',
        compatibles: [
          { team: 'Sportivo Lugano', zone: 'Villa Lugano', closeness: 'Misma región', level: 'Intermedio', faltas90: 0, rating: '★ 3,9 (14)', overlap: '10 a 12' },
        ],
      },
    ],
  },
]

export interface Proposal {
  id: string
  teamId: string
  direction: 'recibida' | 'enviada'
  rival: string
  rivalZone: string
  when: string
  status: 'Pendiente' | 'Vencida' | 'Rechazada' | 'Anulada'
  expires?: string
}

export const proposals: Proposal[] = [
  { id: 'p1', teamId: 'rf', direction: 'recibida', rival: 'Sportivo Lugano', rivalZone: 'Villa Lugano', when: 'Sáb 7/11 · 10 a 12', status: 'Pendiente', expires: 'vence el vie 30/10 18:00' },
  { id: 'p2', teamId: 'rf', direction: 'enviada', rival: 'Deportivo X', rivalZone: 'Floresta', when: 'Mar 3/11 · 20 a 22', status: 'Pendiente', expires: 'vence el jue 29/10 21:10' },
  { id: 'p3', teamId: 'rf', direction: 'enviada', rival: 'Juventud Unida', rivalZone: 'Liniers', when: 'Dom 25/10 · 18 a 20', status: 'Vencida' },
  { id: 'p4', teamId: 'pj', direction: 'recibida', rival: 'Unión Caballito', rivalZone: 'Caballito', when: 'Dom 1/11 · 16 a 18', status: 'Pendiente', expires: 'vence el sáb 31/10 16:00' },
]

// Lo que el capitán ve en la pantalla del partido. Es el estado calculado,
// visto desde el lado de quien mira.
export type MatchView =
  | 'a-coordinar'
  | 'confirmar-cancha'
  | 'confirmacion-previa'
  | 'esperando-rival'
  | 'confirmar-resultado'

export interface Match {
  id: string
  teamId: string
  rival: string
  rivalZone: string
  rivalWhatsapp: string
  range: string
  status: 'A coordinar' | 'Coordinado' | 'Confirmado' | 'Por cargar resultado'
  view: MatchView
  venue?: string
  time?: string
  // Qué tiene que hacer el capitán ahora, en una línea; vacío si nada
  todo?: string
  deadline?: string
  sortKey: number
}

export const matches: Match[] = [
  {
    id: 'm3', teamId: 'rf', rival: 'Barrio Unido', rivalZone: 'Flores', rivalWhatsapp: '+54 9 11 5555-0101',
    range: 'Sáb 24/10 · 18 a 20', status: 'Por cargar resultado', view: 'confirmar-resultado',
    venue: 'Fútbol Floresta, Gaona 4100', time: '18:30',
    todo: 'Cargaron el resultado: confirmá o corregí', deadline: 'antes del jue 29/10 19:40 o queda el que cargaron', sortKey: 1,
  },
  {
    id: 'm2', teamId: 'rf', rival: 'La 12 FC', rivalZone: 'Villa Luro', rivalWhatsapp: '+54 9 11 5555-0102',
    range: 'Mié 28/10 · 21 a 23', status: 'Coordinado', view: 'confirmacion-previa',
    venue: 'Club Ciclón, Av. Rivadavia 9000', time: '21:30',
    todo: '¿Confirmás que van?', deadline: 'es mañana 21:30', sortKey: 2,
  },
  {
    id: 'm4', teamId: 'pj', rival: 'Unión Floresta', rivalZone: 'Floresta', rivalWhatsapp: '+54 9 11 5555-0103',
    range: 'Vie 30/10 · 20 a 22', status: 'A coordinar', view: 'confirmar-cancha',
    venue: 'La Canchita, Yerbal 2300', time: '20:15',
    todo: 'Confirmá cancha y hora', sortKey: 3,
  },
  {
    id: 'm1', teamId: 'rf', rival: 'Deportivo Norte', rivalZone: 'Villa del Parque', rivalWhatsapp: '+54 9 11 5555-0104',
    range: 'Jue 5/11 · 20 a 22', status: 'A coordinar', view: 'a-coordinar',
    todo: 'Arreglen cancha y hora por WhatsApp y cargala', sortKey: 4,
  },
  {
    id: 'm5', teamId: 'ab', rival: 'Racing de Almagro', rivalZone: 'Almagro', rivalWhatsapp: '+54 9 11 5555-0105',
    range: 'Dom 1/11 · 11 a 13', status: 'Coordinado', view: 'esperando-rival',
    venue: 'Polideportivo Boedo', time: '11:00', sortKey: 5,
  },
]

export interface Notice {
  text: string
  when: string
  unread: boolean
  matchId?: string
}

export const notices: Notice[] = [
  { text: 'Real Floresta · Cargaron el resultado: confirmá o corregí (respondé antes del jue 29/10 19:40)', when: 'hace 2 h', unread: true, matchId: 'm3' },
  { text: 'Real Floresta · Te propusieron un partido: Sportivo Lugano, sáb 7/11 10 a 12', when: 'hace 5 h', unread: true },
  { text: 'Los Pibes del Jueves · Confirmá cancha y hora con Unión Floresta', when: 'ayer', unread: true, matchId: 'm4' },
  { text: 'Atlético Boedo · Partido coordinado: Polideportivo Boedo, dom 1/11 11:00', when: 'ayer', unread: false, matchId: 'm5' },
  { text: 'Real Floresta · Partido acordado con Deportivo Norte, jue 5/11 20 a 22', when: 'lun', unread: false, matchId: 'm1' },
]

export const teamById = (id: string) => myTeams.find((t) => t.id === id)!
