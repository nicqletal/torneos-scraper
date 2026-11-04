# Módulo Administración · Diagramas de secuencia

Versión del **04/11/2026**. Un diagrama por caso de uso, en [Mermaid](https://mermaid.js.org/) (GitHub los dibuja directo). Siguen a las [pantallas](../03-pantallas.md) y se apoyan en los [casos de uso](../02-casos-de-uso.md).

| Diagrama | Caso de uso | Pantalla | Estado | PNG |
|---|---|---|---|---|
| [S01 · Acceder al panel](uc-f01-acceder-administracion.md) | UC-F01 | P1 | Implementado | [img/s01-acceder-administracion.png](img/s01-acceder-administracion.png) |
| [S02 · Consultar el tablero](uc-f02-consultar-tablero.md) | UC-F02 | P2, P3, P4 | Parcial | [img/s02-consultar-tablero.png](img/s02-consultar-tablero.png) |
| [S03 · Resolver un reporte de torneo](uc-f03-resolver-reporte-torneo.md) | UC-F03 | — | **Pendiente** (diseño objetivo) | [img/s03-resolver-reporte-torneo.png](img/s03-resolver-reporte-torneo.png) |
| [S04 · Resolver un reporte de equipo](uc-f04-resolver-reporte-equipo.md) | UC-F04 | — | **Pendiente** (diseño objetivo) | [img/s04-resolver-reporte-equipo.png](img/s04-resolver-reporte-equipo.png) |
| [S05 · Suspender una cuenta](uc-f05-suspender-cuenta.md) | UC-F05 | — | **Pendiente** (diseño objetivo) | [img/s05-suspender-cuenta.png](img/s05-suspender-cuenta.png) |
| [S06 · Buscar usuarios](uc-f06-buscar-usuarios.md) | UC-F06 | — | **Pendiente** (diseño objetivo) | [img/s06-buscar-usuarios.png](img/s06-buscar-usuarios.png) |

Los PNG están dibujados sobre fondo blanco, para pegarlos en un informe. La fuente de cada diagrama es el bloque Mermaid de su archivo: si se cambia uno, hay que regenerar su PNG.

**Relación con los diagramas generales.** [`docs/diagramas-de-secuencia/diagramas-secuencia.md`](../../diagramas-de-secuencia/diagramas-secuencia.md) tiene diagramas de todo el proyecto con participantes genéricos. Los de este módulo los **detallan**: D30 (acceder a administración) corresponde a S01, D31 (resolver reporte) a S03 y S04, D32 (suspender cuenta) a S05, y D33 (registrar la resolución) está dentro de S03 a S05, en el paso del registro de acciones.

> **Diseño objetivo.** S03 a S06 dibujan casos que **todavía no están programados**: dibujan lo que dicen las reglas escritas. Los participantes marcados como «no existen todavía» tienen nombres provisorios.

## Criterios aplicados

Son los de la guía para diagramas con formularios y desplegables.

1. **Un caso de uso por diagrama.** Cargar las opciones de una elección y la acción que sigue van **en el mismo diagrama**.
2. **Si el caso empieza con una elección entre opciones**, el diagrama muestra a la pantalla pidiendo las opciones **antes** de que el actor elija. Acá: las resoluciones posibles de un reporte (S03 y S04) y las duraciones de una Suspensión (S05).
3. **Un objeto por responsabilidad o fuente de datos.** Esas listas son **fijas del código** (no se guardan en la base), así que las provee un **proveedor de opciones** y no un repositorio.
4. **Al enviar**, se pasan **solo los valores elegidos** (`resolucion`, `duracion`, `motivo`), nunca las listas.
5. **La validación se repite al guardar.** Una opción mostrada no garantiza que siga siendo válida: el reporte pudo resolverse en otra pestaña, o el pedido pudo armarse a mano. Y **el rol se vuelve a verificar en el servidor en cada acción**: la pantalla no autoriza.
6. **Cada diagrama muestra solo los participantes que intervienen.**

## Participantes: responsabilidad y correspondencia en el repo

**Son responsabilidades conceptuales.** No existen como clases TypeScript con esos nombres.

| Participante | Responsabilidad | Correspondencia en el repo |
|---|---|---|
| **Administrador, Usuario** | La persona que inicia el caso. El Usuario es una cuenta común. | La sesión, y una fila en `admins` para el Administrador. |
| **ControlDeAcceso** | Primera capa: decide si una ruta `/admin/…` exige sesión y rol, y redirige. | `src/proxy.ts`. |
| **FormularioAdmin** | La pantalla `/admin/login`. | `admin/login/page.tsx`. |
| **PanelAdmin** | El resumen, «Seguridad y acceso» y la sidebar. | `admin/(backoffice)/page.tsx`, `seguridad/page.tsx`, `AdminSidebar.tsx`. |
| **AdminService** | Coordina el acceso y las acciones del administrador. | La Server Action `loginAsAdmin` (`admin/login/actions.ts`) y `authenticateAdmin` (`utils/supabase/admin-login.ts`). Para la moderación, no existe todavía. |
| **Validador** | Valida entradas antes de actuar. | `adminDestination` (`utils/admin-access.ts`). |
| **CuentaRepository** | Abre y consulta la sesión. | Supabase Auth (`signInWithPassword`, `getUser`). |
| **RolRepository** | Responde si la sesión actual es de un administrador. | La función `is_admin()` (`security definer`) sobre la tabla `admins`, que no se puede leer directo. Se usa desde `proxy.ts` y `requireAdmin()` (`utils/admin.ts`). |
| **EstadisticasRepository** | Cuenta torneos, equipos y usuarios. | Consultas `count` sobre `tournaments`, `teams` y `profiles`. |
| **OpcionesResolucion, OpcionesSuspension** | Entregan las resoluciones de un reporte y las duraciones de una Suspensión: **listas fijas del código**. | **No existen todavía.** |
| **PanelReportes, FormularioSuspension, PanelUsuarios** | Las pantallas de moderación. | **No existen todavía.** |
| **ReporteRepository, TorneoRepository, EquipoRepository, CalificacionRepository, SuspensionRepository, UsuarioRepository, RegistroDeAcciones** | Los datos de la moderación. | Pendientes. `TorneoRepository` y `EquipoRepository` sí existen como tablas `tournaments` y `teams`; el resto **no existe todavía**. |

## Convenciones de dibujo

- Flecha continua (`->>`): una llamada. Flecha punteada (`-->>`): su respuesta.
- Un mensaje de un participante a sí mismo es un paso interno.
- Una nota sobre un participante marca una regla que **hace cumplir la base**, un paso pendiente o una diferencia con la documentación.
- Entre paréntesis y en minúscula van los **valores que viajan**; entre comillas «así», los mensajes que ve la persona.
- `opt` es un paso opcional; `alt` / `else`, caminos que se excluyen; `par`, pasos en paralelo.
