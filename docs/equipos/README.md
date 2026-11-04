# Módulo Equipos · Documentación

Documentación completa del módulo de Equipos de Torneos Amateur BA, versión del **04/11/2026**. Sigue el orden pedido para el trabajo de la materia:

| Paso | Documento | Qué contiene |
|---|---|---|
| 1 | [01-requerimientos.md](01-requerimientos.md) | Alcance, actores, requerimientos funcionales (RF-C) y no funcionales (RNF-C), con su estado. |
| 2 | [02-casos-de-uso.md](02-casos-de-uso.md) | Los casos de uso UC-C01 a UC-C10: actor, precondiciones, flujo principal, alternativos y postcondición. |
| 3 | [03-pantallas.md](03-pantallas.md) y [`pantallas/`](pantallas/) | La pantalla que representa cada caso, con su captura, sus estados y el origen de cada desplegable. |
| 4 | [04-diagramas-secuencia/](04-diagramas-secuencia/README.md) | Un diagrama de secuencia por caso de uso (Mermaid y PNG), con los criterios y los participantes. |

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) → [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) → [CONTEXT.md](../../CONTEXT.md) → código y migraciones. Reemplaza a la especificación del 28/10/2026 (`docs/especificaciones-y-requerimientos/modulo-equipos-especificacion.pdf`).

## Matriz de trazabilidad

Cada caso de uso con lo que lo cubre en los cuatro documentos.

| Caso de uso | Requerimientos | Pantalla | Diagrama | Estado |
|---|---|---|---|---|
| **UC-C01** Crear equipo | RF-C01 a C06, C27 | [P1](03-pantallas.md#p1--crear-equipo) `/crear-equipo` | [S01](04-diagramas-secuencia/uc-c01-crear-equipo.md) | Implementado |
| **UC-C02** Invitar jugadores | RF-C07, C25 | [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) `/equipos/{id}` | [S02](04-diagramas-secuencia/uc-c02-invitar-jugadores.md) | Implementado |
| **UC-C03** Unirse con el link | RF-C08 a C10, C27 | [P6](03-pantallas.md#p6--unirse-al-equipo) `/unirse/{token}` | [S03](04-diagramas-secuencia/uc-c03-unirse-al-equipo.md) | Implementado |
| **UC-C04** Ver la página del equipo | RF-C11 a C14, C25 | [P3](03-pantallas.md#p3--equipo-vista-pública) y [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) | [S04](04-diagramas-secuencia/uc-c04-ver-pagina-equipo.md) | Implementado |
| **UC-C05** Editar equipo | RF-C01, C02, C16, C25 | [P5](03-pantallas.md#p5--editar-equipo) `/equipos/{id}/editar` | [S05](04-diagramas-secuencia/uc-c05-editar-equipo.md) | Implementado |
| **UC-C06** Pasar la capitanía | RF-C05, C17, C20, C21, C27 | [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) | [S06](04-diagramas-secuencia/uc-c06-pasar-capitania.md) | Implementado (Suspensión pendiente) |
| **UC-C07** Sacar a un jugador | RF-C18, C20, C21, C25 | [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) | [S07](04-diagramas-secuencia/uc-c07-sacar-jugador.md) | Implementado |
| **UC-C08** Salir del equipo | RF-C19, C20, C21, C25 | [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) | [S08](04-diagramas-secuencia/uc-c08-salir-del-equipo.md) | Implementado |
| **UC-C09** Disolver equipo | RF-C22 a C25 | [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) | [S09](04-diagramas-secuencia/uc-c09-disolver-equipo.md) | Implementado |
| **UC-C10** Reportar un equipo | RF-C26 | [P3](03-pantallas.md#p3--equipo-vista-pública) (botón por crear) | [S10](04-diagramas-secuencia/uc-c10-reportar-equipo.md) | **Pendiente** |
| — (pantalla, sin decisión) | RF-C15 | [P2](03-pantallas.md#p2--mis-equipos) `/mis-equipos` | — | Implementado |

## Equivalencia con la numeración anterior

La especificación del 28/10 usaba «módulo D» y otros números. La numeración vigente es la de `casos-de-uso.md` (módulo C).

| Vigente | Anterior (PDF 28/10) |
|---|---|
| UC-C01 Crear equipo | UC-25 |
| UC-C02 Invitar jugadores | UC-27 |
| UC-C03 Unirse con el link | UC-28 |
| UC-C04 Ver la página del equipo | UC-29 y UC-30 (historial) |
| UC-C05 Editar equipo | «Editar Equipo» (sin número) |
| UC-C06 Pasar la capitanía | UC-26 |
| UC-C07 Sacar a un jugador | «Sacar a un Jugador» (sin número) |
| UC-C08 Salir del equipo | «Salir del Equipo» (sin número) |
| UC-C09 Disolver equipo | «Disolver Equipo» (sin número) |
| UC-C10 Reportar un equipo | — |
| RF-C01 a C06 | RF-D01 a D06 |
| RF-C07 a C10 | RF-D07 a D10 |
| RF-C11 a C14 | RF-D19 y D20 |
| RF-C15 | RF-D21 |
| RF-C16 | RF-D14 |
| RF-C17 | RF-D11 |
| RF-C18 y C19 | RF-D13 |
| RF-C20 | RF-D12 |
| RF-C21 | RF-D22 |
| RF-C22 a C25 | RF-D15 a D18 |

## Qué cambió respecto del PDF del 28/10

- **Lo que el PDF daba por pendiente hoy está implementado:** el historial público de Partidos (antes UC-30), el bloqueo de la disolución con partidos sin terminar y la cancelación de búsquedas y propuestas al disolver.
- **El catálogo `/equipos` no está en `main`** (era RF-D23). Existe solo en la rama `franco-equipos` y no figura en `casos-de-uso.md`. Queda en «Sin decisión» en los requerimientos.
- **Reportar un equipo** (UC-C10) y la **Suspensión** son alcance vigente que todavía no está programado.
- **Los diagramas se rehicieron** con los objetos de los formularios (`ZonaRepository` y `OpcionesEquipo`) y la validación al guardar, según la guía de diagramas con desplegables. El de Crear equipo coincide con el de la rama `codex/diagrama-crear-equipo`, más la consulta de requisitos de la pantalla y el manejo del escudo.

## Pendientes y decisiones abiertas

1. **Capturas faltantes** (ficha pública, vista del Jugador, editar, unirse, estados de error) y una **desactualizada** (ficha del Capitán, sin la sección «Partidos»). Está la lista con los pasos en [03-pantallas.md](03-pantallas.md#capturas-pendientes).
2. **Catálogo público de Equipos:** decidir si entra al alcance.
3. **Reportar un equipo:** decidir si una persona puede reportar más de una vez al mismo Equipo.
4. **Suspensión:** hoy la base no la verifica al crear un Equipo ni al recibir la capitanía (depende de UC-F05).
5. **Tests de base:** `teams_management_test.sql` cubre disolver, pasar la capitanía, invitación inválida y `create_team`; no encontré pruebas pgTAP dedicadas a `leave_team`, `remove_team_member` ni al límite de 3 capitanías. La regla del proyecto es que cada policy o función de RLS nueva tenga su test.
6. **Si se cambia un diagrama,** hay que regenerar su PNG (el bloque Mermaid de cada archivo es la fuente).
