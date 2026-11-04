# S13 · UC-D13 — Calificar al rival

Caso de uso: [UC-D13](../02-casos-de-uso.md#uc-d13--calificar-al-rival) · Pantalla: [P1](../03-pantallas.md#p1--partidos) («Calificar a …») · Requerimientos: RF-D28, RF-D29

El formulario tiene **una elección entre cinco opciones** (de 1 a 5 estrellas) y un comentario de texto. Las estrellas son una **lista fija del código** (botones de opción), así que no hay repositorio que consultar. Al enviar viajan solo los valores elegidos.

```mermaid
sequenceDiagram
    actor Capitan as Capitán
    participant PantallaPartidos
    participant PartidoService
    participant Validador
    participant CalificacionRepository

    PantallaPartidos->>CalificacionRepository: obtenerEstadoDeCalificacion(partidoId)
    CalificacionRepository-->>PantallaPartidos: si ya calificó, si el rival calificó, el plazo y la calificación recibida (solo si ya se reveló)
    PantallaPartidos-->>Capitan: mostrar «Calificar a [rival]» con las estrellas y el comentario (si el partido está Jugado y no pasaron 7 días)

    Capitan->>PantallaPartidos: elegir de 1 a 5 estrellas y, si quiere, escribir un comentario
    Capitan->>PantallaPartidos: confirmar con «Calificar»
    PantallaPartidos->>PartidoService: calificarRival(partidoId, estrellas, comentario?)
    PartidoService->>Validador: validarCalificacion(estrellas, comentario)
    Validador-->>PartidoService: valores válidos o error

    alt Valores inválidos
        PartidoService-->>PantallaPartidos: «Elegí de 1 a 5 estrellas.» o «El comentario va hasta 500 caracteres.»
        PantallaPartidos-->>Capitan: mostrar error
    else Valores válidos
        PartidoService->>CalificacionRepository: calificar(partidoId, estrellas, comentario)
        CalificacionRepository->>CalificacionRepository: verificar Capitán, partido Jugado (con o sin resultado), dentro de los 7 días y que su equipo no haya calificado ya

        alt Rechazada (partido caído, en conflicto o con falta, plazo vencido, o ya calificó)
            CalificacionRepository-->>PartidoService: motivo de rechazo
            PartidoService-->>PantallaPartidos: motivo de rechazo
            PantallaPartidos-->>Capitan: mostrar error
        else Calificación guardada
            CalificacionRepository->>CalificacionRepository: guardar una calificación por equipo y partido (no se edita)
            opt El rival ya había calificado
                Note over CalificacionRepository: Se revelan las dos calificaciones. Aviso «Ya podés ver tu calificación» a quien calificó primero
            end
            CalificacionRepository-->>PartidoService: ok
            PartidoService-->>PantallaPartidos: ok
            PantallaPartidos-->>Capitan: mostrar «ya calificaste» (la que te pusieron se ve cuando los dos calificaron o vencieron los 7 días)
        end
    end
```

## Cómo se lee

- **Cuándo se puede:** solo en un partido **Jugado** (con o sin resultado) y hasta **7 días** después de que quedó Jugado. Un partido caído, en conflicto o con falta **no se califica**. Un equipo **disuelto** se sigue calificando hasta que venzan los 7 días.
- **Una calificación por equipo y partido, y no se edita.** El Capitán califica al rival; 1 a 5 estrellas y un comentario opcional de hasta 500 caracteres.
- **El comentario es privado:** solo lo lee el administrador al revisar un equipo reportado; la tabla de calificaciones no se lee por la API.
- **Revelación cruzada, para que nadie califique en represalia.** Cada Capitán ve la calificación que le pusieron recién cuando **los dos calificaron** o **pasaron los 7 días**. Cuando la segunda calificación revela las dos, el que calificó primero recibe «Ya podés ver tu calificación»; revelar por vencimiento no avisa.
- **El promedio público** (las estrellas de la página del equipo) cuenta **solo las calificaciones reveladas**.

## Correspondencia en el código

`rateRival` (`src/app/partidos/actions.ts`): `parseRating` → RPC `rate_rival(p_match_id, p_stars, p_comment)`. Probado en `ratings_test.sql`.
