# Módulo Partidos · Documentación

Documentación completa del módulo D (Partidos: buscar rival) de Torneos Amateur BA, versión del **04/11/2026**. Sigue el mismo orden que la de los demás módulos ([Equipos](../equipos/README.md), [Cuenta y acceso](../cuenta-y-acceso/README.md), [Catálogo de torneos](../catalogo-de-torneos/README.md), [Organizador](../organizador/README.md), [Administración](../administracion/README.md)):

| Paso | Documento | Qué contiene |
|---|---|---|
| 1 | [01-requerimientos.md](01-requerimientos.md) | Alcance, actores, requerimientos funcionales (RF-D) y no funcionales (RNF-D), y las decisiones abiertas. |
| 2 | [02-casos-de-uso.md](02-casos-de-uso.md) | Los casos de uso UC-D01 a UC-D14. |
| 3 | [03-pantallas.md](03-pantallas.md) y [`pantallas/`](pantallas/) | Las dos pantallas (`/partidos` y `/partidos/buscar`), con sus estados y el origen de cada opción. |
| 4 | [04-diagramas-secuencia/](04-diagramas-secuencia/README.md) | Un diagrama de secuencia por caso de uso (Mermaid y PNG). |

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) → [diseno-partidos.md](../especificaciones-y-requerimientos/diseno-partidos.md) → [ADR 0002](../adr/0002-conflictos-sin-arbitro.md) → [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) → [CONTEXT.md](../../CONTEXT.md) → código y migraciones.

> **No confundir los prefijos.** Los `RF-D##` de este módulo son los del módulo D (Partidos). La especificación vieja de Equipos (28/10/2026) usaba `RF-D##` para los suyos cuando llamaba «módulo D» a Equipos; esos hoy son los `RF-C##` de [Equipos](../equipos/01-requerimientos.md).

## Matriz de trazabilidad

| Caso de uso | Requerimientos | Pantalla | Diagrama | Estado |
|---|---|---|---|---|
| **UC-D01** Publicar una búsqueda | RF-D02 a D06, D32 | [P2](03-pantallas.md#p2--buscar-rival) `/partidos/buscar` | [S01](04-diagramas-secuencia/uc-d01-publicar-busqueda.md) | **Parcial** (Suspensión) |
| **UC-D02** Editar o cancelar la búsqueda | RF-D07, D08 | [P2](03-pantallas.md#p2--buscar-rival) | [S02](04-diagramas-secuencia/uc-d02-editar-cancelar-busqueda.md) | Implementado |
| **UC-D03** Ver rivales compatibles | RF-D09, D10, D31 | [P2](03-pantallas.md#p2--buscar-rival) | [S03](04-diagramas-secuencia/uc-d03-ver-rivales-compatibles.md) | Implementado |
| **UC-D04** Proponer un partido | RF-D11, D12 | [P2](03-pantallas.md#p2--buscar-rival) | [S04](04-diagramas-secuencia/uc-d04-proponer-partido.md) | Implementado |
| **UC-D05** Cancelar una propuesta | RF-D13 | [P2](03-pantallas.md#p2--buscar-rival) | [S05](04-diagramas-secuencia/uc-d05-cancelar-propuesta.md) | Implementado |
| **UC-D06** Aceptar o rechazar una propuesta | RF-D14 a D18 | [P1](03-pantallas.md#p1--partidos) `/partidos` | [S06](04-diagramas-secuencia/uc-d06-responder-propuesta.md) | Implementado |
| **UC-D07** Coordinar cancha y hora | RF-D19, D20 | [P1](03-pantallas.md#p1--partidos) | [S07](04-diagramas-secuencia/uc-d07-coordinar-cancha-hora.md) | Implementado |
| **UC-D08** Confirmar asistencia | RF-D21 | [P1](03-pantallas.md#p1--partidos) | [S08](04-diagramas-secuencia/uc-d08-confirmar-asistencia.md) | Implementado |
| **UC-D09** Tirar el partido | RF-D22, D31 | [P1](03-pantallas.md#p1--partidos) | [S09](04-diagramas-secuencia/uc-d09-tirar-partido.md) | Implementado |
| **UC-D10** Caída de común acuerdo | RF-D23, D35 | [P1](03-pantallas.md#p1--partidos) | [S10](04-diagramas-secuencia/uc-d10-caida-comun-acuerdo.md) | Implementado |
| **UC-D11** Cargar el resultado | RF-D24, D25, D27 | [P1](03-pantallas.md#p1--partidos) | [S11](04-diagramas-secuencia/uc-d11-cargar-resultado.md) | Implementado |
| **UC-D12** Reportar que no se presentó | RF-D26, D27, D31, D33 | [P1](03-pantallas.md#p1--partidos) | [S12](04-diagramas-secuencia/uc-d12-reportar-no-se-presento.md) | Implementado |
| **UC-D13** Calificar al rival | RF-D28, D29 | [P1](03-pantallas.md#p1--partidos) | [S13](04-diagramas-secuencia/uc-d13-calificar-rival.md) | Implementado |
| **UC-D14** Ver mis partidos | RF-D01, D30 | [P1](03-pantallas.md#p1--partidos) | [S14](04-diagramas-secuencia/uc-d14-ver-mis-partidos.md) | Implementado |

## Equivalencia con el PDF original

| Vigente | PDF original |
|---|---|
| UC-D01 Publicar una búsqueda | UC-13 |
| UC-D03 Ver rivales compatibles | UC-14 |
| UC-D04 Proponer un partido | UC-15 |
| UC-D06 Aceptar o rechazar una propuesta | UC-16 |
| UC-D05 Cancelar una propuesta | UC-17 |
| UC-D07 Coordinar cancha y hora | UC-18 |
| UC-D08 Confirmar asistencia | UC-19 |
| UC-D09 Tirar el partido | UC-20 |
| UC-D02, D10 a D14 | Sin correspondencia exacta en los documentos del repo (los diagramas generales dejan UC-21 a UC-24 «para otra tanda») |

## Hallazgos y pendientes

El módulo **está casi completo**: los 14 casos están implementados. Las observaciones son pocas:

1. **«Copiar horarios de la última búsqueda» no existe.** `decisiones-casos-de-uso.md` dice que reemplaza a la grilla de disponibilidad eliminada, pero no hay nada en el código y `casos-de-uso.md` no lo menciona. Hay que decidir si se programa o si se quita esa frase de las decisiones.
2. **La Suspensión no se verifica** en `save_rival_search` ni en las demás funciones de Partidos (UC-D01 la pide como precondición). Depende de UC-F05.
3. **La calificación no tiene lector.** Los comentarios de calificación los debe leer el administrador al revisar un equipo reportado (UC-F04), pero la tabla `ratings` no la lee nadie por la API. Falta definir cómo accede el backoffice.
4. **El motivo de tirar un partido no se modera** y queda visible en el historial público (riesgo aceptado el 27/10/2026).
5. **Los diagramas generales** (D12 a D19) cubren 8 de los 14 casos y no muestran la carga de las opciones del formulario; los de este módulo sí, y suman los casos que faltaban.
6. **Capturas: no hay ninguna.** Las dos pantallas exigen sesión (y la base de desarrollo no respondía). Para sacarlas hacen falta las cuentas QA y el script de escenarios `scripts/qa/partidos.ts` (que arma los casos con plazos); la lista, con los pasos, está en [03-pantallas.md](03-pantallas.md#capturas-pendientes).
7. **Tests:** es el módulo mejor probado: pgTAP para cada frontera de fase y plazo, cada función y cada policy o vista (`rival_searches`, `proposals`, `matches`, `match_coordination`, `match_drops`, `match_results`, `ratings`, `team_faults`, `team_history`, `compatible_rivals`, `notices`), y pruebas unitarias de la validación y el texto.
8. **Si se cambia un diagrama,** hay que regenerar su PNG (el bloque Mermaid de cada archivo es la fuente).
