# Módulo Organizador · Diagramas de secuencia

Versión del **04/11/2026**. Un diagrama por caso de uso, en [Mermaid](https://mermaid.js.org/) (GitHub los dibuja directo). Siguen a las [pantallas](../03-pantallas.md) y se apoyan en los [casos de uso](../02-casos-de-uso.md).

| Diagrama | Caso de uso | Pantalla | Estado | PNG |
|---|---|---|---|---|
| [S01 · Publicar un torneo](uc-e01-publicar-torneo.md) | UC-E01 | P2 | Parcial (Suspensión) | [img/s01-publicar-torneo.png](img/s01-publicar-torneo.png) |
| [S02 · Ver mis torneos](uc-e02-ver-mis-torneos.md) | UC-E02 | P1 | Implementado | [img/s02-ver-mis-torneos.png](img/s02-ver-mis-torneos.png) |
| [S03 · Editar un torneo](uc-e03-editar-torneo.md) | UC-E03 | P3 | Implementado | [img/s03-editar-torneo.png](img/s03-editar-torneo.png) |
| [S04 · Verificar un torneo](uc-e04-verificar-torneo.md) | UC-E04 | P1 y P3 | Implementado | [img/s04-verificar-torneo.png](img/s04-verificar-torneo.png) |
| [S05 · Dar de baja un torneo](uc-e05-dar-de-baja-torneo.md) | UC-E05 | P3 | Implementado | [img/s05-dar-de-baja-torneo.png](img/s05-dar-de-baja-torneo.png) |
| [S06 · Cargar una inscripción](uc-e06-cargar-inscripcion.md) | UC-E06 | P3 | Implementado | [img/s06-cargar-inscripcion.png](img/s06-cargar-inscripcion.png) |
| [S07 · Dar de baja una inscripción](uc-e07-dar-de-baja-inscripcion.md) | UC-E07 | P3 | Implementado | [img/s07-dar-de-baja-inscripcion.png](img/s07-dar-de-baja-inscripcion.png) |

Los PNG están dibujados sobre fondo blanco, para pegarlos en un informe. La fuente de cada diagrama es el bloque Mermaid de su archivo: si se cambia uno, hay que regenerar su PNG.

**Relación con los diagramas generales.** [`docs/diagramas-de-secuencia/diagramas-secuencia.md`](../../diagramas-de-secuencia/diagramas-secuencia.md) tiene diagramas de todo el proyecto con participantes genéricos. Los de este módulo los **detallan**: D23 a D28 corresponden a S01, S03, S02, S04, S05 y S06 (en ese orden: publicar, editar, consultar, verificar, dar de baja y cargar inscripción); S07 no tiene equivalente. Los generales no muestran la carga de las Zonas y las modalidades de los formularios.

## Criterios aplicados

Son los de la guía para diagramas con formularios y desplegables.

1. **Un caso de uso por diagrama.** La carga de las opciones de un formulario y el alta o la edición van **en el mismo diagrama**.
2. **Si el caso empieza con un formulario con desplegables**, el diagrama muestra al actor abriendo la pantalla y a la pantalla pidiendo las opciones de cada desplegable **antes** de que el actor elija. Pasa en **publicar** (S01) y **editar** (S03): comparten el formulario, con la **Zona** y la **modalidad**.
3. **Un objeto por responsabilidad o fuente de datos**, no uno por desplegable. Las Zonas se consultan en la base: `ZonaRepository`. La modalidad es una lista fija del código: `OpcionesTorneo`. No se inventa un repositorio para las modalidades.
4. **Al enviar**, el método del caso de uso recibe **solo los valores elegidos** (`zonaId`, `modalidad`), no las listas.
5. **La validación se repite al guardar**: una opción mostrada no garantiza que siga siendo válida (la Zona pudo dejar de existir, o el pedido pudo armarse a mano). Y **quién es el dueño, el Estado y el cupo los comprueba la base** en cada acción.
6. **Cada diagrama muestra solo los participantes que intervienen.**

## Participantes: responsabilidad y correspondencia en el repo

**Son responsabilidades conceptuales.** No existen como clases TypeScript con esos nombres.

| Participante | Responsabilidad | Correspondencia en el repo |
|---|---|---|
| **Usuario, Organizador** | La persona que inicia el caso. | La sesión; Organizador es quien publicó un torneo. |
| **FormularioTorneo** | El formulario de torneo (alta y edición). | `components/TournamentForm.tsx`, en `crear-torneo/page.tsx` y `mis-torneos/[id]/DatosTab.tsx`. |
| **PanelTorneos** | La lista «Mis torneos». | `mis-torneos/page.tsx`, con `VerifyButton`. |
| **GestionTorneo** | La pantalla de gestión con sus pestañas. | `mis-torneos/[id]/page.tsx`, `DatosTab.tsx`, `InscripcionesTab.tsx`, `TeamSearch.tsx`, `WithdrawButton.tsx`. |
| **ZonaRepository** | Entrega la lista cerrada de Zonas, **consultada en la base**. | `getZoneGroups()` en `ZoneSelect.tsx`: lee `zones` con corredores y regiones. |
| **OpcionesTorneo** | Entrega las modalidades: **lista fija del código**. | `SPORT_MODALITIES` (`utils/modality.ts`). |
| **TorneoService** | Coordina los casos de uso del torneo. | Las Server Actions de `crear-torneo/actions.ts`, `mis-torneos/actions.ts` y `mis-torneos/[id]/editar/actions.ts`. |
| **InscripcionService** | Coordina cargar y dar de baja inscripciones. | `mis-torneos/[id]/inscripciones/actions.ts`. |
| **Validador** | Valida entradas antes de escribir. | `parseTournamentForm`, `parseFlyer`, `parseTeamName`, `parseTeamQuery` (`utils/`). |
| **TorneoRepository** | Lee y escribe torneos y su flyer, y ejecuta las transiciones (verificar, dar de baja). | Tabla `tournaments` con RLS, las funciones `verify_tournament` y `withdraw_tournament`, y Storage (bucket `flyers`, `utils/supabase/flyer.ts`). |
| **InscripcionRepository** | Lee y escribe las inscripciones. | Tabla `inscriptions` (solo por las funciones `add_inscription`, `add_linked_inscription` y `remove_inscription`). |
| **EquipoRepository** | Busca equipos activos por nombre. | Tabla `teams` (lectura pública). |

## Convenciones de dibujo

- Flecha continua (`->>`): una llamada. Flecha punteada (`-->>`): su respuesta.
- Un mensaje de un participante a sí mismo es un paso interno (por ejemplo, una verificación dentro de una función de Postgres).
- Una nota sobre un participante marca una regla que **hace cumplir la base**.
- Entre paréntesis y en minúscula van los **valores que viajan**; entre comillas «así», los mensajes que ve la persona.
- `opt` es un paso opcional; `alt` / `else`, caminos que se excluyen.
