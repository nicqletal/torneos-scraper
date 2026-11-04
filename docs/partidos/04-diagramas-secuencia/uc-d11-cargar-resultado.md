# S11 · UC-D11 — Cargar el resultado

Caso de uso: [UC-D11](../02-casos-de-uso.md#uc-d11--cargar-el-resultado) · Pantalla: [P1](../03-pantallas.md#p1--partidos) («Contanos cómo salió») · Requerimientos: RF-D24, RF-D25, RF-D27

El formulario es un **marcador** con dos goles (números de 0 a 99, el equipo propio a la izquierda): no hay desplegables. El caso tiene dos actores: quien **carga** y el Capitán rival, que **confirma o corrige**.

```mermaid
sequenceDiagram
    actor Capitan as Capitán
    actor CapitanRival as Capitán rival
    participant PantallaPartidos
    participant PartidoService
    participant Validador
    participant PartidoRepository

    PantallaPartidos->>PartidoRepository: obtenerPartido(partidoId)
    PartidoRepository-->>PantallaPartidos: partido esperando resultado, con lo cargado y el vencimiento del plazo
    PantallaPartidos-->>Capitan: mostrar «Contanos cómo salió» con el marcador

    Capitan->>PantallaPartidos: escribir los goles de cada lado y confirmar
    PantallaPartidos->>PartidoService: cargarResultado(partidoId, golesAFavor, golesEnContra)
    PartidoService->>Validador: validarResultado(golesAFavor, golesEnContra)
    Validador-->>PartidoService: goles válidos (0 a 99) o error

    alt Goles inválidos
        PartidoService-->>PantallaPartidos: «Los goles van de 0 a 99.»
        PantallaPartidos-->>Capitan: mostrar error
    else Goles válidos
        PartidoService->>PartidoRepository: cargarResultado(partidoId, golesAFavor, golesEnContra)
        PartidoRepository->>PartidoRepository: verificar Capitán, que pasó la Hora de inicio y que el partido no esté cerrado
        PartidoRepository->>PartidoRepository: comparar con lo que cargó el rival (el mismo resultado, espejado)

        alt Rechazado
            PartidoRepository-->>PartidoService: motivo de rechazo
            PartidoService-->>PantallaPartidos: motivo de rechazo
            PantallaPartidos-->>Capitan: mostrar error
        else El rival ya había reportado «no vinieron»
            PartidoRepository->>PartidoRepository: dejar el partido en conflicto, sin falta para nadie
            Note over PartidoRepository: Avisos «Partido en conflicto» a los dos planteles. Cargar un resultado equivale a decir «fuimos»
            PartidoRepository-->>PartidoService: en conflicto
            PartidoService-->>PantallaPartidos: ok
            PantallaPartidos-->>Capitan: el partido pasa al historial como «En conflicto»
        else Coincide con el resultado del rival
            PartidoRepository->>PartidoRepository: dejar el partido Jugado con ese resultado
            Note over PartidoRepository: Aviso «Jugado» (con el resultado) a los dos planteles. Se habilita calificar
            PartidoRepository-->>PartidoService: Jugado
            PartidoService-->>PantallaPartidos: ok
            PantallaPartidos-->>Capitan: el partido pasa al historial como «Ganamos», «Perdimos» o «Empatamos»
        else Primer resultado, o distinto del que cargó el rival
            PartidoRepository->>PartidoRepository: guardar el resultado y reiniciar el plazo de 48 horas
            Note over PartidoRepository: Aviso «Cargaron el resultado: confirmá o corregí» al Capitán rival, con el vencimiento
            PartidoRepository-->>PartidoService: pendiente de confirmar
            PartidoService-->>PantallaPartidos: ok
            PantallaPartidos-->>Capitan: «esperando que confirme el rival»

            CapitanRival->>PantallaPartidos: ver el resultado cargado, abierto en la fila
            alt Confirma el mismo resultado
                CapitanRival->>PantallaPartidos: tocar «Confirmar»
                PantallaPartidos->>PartidoService: cargarResultado(partidoId, goles espejados)
                PartidoService->>PartidoRepository: cargarResultado(partidoId, goles espejados)
                PartidoRepository-->>PartidoService: Jugado
                PartidoService-->>PantallaPartidos: ok
                PantallaPartidos-->>CapitanRival: el partido pasa al historial
            else Corrige
                CapitanRival->>PantallaPartidos: cargar otro resultado
                Note over CapitanRival,PartidoRepository: Repite este diagrama con los roles invertidos: cada corrección le da al otro 48 horas enteras
            end
        end
    end
```

## Cómo se lee

- **Una sola función para cargar, confirmar y corregir.** Si los goles coinciden (espejados) con los que cargó el otro, el partido queda **Jugado**; si no, es una carga o una corrección y le toca al otro.
- **Los plazos de 48 h** se calculan **al leer**, contados desde la última carga de cualquiera de los dos (o, si nadie cargó, desde el fin del rango), y no avisan al vencer: si el rival no hace nada, el partido queda **Jugado con el resultado cargado**; con resultados distintos, cada corrección da 48 h enteras al otro, sin tope, y si siguen sin coincidir al vencer, **Jugado sin resultado**; si nadie carga, **Jugado sin resultado**, sin falta para nadie.
- **Cargar un resultado equivale a decir «fuimos».** Si el rival ya reportó «no vinieron» ([S12](uc-d12-reportar-no-se-presento.md)), el partido queda **en conflicto**. Quien cargó un resultado ya no puede reportar «no vinieron».
- **Un partido cerrado no se corrige más:** Jugado, en conflicto o con falta.
- **Solo después de la Hora de inicio.** Antes, el partido solo admite tirarlo.
- **Calificar** se habilita al quedar Jugado ([S13](uc-d13-calificar-rival.md)).

## Correspondencia en el código

`reportResult` (`src/app/partidos/actions.ts`): `parseResult` → RPC `report_result(p_match_id, p_goals_for, p_goals_against)`. El marcador es el componente `Scoreboard`. Probado en `match_results_test.sql`.
