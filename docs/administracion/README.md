# Módulo Administración · Documentación

Documentación completa del módulo F (Administración) de Torneos Amateur BA, versión del **04/11/2026**. Sigue el mismo orden que la de los módulos [Equipos](../equipos/README.md), [Cuenta y acceso](../cuenta-y-acceso/README.md) y [Catálogo de torneos](../catalogo-de-torneos/README.md):

| Paso | Documento | Qué contiene |
|---|---|---|
| 1 | [01-requerimientos.md](01-requerimientos.md) | Alcance, actores, requerimientos funcionales (RF-F) y no funcionales (RNF-F), y las decisiones abiertas. |
| 2 | [02-casos-de-uso.md](02-casos-de-uso.md) | Los casos de uso UC-F01 a UC-F06. |
| 3 | [03-pantallas.md](03-pantallas.md) y [`pantallas/`](pantallas/) | Las cuatro pantallas que existen, con su captura y sus estados. |
| 4 | [04-diagramas-secuencia/](04-diagramas-secuencia/README.md) | Un diagrama de secuencia por caso de uso (Mermaid y PNG). Los cuatro de moderación son diseño objetivo. |

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) → [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) → [acceso-administrador.md](../especificaciones-y-requerimientos/acceso-administrador.md) → [CONTEXT.md](../../CONTEXT.md) → código y migraciones.

## Matriz de trazabilidad

| Caso de uso | Requerimientos | Pantalla | Diagrama | Estado |
|---|---|---|---|---|
| **UC-F01** Acceder al panel | RF-F01 a F07 | [P1](03-pantallas.md#p1--acceso-de-administrador) `/admin/login` | [S01](04-diagramas-secuencia/uc-f01-acceder-administracion.md) | Implementado |
| **UC-F02** Consultar el tablero | RF-F08 a F11 | [P2](03-pantallas.md#p2--resumen-de-la-plataforma), [P3](03-pantallas.md#p3--seguridad-y-acceso), [P4](03-pantallas.md#p4--sidebar-de-administración) | [S02](04-diagramas-secuencia/uc-f02-consultar-tablero.md) | **Parcial** |
| **UC-F03** Resolver reporte de torneo | RF-F12, F13, F18 | — | [S03](04-diagramas-secuencia/uc-f03-resolver-reporte-torneo.md) | **Pendiente** |
| **UC-F04** Resolver reporte de equipo | RF-F14, F18 | — | [S04](04-diagramas-secuencia/uc-f04-resolver-reporte-equipo.md) | **Pendiente** |
| **UC-F05** Suspender una cuenta | RF-F15 a F18 | — | [S05](04-diagramas-secuencia/uc-f05-suspender-cuenta.md) | **Pendiente** |
| **UC-F06** Buscar usuarios | RF-F19 | — | [S06](04-diagramas-secuencia/uc-f06-buscar-usuarios.md) | **Pendiente** |

## Equivalencia con el PDF original

| Vigente | PDF original |
|---|---|
| UC-F01 Acceder al panel | CU-F01 |
| UC-F02 Consultar el tablero | — (caso nuevo) |
| UC-F03 Resolver reporte de torneo | CU-F03 (y CU-F06, registrar la resolución) |
| UC-F04 Resolver reporte de equipo | — (caso nuevo) |
| UC-F05 Suspender una cuenta | CU-F05 |
| UC-F06 Buscar usuarios | — (caso nuevo) |
| — | CU-F04, arbitrar partidos: se retiró (el administrador no arbitra partidos) |

La correspondencia del CU-F02 del PDF no está clara en los documentos del repo: figura como «para otra tanda» en los diagramas generales.

## Hallazgos y pendientes

1. **El módulo está a un tercio.** Está hecho el **acceso diferenciado** (con sus dos capas de verificación del rol), el marco del backoffice y el resumen. **No existe nada de la moderación:** no hay tablas de reportes, de suspensiones ni de registro de acciones, y los botones «Reportar» de torneos y equipos tampoco existen. Los cuatro casos pendientes dependen de eso.
2. **Los reportes son la dependencia crítica.** Sin UC-B06 (reportar un torneo) y UC-C10 (reportar un equipo) el administrador no tiene qué resolver. Conviene programarlos antes que la pantalla de reportes del backoffice.
3. **La Suspensión toca otros módulos.** Cancela búsquedas, anula propuestas y tira partidos futuros (módulos C y D) y hoy la base no verifica ni siquiera que un suspendido no reciba la capitanía. Hay que decidir qué hace falta antes de programarla.
4. **Decisiones abiertas** ([detalle](01-requerimientos.md#5-sin-decisión)): el email de contacto del Aviso de suspensión; cómo buscar usuarios por email sin exponer datos ni la `service_role key`; cómo accede el administrador a los comentarios privados de calificación y al Capitán de un equipo; y qué pasa con lo cancelado cuando vence una Suspensión.
5. **Un mensaje de error en español, no como en el acceso general.** El acceso de administrador dice «No pudimos iniciar sesión. Revisá tu email y contraseña.»; el acceso general dice «Invalid Credentials» en inglés.
6. **Capturas:** hay dos vigentes del acceso (normal y con «acceso denegado»). Las demás requieren una cuenta con el rol de administrador: la lista está en [03-pantallas.md](03-pantallas.md#capturas-pendientes).
7. **Tests:** `is_admin_test.sql` y `admin-access.test.ts` cubren el acceso. Cada etapa de moderación deberá llegar con sus pruebas (la regla del proyecto: toda policy de RLS nueva viene con su test).
8. **Si se cambia un diagrama,** hay que regenerar su PNG (el bloque Mermaid de cada archivo es la fuente).
