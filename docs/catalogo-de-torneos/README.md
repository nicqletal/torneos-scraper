# Módulo Catálogo de torneos · Documentación

Documentación completa del módulo B (Catálogo de torneos, público) de Torneos Amateur BA, versión del **04/11/2026**. Sigue el mismo orden que la de los módulos [Equipos](../equipos/README.md) y [Cuenta y acceso](../cuenta-y-acceso/README.md):

| Paso | Documento | Qué contiene |
|---|---|---|
| 1 | [01-requerimientos.md](01-requerimientos.md) | Alcance, actores, requerimientos funcionales (RF-B) y no funcionales (RNF-B), y la lista de diferencias con `casos-de-uso.md`. |
| 2 | [02-casos-de-uso.md](02-casos-de-uso.md) | Los casos de uso UC-B01 a UC-B06, con las salvedades marcadas. |
| 3 | [03-pantallas.md](03-pantallas.md) y [`pantallas/`](pantallas/) | Las pantallas públicas, con su captura, sus estados y el origen de cada lista del filtro. |
| 4 | [04-diagramas-secuencia/](04-diagramas-secuencia/README.md) | Un diagrama de secuencia por caso de uso (Mermaid y PNG). |

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) → [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) → [CONTEXT.md](../../CONTEXT.md) → código y migraciones.

## Matriz de trazabilidad

| Caso de uso | Requerimientos | Pantalla | Diagrama | Estado |
|---|---|---|---|---|
| **UC-B01** Ver el catálogo | RF-B01 a B07, B25 | [P1](03-pantallas.md#p1--catálogo) `/` | [S01](04-diagramas-secuencia/uc-b01-ver-catalogo.md) | **Parcial** (sin paginar) |
| **UC-B02** Filtrar y compartir | RF-B08 a B13 | [P1](03-pantallas.md#p1--catálogo) panel de filtros | [S02](04-diagramas-secuencia/uc-b02-filtrar-torneos.md) | **Parcial** (2 de 5 filtros) |
| **UC-B03** Ver la ficha | RF-B14 a B20 | [P2](03-pantallas.md#p2--ficha-del-torneo) `/torneos/{id}` | [S03](04-diagramas-secuencia/uc-b03-ver-ficha-torneo.md) | **Parcial** |
| **UC-B04** Contactar al organizador | RF-B21, B22 | [P2](03-pantallas.md#p2--ficha-del-torneo) | [S04](04-diagramas-secuencia/uc-b04-contactar-organizador.md) | Implementado |
| **UC-B05** Ver al organizador | RF-B23 | [P3](03-pantallas.md#p3--página-del-organizador) `/organizadores/{id}` | [S05](04-diagramas-secuencia/uc-b05-ver-organizador.md) | Implementado |
| **UC-B06** Reportar un torneo | RF-B24 | [P2](03-pantallas.md#p2--ficha-del-torneo) | [S06](04-diagramas-secuencia/uc-b06-reportar-torneo.md) | **Pendiente** |

## Equivalencia con el PDF original

| Vigente | PDF original |
|---|---|
| UC-B01 Ver el catálogo | UC-08 |
| UC-B02 Filtrar y compartir | UC-09 (filtrar) y UC-10 (compartir) |
| UC-B03 Ver la ficha | UC-11 |
| UC-B04 Contactar al organizador | UC-12 |
| UC-B05 Ver al organizador | SPEC-E04 |
| UC-B06 Reportar un torneo | — (caso nuevo) |

## Hallazgos y pendientes

**`casos-de-uso.md` marca el módulo B como «Implementado», salvo el reporte. Al compararlo con el código, hay nueve diferencias.** Están detalladas en [«Sin decisión»](01-requerimientos.md#5-sin-decisión-lo-que-casos-de-usomd-dice-y-el-código-no-hace). Las más importantes:

1. **El catálogo solo filtra por modalidad y estado.** Zona o Corredor, precio máximo y fechas de inicio **no existen en `main`**. `decisiones-casos-de-uso.md` incluso define el parámetro `?zona=` (que acepta una Zona o un Corredor completo). La rama `feat/dynamic-filters` tiene un filtro por Zona y por precio, pero **no está integrada** y es anterior a la tabla `zones`.
2. **No hay paginación**: se traen todos los torneos de una vez. Con el catálogo creciendo, es la primera deuda de rendimiento.
3. **La ficha de un torneo Finalizado muestra los botones de contacto**, aunque `casos-de-uso.md` pide «Este torneo ya terminó» sin botones.
4. **El 404 de una ficha es el genérico de Next**: en inglés, sin link al catálogo. Se comprobó con una captura.
5. **La ficha no tiene metadatos propios** para la vista previa de WhatsApp.
6. **El texto del mensaje de WhatsApp y el nombre del producto difieren** de lo documentado: la interfaz dice «Torneos Scraper»; la documentación, «Torneos BA».
7. **Un valor inválido en un filtro de la URL no se ignora**: lo rechaza la base y se ve el error de carga.
8. **`casos-de-uso.md` se contradice** sobre los Finalizados: UC-B01 A4 dice que aparecen si se filtra por ese Estado; la regla transversal dice que salen del catálogo. El código hace lo segundo.
9. **El reporte de torneos (UC-B06)** sigue pendiente: sin tabla, función ni botón.

**Capturas:** hay dos vigentes (el catálogo con filtros activos en su estado de error de carga, y el 404 de la ficha). La base de desarrollo no respondía, así que **faltan las que muestran torneos reales**: la lista en [03-pantallas.md](03-pantallas.md#capturas-pendientes).

**Si se cambia un diagrama,** hay que regenerar su PNG (el bloque Mermaid de cada archivo es la fuente).
