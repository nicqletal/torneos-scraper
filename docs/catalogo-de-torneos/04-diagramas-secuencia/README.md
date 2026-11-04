# Módulo Catálogo de torneos · Diagramas de secuencia

Versión del **04/11/2026**. Un diagrama por caso de uso, en [Mermaid](https://mermaid.js.org/) (GitHub los dibuja directo). Siguen a las [pantallas](../03-pantallas.md) y se apoyan en los [casos de uso](../02-casos-de-uso.md).

| Diagrama | Caso de uso | Pantalla | Estado | PNG |
|---|---|---|---|---|
| [S01 · Ver el catálogo](uc-b01-ver-catalogo.md) | UC-B01 | P1 | Parcial (sin paginar) | [img/s01-ver-catalogo.png](img/s01-ver-catalogo.png) |
| [S02 · Filtrar torneos](uc-b02-filtrar-torneos.md) | UC-B02 | P1 | Parcial (2 de 5 filtros) | [img/s02-filtrar-torneos.png](img/s02-filtrar-torneos.png) |
| [S03 · Ver la ficha](uc-b03-ver-ficha-torneo.md) | UC-B03 | P2 | Parcial | [img/s03-ver-ficha-torneo.png](img/s03-ver-ficha-torneo.png) |
| [S04 · Contactar al organizador](uc-b04-contactar-organizador.md) | UC-B04 | P2 | Implementado | [img/s04-contactar-organizador.png](img/s04-contactar-organizador.png) |
| [S05 · Ver al organizador](uc-b05-ver-organizador.md) | UC-B05 | P3 | Implementado | [img/s05-ver-organizador.png](img/s05-ver-organizador.png) |
| [S06 · Reportar un torneo](uc-b06-reportar-torneo.md) | UC-B06 | P2 | **Pendiente** (diseño objetivo) | [img/s06-reportar-torneo.png](img/s06-reportar-torneo.png) |

Los PNG están dibujados sobre fondo blanco, para pegarlos en un informe. La fuente de cada diagrama es el bloque Mermaid de su archivo: si se cambia uno, hay que regenerar su PNG.

**Relación con los diagramas generales.** [`docs/diagramas-de-secuencia/diagramas-secuencia.md`](../../diagramas-de-secuencia/diagramas-secuencia.md) tiene diagramas de todo el proyecto con participantes genéricos. Los de este módulo los **detallan**: D07 a D11 corresponden a S01 a S04 (D08 y D09, filtrar y compartir, están juntos en S02), y D29 (página del organizador) a S05. S06 no tiene equivalente.

## Criterios aplicados

Son los de la guía para diagramas con formularios y desplegables.

1. **Un caso de uso por diagrama.** Cargar las opciones de un filtro y filtrar van **en el mismo diagrama**.
2. **Si el caso empieza con un formulario o filtros con opciones**, el diagrama muestra al actor abriendo la pantalla y a la pantalla pidiendo las opciones **antes** de que el actor elija. Acá, el panel de filtros (S02) y los motivos del reporte (S06).
3. **Un objeto por responsabilidad o fuente de datos.** Si la lista se consulta en la base, es un repositorio; si es una lista fija del código, es un **proveedor de opciones**. Las modalidades y los Estados del filtro son listas fijas del código, así que las provee `OpcionesTorneo`; no se inventa un repositorio para ellas.
4. **Al filtrar**, se pasan **solo los valores elegidos** (`modalidad`, `estado`), nunca las listas.
5. **La validación se repite al consultar.** Un valor que aparece en el panel no garantiza que siga siendo válido en la URL: cualquiera puede editarla. Hoy el servidor **no** lo valida antes de consultar (ver S02).
6. **Cada diagrama muestra solo los participantes que intervienen.**

## Participantes: responsabilidad y correspondencia en el repo

**Son responsabilidades conceptuales.** No existen como clases TypeScript con esos nombres: la app usa Server Components, utilidades puras y consultas a la base.

| Participante | Responsabilidad | Correspondencia en el repo |
|---|---|---|
| **Invitado, Usuario** | La persona que inicia el caso. | La sesión; el Invitado navega sin ella. |
| **PaginaCatalogo** | La portada con el listado de tarjetas. | `app/page.tsx`, `TournamentList.tsx`, `TournamentCard.tsx`. |
| **FiltrosCatalogo** | El panel de filtros, que escribe los filtros en la URL. | `components/Filters.tsx`. |
| **FichaTorneo** | La ficha pública de un torneo. | `app/torneos/[id]/page.tsx`. |
| **PaginaOrganizador** | La página pública del organizador. | `app/organizadores/[id]/page.tsx`. |
| **OpcionesTorneo** | Entrega las modalidades y los Estados del filtro: **listas fijas del código**. | `SPORT_MODALITIES` (`utils/modality.ts`) y la lista de Estados de `Filters.tsx`. |
| **OpcionesReporte** | Solo en S06: los motivos de reporte, lista fija. | **No existe todavía.** |
| **TorneoRepository** | Lee torneos, con su Estado y cupos calculados por la base. | Tabla `tournaments` con RLS y columnas calculadas `status` e `inscriptions_count`; la Zona sale de `zones`. |
| **InscripcionRepository** | Entrega los nombres de los equipos anotados. | Vista pública `tournament_inscriptions`. |
| **PerfilRepository** | Entrega el nombre, la foto y la Zona del organizador. | Tabla `profiles` (lectura pública). |
| **ReporteService, Validador, ReporteRepository** | Solo en S06: validar y guardar el reporte. | **No existen todavía.** |
| **WhatsApp, Instagram** | Sistemas externos adonde termina el flujo. | `wa.me` (`whatsappLink`) e `instagram.com`. |

## Convenciones de dibujo

- Flecha continua (`->>`): una llamada. Flecha punteada (`-->>`): su respuesta.
- Un mensaje de un participante a sí mismo es un paso interno.
- Una nota sobre un participante marca una regla que **hace cumplir la base** o una diferencia con la documentación.
- Entre paréntesis y en minúscula van los **valores que viajan**; entre comillas «así», los mensajes que ve la persona.
- `opt` es un paso opcional; `alt` / `else`, caminos que se excluyen.
