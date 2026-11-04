# Módulo Equipos · Diagramas de secuencia

Versión del **04/11/2026**. Un diagrama por caso de uso, en [Mermaid](https://mermaid.js.org/) (GitHub los dibuja directo). Siguen a las [pantallas](../03-pantallas.md) y se apoyan en los [casos de uso](../02-casos-de-uso.md).

| Diagrama | Caso de uso | Pantalla | Estado | PNG |
|---|---|---|---|---|
| [S01 · Crear equipo](uc-c01-crear-equipo.md) | UC-C01 | P1 | Implementado | [img/s01-crear-equipo.png](img/s01-crear-equipo.png) |
| [S02 · Invitar jugadores](uc-c02-invitar-jugadores.md) | UC-C02 | P4 | Implementado | [img/s02-invitar-jugadores.png](img/s02-invitar-jugadores.png) |
| [S03 · Unirse al equipo](uc-c03-unirse-al-equipo.md) | UC-C03 | P6 | Implementado | [img/s03-unirse-al-equipo.png](img/s03-unirse-al-equipo.png) |
| [S04 · Ver la página del equipo](uc-c04-ver-pagina-equipo.md) | UC-C04 | P3 y P4 | Implementado | [img/s04-ver-pagina-equipo.png](img/s04-ver-pagina-equipo.png) |
| [S05 · Editar equipo](uc-c05-editar-equipo.md) | UC-C05 | P5 | Implementado | [img/s05-editar-equipo.png](img/s05-editar-equipo.png) |
| [S06 · Pasar la capitanía](uc-c06-pasar-capitania.md) | UC-C06 | P4 | Implementado (Suspensión pendiente) | [img/s06-pasar-capitania.png](img/s06-pasar-capitania.png) |
| [S07 · Sacar a un jugador](uc-c07-sacar-jugador.md) | UC-C07 | P4 | Implementado | [img/s07-sacar-jugador.png](img/s07-sacar-jugador.png) |
| [S08 · Salir del equipo](uc-c08-salir-del-equipo.md) | UC-C08 | P4 | Implementado | [img/s08-salir-del-equipo.png](img/s08-salir-del-equipo.png) |
| [S09 · Disolver equipo](uc-c09-disolver-equipo.md) | UC-C09 | P4 | Implementado | [img/s09-disolver-equipo.png](img/s09-disolver-equipo.png) |
| [S10 · Reportar un equipo](uc-c10-reportar-equipo.md) | UC-C10 | P3 | **Pendiente** (diseño objetivo) | [img/s10-reportar-equipo.png](img/s10-reportar-equipo.png) |

Los PNG están dibujados sobre fondo blanco, para pegarlos en un informe. La fuente de cada diagrama es el bloque Mermaid de su archivo: si se cambia uno, hay que regenerar su PNG.

## Criterios aplicados

Son los de la guía para diagramas con formularios y desplegables.

1. **Un caso de uso por diagrama.** Se separan casos distintos, no las etapas de uno solo: la carga de las opciones de un formulario y el alta o la edición van **en el mismo diagrama**.
2. **Si el caso empieza con un formulario**, el diagrama muestra al actor abriendo la pantalla y a la pantalla pidiendo las opciones de cada desplegable **antes** de que el actor elija. Recién después, la pantalla completa que recibe la persona.
3. **Un objeto por responsabilidad o fuente de datos**, no uno por desplegable. Si la lista se consulta en la base, es un repositorio con nombre específico (`ZonaRepository`). Si es una lista fija del código, es un proveedor de opciones (`OpcionesEquipo`). No se inventan repositorios para listas que no se guardan en la base.
4. **Al enviar**, el método del caso de uso recibe **solo los valores elegidos** (`zonaId`, `modalidad`, `nivel`), nunca las listas completas.
5. **La validación se repite al guardar.** Que un valor aparezca en un desplegable no garantiza que siga siendo válido cuando se guarda: la Zona pudo dejar de existir, o el cliente pudo mandar otro valor.
6. **Cada diagrama muestra solo los participantes que intervienen.**

## Participantes: responsabilidad y correspondencia en el repo

**Son responsabilidades conceptuales.** No existen como clases TypeScript con esos nombres: la app usa Server Actions, utilidades puras y funciones de Postgres. La columna de la derecha dice dónde vive hoy cada responsabilidad.

| Participante | Responsabilidad | Correspondencia en el repo |
|---|---|---|
| **Usuario, Invitado, Jugador, Capitán** | La persona que inicia el caso. Es un rol respecto del Equipo, no una cuenta distinta. | La sesión y su relación con el Equipo (`team_members`). El Invitado navega sin sesión. |
| **FormularioCrearEquipo, FormularioEditarEquipo** | La pantalla: carga las opciones, muestra el formulario, recoge y envía la selección. | `crear-equipo/page.tsx` y `equipos/[id]/editar/page.tsx`, con el componente `TeamForm`. |
| **FichaEquipo** | La página del Equipo y sus botones de gestión. | `equipos/[id]/page.tsx`. |
| **PantallaUnirse** | La pantalla de invitación con el botón «Unirme al equipo». | `unirse/[token]/page.tsx`. |
| **ZonaRepository** | Entrega la lista cerrada de Zonas, que **se consulta en la base**. | `getZoneGroups()` en `ZoneSelect.tsx`: lee `zones` con sus corredores y regiones. |
| **OpcionesEquipo** | Entrega las modalidades y los niveles: **listas fijas del código**, sin consulta a la base. | `SPORT_MODALITIES` (`utils/modality.ts`) y `TEAM_LEVELS` (`utils/teams.ts`). |
| **EquipoService** | Coordina el caso de uso: valida, llama al repositorio y arma la respuesta. | Las Server Actions: `crear-equipo/actions.ts`, `equipos/[id]/actions.ts` y `unirse/[token]/actions.ts`. |
| **Validador** | Valida las entradas antes de escribir. | `parseTeamForm` (`utils/team-form.ts`) y `parseCrest` (`utils/team-crest.ts`). |
| **EquipoRepository** | Lee y escribe el Equipo, el Plantel y las invitaciones. | Las tablas `teams`, `team_members` y `team_invites`, tocadas por consultas con RLS y por las funciones de Postgres `create_team`, `join_team`, `leave_team`, `remove_team_member`, `transfer_captaincy`, `regenerate_team_invite`, `get_team_invite`, `dissolve_team`; y `saveTeam` (`utils/supabase/team.ts`) para los datos y el escudo (Storage, bucket `team-crests`). |
| **InscripcionRepository** | Entrega los torneos donde el Equipo tiene una Inscripción vinculada. | La vista pública `tournament_inscriptions` más `tournaments`. Datos del módulo E. |
| **HistorialRepository** | Entrega el historial público del Equipo. | Las vistas `team_record` y `team_match_history`. Datos del módulo de Partidos. |
| **PartidoRepository**, **BusquedaRepository** | Solo en S09: los partidos y las búsquedas de rival del Equipo. | `matches` y `match_phase`; `rival_searches`, `search_slots` y `cancel_proposals`. Datos del módulo de Partidos. |
| **OpcionesReporte**, **ReporteRepository** | Solo en S10: los motivos de reporte y el guardado del reporte. | **No existen todavía.** |

**Zonas de la base y listas del código.** Esa diferencia es la que justifica tener un repositorio para las Zonas y un proveedor de opciones para modalidad y nivel. Si alguna vez la modalidad o el nivel pasaran a guardarse en una tabla, `OpcionesEquipo` se reemplazaría por un repositorio.

## Convenciones de dibujo

- Flecha continua (`->>`): una llamada. Flecha punteada (`-->>`): su respuesta.
- Un mensaje de un participante a sí mismo es un paso interno (por ejemplo, una verificación dentro de una función de Postgres).
- Una nota sobre un participante marca una regla que **hace cumplir la base**, no la pantalla.
- Entre paréntesis y en minúscula van los **valores que viajan**; entre comillas «así», los mensajes que ve la persona.
- `opt` es un paso opcional; `alt` / `else`, caminos que se excluyen.
