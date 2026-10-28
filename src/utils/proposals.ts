// Textos de las propuestas en /partidos. El estado lo calcula la base
// (`proposal_status`); acá solo se traduce a lo que lee el capitán.
import { slotFromRange, slotLabel } from './rival-search-form.ts'

// Lo que devuelve `proposal_status`: lo guardado (`proposal_close_reason`),
// o `pendiente` / `vencida` / `equipo_bloqueado`, que se calculan al leer.
export type ProposalStatus =
  | 'pendiente'
  | 'vencida'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada'
  | 'franja_sacada'
  | 'busqueda_cancelada'
  | 'anulada'
  | 'equipo_bloqueado'

// "Real Floresta te propone jugar · mar 4/11, de 20 a 22"
export function proposalCardTitle(fromTeamName: string, range: string): string {
  return `${fromTeamName} te propone jugar · ${slotLabel(slotFromRange(range))}`
}

// La nota que queda en el compatible cuando la última propuesta que se le
// mandó ya no está pendiente, para que no parezca que nunca se mandó. La que
// cancela uno mismo no deja nota: ya sabe lo que hizo.
export function proposalStatusLabel(status: ProposalStatus): string | null {
  switch (status) {
    case 'vencida':
      return 'Tu propuesta venció'
    case 'rechazada':
      return 'Rechazaron tu propuesta'
    case 'franja_sacada':
      return 'Se canceló tu propuesta: se sacó la franja'
    case 'busqueda_cancelada':
      return 'Se canceló tu propuesta: se canceló la búsqueda'
    case 'anulada':
      return 'Se anuló tu propuesta: ya no tienen ese horario'
    case 'equipo_bloqueado':
      return 'Se canceló la propuesta: el equipo está bloqueado por faltas'
    default:
      return null
  }
}
