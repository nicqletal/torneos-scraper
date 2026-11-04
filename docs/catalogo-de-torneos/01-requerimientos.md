# Módulo Catálogo de torneos · Especificación de requerimientos

Versión del **04/11/2026**. Parte de la documentación del módulo: **requerimientos** → [casos de uso](02-casos-de-uso.md) → [pantallas](03-pantallas.md) → [diagramas de secuencia](04-diagramas-secuencia/README.md). El [README](README.md) tiene la matriz que los une.

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md), [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (módulo B, 03/11/2026), el glosario [CONTEXT.md](../../CONTEXT.md) y el código y las migraciones del repo al día de hoy. **Donde `casos-de-uso.md` y el código no coinciden, este documento lo señala** (ver la sección «Sin decisión»).

## 1. Alcance

El módulo es la parte **pública** de los torneos: cualquiera, sin sesión, **encuentra torneos** en el catálogo (`/`), los **filtra**, abre la **ficha** de uno, **contacta al organizador** y mira la **página pública del organizador**. Cualquier usuario con sesión puede además **reportar** un torneo (pendiente). El flujo **termina en un deep link a WhatsApp o Instagram del organizador**.

**Límite de producto:** la app **nunca inscribe ni cobra**. La inscripción se arregla por fuera y la carga el organizador (módulo E). Que la ficha no tenga un botón «Anotarme» es un límite, no una función faltante.

**Fuera del módulo:**

| Tema | Dónde está |
|---|---|
| Publicar, editar, verificar y dar de baja un torneo; cargar inscripciones | Módulo E — Organizador |
| Resolver un Reporte (descartar, marcar Observado, dar de baja) | Módulo F — Administración |
| Crear cuenta o iniciar sesión para reportar | Módulo A — Cuenta y acceso |
| Cómo se calcula el Estado del torneo | La base de datos (función `status`); este módulo solo lo muestra |

## 2. Actores

| Actor | Quién es | Qué hace en este módulo |
|---|---|---|
| **Invitado** | Persona sin sesión | Consulta el catálogo, filtra, abre fichas, contacta al organizador, mira la página del organizador. |
| **Usuario** | Persona con sesión | Todo lo del Invitado, y reporta un torneo. |
| **Organizador** | Usuario que publicó un torneo | Ve su propia ficha con la barra «Este torneo es tuyo · Gestionar». |
| **Sistema** | La base de datos y la app | Calcula el Estado, la antigüedad de verificación y «Últimos cupos» al momento de leer. |

## 3. Requerimientos funcionales

**Estado:** `Implementado` está en `main`. `Parcial` tiene una parte sin cumplir, que se indica. `Pendiente` es alcance vigente sin programar.

### Catálogo

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-B01 | `/` es el **catálogo público**: lista los torneos **no finalizados**, ordenados por **fecha de inicio** (el que empieza antes, primero). No hay «vista de jugador» ni «de organizador». | UC-B01 | Implementado |
| RF-B02 | El listado está **paginado**. | UC-B01 | **Pendiente**: hoy se traen todos los torneos de una vez (ver «Sin decisión») |
| RF-B03 | Cada tarjeta muestra el **flyer** (o un marcador), el nombre, la Zona con su corredor, la modalidad, el precio, el **Estado del torneo** y la **antigüedad de verificación**; y toda la tarjeta es el link a la ficha. | UC-B01 | Implementado |
| RF-B04 | **Precio:** vacío se muestra como «Consultar» y 0 como «Gratis». | UC-B01, UC-B03 | Implementado |
| RF-B05 | **Antigüedad de verificación:** desde 30 días completos sin verificar, en ámbar; desde 60, en rojo con «Sin confirmar». Un Finalizado no la muestra. | UC-B01, UC-B03 | Implementado |
| RF-B06 | **«Últimos cupos»:** etiqueta sobre un torneo **Abierto** con 2 lugares o menos. **No es un Estado.** | UC-B01 | Implementado |
| RF-B07 | Los torneos **Finalizados no aparecen en el catálogo**; su ficha sigue accesible. | UC-B01, UC-B03 | Implementado |

### Filtros

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-B08 | Filtrar por **modalidad** (Fútbol 5, 7, 8 u 11) y por **Estado** (inscripción abierta, en curso, inscripción cerrada). Los filtros se combinan (AND). | UC-B02 | Implementado |
| RF-B09 | Filtrar por **Zona** o por **Corredor** completo (elegir un corredor incluye todas sus Zonas). | UC-B02 | **Pendiente** |
| RF-B10 | Filtrar por **precio máximo** y por **fechas de inicio**. | UC-B02 | **Pendiente** (solo figura en `casos-de-uso.md`) |
| RF-B11 | Los filtros viven en la **URL** (`?modality=…&status=…`), nunca en estado local: una vista filtrada es siempre un **link compartible**, y cambiar un filtro vuelve a la primera página. | UC-B02 | Implementado |
| RF-B12 | Un parámetro desconocido en la URL se ignora sin romper la página. | UC-B02 | **Parcial**: una clave desconocida se ignora, pero un valor inválido de `modality` o `status` no se valida antes de consultar |
| RF-B13 | Sin resultados, mostrar un mensaje y la forma de limpiar los filtros. | UC-B02 | **Parcial**: hay mensaje; limpiar es elegir «Todas las modalidades» y «Todos los estados» (no hay un botón «Limpiar») |

### Ficha del torneo

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-B14 | La **ficha pública** (`/torneos/{id}`) muestra flyer, nombre, organizador (con link a su página), modalidad, Zona, **dirección de la sede** (con link al mapa), cierre de inscripción, inicio y fin, precio, Estado, descripción, reglamento, antigüedad de verificación, cupo e inscriptos. | UC-B03 | Implementado |
| RF-B15 | La ficha muestra los **nombres de los equipos anotados**; los de una Inscripción vinculada enlazan a la página del equipo. Solo nombres: nunca contactos. | UC-B03 | Implementado |
| RF-B16 | Para el **organizador dueño** la ficha es idéntica a la de cualquiera, más una barra «Este torneo es tuyo · Gestionar». | UC-B03 | Implementado |
| RF-B17 | Un torneo **dado de baja** devuelve **404 con un link al catálogo**. | UC-B03 | **Parcial**: devuelve 404, pero es la página genérica de Next, en inglés y sin link |
| RF-B18 | Un torneo **Finalizado** se muestra **sin botones de contacto** («Este torneo ya terminó»). | UC-B03 | **Pendiente**: hoy la ficha de un Finalizado muestra los botones |
| RF-B19 | La URL de la ficha es **estable** y la página tiene **metadatos** (flyer, nombre, Zona) para la vista previa al compartir por WhatsApp. | UC-B03 | **Parcial**: la URL es estable; no hay metadatos propios |
| RF-B20 | La ficha de un torneo es **de lectura pública**, con o sin sesión. | UC-B03 | Implementado |

### Contacto y organizador

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-B21 | **Contactar por WhatsApp** abre `wa.me` con el número del organizador y un **mensaje sugerido** editable; **Ver Instagram** abre el perfil. Ahí termina el flujo en la app. | UC-B04 | Implementado (el texto del mensaje difiere del documentado) |
| RF-B22 | Si falta un medio de contacto, ese botón no se muestra; si faltan los dos, «El organizador no suministró datos de contacto directo». | UC-B04 | Implementado |
| RF-B23 | La **página del organizador** (`/organizadores/{id}`) muestra nombre, foto, Zona, «Organiza desde…», sus torneos vigentes y su trayectoria (finalizados), **sin ningún contacto personal**. | UC-B05 | Implementado |

### Reportar

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-B24 | Un Usuario con sesión puede **reportar un torneo** con un motivo («Ya no existe», «Datos incorrectos» o «No es un torneo»), **una sola vez por usuario y torneo**. Cada usuario ve solo sus reportes. | UC-B06 | **Pendiente** |

### Captación

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-B25 | El link «¿Organizás torneos? Publicalo» va **al pie del catálogo y en el footer**, nunca en la barra superior. | UC-B01 | Implementado |

## 4. Requerimientos no funcionales

| ID | Requisito | Evidencia |
|---|---|---|
| RNF-B01 | **Lectura pública en la base (RLS).** Los torneos se leen sin sesión; solo el organizador crea, edita y da de baja los suyos. | `20260930000001_tournaments_owner_only_rls.sql` |
| RNF-B02 | **Los inscriptos son públicos pero solo por nombre**, a través de una vista; la tabla de inscripciones solo la lee el organizador del torneo. | Vista `tournament_inscriptions` (`20261007000000_inscriptions.sql`) |
| RNF-B03 | **El Estado, la antigüedad y los cupos se calculan al leer**, con la hora actual: no hay tareas programadas. El Estado es una columna calculada de la base (`status`, `inscriptions_count`), que hay que pedir explícitamente. | `20260930000002_tournaments_computed_status.sql` |
| RNF-B04 | **La antigüedad se calcula en el servidor** y la tarjeta la recibe hecha: si la calculara el navegador, el «ahora» del servidor y el del navegador podrían no coincidir al hidratar. | `TournamentList.tsx`, `tournament-verification.ts` |
| RNF-B05 | **Una vista filtrada es un link**: los filtros se leen en el servidor desde la URL (Server Components), sin estado local. | `page.tsx`, `Filters.tsx` |
| RNF-B06 | **El flyer solo se muestra si es del bucket propio**; una URL ajena cuenta como «sin flyer» y no rompe la página. | `tournament-flyer.ts`, `TournamentFlyer.tsx` |
| RNF-B07 | **Privacidad del organizador.** La página pública pide solo las columnas que muestra: ni el WhatsApp del perfil ni el contacto de los torneos llegan a ella. | `organizadores/[id]/page.tsx` |
| RNF-B08 | **Carga progresiva.** El catálogo y los filtros están en `Suspense` con esqueletos; la ficha tiene `loading.tsx`. | `page.tsx`, `torneos/[id]/loading.tsx` |
| RNF-B09 | **Accesibilidad.** Toda la tarjeta es un solo link (el blanco para tocar es la tarjeta entera) con foco visible; los avisos de estado usan `role`. | `TournamentCard.tsx` |
| RNF-B10 | **Lógica pura verificable:** `priceLabel`, `verificationAge`, `isLastSpots`, `splitTournaments`, `organizesSince`, `whatsappLink`, con sus `*.test.ts` (`pnpm test`). | `src/utils/` |

## 5. Sin decisión: lo que `casos-de-uso.md` dice y el código no hace

Estas diferencias salieron de comparar `casos-de-uso.md` (marca todo el módulo B como «Implementado», salvo el reporte) con el código. Hay que decidir, caso por caso, si se programa lo que falta o se corrige el documento.

| Tema | Lo que dice `casos-de-uso.md` | Lo que hace el código |
|---|---|---|
| Paginación | El listado está paginado (UC-B01). | `TournamentList` trae todos los torneos; el filtro borra `page` de la URL pero no existe. |
| Filtros | Modalidad, estado, **Zona o Corredor**, **precio máximo** y **fechas de inicio** (UC-B02). `decisiones-casos-de-uso.md` define `?zona=` (una Zona o un Corredor). | Solo modalidad y estado. La rama `feat/dynamic-filters` tiene un filtro por Zona (por texto) y por rango de precio, pero **no está integrada** a `main` y es anterior a la tabla `zones`. |
| Finalizados en el catálogo | UC-B01 A4: «solo aparecen si se filtra explícitamente por ese estado». La regla transversal dice que el Finalizado **sale del catálogo**. | La consulta excluye siempre los Finalizados y el filtro no ofrece ese Estado: **nunca aparecen**. Coincide con la regla transversal, no con A4. |
| Sin resultados | «No hay torneos con esos filtros» y la opción de limpiar. | «No hay torneos registrados», con el texto «Probá cambiando las opciones en el panel lateral o limpiando los filtros». Sin botón. |
| Ficha de un Finalizado | Sin botones de contacto; «Este torneo ya terminó». | Muestra los botones de contacto como en cualquier otra ficha. |
| Torneo dado de baja | 404 con un link al catálogo. | 404 genérico de Next («This page could not be found.»), sin link. |
| Vista previa al compartir | La página tiene metadatos (flyer, nombre, Zona). | No hay `generateMetadata` en la ficha; usa los metadatos generales del sitio. |
| Mensaje de WhatsApp | «Hola, vi el torneo [nombre] en Torneos BA y quiero anotar a mi equipo». | «Hola, vengo de Torneos Scraper. Me interesa el torneo "[nombre]"!». También el nombre del producto difiere: la interfaz dice «Torneos Scraper» y la documentación, «Torneos BA». |
| Valor inválido en la URL | Se ignora ese filtro y se mantienen los válidos. | Una clave desconocida se ignora; un valor de `modality` o `status` no se valida antes de consultar. |

## 6. Reglas de referencia

- **Estado del torneo:** **Abierto** (no pasó el cierre y hay lugar), **Cerrado** (pasó el cierre sin empezar, o se completó el cupo), **En curso** (entre inicio y fin), **Finalizado** (pasó el fin; sale del catálogo y no se puede dar de baja). En la interfaz: «Inscripción Abierta», «Inscripción Cerrada», «En Juego» y «Torneo Finalizado».
- **Visibilidad:** catálogo, ficha, inscriptos (solo nombres) y página del organizador son públicos; un contacto personal del organizador nunca se muestra.
- **Términos:** se dice «baja» (nunca «eliminar»); «Zona» (nunca «barrio» ni «localidad»); «Inscripción vinculada» e «Inscripción por nombre».
