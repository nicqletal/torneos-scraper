import { TournamentForm } from '@/components/TournamentForm'
import { getZoneGroups } from '@/components/ZoneSelect'
import { editConfirmation, tournamentToFormValues, type TournamentInput } from '@/utils/tournament-form'
import { updateTournament } from './editar/actions'
import { setAcceptsRequests } from './editar/actions'
import { SubmitButton } from '@/components/SubmitButton'
import { errorTextClass, secondaryButtonClass } from '@/components/button-styles'

interface DatosTabProps {
  id: string
  formColumns: TournamentInput
  // Con equipos anotados se pide confirmar antes de guardar.
  inscriptionsCount: number
  // El flyer no es un campo que se precarga (un <input type="file"> no puede):
  // solo se avisa que ya hay uno.
  hasFlyer: boolean
  // Interruptor "Recibir solicitudes desde la app".
  acceptsRequests: boolean
  // Lo deja el interruptor si no pudo guardar.
  errorCode: string | undefined
}

// Pestaña "Datos" de la pantalla de gestión: el formulario de edición.
export async function DatosTab({ id, formColumns, inscriptionsCount, hasFlyer, acceptsRequests, errorCode }: DatosTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Va aparte del formulario: se cambia con un toque y no pide confirmar
          aunque haya equipos anotados, porque no les cambia nada. */}
      <form
        action={setAcceptsRequests.bind(null, id, !acceptsRequests)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-brand-surface border border-brand-border rounded-sm"
      >
        <div className="flex flex-col gap-1">
          <p className="font-display tracking-wider text-sm text-foreground uppercase font-bold">
            Recibir solicitudes desde la app:{' '}
            <span className={acceptsRequests ? 'text-brand-lime' : 'text-foreground/60'}>
              {acceptsRequests ? 'Encendido' : 'Apagado'}
            </span>
          </p>
          <p className="text-foreground/70 text-xs leading-relaxed">
            {acceptsRequests
              ? 'Los capitanes pueden pedir la inscripción desde la ficha mientras el torneo está abierto.'
              : 'La ficha muestra solo tu contacto. Las solicitudes que ya llegaron siguen en Inscripciones.'}
          </p>
          {errorCode !== undefined && (
            <p role="alert" className={`animate-enter ${errorTextClass}`}>
              No pudimos guardar el cambio. Probá de nuevo.
            </p>
          )}
        </div>
        <SubmitButton pendingLabel="Guardando…" className={`${secondaryButtonClass} cursor-pointer shrink-0`}>
          {acceptsRequests ? 'Apagar' : 'Encender'}
        </SubmitButton>
      </form>

      <p className="text-foreground/70 text-xs leading-relaxed">
        Editar los datos no cuenta como confirmar que el torneo sigue vigente.
      </p>

      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 md:p-8">
        <TournamentForm
          stepByStep
          action={updateTournament.bind(null, id)}
          zoneGroups={await getZoneGroups()}
          submitLabel="Guardar cambios"
          pendingLabel="Guardando…"
          initialValues={tournamentToFormValues(formColumns)}
          confirmMessage={editConfirmation(inscriptionsCount)}
          hasFlyer={hasFlyer}
        />
      </div>
    </div>
  )
}
