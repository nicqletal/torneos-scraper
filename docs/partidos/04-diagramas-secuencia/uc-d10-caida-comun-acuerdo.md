# S10 · UC-D10 — Caída de común acuerdo

Caso de uso: [UC-D10](../02-casos-de-uso.md#uc-d10--caída-de-común-acuerdo) · Pantalla: [P1](../03-pantallas.md#p1--partidos) · Requerimientos: RF-D23, RF-D35

El formulario es el del motivo ([S09](uc-d09-tirar-partido.md)); no hay desplegables. El caso tiene dos actores: el Capitán que **pide** y el Capitán rival que **responde**.

```mermaid
sequenceDiagram
    actor Capitan as Capitán
    actor CapitanRival as Capitán rival
    participant PantallaPartidos
    participant PartidoService
    participant Validador
    participant PartidoRepository

    PantallaPartidos-->>Capitan: ofrecer «pedir tirarlo de común acuerdo» (faltan menos de 24 horas y nadie lo pidió)
    Capitan->>PantallaPartidos: escribir el motivo y pedirlo
    PantallaPartidos->>PartidoService: pedirCaidaDeComunAcuerdo(partidoId, motivo)
    PartidoService->>Validador: validarMotivo(motivo)
    Validador-->>PartidoService: motivo válido o error
    PartidoService->>PartidoRepository: pedirCaida(partidoId, motivo)
    PartidoRepository->>PartidoRepository: verificar Capitán, menos de 24 horas, antes de la Hora de inicio y que nadie la haya pedido antes

    alt Rechazado
        PartidoRepository-->>PartidoService: motivo de rechazo
        PartidoService-->>PantallaPartidos: motivo de rechazo
        PantallaPartidos-->>Capitan: mostrar error
    else Pedido registrado
        Note over PartidoRepository: Aviso «Piden tirar el partido de común acuerdo» al Capitán rival
        PartidoRepository-->>PartidoService: pedido pendiente
        PartidoService-->>PantallaPartidos: ok
        PantallaPartidos-->>Capitan: mostrar «esperando respuesta»

        CapitanRival->>PantallaPartidos: ver el pedido abierto en la fila
        alt Acepta antes de la Hora de inicio
            CapitanRival->>PantallaPartidos: tocar aceptar
            PantallaPartidos->>PartidoService: responderCaida(partidoId, aceptar = sí)
            PartidoService->>PartidoRepository: responderCaida(partidoId, sí)
            PartidoRepository->>PartidoRepository: tirar el partido con ese motivo, sin falta para nadie
            Note over PartidoRepository: Aviso «Se cayó de común acuerdo» a los dos planteles. En el historial figura como tirado de común acuerdo
            PartidoRepository-->>PartidoService: partido caído
            PartidoService-->>PantallaPartidos: ok
            PantallaPartidos-->>CapitanRival: el partido pasa al historial
        else Rechaza
            CapitanRival->>PantallaPartidos: tocar rechazar
            PantallaPartidos->>PartidoService: responderCaida(partidoId, aceptar = no)
            PartidoService->>PartidoRepository: responderCaida(partidoId, no)
            PartidoRepository->>PartidoRepository: registrar el rechazo (no se vuelve a pedir)
            Note over PartidoRepository: Aviso «Rechazaron tirarlo de común acuerdo» al Capitán que lo pidió
            PartidoRepository-->>PartidoService: el partido sigue en pie
            PartidoService-->>PantallaPartidos: ok
            PantallaPartidos-->>CapitanRival: el partido sigue en pie
        else No responde antes de la Hora de inicio
            Note over Capitan,PartidoRepository: El partido sigue en pie. El que pidió puede tirarlo solo, con la falta (S09)
        end
    end
```

## Cómo se lee

- **Cuándo se ofrece:** solo con **menos de 24 h** para la Hora de inicio (con más, tirarlo no suma falta y no hace falta), antes de esa hora, y si **nadie pidió una antes** en este partido.
- **Si el rival acepta,** el partido se cae con ese motivo, **sin falta para nadie**, y queda en el historial como tirado de común acuerdo.
- **Si rechaza o no responde,** el partido sigue en pie y el que pidió todavía puede **tirarlo solo, con la falta** ([S09](uc-d09-tirar-partido.md)). **No se vuelve a pedir:** ninguno de los dos.
- **Un cambio de Capitán en el medio no lo traba:** el pedido es del equipo, y el Capitán nuevo responde el pedido pendiente (las búsquedas, propuestas y partidos son del equipo).
- **Los Avisos de este caso:** «Piden tirar el partido de común acuerdo» (al rival, pide acción), «Se cayó de común acuerdo» (a los dos planteles) y «Rechazaron tirarlo de común acuerdo» (al que pidió).

## Correspondencia en el código

`requestMutualDrop` y `answerMutualDrop` (`src/app/partidos/actions.ts`) llaman a `request_mutual_drop(p_match_id, p_reason)` y `answer_mutual_drop(p_match_id, p_accept)`. Probado en `match_drops_test.sql`.
