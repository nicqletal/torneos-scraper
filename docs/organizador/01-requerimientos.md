# Módulo Organizador · Especificación de requerimientos

Versión del **04/11/2026**. Parte de la documentación del módulo: **requerimientos** → [casos de uso](02-casos-de-uso.md) → [pantallas](03-pantallas.md) → [diagramas de secuencia](04-diagramas-secuencia/README.md). El [README](README.md) tiene la matriz que los une.

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md), [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (módulo E, 03/11/2026), el glosario [CONTEXT.md](../../CONTEXT.md) y el código y las migraciones del repo al día de hoy.

## 1. Alcance

El módulo permite a un **Organizador** **publicar torneos**, **gestionarlos** desde su panel («Mis torneos»), mantenerlos al día («Sigue vigente»), **editarlos**, **cargar y dar de baja inscripciones** y **dar de baja** un torneo. Cualquier usuario con sesión puede publicar; al hacerlo pasa a ser Organizador. Todo torneo tiene **exactamente un Organizador**.

**Límite de producto:** la app **nunca inscribe ni cobra**. La inscripción se arregla por fuera (el capitán le escribe al organizador por WhatsApp o Instagram) y **la carga el organizador** en su panel. El capitán no «se anota» desde la app y no confirma la vinculación.

**Fuera del módulo:**

| Tema | Dónde está |
|---|---|
| Ver el catálogo y la ficha pública, y contactar al organizador | Módulo B — Catálogo de torneos |
| Resolver un reporte de un torneo, marcarlo Observado o darlo de baja como administrador | Módulo F — Administración |
| Crear la cuenta y el perfil (nombre y foto del organizador) | Módulo A — Cuenta y acceso |
| Los Equipos que se vinculan a una inscripción | Módulo C — Equipos |

## 2. Actores

| Actor | Quién es | Qué hace en este módulo |
|---|---|---|
| **Usuario** | Persona con sesión | Publica un torneo y pasa a ser Organizador. |
| **Organizador** | Usuario que publicó al menos un torneo | Gestiona sus torneos desde el **Panel de organizador**. No tiene ningún poder de administración. |
| **Administrador** | Integrante del equipo de Torneos BA | Puede dar de baja un torneo por un reporte (UC-F03); no gestiona torneos ajenos desde este panel. |
| **Sistema** | La base de datos y la app | Calcula el Estado, la antigüedad y los cupos al leer, y reparte los Avisos de baja. |

## 3. Requerimientos funcionales

**Estado:** `Implementado` está en `main`. `Parcial` tiene una parte sin cumplir, que se indica. `Pendiente` es alcance vigente sin programar.

### Publicar y editar

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-E01 | **Cualquier usuario con sesión** publica un torneo y pasa a ser Organizador. El organizador (`user_id`) sale de la sesión, **nunca del formulario**. Un usuario con **Suspensión** no puede publicar. | UC-E01 | **Parcial**: la Suspensión no se verifica todavía (módulo F pendiente) |
| RF-E02 | **Obligatorios:** nombre, modalidad (Fútbol 5, 7, 8 u 11), Zona, cierre de inscripción, inicio y fin, dirección de la sede y **al menos un contacto** (WhatsApp o Instagram). **Opcionales:** precio, flyer, cupo, descripción y reglamento. | UC-E01, UC-E03 | Implementado |
| RF-E03 | Las fechas cumplen **cierre ≤ inicio ≤ fin**; si no, el formulario no guarda. La fecha de fin es obligatoria: sin ella el torneo nunca llegaría a «Finalizado». | UC-E01, UC-E03 | Implementado |
| RF-E04 | **Contactos normalizados:** el WhatsApp se guarda solo con dígitos, en formato argentino de celular (`549` + código de área sin 0 + número sin 15); el Instagram se guarda solo como usuario (acepta `@usuario` o la URL del perfil). | UC-E01, UC-E03 | Implementado |
| RF-E05 | **Precio:** vacío es «Consultar» (null) y 0 es «Gratis». **Cupo:** entero de al menos 1. | UC-E01, UC-E03 | Implementado |
| RF-E06 | **Flyer** opcional, JPG, PNG o WebP de hasta **3 MB**. Se sube **después del alta**, con el id del torneo, para no dejar archivos huérfanos. Si la subida falla, el torneo **ya está publicado**: se avisa en la ficha y se reintenta desde Datos. | UC-E01, UC-E03 | Implementado |
| RF-E07 | El torneo **nace verificado** y aparece en el catálogo con su Estado calculado. | UC-E01 | Implementado |
| RF-E08 | **Todo torneo tiene exactamente un Organizador.** No existe el «torneo copiado» sin organizador (descartado el 07/10/2026). La **carga manual** de torneos de Instagram la hace alguien del equipo con su propia cuenta, como organizador común, y pone el contacto del organizador real. | UC-E01 | Implementado |
| RF-E09 | **Editar** cualquier campo del formulario (incluido reemplazar el flyer) con las mismas validaciones del alta. Solo el dueño, y solo las columnas del formulario. **Editar no cuenta como verificar.** Al guardar, vuelve a la pantalla de gestión. | UC-E03 | Implementado |
| RF-E10 | Al editar un torneo **con equipos anotados**, el organizador **confirma** el cambio («Hay N equipos anotados, ¿confirmás el cambio?»). Sin equipos no se pregunta. | UC-E03 | Implementado (no figura en `casos-de-uso.md`) |
| RF-E11 | **Subir el cupo** es la forma de admitir más inscripciones cuando está completo. | UC-E03, UC-E06 | Implementado |

### Panel y gestión

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-E12 | **Panel «Mis torneos»**, en tres niveles: (1) la lista, con una fila por torneo (nombre, Zona, modalidad, cupo, Estado y antigüedad de verificación) y dos acciones, «Sigue vigente» y «Gestionar»; (2) la **pantalla de gestión**; (3) la ficha pública (para el dueño, con la barra «Este torneo es tuyo · Gestionar»). | UC-E02 | Implementado |
| RF-E13 | **Orden del panel:** primero los que llevan 30 días o más sin verificar, del más viejo al más nuevo; después el resto; y al final los **Finalizados**, sin antigüedad ni botón de verificar. | UC-E02 | Implementado |
| RF-E14 | **Pantalla de gestión:** cabecera con los números clave (cupo o inscriptos, cierre de inscripción, fechas y última confirmación), «Ver ficha pública» y «Sigue vigente»; pestañas **Datos** e **Inscripciones**, cada una con su URL (`?tab=`); y «Dar de baja» al final, aparte. | UC-E02 | Implementado |
| RF-E15 | Un torneo **ajeno** da **404**, igual que uno inexistente: no se confirma que exista un torneo con ese id que no es tuyo. | UC-E02 | Implementado |

### Verificar y dar de baja

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-E16 | **«Sigue vigente»** reinicia la **antigüedad de verificación**: el torneo vuelve a mostrarse sin ámbar ni rojo. Solo el dueño, y solo por la función de la base, que es la única que escribe la fecha. | UC-E04 | Implementado |
| RF-E17 | «Sigue vigente» **no se ofrece** en un torneo **Finalizado** ni en uno **ya confirmado hoy** (menos de 24 h): el botón sale apagado. | UC-E04 | Implementado (la segunda regla no figura en `casos-de-uso.md`) |
| RF-E18 | «Sigue vigente» **no saca la marca Observado**: solo la saca el administrador. | UC-E04 | Regla vigente; la marca todavía no existe (módulo F) |
| RF-E19 | **Dar de baja** un torneo Abierto, Cerrado o En curso. **Nunca un Finalizado:** los finalizados son la trayectoria del organizador. | UC-E05 | Implementado |
| RF-E20 | La baja **siempre pide confirmación** con el nombre del torneo y la cantidad de equipos anotados (aunque sea 0): no se puede deshacer. | UC-E05 | Implementado |
| RF-E21 | La baja **retira el torneo**: desaparece del catálogo, su ficha devuelve 404 y se borra el flyer de Storage. | UC-E05 | Implementado |
| RF-E22 | La baja **avisa a los planteles**: cada jugador del Plantel de cada equipo con Inscripción vinculada recibe **un único Aviso** (aunque esté en dos equipos anotados), con link a la página del equipo: «Se dio de baja el torneo 'X', en el que estaba anotado tu equipo. Hablá con el organizador por lo que hayas pagado.». | UC-E05 | Implementado |

### Inscripciones

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-E23 | **Dos tipos de inscripción:** la **vinculada** (se busca un equipo de la app por nombre y se lo selecciona; el resultado muestra siempre la Zona, porque los nombres se repiten) y la **por nombre** (se escribe el nombre de un equipo que no está en la app, de 2 a 50 caracteres). | UC-E06 | Implementado |
| RF-E24 | **Ambas cuentan para el cupo** y aparecen por nombre en la ficha pública. **Solo la vinculada** genera Avisos y figura en la historia del equipo. | UC-E06 | Implementado |
| RF-E25 | Un equipo de la app tiene **como mucho una inscripción vinculada por torneo**. | UC-E06 | Implementado |
| RF-E26 | **Cupo completo:** se rechaza y se sugiere subir el cupo desde Datos. | UC-E06 | Implementado |
| RF-E27 | Un **Equipo disuelto** no recibe inscripciones. | UC-E06 | Implementado |
| RF-E28 | Un torneo **Cerrado** o **En curso** sí admite inscripciones (el organizador sigue acomodando la lista); un **Finalizado** no cambia sus inscripciones. | UC-E06, UC-E07 | Implementado |
| RF-E29 | El **capitán no confirma** la vinculación. El organizador **no ve el WhatsApp** del capitán: ya lo tiene, porque el capitán le escribió. | UC-E06 | Implementado |
| RF-E30 | Si el cupo se completa, el torneo pasa a **Cerrado**. | UC-E06 | Implementado (lo calcula la base) |
| RF-E31 | **Dar de baja una inscripción:** el equipo deja de figurar y libera su lugar. Si el torneo estaba Cerrado por cupo y no pasó el cierre de inscripción, vuelve a **Abierto**. | UC-E07 | Implementado |

## 4. Requerimientos no funcionales

| ID | Requisito | Evidencia |
|---|---|---|
| RNF-E01 | **Solo el dueño gestiona su torneo, y lo decide la base** (RLS), no la pantalla. Crear exige `auth.uid() = user_id`; editar y dar de baja, ser el dueño. | `20260930000001_tournaments_owner_only_rls.sql`, `tournaments_rls_test.sql` |
| RNF-E02 | **Permisos por columna.** El organizador solo puede escribir las columnas del formulario (más `user_id` al crear): no puede escribir `verified_at` ni el Estado. | `20260930000004_tournaments_update_form_columns.sql`, `tournaments_update_test.sql`, `tournaments_form_test.sql` |
| RNF-E03 | **Las transiciones van por funciones de Postgres, no por `update` directo:** `verify_tournament` (la única que escribe `verified_at`), `withdraw_tournament` (la única que borra torneos), `add_inscription`, `add_linked_inscription` y `remove_inscription` (las únicas que escriben en `inscriptions`). | `20260930000005_tournaments_verify.sql`, `20260930000006_tournaments_withdraw.sql`, `20261007000000_inscriptions.sql`, `20261014000004_linked_inscriptions.sql` |
| RNF-E04 | **Los ids que llegan del cliente no son de confiar.** Que el torneo sea del que llama, que no esté Finalizado y que haya cupo lo controla la función en la base. | Comentarios y acciones de `mis-torneos/` |
| RNF-E05 | **Estado, cupos y antigüedad se calculan al leer**, sin tareas programadas. | `20260930000002_tournaments_computed_status.sql` |
| RNF-E06 | **Mensajes claros por cada error de la base**, según su SQLSTATE: cupo completo (`23514`), torneo Finalizado (`22023`), torneo ajeno o inexistente (`42501`), equipo inexistente (`P0002`), disuelto (`55000`) o ya anotado (`23505`). | `inscriptions.ts` (`inscriptionErrorMessage`) |
| RNF-E07 | **Funciona sin JavaScript** en las acciones que son formularios: «Sigue vigente», dar de baja una inscripción, anotar un equipo vinculado y el buscador de equipos (un formulario GET con `?q=`). | `VerifyButton`, `TeamSearch` |
| RNF-E08 | **Un alta que falla no deja archivos huérfanos:** el flyer se sube después del alta; en la baja se borra después de que la base la confirma. | `crear-torneo/actions.ts`, `mis-torneos/actions.ts` |
| RNF-E09 | **El flyer lo valida la app y lo repite Storage** (tipo y 3 MB): el bucket es la última defensa. | `tournament-flyer.ts`, `20260930000007_tournament_flyers.sql`, `tournament_flyers_test.sql` |
| RNF-E10 | **El formulario no se vacía ante un error:** devuelve el mensaje y lo ya cargado (salvo el archivo, que un navegador no deja precargar). | `TournamentFormState` |
| RNF-E11 | **Las pestañas son links** (`?tab=`): cada una tiene su URL compartible y la búsqueda de equipos convive en la misma URL. | `tournament-manage.ts` |
| RNF-E12 | **Lógica pura verificable:** `parseTournamentForm`, `normalizeInstagram`, `parseFlyer`, `parseTeamName`, `parseTeamQuery`, `verificationAge`, `sortForPanel`, `withdrawConfirmation`, con sus `*.test.ts` (`pnpm test`). | `src/utils/` |

## 5. Sin decisión y diferencias con `casos-de-uso.md`

| Tema | Situación |
|---|---|
| **Suspensión al publicar** | `casos-de-uso.md` pone «sin Suspensión» como precondición de UC-E01, pero la Suspensión no existe todavía (UC-F05). Hoy cualquier usuario con sesión publica. |
| **«Sigue vigente» el mismo día** | El código apaga el botón si se confirmó hace menos de 24 h (`verifyBlock`). La regla no figura en `casos-de-uso.md` ni en las decisiones. Hay que decidir si se documenta. |
| **Confirmar al editar con equipos anotados** | El código pide confirmación cuando hay equipos anotados. Tampoco figura en las decisiones. |
| **Marca Observado** | «Sigue vigente» no la saca, pero la marca todavía no existe: depende de UC-F03. |
| **Nombre del producto en los mensajes** | La interfaz dice «Torneos Scraper»; la documentación, «Torneos BA». |

## 6. Reglas de referencia

- **Estado del torneo:** Abierto (no pasó el cierre y hay lugar), Cerrado (pasó el cierre sin empezar, o se completó el cupo), En curso (entre inicio y fin), Finalizado (pasó el fin; sale del catálogo y no se puede dar de baja).
- **Antigüedad de verificación:** días completos desde la última verificación; 30 días, ámbar; 60 días, rojo con «Sin confirmar». Crear verifica; editar no.
- **Términos:** se dice «baja» (nunca «eliminar»); «Inscripción vinculada» e «Inscripción por nombre»; «Zona» (nunca «barrio» ni «localidad»).
