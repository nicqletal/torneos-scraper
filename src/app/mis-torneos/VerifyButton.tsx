import { CheckCircle2 } from 'lucide-react'
import type { VerifyBlock } from '@/utils/tournament-verification'
import { SubmitButton } from '@/components/SubmitButton'
import { verifyTournament } from './actions'

const baseClass =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider rounded-sm'

// Lo que se le dice a quien pasa el mouse (o usa lector de pantalla) por el
// botón apagado.
const blockReasons: Record<VerifyBlock, string> = {
  confirmado_hoy: 'Ya lo confirmaste hoy',
  finalizado: 'Un torneo finalizado ya no se confirma',
}

// "Sigue vigente": la Verificación. Lo usan la lista y la pantalla de gestión.
// `block` sale de `verifyBlock`; con un motivo, el botón se ve pero apagado.
// Es solo lo que se muestra: quién puede verificar qué lo decide
// `verify_tournament` en la base.
export function VerifyButton({ id, block }: { id: string; block: VerifyBlock | null }) {
  if (block) {
    return (
      <button
        type="button"
        disabled
        title={blockReasons[block]}
        className={`${baseClass} border border-brand-border text-foreground/30 cursor-not-allowed`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Sigue vigente
        <span className="sr-only">: {blockReasons[block]}</span>
      </button>
    )
  }

  // Un <form> con el id en un campo oculto: funciona sin JavaScript.
  return (
    <form action={verifyTournament}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        pendingLabel={<><CheckCircle2 className="w-3.5 h-3.5" />Confirmando…</>}
        className={`press ${baseClass} w-full bg-brand-lime hover:bg-foreground text-brand-bg cursor-pointer`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Sigue vigente
      </SubmitButton>
    </form>
  )
}
