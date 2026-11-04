# Módulo Equipos · Especificación de requerimientos

Versión del **04/11/2026**. Parte de la documentación del módulo: **requerimientos** → [casos de uso](02-casos-de-uso.md) → [pantallas](03-pantallas.md) → [diagramas de secuencia](04-diagramas-secuencia/README.md). El [README](README.md) tiene la matriz que los une.

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) (reglas vigentes), [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (módulo C, 03/11/2026), el glosario [CONTEXT.md](../../CONTEXT.md) y el código y las migraciones del repo al día de hoy. Reemplaza a la especificación del 28/10/2026 (`modulo-equipos-especificacion.pdf`), que usaba otra numeración y daba por pendiente lo que hoy ya está.

## 1. Alcance

El módulo permite **crear y gestionar un Equipo**: formar su **Plantel** con un link de invitación, editar sus datos, pasar la capitanía, sacar jugadores o salir, y **disolverlo**. Cada Equipo tiene una **página pública** con sus datos, los torneos en los que tiene una **Inscripción vinculada** y su historial de Partidos. El Plantel lo ven solo sus integrantes. Un **Equipo disuelto** conserva su página y su historia, pero ya no puede operar.

**Fuera del módulo** (tienen su propio documento):

| Tema | Dónde está |
|---|---|
| Buscar rival, propuestas, partidos, resultados, faltas y calificaciones | Módulo D — Partidos |
| Cargar o dar de baja una inscripción | Módulo E — Organizador |
| Suspender una cuenta, resolver reportes | Módulo F — Administración |
| Editar el WhatsApp del perfil | Módulo A — Cuenta (UC-A05) |

**Fuera del alcance vigente:** la grilla de disponibilidad del equipo (mañana/tarde/noche) se eliminó el 28/09/2026; no existe en la página ni en la base.

**Límite de producto:** la app nunca inscribe ni cobra. Un Equipo no "se anota" a un torneo: lo anota el organizador desde su panel (UC-E06).

## 2. Actores

Una cuenta puede cumplir roles distintos según su relación con cada Equipo. **Jugador y Capitán son roles respecto de un Equipo, no cuentas distintas.**

| Actor | Quién es | Qué hace en este módulo |
|---|---|---|
| **Invitado** | Persona sin sesión | Consulta la página pública de un Equipo. |
| **Usuario** | Persona con sesión | Crea Equipos, acepta invitaciones, reporta equipos con los que jugó. |
| **Jugador** | Usuario que integra un Plantel | Ve el Plantel y los partidos del Equipo, y sale si no es Capitán. No opera. |
| **Capitán** | Único miembro que gestiona un Equipo activo | Edita, invita, saca jugadores, pasa la capitanía y disuelve. |
| **Sistema** | La base de datos y la app | Valida y calcula al momento de leer; no hay tareas programadas. |

## 3. Requerimientos funcionales

**Estado:** `Implementado` está en `main`. `Parcial` tiene una parte pendiente que se indica. `Pendiente` es alcance vigente sin programar. **ID anterior** es el de la especificación del 28/10 (`RF-D##`).

### Crear y datos del Equipo

| ID | Requerimiento | Casos de uso | Estado | ID anterior |
|---|---|---|---|---|
| RF-C01 | Crear un Equipo con **nombre** (2 a 50 caracteres), **Zona**, **modalidad habitual** (Fútbol 5, 7, 8 u 11) y **nivel** (recreativo, intermedio o competitivo). Zona, modalidad y nivel se eligen de listas cerradas. | UC-C01 | Implementado | D01 |
| RF-C02 | **Escudo** opcional, JPG, PNG o WebP de hasta 2 MB; se puede subir, reemplazar o quitar. Si falla el guardado del escudo al crear, el Equipo igual queda creado. | UC-C01, UC-C05 | Implementado | D02 |
| RF-C03 | Permitir **nombres de Equipo repetidos**; públicamente se distinguen por la Zona. | UC-C01 | Implementado | D03 |
| RF-C04 | Exigir **sesión** y **WhatsApp cargado en el perfil** para crear un Equipo. | UC-C01 | Implementado | D04 |
| RF-C05 | Máximo **3 capitanías** de Equipos no disueltos por persona, tanto al crear como al recibir la capitanía. | UC-C01, UC-C06 | Implementado | D05 |
| RF-C06 | Crear el Equipo y su Capitán inicial en **una sola transacción**: nunca queda un Equipo sin Capitán. | UC-C01 | Implementado | D06 |
| RF-C16 | Solo el **Capitán de un Equipo activo** edita nombre, escudo, Zona, modalidad y nivel. Cambiar la Zona o el nivel cambia en el acto cómo aparece el Equipo en los rivales compatibles. | UC-C05 | Implementado | D14 |

### Invitar y formar el Plantel

| ID | Requerimiento | Casos de uso | Estado | ID anterior |
|---|---|---|---|---|
| RF-C07 | Link de invitación **válido 7 días**; **regenerarlo invalida el anterior**. Hay un solo link vigente por Equipo. | UC-C02 | Implementado | D07 |
| RF-C08 | Unirse al Plantel **pulsando «Unirme al equipo»**, sin aprobación del Capitán. Abrir el link no suma a nadie (los chats y navegadores precargan links). Si ya integra el Plantel, lo lleva al Equipo sin error. | UC-C03 | Implementado | D08 |
| RF-C09 | **Mensaje único** para un link inexistente, vencido, regenerado o de un Equipo disuelto: «El link de invitación no es válido o venció». | UC-C03 | Implementado | D09 |
| RF-C10 | Si el Usuario no tiene sesión, conservar el destino de la invitación al iniciar sesión o crear cuenta. | UC-C03 | Implementado | D10 |

### Página pública y Plantel

| ID | Requerimiento | Casos de uso | Estado | ID anterior |
|---|---|---|---|---|
| RF-C11 | Página pública `/equipos/{id}`, accesible **sin sesión**, con escudo, nombre, Zona (y su corredor), modalidad, nivel y cantidad de jugadores. Si el Equipo está disuelto, lo marca. | UC-C04 | Implementado | D19 |
| RF-C12 | La página lista los **torneos con Inscripción vinculada** al Equipo, con su estado. | UC-C04 | Implementado | D19 |
| RF-C13 | **Historial público**: contador de partidos jugados, faltas y conflictos (con la cantidad de rivales distintos), promedio de estrellas (solo calificaciones reveladas) y los **últimos 5 partidos cerrados**, sin cancha ni hora. | UC-C04 | Implementado | D19, UC-30 |
| RF-C14 | El **Plantel** (nombres) lo ven solo sus integrantes. El WhatsApp de los jugadores nunca está en la página. | UC-C04 | Implementado | D20 |
| RF-C15 | **Mis equipos** lista los Equipos del Usuario, activos primero y disueltos después, y marca en cuáles es Capitán. | — (pantalla) | Implementado | D21 |

### Gestionar el Plantel

| ID | Requerimiento | Casos de uso | Estado | ID anterior |
|---|---|---|---|---|
| RF-C17 | **Pasar la capitanía** a un integrante del Plantel que tenga WhatsApp, no esté suspendido y capitanee menos de 3 Equipos. El Capitán anterior queda como Jugador. | UC-C06 | **Parcial**: la regla de la Suspensión espera al módulo de administración (UC-F05) | D11 |
| RF-C18 | El Capitán puede **sacar** a cualquier otro jugador del Plantel. | UC-C07 | Implementado | D13 |
| RF-C19 | Cualquier Jugador que **no sea Capitán** puede **salir** del Equipo. | UC-C08 | Implementado | D13 |
| RF-C20 | El Capitán **no puede salir ni sacarse a sí mismo**: primero tiene que pasar la capitanía. | UC-C06, UC-C07, UC-C08 | Implementado | D12 |
| RF-C21 | Cambiar el Capitán o el Plantel **nunca se bloquea** por partidos en curso: las búsquedas, propuestas y partidos son del Equipo, y el Capitán nuevo opera todo lo pendiente. El Capitán anterior deja de ver las propuestas y sigue viendo los partidos; quien sale del Plantel deja de ver los partidos y conserva los Avisos que ya recibió. | UC-C06, UC-C07, UC-C08 | Implementado | D22 |

### Disolver

| ID | Requerimiento | Casos de uso | Estado | ID anterior |
|---|---|---|---|---|
| RF-C22 | **Disolver** con confirmación explícita. El Equipo **no se borra**: conserva su página, su Plantel, su escudo y su historia. **No se reactiva**: si vuelven, crean un Equipo nuevo. Deja de contar para el tope de 3 capitanías. | UC-C09 | Implementado | D15 |
| RF-C23 | **No se puede disolver** un Equipo con un partido por jugarse o esperando resultado. El mensaje indica que primero lo tire o cierre el resultado. | UC-C09 | Implementado | D16 |
| RF-C24 | Al disolver: las **invitaciones dejan de valer** y se **cancelan las búsquedas de rival activas** con sus propuestas pendientes (enviadas y recibidas); el otro lado recibe el Aviso «Se canceló tu propuesta». | UC-C09 | Implementado | D17 |
| RF-C25 | Un **Equipo disuelto** no admite nuevas incorporaciones, ediciones, invitaciones, salidas, expulsiones, pase de capitanía ni inscripciones. Un partido Jugado se sigue pudiendo calificar hasta que venzan los 7 días. | UC-C02 a UC-C09 | Implementado | D18 |

### Pendientes del alcance vigente

| ID | Requerimiento | Casos de uso | Estado | ID anterior |
|---|---|---|---|---|
| RF-C26 | **Reportar un Equipo** (motivos: «Violencia o agresiones», «Cuenta falsa», «Abuso de calificaciones»), solo con sesión y solo si el Usuario jugó al menos un partido contra el reportado. | UC-C10 | Pendiente | — |
| RF-C27 | La **Suspensión** de una cuenta impide crear Equipos y recibir la capitanía; un suspendido puede sumarse a un Plantel. Mientras dure, su Equipo no puede cambiar de Capitán. | UC-C01, UC-C03, UC-C06 | Pendiente (UC-F05); hoy la base no la verifica | — |

### Sin decisión

| Tema | Situación |
|---|---|
| **Catálogo público de Equipos** (`/equipos`, con búsqueda por nombre y filtros por Zona, modalidad, nivel y estado). La especificación del 28/10 lo daba como requerimiento (RF-D23). | Existe solo en la rama `franco-equipos` (commit `5564c51`). **No está en `main` ni en `casos-de-uso.md`.** Hay que decidir con el equipo si entra al alcance antes de documentarlo como caso de uso. |

## 4. Requerimientos no funcionales

| ID | Requisito | Evidencia |
|---|---|---|
| RNF-C01 | **Control de acceso en la base (RLS).** `teams` se lee en público y solo el Capitán edita su Equipo activo, y solo las columnas `name`, `zone_id`, `modality`, `level` y `crest_url`. `team_members` no tiene policies de escritura: el Plantel cambia únicamente por funciones. | `20260928000004_teams.sql` |
| RNF-C02 | **Un solo Capitán por Equipo.** | Índice único parcial `team_members_one_captain`; las funciones conservan al Capitán. |
| RNF-C03 | **El límite de 3 capitanías se respeta aun con altas simultáneas.** | `create_team` y `transfer_captaincy` bloquean el perfil (`for update`) antes de contar. |
| RNF-C04 | **Privacidad del Plantel y de los contactos.** | Policy de `team_members` solo para integrantes; el WhatsApp vive en `profile_contacts`, fuera de la ficha pública. |
| RNF-C05 | **Token de invitación no adivinable ni listable.** | 16 bytes aleatorios en hexadecimal (`gen_random_bytes(16)`); `team_invites` tiene RLS sin policies: solo se toca desde funciones. |
| RNF-C06 | **Alta atómica.** | `create_team` inserta el Equipo y el Capitán en una transacción. |
| RNF-C07 | **Gestión y disolución se serializan por Equipo.** Una invitación o transferencia concurrente no puede modificar un Equipo que otra transacción acaba de disolver. | `20261014000003_team_management_locks.sql` (`for update` sobre `teams`) |
| RNF-C08 | **Errores claros y confirmación de acciones destructivas.** Pasar la capitanía, sacar, salir y disolver piden confirmación; disolver pide además tildar «Entiendo que no podré reactivar este equipo». | `ConfirmButton`, `equipos/[id]/page.tsx` |
| RNF-C09 | **URL pública estable** por Equipo, abierta sin sesión (`/equipos/{id}` no está protegida a propósito). | `src/proxy.ts`, [integracion-rama-equipos.md](../integracion-rama-equipos.md) |
| RNF-C10 | **Validación pura y verificable.** | `parseTeamForm` y `parseCrest`, con `team-form.test.ts` y `team-crest.test.ts` (`pnpm test`). |
| RNF-C11 | **Los escudos solo se sirven desde el bucket propio** y el servidor solo borra archivos de la carpeta del propio Equipo. | `team-crest.ts` (`crestSrc`, `crestObjectPath`), `20261014000002_team_crests.sql`, `team_crests_test.sql` |
| RNF-C12 | **El historial público nunca expone cancha ni hora**, aunque los partidos solo los lea su plantel. | Funciones `security definer` y vistas `team_record` y `team_match_history` (`20261028000012_team_history.sql`), `team_history_test.sql` |
| RNF-C13 | **Las transiciones del Plantel van por funciones de Postgres**, no por `update` directo: `create_team`, `join_team`, `leave_team`, `remove_team_member`, `transfer_captaincy`, `regenerate_team_invite`, `dissolve_team`. Las ejecuta solo `authenticated`. | Migraciones de `teams`, `team_invites`, `team_roster_changes`, `team_management_locks` |

## 5. Reglas de negocio de referencia

No son requerimientos nuevos: son las reglas que los requerimientos de arriba concretan. El detalle está en [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md), sección «Equipos».

- **Plantel:** sin tope de jugadores por ahora.
- **Quién es capitán:** es una marca dentro del Plantel (`team_members.is_captain`), no una columna de `teams`; así queda tan privado como el resto del Plantel.
- **WhatsApp del Capitán:** obligatorio para crear un Equipo o recibir la capitanía; el Capitán de un Equipo no disuelto no puede dejarlo vacío en el perfil (sí cambiarlo).
- **Suspensión vs. Bloqueo por faltas:** la Suspensión recae sobre una cuenta y la decide el administrador; el Bloqueo por faltas recae sobre un Equipo y es automático. No se confunden.
- **Términos:** se dice «disolver» y «Equipo disuelto» (nunca «eliminar» ni «borrar»); «Capitán» (nunca «dueño» ni «admin del equipo»); «Zona» (nunca «barrio» ni «localidad»).
