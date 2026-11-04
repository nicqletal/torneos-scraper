# S09 · UC-D09 — Tirar el partido

Caso de uso: [UC-D09](../02-casos-de-uso.md#uc-d09--tirar-el-partido) · Pantalla: [P1](../03-pantallas.md#p1--partidos) («Tirar el partido») · Requerimientos: RF-D22, RF-D31

El formulario tiene un único campo, el **motivo** (texto, sin desplegables). Si falta menos de 24 h, el formulario **advierte que suma una falta**.

```mermaid
sequenceDiagram
    actor Capitan as Capitán
    participant PantallaPartidos
    participant PartidoService
    participant Validador
    participant PartidoRepository

    Capitan->>PantallaPartidos: tocar «Tirar el partido» (o «No vamos»)
    PantallaPartidos->>PartidoRepository: obtenerPartido(partidoId)
    PartidoRepository-->>PantallaPartidos: partido y cuánto falta para la Hora de inicio
    PantallaPartidos-->>Capitan: mostrar el formulario del motivo (con «Tirarlo ahora suma una falta a tu equipo» si faltan menos de 24 horas)

    Capitan->>PantallaPartidos: escribir el motivo y confirmar
    PantallaPartidos->>PartidoService: tirarPartido(partidoId, motivo)
    PartidoService->>Validador: validarMotivo(motivo)
    Validador-->>PartidoService: motivo válido (de 1 a 140 caracteres) o error

    alt Motivo inválido
        PartidoService-->>PantallaPartidos: «El motivo va de 1 a 140 caracteres.»
        PantallaPartidos-->>Capitan: mostrar error
    else Motivo válido
        PartidoService->>PartidoRepository: tirar(partidoId, motivo)
        PartidoRepository->>PartidoRepository: verificar Capitán del partido, partido por jugarse y antes de la Hora de inicio

        alt Rechazado
            PartidoRepository-->>PartidoService: motivo de rechazo
            PartidoService-->>PantallaPartidos: motivo de rechazo
            PantallaPartidos-->>Capitan: mostrar error
        else Partido tirado
            PartidoRepository->>PartidoRepository: marcar el partido caído con su motivo, quién lo tiró y la hora
            PartidoRepository->>PartidoRepository: liberar las franjas que el partido ocupaba
            opt Faltan menos de 24 horas
                PartidoRepository->>PartidoRepository: sumar una Falta al equipo que lo tiró, desde ese momento
            end
            Note over PartidoRepository: Aviso «Se cayó el partido» a los dos planteles, con el motivo y, si suma falta, a quién
            PartidoRepository-->>PartidoService: partido caído
            PartidoService-->>PantallaPartidos: ok
            PantallaPartidos-->>Capitan: el partido pasa al historial como «Se cayó»
        end
    end
```

## Cómo se lee

- **La falta la decide la fase, no el Capitán.** Con **menos de 24 h** para la Hora de inicio, tirar el partido suma una **Falta** al equipo que lo tiró, **desde el momento en que lo tiró**. Con **24 h justas**, todavía no. Con más de 24 h, no.
- **El motivo es obligatorio** (1 a 140 caracteres) y queda **visible en el historial público**; nadie lo modera (riesgo aceptado el 27/10/2026). «Equipo suspendido» lo escribe el sistema en el mismo campo, para los partidos que cae una Suspensión.
- **Qué pasa al caer:** el partido entra al historial del equipo **desde que se tira**, aunque su fecha no haya llegado; las franjas que ocupaba se liberan; y los dos planteles reciben el Aviso.
- **Con menos de 24 h hay una salida sin falta:** pedir la **caída de común acuerdo** ([S10](uc-d10-caida-comun-acuerdo.md)).
- **Solo antes de la Hora de inicio.** Después, el partido solo admite resultado o «no vinieron».
- **Las faltas cuentan 90 días** para el presentismo, y 3 faltas bloquean al equipo 30 días. El bloqueo no avisa.

## Correspondencia en el código

`dropMatch` (`src/app/partidos/actions.ts`): `parseDropReason` → RPC `drop_match(p_match_id, p_reason)`. Las faltas salen de la vista `team_faults`. Probado en `match_drops_test.sql` y `team_faults_test.sql`.
