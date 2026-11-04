# S06 · UC-E06 — Cargar una inscripción

Caso de uso: [UC-E06](../02-casos-de-uso.md#uc-e06--cargar-una-inscripción) · Pantalla: [P3](../03-pantallas.md#p3--gestión-del-torneo) (pestaña Inscripciones) · Requerimientos: RF-E23 a RF-E30

No hay desplegables: el equipo vinculado se elige de **resultados de una búsqueda por nombre** (un campo de texto), no de una lista fija. Los resultados salen de la base, así que los provee `EquipoRepository`. Los dos tipos de inscripción son **un solo caso de uso** y van en el mismo diagrama.

```mermaid
sequenceDiagram
    actor Organizador
    participant GestionTorneo
    participant InscripcionService
    participant Validador
    participant EquipoRepository
    participant InscripcionRepository

    Organizador->>GestionTorneo: abrir la pestaña Inscripciones
    GestionTorneo-->>Organizador: mostrar el buscador de equipos, el campo para anotar por nombre y los equipos anotados

    alt Inscripción vinculada
        Organizador->>GestionTorneo: escribir parte del nombre de un equipo y buscar
        GestionTorneo->>Validador: validarBusqueda(texto)
        Validador-->>GestionTorneo: texto válido (al menos 2 letras) o error
        GestionTorneo->>EquipoRepository: buscarEquiposActivos(texto)
        Note over EquipoRepository: Solo equipos no disueltos, hasta 10 resultados. Nunca lee el Plantel
        EquipoRepository-->>GestionTorneo: equipos con su Zona
        GestionTorneo-->>Organizador: mostrar los resultados con «Anotar» (o «Ya anotado»)

        Organizador->>GestionTorneo: elegir un equipo con «Anotar»
        GestionTorneo->>InscripcionService: anotarEquipoVinculado(torneoId, equipoId)
        InscripcionService->>InscripcionRepository: agregarVinculada(torneoId, equipoId)
        InscripcionRepository->>InscripcionRepository: verificar torneo propio y no Finalizado, equipo existente y activo, no anotado antes y cupo
    else Inscripción por nombre
        Organizador->>GestionTorneo: escribir el nombre del equipo y confirmar con «Anotar equipo»
        GestionTorneo->>InscripcionService: anotarEquipoPorNombre(torneoId, nombre)
        InscripcionService->>Validador: validarNombreDeEquipo(nombre)
        Validador-->>InscripcionService: nombre normalizado (de 2 a 50 caracteres) o error
        InscripcionService->>InscripcionRepository: agregarPorNombre(torneoId, nombre)
        InscripcionRepository->>InscripcionRepository: verificar torneo propio y no Finalizado, y cupo
    end

    alt Inscripción rechazada
        InscripcionRepository-->>InscripcionService: motivo (cupo completo, Finalizado, ajeno, equipo inexistente, disuelto o ya anotado)
        InscripcionService-->>GestionTorneo: mensaje del motivo
        GestionTorneo-->>Organizador: mostrar el error (conserva el nombre escrito o la búsqueda)
    else Inscripción guardada
        InscripcionRepository->>InscripcionRepository: guardar la inscripción (cuenta para el cupo)
        Note over InscripcionRepository: Si el cupo se completa, el torneo pasa a Cerrado al leer
        InscripcionRepository-->>InscripcionService: ok
        InscripcionService-->>GestionTorneo: ok
        GestionTorneo-->>Organizador: mostrar la lista de equipos anotados actualizada
    end
```

## Cómo se lee

- **La inscripción ya se arregló afuera.** El capitán le escribió al organizador por WhatsApp o Instagram (UC-B04); acá el organizador solo **registra** lo acordado. El capitán **no confirma** la vinculación y el organizador **no ve el WhatsApp** del capitán.
- **Dos tipos.** La **vinculada** busca un equipo de la app (el resultado muestra la **Zona**, porque los nombres se repiten) y solo ella genera Avisos y figura en la historia del equipo. La **por nombre** es para un equipo que no está en la app. **Las dos cuentan para el cupo** y aparecen por nombre en la ficha pública.
- **Se valida de nuevo al guardar.** Que el resultado aparezca en la pantalla no garantiza que el equipo siga activo o libre: las reglas las comprueba la función de la base, que es la única que escribe en las inscripciones. El `torneoId` y el `equipoId` vienen del cliente y no son de confiar.
- **Los rechazos, por su código:** cupo completo («Subí el cupo desde la pestaña “Datos”…»), torneo Finalizado, torneo ajeno o inexistente, equipo inexistente, **equipo disuelto** (no recibe inscripciones) y **equipo ya anotado** (como mucho una vinculada por equipo y torneo). Un error desconocido da un mensaje genérico.
- **Torneo Cerrado o En curso:** sí admite inscripciones; el organizador sigue acomodando la lista. Un Finalizado no.
- **Si falla una vinculada,** la pantalla vuelve a la pestaña **conservando la búsqueda**, para que el error se vea al lado de lo que se eligió. Con el equipo anotado, la búsqueda cumplió y vuelve a la lista limpia.
- **Funciona sin JavaScript:** el buscador es un formulario GET (`?q=`) y «Anotar» es un formulario con los ids en campos ocultos.

## Correspondencia en el código

`addInscription` y `addLinkedInscription` (`src/app/mis-torneos/[id]/inscripciones/actions.ts`) llaman a las RPC `add_inscription` y `add_linked_inscription`; el buscador es `TeamSearch` (con `parseTeamQuery`) y el nombre se valida con `parseTeamName` (`utils/inscriptions.ts`). Probado en `inscriptions_test.sql` y `linked_inscriptions_test.sql`.
