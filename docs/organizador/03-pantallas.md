# Módulo Organizador · Pantallas

Versión del **04/11/2026**. Cada pantalla del Panel de organizador, con su ruta, el caso, los requerimientos, lo que muestra y la captura. Siguen a los [casos de uso](02-casos-de-uso.md) y preceden a los [diagramas de secuencia](04-diagramas-secuencia/README.md).

**Estado de las capturas**

| Marca | Significa |
|---|---|
| ✅ **Vigente** | Sacada de `main` con la UI actual. |
| ⏳ **Pendiente** | Todavía no hay captura. |

**Hoy no hay ninguna captura de este módulo.** Todas sus pantallas exigen una sesión (y la base de desarrollo, que no respondía): sin sesión, `/crear-torneo` y `/mis-torneos` redirigen a Iniciar sesión. Al final está la lista de capturas con los pasos para sacarlas.

## Mapa de pantallas

| Pantalla | Ruta | Casos de uso | Sesión |
|---|---|---|---|
| [P1 · Mis torneos](#p1--mis-torneos) | `/mis-torneos` | UC-E02, UC-E04 | Obligatoria |
| [P2 · Publicar torneo](#p2--publicar-torneo) | `/crear-torneo` | UC-E01 | Obligatoria |
| [P3 · Gestión del torneo](#p3--gestión-del-torneo) | `/mis-torneos/{id}` (pestañas `?tab=datos` e `?tab=inscripciones`) | UC-E02 a UC-E07 | Dueño del torneo |

`/mis-torneos/{id}/editar` y `/mis-torneos/{id}/inscripciones` ya no son pantallas: redirigen a la pestaña correspondiente de P3. Los tres paneles son **el Panel de organizador en tres niveles**: la lista (P1), la gestión (P3) y la ficha pública (la del módulo B, con la barra «Este torneo es tuyo · Gestionar»).

---

## P1 · Mis torneos

**Ruta:** `/mis-torneos` · **Casos de uso:** [UC-E02](02-casos-de-uso.md#uc-e02--ver-mis-torneos-panel-de-organizador), [UC-E04](02-casos-de-uso.md#uc-e04--verificar-que-el-torneo-sigue-vigente) · **Requerimientos:** RF-E12, RF-E13, RF-E16, RF-E17 · **Diagramas:** [S02](04-diagramas-secuencia/uc-e02-ver-mis-torneos.md), [S04](04-diagramas-secuencia/uc-e04-verificar-torneo.md)

> ⏳ **Captura pendiente.**

**Qué muestra.** «← Volver al catálogo», el título «Mis torneos» con una explicación breve («Tocá “Sigue vigente” para confirmar que un torneo está en pie: a los 30 días sin confirmar se marca en ámbar y a los 60, en rojo como “sin confirmar”») y el botón **«Publicar torneo»**. Debajo, **una fila por torneo** con su Estado, su antigüedad de verificación, el nombre, la Zona, la modalidad y el cupo, y dos acciones: **«Sigue vigente»** y **«Gestionar»**.

**Orden:** primero los torneos con 30 días o más sin verificar (del más viejo al más nuevo), después el resto, y al final los Finalizados (sin antigüedad ni botón de verificar).

**Estados:** *con torneos*; *sin torneos* («Todavía no publicaste torneos» y «Publicar mi primer torneo»); *«Sigue vigente» apagado* (torneo Finalizado o ya confirmado hoy); *sin sesión* (redirige a `/login?next=/mis-torneos`, y desde «Publicalo» abre Crear cuenta con el aviso).

---

## P2 · Publicar torneo

**Ruta:** `/crear-torneo` · **Caso de uso:** [UC-E01](02-casos-de-uso.md#uc-e01--publicar-un-torneo) · **Requerimientos:** RF-E01 a RF-E08 · **Diagrama:** [S01](04-diagramas-secuencia/uc-e01-publicar-torneo.md)

> ⏳ **Captura pendiente.**

**Qué muestra.** «← Mis torneos», el título «Publicar torneo» y un formulario que es **el mismo de la edición** (pestaña Datos de P3):

| Campo | Tipo | De dónde salen las opciones | Obligatorio |
|---|---|---|---|
| Nombre | texto (placeholder «Copa Amistad Sabatina») | — | Sí |
| **Modalidad** | desplegable | Lista **fija del código** (`SPORT_MODALITIES`: Fútbol 5, 7, 8 y 11) | Sí |
| **Zona** | desplegable, agrupado por corredor | Se **consulta en la base** (`zones`, vía `getZoneGroups`) | Sí |
| Dirección de la sede | texto («Calle y altura de la cancha. En la ficha se abre en el mapa.») | — | Sí |
| WhatsApp | teléfono («Con código de área y sin el 15.») | — | Uno de los dos contactos |
| Instagram | texto («Solo el usuario.») | — | Uno de los dos contactos |
| Cierre de inscripción | fecha | — | Sí |
| Inicio | fecha | — | Sí |
| Fin | fecha | — | Sí |
| Precio (opcional) | número («Vacío: se muestra “Consultar”. 0: “Gratis”.») | — | No |
| Cupo (opcional) | entero ≥ 1 («Cantidad máxima de equipos.») | — | No |
| Imagen (flyer) | archivo JPG, PNG o WebP, hasta 3 MB | — | No |
| Descripción | texto largo («Premios, horarios, tercer tiempo…») | — | No |
| Reglamento | texto largo | — | No |

El botón es «Publicar torneo» (con «Publicando…» mientras trabaja).

**Estados:** *normal*; *error* (banda con el motivo, **conservando lo cargado**; el archivo del flyer no se puede precargar); *sin sesión* (redirige a `/login?next=/crear-torneo`); y, tras publicar, la **ficha pública** con «Publicado. Así lo ve la gente» (y, si falló la subida, «No pudimos subir el flyer…»).

---

## P3 · Gestión del torneo

**Ruta:** `/mis-torneos/{id}` · **Casos de uso:** [UC-E02](02-casos-de-uso.md#uc-e02--ver-mis-torneos-panel-de-organizador) a [UC-E07](02-casos-de-uso.md#uc-e07--dar-de-baja-una-inscripción) · **Requerimientos:** RF-E09 a RF-E31 · **Diagramas:** [S03](04-diagramas-secuencia/uc-e03-editar-torneo.md), [S04](04-diagramas-secuencia/uc-e04-verificar-torneo.md), [S05](04-diagramas-secuencia/uc-e05-dar-de-baja-torneo.md), [S06](04-diagramas-secuencia/uc-e06-cargar-inscripcion.md), [S07](04-diagramas-secuencia/uc-e07-dar-de-baja-inscripcion.md)

> ⏳ **Capturas pendientes** de la cabecera y de las dos pestañas.

**Cabecera (siempre visible).** «← Mis torneos»; el nombre del torneo y su Estado; cuatro **números clave**: **Cupo** (o Inscriptos, si no hay cupo), **Cierre de inscripción**, **Fechas** y **Última confirmación** (con su antigüedad, o «Finalizó: ya no se confirma»); y dos botones: **«Sigue vigente»** y **«Ver ficha pública»**.

**Pestañas** (links, cada una con su URL): **Datos** e **Inscripciones**. Al final de la pantalla, aparte, **«Dar de baja»**.

**Pestaña Datos.** El formulario de P2 con los valores actuales y el botón de guardar; si hay equipos anotados, pide confirmación («Hay N equipos anotados, ¿confirmás el cambio?»). Guardar vuelve a esta pantalla.

**Pestaña Inscripciones.**

- La sección **«Anotar un equipo»**, con la indicación «Arreglá la inscripción con el capitán por WhatsApp y cargala acá buscando su equipo en la app». Tiene un **buscador de equipos de la app** («Buscar un equipo de la app», botón «Buscar»), que es un formulario GET: la búsqueda vive en `?q=`. Cada resultado muestra el nombre del equipo y su **Zona**, y un botón **«Anotar»**; si ya está anotado, dice «Ya anotado». Muestra hasta 10 equipos activos.
- Debajo, **«¿El equipo no está en la app? Anotalo solo con el nombre»**: un campo «Nombre del equipo» y el botón «Anotar equipo» (con «Anotando…» mientras trabaja).
- La sección **«Equipos anotados»**, con cada equipo (los vinculados son un link a su página, con su Zona) y «Dar de baja» en cada uno. Sin inscriptos: «Todavía no hay equipos anotados.»

**«Dar de baja»** (el torneo) abre una confirmación con el nombre y la cantidad de equipos anotados: «¿Dar de baja “X” con N equipos anotados? No se puede deshacer.»

**Estados:** *normal*; *cupo completo* (error al anotar: «Subí el cupo desde la pestaña “Datos”…»); *torneo Finalizado* (sin «Sigue vigente» activo ni baja); *torneo ajeno o inexistente* (404); *sin sesión* (redirige a `/login` conservando la pestaña).

---

## Capturas pendientes

Convención: PNG en `docs/organizador/pantallas/`, ventana de unos 1280 px de ancho, con datos de prueba. **Hace falta una cuenta con sesión, la base de desarrollo disponible y al menos dos torneos** (uno vigente y uno finalizado).

| Archivo | Pantalla y estado | Cómo conseguirlo |
|---|---|---|
| `mis-torneos.png` | P1 con torneos | Un organizador con torneos de distintas antigüedades (incluido uno con 30 días o más sin verificar, un Finalizado y uno «ya confirmado hoy»). |
| `mis-torneos-vacio.png` | P1 sin torneos | Una cuenta que nunca publicó. |
| `publicar-torneo.png` | P2 vacío | Abrir `/crear-torneo` con sesión. |
| `publicar-torneo-error.png` | P2 con un error | Enviar con el cierre de inscripción posterior al inicio. |
| `publicar-torneo-zona.png` | P2 con el desplegable de Zona abierto | Abrir el desplegable «Zona» para ver los corredores. |
| `gestion-datos.png` | P3, pestaña Datos | Abrir «Gestionar» de un torneo. |
| `gestion-inscripciones.png` | P3, pestaña Inscripciones | Con equipos anotados (vinculados y por nombre) y con una búsqueda de equipo con resultados. |
| `gestion-cupo-completo.png` | P3 con el error de cupo completo | Intentar anotar con el cupo lleno. |
| `gestion-baja.png` | La confirmación de «Dar de baja» | Pulsar «Dar de baja» (sin aceptar). |
| `gestion-finalizado.png` | P3 de un torneo Finalizado | Para mostrar «Finalizó: ya no se confirma». |
