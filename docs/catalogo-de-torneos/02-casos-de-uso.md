# Módulo Catálogo de torneos · Casos de uso

Versión del **04/11/2026**. Detalla los casos de uso del módulo B de [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (UC-B01 a UC-B06) con los requerimientos que cubre cada uno ([01-requerimientos.md](01-requerimientos.md)), la pantalla que lo representa ([03-pantallas.md](03-pantallas.md)) y su diagrama de secuencia ([04-diagramas-secuencia](04-diagramas-secuencia/README.md)).

**Cómo leerlo.** Cada caso expresa una meta y tiene **un actor iniciador**. **Estado** dice si está en `main`. Cuando el código **no coincide** con lo que dice `casos-de-uso.md`, el flujo alternativo afectado lleva la marca ⚠️ y se explica; el resumen está en [«Sin decisión»](01-requerimientos.md#5-sin-decisión-lo-que-casos-de-usomd-dice-y-el-código-no-hace).

## Mapa de casos de uso

| Caso | Meta del actor | Actor | Estado | ID en el PDF original |
|---|---|---|---|---|
| [UC-B01](#uc-b01--ver-el-catálogo-de-torneos) | Ver el catálogo de torneos | Invitado | **Parcial** (sin paginar) | UC-08 |
| [UC-B02](#uc-b02--filtrar-torneos-y-compartir-la-búsqueda) | Filtrar torneos y compartir la búsqueda | Invitado | **Parcial** (solo 2 de los 5 filtros) | UC-09 y UC-10 |
| [UC-B03](#uc-b03--ver-la-ficha-pública-de-un-torneo) | Ver la ficha pública de un torneo | Invitado | **Parcial** (3 salvedades) | UC-11 |
| [UC-B04](#uc-b04--contactar-al-organizador) | Contactar al organizador | Invitado | Implementado | UC-12 |
| [UC-B05](#uc-b05--ver-la-página-pública-del-organizador) | Ver la página pública del organizador | Invitado | Implementado | SPEC-E04 |
| [UC-B06](#uc-b06--reportar-un-torneo) | Reportar un torneo | Usuario | **Pendiente** | — |

**Qué no es un caso de uso acá:** el `loading` de la ficha, navegar del catálogo a una ficha o volver («← Volver al catálogo») no toman ninguna decisión.

---

## UC-B01 · Ver el catálogo de torneos

- **Actor:** Invitado (y cualquier usuario).
- **Requerimientos:** RF-B01 a RF-B07, RF-B25. **Pantalla:** [P1 · Catálogo](03-pantallas.md#p1--catálogo) (`/`). **Diagrama:** [S01](04-diagramas-secuencia/uc-b01-ver-catalogo.md).
- **Precondiciones:** ninguna. `/` es el catálogo para cualquiera.
- **Flujo principal:**
  1. Entra a la portada.
  2. El sistema lista los torneos **no finalizados**, ordenados por **fecha de inicio**.
  3. Cada tarjeta muestra el **flyer** (o un marcador con el nombre), el nombre, la Zona con su corredor, la modalidad, el precio, el **Estado del torneo** y la **antigüedad de verificación**.
  4. Toca una tarjeta y se abre la ficha (UC-B03).
- **Flujos alternativos:**
  - **A1. Precio:** vacío se muestra como «Consultar»; 0, como «Gratis».
  - **A2. Antigüedad de verificación:** desde 30 días completos sin verificar, en ámbar; desde 60, en rojo con «Sin confirmar».
  - **A3. Últimos cupos:** etiqueta sobre un torneo **Abierto** con 2 lugares o menos. No es un Estado.
  - **A4. Finalizados:** ⚠️ `casos-de-uso.md` dice que solo aparecen si se filtra explícitamente por ese Estado. **En el código nunca aparecen**: la consulta los excluye siempre y el filtro no ofrece «Finalizado». Coincide con la regla transversal («el Finalizado sale del catálogo»).
  - **A5. Sin torneos:** «No hay torneos registrados».
  - **A6. Falla la consulta:** «Hubo un error al cargar los torneos deportivos.» El panel de filtros sigue visible.
  - **A7. Paginación:** ⚠️ `casos-de-uso.md` dice «paginados». **Hoy no hay paginación**: se traen todos los torneos de una vez.
- **Postcondición:** la persona ve los torneos vigentes y puede abrir uno.
- **Estado:** **Parcial** (`src/app/page.tsx`, `TournamentList`, `TournamentCard`): todo salvo la paginación.

## UC-B02 · Filtrar torneos y compartir la búsqueda

- **Actor:** Invitado.
- **Requerimientos:** RF-B08 a RF-B13. **Pantalla:** [P1 · Catálogo](03-pantallas.md#p1--catálogo) (panel de filtros). **Diagrama:** [S02](04-diagramas-secuencia/uc-b02-filtrar-torneos.md).
- **Precondiciones:** está en el catálogo.
- **Flujo principal:**
  1. Abre el panel de filtros (columna lateral en pantalla grande).
  2. Elige una **modalidad** (Fútbol 5, 7, 8 u 11) y/o un **Estado** (inscripción abierta, en curso, inscripción cerrada). Cada lista tiene también «Todas / Todos», que quita ese filtro.
  3. El sistema combina los filtros (AND), los escribe en la URL (`?modality=…&status=…`) y vuelve a la primera página.
  4. El catálogo se vuelve a consultar con esos filtros.
  5. Copia la URL y la comparte; quien la abre ve el mismo listado con los mismos filtros activos.
- **Flujos alternativos:**
  - **A1. Zona o Corredor:** ⚠️ `casos-de-uso.md` y las decisiones lo describen (`?zona=` recibe una Zona o un corredor completo). **No está en `main`.**
  - **A2. Precio máximo y fechas de inicio:** ⚠️ `casos-de-uso.md` los describe. **No están en `main`.**
  - **A3. Parámetro desconocido en la URL:** una clave desconocida (`?foo=1`) se ignora y la página no se rompe. ⚠️ Un **valor** inválido de `modality` o `status` no se valida antes de consultar.
  - **A4. Sin resultados:** «No hay torneos registrados … Probá cambiando las opciones en el panel lateral o limpiando los filtros». ⚠️ No hay un botón «Limpiar»; se limpia eligiendo «Todas las modalidades» y «Todos los estados».
- **Regla de diseño:** los filtros viven en la URL, nunca en estado local; una vista filtrada es siempre un link compartible.
- **Postcondición:** el catálogo muestra solo los torneos que cumplen los filtros; la URL los refleja.
- **Estado:** **Parcial** (`Filters.tsx`): modalidad y estado. Faltan Zona o Corredor, precio máximo y fechas.

## UC-B03 · Ver la ficha pública de un torneo

- **Actor:** Invitado.
- **Requerimientos:** RF-B14 a RF-B20. **Pantalla:** [P2 · Ficha del torneo](03-pantallas.md#p2--ficha-del-torneo) (`/torneos/{id}`). **Diagrama:** [S03](04-diagramas-secuencia/uc-b03-ver-ficha-torneo.md).
- **Precondiciones:** el torneo existe y no fue dado de baja.
- **Flujo principal:**
  1. Elige un torneo del catálogo (o abre un link compartido).
  2. El sistema muestra flyer, nombre, **organizador** (con link a su página), modalidad, Zona, **dirección de la sede** (abre el mapa), cierre de inscripción, inicio y fin, precio, Estado, descripción, reglamento, antigüedad de verificación, cupo e inscriptos, y los **nombres** de los equipos anotados.
  3. Debajo del precio y las fechas aparecen los botones de contacto (UC-B04).
- **Flujos alternativos:**
  - **A1. Torneo dado de baja o inexistente:** la ficha devuelve 404. ⚠️ `casos-de-uso.md` dice «con un link al catálogo»; hoy es la página 404 genérica de Next («This page could not be found.»), en inglés y **sin link**.
  - **A2. Torneo finalizado:** se muestra la ficha. ⚠️ `casos-de-uso.md` dice que **sin botones de contacto** («Este torneo ya terminó»); **hoy los botones se muestran** igual que en cualquier ficha.
  - **A3. Es el organizador:** la ficha es idéntica a la de cualquiera, más una barra arriba «Este torneo es tuyo · Gestionar».
  - **A4. Compartir:** la URL es estable. ⚠️ `casos-de-uso.md` dice que la página tiene metadatos (flyer, nombre, Zona) para la vista previa en WhatsApp; **no hay metadatos propios** de la ficha.
  - **A5. Inscriptos:** solo los **nombres**; los de una Inscripción vinculada son un link a la página del equipo. Sin inscriptos, la sección no aparece.
  - **A6. Sin flyer:** la ficha usa una sola columna, sin placeholder. Un `image_url` que no es del bucket propio cuenta como «sin flyer».
  - **A7. Cupo:** con cupo, «3/8 equipos»; sin cupo, cuántos hay anotados.
- **Postcondición:** la persona conoce las condiciones del torneo y puede contactar al organizador.
- **Estado:** **Parcial** (`src/app/torneos/[id]`): funciona, pero con las salvedades A1, A2 y A4.

## UC-B04 · Contactar al organizador

- **Actor:** Invitado.
- **Requerimientos:** RF-B21, RF-B22. **Pantalla:** [P2 · Ficha del torneo](03-pantallas.md#p2--ficha-del-torneo) (botones de contacto). **Diagrama:** [S04](04-diagramas-secuencia/uc-b04-contactar-organizador.md).
- **Precondiciones:** el torneo tiene al menos un medio de contacto.
- **Flujo principal (WhatsApp):**
  1. Toca «Contactar por WhatsApp».
  2. El sistema abre `wa.me` con el número del organizador y un **mensaje sugerido** (hoy: «Hola, vengo de Torneos Scraper. Me interesa el torneo "[nombre]"!»).
  3. La persona edita el mensaje si quiere y lo envía desde WhatsApp. **Acá termina el flujo en la app:** la inscripción se arregla afuera y la carga el organizador (UC-E06).
- **Flujo principal (Instagram):** toca «Ver Instagram» y el sistema abre el perfil del organizador en una pestaña nueva.
- **Flujos alternativos:**
  - **A1. Falta un medio:** ese botón no se muestra.
  - **A2. No hay ninguno:** «El organizador no suministró datos de contacto directo». Solo puede pasar con torneos viejos: al publicar es obligatorio al menos un contacto.
  - **A3. Texto del mensaje:** ⚠️ `casos-de-uso.md` documenta otro texto («Hola, vi el torneo [nombre] en Torneos BA y quiero anotar a mi equipo»). El código usa el de arriba.
- **Postcondición:** la persona está en WhatsApp o Instagram, fuera de la app.
- **Estado:** Implementado.

## UC-B05 · Ver la página pública del organizador

- **Actor:** Invitado.
- **Requerimientos:** RF-B23. **Pantalla:** [P3 · Página del organizador](03-pantallas.md#p3--página-del-organizador) (`/organizadores/{id}`). **Diagrama:** [S05](04-diagramas-secuencia/uc-b05-ver-organizador.md).
- **Precondiciones:** el organizador existe.
- **Flujo principal:**
  1. Desde una ficha, toca el nombre del organizador.
  2. El sistema muestra su **nombre**, **foto** (o su inicial), **Zona** y «Organiza desde [mes y año]».
  3. Debajo, sus **torneos vigentes** (del que empieza antes al que empieza después) y su **trayectoria**: los finalizados, del más reciente al más viejo.
- **Reglas:** no se muestra ningún contacto personal del organizador; el contacto es siempre el de cada torneo.
- **Flujos alternativos:**
  - **A1. No existe** (o el id no es un uuid): 404.
  - **A2. Sin torneos:** «Todavía no publicó torneos».
  - **A3. Falla la consulta de torneos:** «No pudimos cargar sus torneos. Probá de nuevo.»
- **Postcondición:** la persona ve la trayectoria del organizador.
- **Estado:** Implementado (`src/app/organizadores/[id]`).

## UC-B06 · Reportar un torneo

- **Actor:** Usuario.
- **Requerimientos:** RF-B24. **Pantalla:** [P2 · Ficha del torneo](03-pantallas.md#p2--ficha-del-torneo) (botón «Reportar», todavía no existe). **Diagrama:** [S06](04-diagramas-secuencia/uc-b06-reportar-torneo.md) (diseño objetivo).
- **Precondiciones:** sesión; no reportó antes ese torneo.
- **Flujo principal:**
  1. En la ficha toca «Reportar».
  2. Elige un motivo: «Ya no existe», «Datos incorrectos» o «No es un torneo».
  3. El sistema guarda el **Reporte** para el administrador (UC-F03).
- **Flujos alternativos:** **A1.** Una sola vez por usuario y torneo; el segundo intento se rechaza.
- **Postcondición:** el reporte queda pendiente en el panel de administración. Cada usuario ve solo los suyos.
- **Estado:** **Pendiente.** No hay tabla, función ni botón.
