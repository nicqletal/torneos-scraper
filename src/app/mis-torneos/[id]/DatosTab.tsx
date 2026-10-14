import { TournamentForm } from '@/components/TournamentForm'
import { getZoneGroups } from '@/components/ZoneSelect'
import { editConfirmation, tournamentToFormValues, type TournamentInput } from '@/utils/tournament-form'
import { updateTournament } from './editar/actions'

interface DatosTabProps {
  id: string
  formColumns: TournamentInput
  // Con equipos anotados se pide confirmar antes de guardar.
  inscriptionsCount: number
  // El flyer no es un campo que se precarga (un <input type="file"> no puede):
  // solo se avisa que ya hay uno.
  hasFlyer: boolean
}

// Pestaña "Datos" de la pantalla de gestión: el formulario de edición.
export async function DatosTab({ id, formColumns, inscriptionsCount, hasFlyer }: DatosTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground/70 text-xs leading-relaxed">
        Editar los datos no cuenta como confirmar que el torneo sigue vigente.
      </p>

      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 md:p-8">
        <TournamentForm
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
