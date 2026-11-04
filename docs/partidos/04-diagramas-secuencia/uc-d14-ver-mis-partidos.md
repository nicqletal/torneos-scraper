# S14 · UC-D14 — Ver mis partidos

Caso de uso: [UC-D14](../02-casos-de-uso.md#uc-d14--ver-mis-partidos) · Pantalla: [P1](../03-pantallas.md#p1--partidos) · Requerimientos: RF-D01, RF-D30

Es una consulta: no hay formulario ni desplegables. El actor es el Capitán o un Jugador del Plantel.

```mermaid
sequenceDiagram
    actor Capitan as Capitán o Jugador
    participant PantallaPartidos
    participant EquipoRepository
    participant PropuestaRepository
    participant PartidoRepository

    Note over Capitan,PantallaPartidos: Sin sesión, la pantalla redirige al login y conserva /partidos como destino
    Capitan->>PantallaPartidos: abrirPartidos()
    PantallaPartidos->>EquipoRepository: listarEquiposDelUsuario(usuario)
    EquipoRepository-->>PantallaPartidos: equipos del usuario y si es Capitán de cada uno

    alt Sin equipo
        PantallaPartidos-->>Capitan: estado vacío «Todavía no hay partidos», que lleva a Mis equipos
    else Tiene equipos
        opt Es Capitán de algún equipo
            PantallaPartidos->>PropuestaRepository: listarPropuestasRecibidas(usuario)
            PropuestaRepository-->>PantallaPartidos: propuestas con su estado calculado
        end
        PantallaPartidos->>PartidoRepository: listarPartidos(equipos)
        Note over PartidoRepository: La base devuelve solo los partidos de los equipos del Plantel actual. Fase y plazos se calculan al leer
        PartidoRepository-->>PantallaPartidos: partidos con su fase, plazo y datos del momento
        opt Es Capitán y hay un partido por jugarse
            PantallaPartidos->>PartidoRepository: obtenerWhatsappDelRival(partidoId)
            Note over PartidoRepository: Solo el Capitán de un equipo con ese partido acordado, mientras esté por jugarse
            PartidoRepository-->>PantallaPartidos: WhatsApp del Capitán rival actual
        end

        alt No hay propuestas ni partidos
            PantallaPartidos-->>Capitan: estado vacío que lleva a Buscar rival (si es Capitán) o a Mis equipos
        else Hay algo
            PantallaPartidos->>PantallaPartidos: ordenar y armar las secciones
            PantallaPartidos-->>Capitan: mostrar «Te proponen jugar» (solo Capitán), el próximo partido, «Contanos cómo salió», «Más adelante» y el historial plegado
        end
    end
```

## Cómo se lee

- **Es la fuente de verdad:** todo lo pendiente se ve acá, **haya o no Aviso**. El Aviso es un puntero; esta pantalla tiene el estado actual.
- **El Jugador ve todo, sin botones.** Las propuestas las ve solo el Capitán. El **WhatsApp del Capitán rival** lo ve solo el Capitán, con un partido acordado y mientras esté por jugarse: lo entrega una función de la base que verifica eso.
- **Visibilidad por Plantel actual:** quien sale del Plantel deja de ver los partidos del equipo; el Capitán anterior, si queda en el Plantel, sigue viendo los partidos pero deja de ver las propuestas.
- **Muestra los partidos de todos los equipos del usuario juntos;** el nombre del equipo propio aparece solo si el usuario está en más de uno.
- **Cada fila muestra lo que pide respuesta abierto, con un solo botón primario;** lo que no pide nada, plegado detrás de un link.
- **El historial** (los cerrados: «Ganamos», «Perdimos», «Empatamos», «Se cayó», «En conflicto», «Falta») está plegado y va en primera persona. El detalle público (quién lo tiró, las dos versiones) vive en la página del equipo, **sin cancha ni hora**.
- **La fase y los plazos se calculan al leer** con la hora actual; no hay tareas programadas.

## Correspondencia en el código

`app/partidos/page.tsx` lee los partidos, las propuestas y los equipos, y arma las secciones con `utils/match-display.ts`; la fase la calcula la función `match_phase`. El WhatsApp sale de `rival_captain_whatsapp(p_match_id)`.
