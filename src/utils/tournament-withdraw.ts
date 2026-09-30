// Texto de la confirmación de la baja. A diferencia de editar, se pide siempre:
// la baja no tiene vuelta atrás, haya equipos anotados o no.
export function withdrawConfirmation(name: string, inscriptions: number): string {
  const teams =
    inscriptions === 0
      ? 'sin equipos anotados'
      : inscriptions === 1
        ? 'con 1 equipo anotado'
        : `con ${inscriptions} equipos anotados`
  return `¿Dar de baja “${name}” ${teams}? No se puede deshacer.`
}
