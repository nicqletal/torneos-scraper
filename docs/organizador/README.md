# Módulo Organizador · Documentación

Documentación completa del módulo E (Organizador) de Torneos Amateur BA, versión del **04/11/2026**. Sigue el mismo orden que la de los módulos [Equipos](../equipos/README.md), [Cuenta y acceso](../cuenta-y-acceso/README.md), [Catálogo de torneos](../catalogo-de-torneos/README.md) y [Administración](../administracion/README.md):

| Paso | Documento | Qué contiene |
|---|---|---|
| 1 | [01-requerimientos.md](01-requerimientos.md) | Alcance, actores, requerimientos funcionales (RF-E) y no funcionales (RNF-E), y las diferencias con `casos-de-uso.md`. |
| 2 | [02-casos-de-uso.md](02-casos-de-uso.md) | Los casos de uso UC-E01 a UC-E07. |
| 3 | [03-pantallas.md](03-pantallas.md) y [`pantallas/`](pantallas/) | Las tres pantallas del panel, con sus estados y el origen de cada desplegable. |
| 4 | [04-diagramas-secuencia/](04-diagramas-secuencia/README.md) | Un diagrama de secuencia por caso de uso (Mermaid y PNG). |

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) → [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) → [CONTEXT.md](../../CONTEXT.md) → código y migraciones.

## Matriz de trazabilidad

| Caso de uso | Requerimientos | Pantalla | Diagrama | Estado |
|---|---|---|---|---|
| **UC-E01** Publicar un torneo | RF-E01 a E08 | [P2](03-pantallas.md#p2--publicar-torneo) `/crear-torneo` | [S01](04-diagramas-secuencia/uc-e01-publicar-torneo.md) | **Parcial** (Suspensión) |
| **UC-E02** Ver mis torneos | RF-E12 a E15 | [P1](03-pantallas.md#p1--mis-torneos) `/mis-torneos`, [P3](03-pantallas.md#p3--gestión-del-torneo) | [S02](04-diagramas-secuencia/uc-e02-ver-mis-torneos.md) | Implementado |
| **UC-E03** Editar un torneo | RF-E02 a E06, E09 a E11 | [P3](03-pantallas.md#p3--gestión-del-torneo) pestaña Datos | [S03](04-diagramas-secuencia/uc-e03-editar-torneo.md) | Implementado |
| **UC-E04** Verificar que sigue vigente | RF-E16 a E18 | [P1](03-pantallas.md#p1--mis-torneos) y [P3](03-pantallas.md#p3--gestión-del-torneo) | [S04](04-diagramas-secuencia/uc-e04-verificar-torneo.md) | Implementado |
| **UC-E05** Dar de baja un torneo | RF-E19 a E22 | [P3](03-pantallas.md#p3--gestión-del-torneo) | [S05](04-diagramas-secuencia/uc-e05-dar-de-baja-torneo.md) | Implementado |
| **UC-E06** Cargar una inscripción | RF-E23 a E30 | [P3](03-pantallas.md#p3--gestión-del-torneo) pestaña Inscripciones | [S06](04-diagramas-secuencia/uc-e06-cargar-inscripcion.md) | Implementado |
| **UC-E07** Dar de baja una inscripción | RF-E28, E31 | [P3](03-pantallas.md#p3--gestión-del-torneo) pestaña Inscripciones | [S07](04-diagramas-secuencia/uc-e07-dar-de-baja-inscripcion.md) | Implementado |

## Equivalencia con el PDF original

| Vigente | PDF original |
|---|---|
| UC-E01 Publicar un torneo | SPEC-E01 |
| UC-E02 Ver mis torneos | SPEC-E02 |
| UC-E03 Editar un torneo | SPEC-E01 |
| UC-E04 Verificar que sigue vigente | SPEC-E02 |
| UC-E05 Dar de baja un torneo | SPEC-E02 |
| UC-E06 Cargar una inscripción | SPEC-E03 (el flujo donde el capitán se anotaba desde la app se retiró) |
| UC-E07 Dar de baja una inscripción | SPEC-E03 |

## Hallazgos y pendientes

Este es **el módulo más completo**: todos los casos están implementados. Las observaciones son menores.

1. **La Suspensión no se verifica al publicar** (UC-E01). `casos-de-uso.md` pone «sin Suspensión» como precondición; la Suspensión no existe todavía (UC-F05). Por eso el caso es **Parcial**.
2. **Dos reglas del código no están documentadas en `casos-de-uso.md` ni en las decisiones:** «Sigue vigente» se apaga si el torneo se confirmó hace menos de 24 h, y editar un torneo con equipos anotados pide confirmación. Hay que decidir si se documentan como reglas del producto (los dejé en los requerimientos como implementados).
3. **La marca Observado todavía no existe**, así que «Sigue vigente no la saca» es una regla sin efecto hasta que se implemente UC-F03.
4. **El formulario de torneo y el de equipo siguen el mismo patrón** (Zona de la base, modalidad de una lista del código): los diagramas S01 y S03 aplican la guía de desplegables.
5. **Los diagramas generales (D23 a D28)** no muestran la carga de las Zonas y las modalidades; los de este módulo sí.
6. **Capturas: no hay ninguna.** Las tres pantallas exigen sesión y la base de desarrollo no respondía. La lista, con los pasos, está en [03-pantallas.md](03-pantallas.md#capturas-pendientes).
7. **Tests de base:** hay pgTAP para RLS, estado, formulario, actualización, verificación, baja, zona, flyers, inscripciones e inscripciones vinculadas (`tournaments_*_test.sql`, `inscriptions_test.sql`, `linked_inscriptions_test.sql`, `tournament_flyers_test.sql`).
8. **Si se cambia un diagrama,** hay que regenerar su PNG (el bloque Mermaid de cada archivo es la fuente).
