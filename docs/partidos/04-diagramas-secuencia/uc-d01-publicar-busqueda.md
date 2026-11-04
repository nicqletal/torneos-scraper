# S01 · UC-D01 — Publicar una búsqueda de rival

Caso de uso: [UC-D01](../02-casos-de-uso.md#uc-d01--publicar-una-búsqueda-de-rival) · Pantalla: [P2](../03-pantallas.md#p2--buscar-rival) · Requerimientos: RF-D02 a RF-D06, RF-D32

El formulario tiene **tres elecciones con opciones**: el **equipo** (si el Capitán capitanea más de uno), la **modalidad** y el **turno**. Siguiendo la guía de formularios, la pantalla obtiene las opciones **antes** de que el Capitán elija: los equipos, que se consultan en la base, de `EquipoRepository`; las modalidades y los turnos, que son listas fijas del código, de `OpcionesBusqueda`. Al enviar viajan solo los valores elegidos. La carga de las opciones y la publicación van en el mismo diagrama.

```mermaid
sequenceDiagram
    actor Capitan as Capitán
    participant PantallaBuscarRival
    participant EquipoRepository
    participant OpcionesBusqueda
    participant BusquedaService
    participant Validador
    participant BusquedaRepository

    Capitan->>PantallaBuscarRival: abrirBuscarRival(equipoId?, modalidad?)
    PantallaBuscarRival->>EquipoRepository: listarEquiposDelCapitan(usuario)
    EquipoRepository-->>PantallaBuscarRival: equipos que capitanea, con su modalidad habitual

    alt No capitanea ningún equipo
        PantallaBuscarRival-->>Capitan: «Buscar rival es cosa del capitán»
    else Capitanea al menos uno
        PantallaBuscarRival->>OpcionesBusqueda: listarModalidades()
        OpcionesBusqueda-->>PantallaBuscarRival: modalidades disponibles
        PantallaBuscarRival->>OpcionesBusqueda: listarTurnos()
        OpcionesBusqueda-->>PantallaBuscarRival: Mañana 9 a 12, Tarde 14 a 18, Noche 20 a 23 y Otro horario
        PantallaBuscarRival->>BusquedaRepository: consultarEstado(equipoId, modalidad)
        BusquedaRepository-->>PantallaBuscarRival: búsqueda activa (si hay) y hasta cuándo dura el bloqueo por faltas (si lo hay)

        alt El equipo está bloqueado por faltas
            PantallaBuscarRival-->>Capitan: mostrar hasta cuándo dura el bloqueo, en vez del formulario
        else Puede publicar
            PantallaBuscarRival-->>Capitan: mostrar equipo y modalidad (la habitual, precargada), la grilla de 14 días, los turnos y «Repetir la semana que viene»

            Capitan->>PantallaBuscarRival: elegir día, turno (u otro horario) y modalidad
            Capitan->>PantallaBuscarRival: confirmar la búsqueda
            PantallaBuscarRival->>BusquedaService: publicarBusqueda(equipoId, modalidad, franjas)
            BusquedaService->>Validador: validarFranjas(franjas)
            Validador-->>BusquedaService: franjas válidas (con «repetir» ya expandido) o errores

            alt Hay errores de validación
                BusquedaService-->>PantallaBuscarRival: errores
                PantallaBuscarRival-->>Capitan: mostrar errores
            else Franjas válidas
                BusquedaService->>BusquedaRepository: guardarBusqueda(equipoId, modalidad, franjas)
                BusquedaRepository->>BusquedaRepository: verificar Capitán, equipo no disuelto, WhatsApp del Capitán y equipo sin bloqueo
                BusquedaRepository->>BusquedaRepository: verificar el formato, los 14 días y que ninguna franja choque con un partido acordado ni entre sí
                Note over BusquedaRepository: Bloquea el equipo (for update) antes de comprobar choques: dos pedidos a la vez no pueden superponer partidos
                BusquedaRepository-->>BusquedaService: búsqueda activa o rechazo

                alt Búsqueda rechazada
                    BusquedaService-->>PantallaBuscarRival: motivo de rechazo
                    PantallaBuscarRival-->>Capitan: mostrar error
                else Búsqueda publicada
                    BusquedaService-->>PantallaBuscarRival: ok
                    PantallaBuscarRival-->>Capitan: mostrar «Buscando rival» y los rivales compatibles (S03)
                end
            end
        end
    end
```

## Cómo se lee

- **Antes de elegir:** la pantalla obtiene los equipos de `EquipoRepository` y las modalidades y los turnos de `OpcionesBusqueda`. El equipo solo se pregunta si el Capitán capitanea más de uno; la modalidad llega con la habitual del equipo.
- **Al enviar,** `publicarBusqueda(...)` recibe solo los **valores elegidos** (`equipoId`, `modalidad`, `franjas`), no las listas. Las franjas se arman en el servidor a partir de fecha y horas enteras, en hora de Buenos Aires.
- **Se valida dos veces, y manda la base.** `Validador` revisa horas enteras, inicio menor que fin, dentro de 14 días, sin pisarse y el atajo «repetir»; la función de la base **repite todo** (formato, 14 días, 8 a 24, al menos 1 h, hoy en una hora que no pasó, choques) y además verifica Capitán, WhatsApp y bloqueo.
- **Una franja que choca con un partido acordado se rechaza**; entre búsquedas de **distinta modalidad** del mismo equipo se pueden superponer.
- **La búsqueda guarda solo modalidad y franjas.** La cercanía y el nivel salen de la Zona y el nivel **actuales** del equipo, así que si el equipo los cambia, se refleja en el acto.
- **Publicar no genera ningún Aviso.** La búsqueda queda activa mientras le quede una franja por empezar y vence sola.
- **Suspensión (pendiente):** un Capitán suspendido no puede buscar rival; hoy no se verifica (UC-F05).
- **«Copiar horarios de la última búsqueda»** figura en las decisiones, pero no existe en el código (ver [«Sin decisión»](../01-requerimientos.md#5-sin-decisión-y-diferencias-con-la-documentación)).

## Correspondencia en el código

`saveRivalSearch` (`src/app/partidos/actions.ts`): `parseRivalSearchForm` → RPC `save_rival_search(p_team_id, p_modality, p_slots)`. La pantalla es `app/partidos/buscar/page.tsx` con el componente `SlotPicker`.
