# Módulo Partidos · Diagramas de secuencia

Versión del **04/11/2026**. Un diagrama por caso de uso, en [Mermaid](https://mermaid.js.org/) (GitHub los dibuja directo). Siguen a las [pantallas](../03-pantallas.md) y se apoyan en los [casos de uso](../02-casos-de-uso.md).

| Diagrama | Caso de uso | Pantalla | Estado | PNG |
|---|---|---|---|---|
| [S01 · Publicar una búsqueda](uc-d01-publicar-busqueda.md) | UC-D01 | P2 | Parcial (Suspensión) | [img/s01-publicar-busqueda.png](img/s01-publicar-busqueda.png) |
| [S02 · Editar o cancelar la búsqueda](uc-d02-editar-cancelar-busqueda.md) | UC-D02 | P2 | Implementado | [img/s02-editar-cancelar-busqueda.png](img/s02-editar-cancelar-busqueda.png) |
| [S03 · Ver rivales compatibles](uc-d03-ver-rivales-compatibles.md) | UC-D03 | P2 | Implementado | [img/s03-ver-rivales-compatibles.png](img/s03-ver-rivales-compatibles.png) |
| [S04 · Proponer un partido](uc-d04-proponer-partido.md) | UC-D04 | P2 | Implementado | [img/s04-proponer-partido.png](img/s04-proponer-partido.png) |
| [S05 · Cancelar una propuesta](uc-d05-cancelar-propuesta.md) | UC-D05 | P2 | Implementado | [img/s05-cancelar-propuesta.png](img/s05-cancelar-propuesta.png) |
| [S06 · Aceptar o rechazar una propuesta](uc-d06-responder-propuesta.md) | UC-D06 | P1 | Implementado | [img/s06-responder-propuesta.png](img/s06-responder-propuesta.png) |
| [S07 · Coordinar cancha y hora](uc-d07-coordinar-cancha-hora.md) | UC-D07 | P1 | Implementado | [img/s07-coordinar-cancha-hora.png](img/s07-coordinar-cancha-hora.png) |
| [S08 · Confirmar asistencia](uc-d08-confirmar-asistencia.md) | UC-D08 | P1 | Implementado | [img/s08-confirmar-asistencia.png](img/s08-confirmar-asistencia.png) |
| [S09 · Tirar el partido](uc-d09-tirar-partido.md) | UC-D09 | P1 | Implementado | [img/s09-tirar-partido.png](img/s09-tirar-partido.png) |
| [S10 · Caída de común acuerdo](uc-d10-caida-comun-acuerdo.md) | UC-D10 | P1 | Implementado | [img/s10-caida-comun-acuerdo.png](img/s10-caida-comun-acuerdo.png) |
| [S11 · Cargar el resultado](uc-d11-cargar-resultado.md) | UC-D11 | P1 | Implementado | [img/s11-cargar-resultado.png](img/s11-cargar-resultado.png) |
| [S12 · Reportar que no se presentó](uc-d12-reportar-no-se-presento.md) | UC-D12 | P1 | Implementado | [img/s12-reportar-no-se-presento.png](img/s12-reportar-no-se-presento.png) |
| [S13 · Calificar al rival](uc-d13-calificar-rival.md) | UC-D13 | P1 | Implementado | [img/s13-calificar-rival.png](img/s13-calificar-rival.png) |
| [S14 · Ver mis partidos](uc-d14-ver-mis-partidos.md) | UC-D14 | P1 | Implementado | [img/s14-ver-mis-partidos.png](img/s14-ver-mis-partidos.png) |

Los PNG están dibujados sobre fondo blanco, para pegarlos en un informe. La fuente de cada diagrama es el bloque Mermaid de su archivo: si se cambia uno, hay que regenerar su PNG.

**Relación con los diagramas generales.** [`docs/diagramas-de-secuencia/diagramas-secuencia.md`](../../diagramas-de-secuencia/diagramas-secuencia.md) cubre solo ocho casos de Partidos (D12 a D19, que corresponden a S01, S03, S04, S06, S05, S07, S08 y S09), con participantes genéricos. Los de este módulo los **detallan** y suman los que faltaban: editar o cancelar la búsqueda, caída de común acuerdo, resultado, «no vinieron», calificar y mis partidos. Los generales no muestran la carga de las opciones de los formularios.

## Criterios aplicados

Son los de la guía para diagramas con formularios y desplegables.

1. **Un caso de uso por diagrama.** La carga de las opciones de un formulario y la acción que sigue van **en el mismo diagrama**.
2. **Si el caso empieza con un formulario con opciones**, el diagrama muestra a la pantalla obteniendo las opciones **antes** de que el Capitán elija. Pasa en **publicar la búsqueda** (S01: equipo, modalidad y turno) y en **coordinar cancha y hora** (S07: la hora).
3. **Un objeto por responsabilidad o fuente de datos.** El equipo se consulta en la base (`EquipoRepository`); la modalidad y el turno son listas fijas del código (`OpcionesBusqueda`); la hora de a 15 minutos la calcula la app a partir del rango del partido (`OpcionesPartido`). No se inventan repositorios para listas que no se guardan.
4. **Al enviar**, el método del caso de uso recibe **solo los valores elegidos** (`equipoId`, `modalidad`, `franjas`; `cancha`, `hora`), no las listas.
5. **La validación se repite al guardar, y la que manda es la de la base.** TypeScript valida para dar un mensaje claro; **cada función de Postgres repite todas las reglas**. Los ids que llegan del cliente no son de confiar.
6. **Cada diagrama muestra solo los participantes que intervienen.**

## Participantes: responsabilidad y correspondencia en el repo

**Son responsabilidades conceptuales.** No existen como clases TypeScript con esos nombres: la app usa Server Actions, utilidades puras y funciones de Postgres.

| Participante | Responsabilidad | Correspondencia en el repo |
|---|---|---|
| **Capitán, CapitanRival** | La persona que inicia el caso y, cuando hace falta, su contraparte. | La sesión y la marca de Capitán en `team_members`. |
| **PantallaBuscarRival** | La pantalla `/partidos/buscar`. | `app/partidos/buscar/page.tsx`, con `SlotPicker.tsx`. |
| **PantallaPartidos** | La pantalla `/partidos`, con sus filas y formularios. | `app/partidos/page.tsx` y `components/partidos/` (`MatchRow`, `NextMatch`, `MatchActions`, `Scoreboard`). |
| **OpcionesBusqueda** | Entrega las modalidades y los turnos: **listas fijas del código**. | `SPORT_MODALITIES` (`utils/modality.ts`) y los turnos de `SlotPicker.tsx`. |
| **OpcionesPartido** | Entrega las horas posibles de un partido: de a 15 min dentro de su rango, **calculadas por la app**. | `coordinationTimes` (`utils/match-forms.ts`). |
| **BusquedaService** | Coordina la búsqueda y las propuestas. | Las Server Actions `saveRivalSearch`, `sendProposal`, `declineProposal` y `acceptProposal` (`app/partidos/actions.ts`). |
| **PartidoService** | Coordina las acciones sobre un partido. | Las Server Actions `coordinateMatch`, `confirmGoing`, `dropMatch`, `requestMutualDrop`, `answerMutualDrop`, `reportResult`, `reportNoShow`, `replyWent` y `rateRival`. |
| **Validador** | Valida entradas antes de actuar (la base las repite). | `parseRivalSearchForm` (`utils/rival-search-form.ts`) y `parseCoordination`, `parseDropReason`, `parseResult`, `parseRating` (`utils/match-forms.ts`). |
| **EquipoRepository** | Entrega los equipos que capitanea el usuario. | Tablas `teams` y `team_members`. |
| **BusquedaRepository** | Lee y escribe búsquedas y franjas, y entrega los compatibles. | `rival_searches`, `search_slots`, `save_rival_search`, `compatible_rivals`. |
| **PropuestaRepository** | Lee y escribe propuestas. | `proposals`, `send_proposal`, `respond_proposal`, `cancel_proposals`. |
| **PartidoRepository** | Lee y escribe partidos y sus lados. | `matches`, `match_sides` y las funciones `coordinate_match`, `confirm_going`, `drop_match`, `request_mutual_drop`, `answer_mutual_drop`, `report_result`, `report_no_show`, `reply_went`; fases y plazos con `match_phase` y `match_deadline`. |
| **CalificacionRepository** | Lee y escribe calificaciones. | `ratings` y `rate_rival`. |

## Convenciones de dibujo

- Flecha continua (`->>`): una llamada. Flecha punteada (`-->>`): su respuesta.
- Un mensaje de un participante a sí mismo es un paso interno (por ejemplo, una verificación dentro de una función de Postgres).
- Una nota sobre un participante marca una regla que **hace cumplir la base** o un paso que genera un **Aviso**.
- Entre paréntesis y en minúscula van los **valores que viajan**; entre comillas «así», los mensajes que ve la persona.
- `opt` es un paso opcional; `alt` / `else`, caminos que se excluyen.
