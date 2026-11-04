# Módulo Administración · Especificación de requerimientos

Versión del **04/11/2026**. Parte de la documentación del módulo: **requerimientos** → [casos de uso](02-casos-de-uso.md) → [pantallas](03-pantallas.md) → [diagramas de secuencia](04-diagramas-secuencia/README.md). El [README](README.md) tiene la matriz que los une.

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md), [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (módulo F, 03/11/2026), [acceso-administrador.md](../especificaciones-y-requerimientos/acceso-administrador.md) (etapa del 14/10/2026), el glosario [CONTEXT.md](../../CONTEXT.md) y el código y las migraciones del repo al día de hoy.

## 1. Alcance

El módulo es el **backoffice del equipo de Torneos BA**: el **Administrador** entra por un acceso propio, ve un resumen de la plataforma y —cuando se implementen las etapas siguientes— **modera**: resuelve reportes de torneos y de equipos, suspende cuentas y busca usuarios.

**Hoy está implementada solo la primera etapa:** el acceso diferenciado, el marco del backoffice (sidebar), el resumen con contadores reales y la pantalla «Seguridad y acceso». **La moderación (UC-F03 a UC-F06) está definida pero sin programar:** no hay tablas, funciones ni pantallas de reportes, suspensiones ni registro de acciones.

**Límites de producto:**

- El Administrador **no arbitra partidos**: los conflictos se resuelven solos, sin árbitro ([ADR 0002](../adr/0002-conflictos-sin-arbitro.md)). Por eso no hay ninguna pantalla de partidos en el backoffice.
- **Administrador y Organizador son roles distintos**: el organizador no tiene ningún poder de administración.
- **El rol nunca se asigna desde la app.**

**Fuera del módulo:**

| Tema | Dónde está |
|---|---|
| Crear una cuenta y el acceso de las personas comunes | Módulo A — Cuenta y acceso |
| Generar los reportes (botón «Reportar») | Módulos B (torneos) y C (equipos), ambos pendientes |
| Qué hace la Suspensión sobre los partidos y las búsquedas | Módulos C y D (la Suspensión los cancela) |

## 2. Actores

| Actor | Quién es | Qué hace en este módulo |
|---|---|---|
| **Administrador** | Integrante del equipo de Torneos BA con una fila en `admins` | Entra al backoffice, mira el resumen y (a futuro) modera. |
| **Usuario** | Cualquier persona con cuenta | Si intenta entrar al backoffice sin el rol, recibe acceso denegado y **conserva su sesión normal**. |
| **Sistema** | La app y la base de datos | Verifica el rol en el servidor y calcula los contadores. |

## 3. Requerimientos funcionales

**Estado:** `Implementado` está en `main`. `Pendiente` es alcance vigente sin programar.

### Acceso y rol

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-F01 | **Entrada diferenciada:** `/admin/login` es un formulario público (email y contraseña), **sin registro ni invitado**. Usa la **misma cuenta de Supabase** que el sitio y después consulta `is_admin()` con esa sesión. | UC-F01 | Implementado |
| RF-F02 | **El rol se asigna a mano:** una persona autorizada inserta el usuario en `public.admins` desde el SQL Editor. No hay registro de administradores ni selección de rol en ningún formulario; no se usan `user_metadata`, un campo del perfil ni nada que venga del cliente. | UC-F01 | Implementado |
| RF-F03 | **Solo el rol habilita el acceso.** Credenciales inválidas, cuenta sin rol, error al verificar el rol o un resultado que no sea exactamente `true` **no habilitan** el backoffice. Cada caso tiene su mensaje: «No pudimos iniciar sesión. Revisá tu email y contraseña.», «Tu cuenta no tiene acceso al Panel de administración.» y «No pudimos verificar el acceso de administrador. Probá de nuevo.». | UC-F01 | Implementado |
| RF-F04 | Una **cuenta común** que intenta entrar conserva su sesión normal en el sitio, sin adquirir ningún permiso. | UC-F01 | Implementado |
| RF-F05 | **Toda ruta `/admin/…` exige sesión y rol**, salvo el login exacto. Sin sesión, se redirige a `/admin/login` conservando el destino interno (con sus parámetros); con sesión sin rol, a `/admin/login` con «acceso denegado». El destino de regreso se limita al backoffice y excluye el propio login, para evitar bucles. | UC-F01 | Implementado |
| RF-F06 | **El rol se verifica en dos capas:** el control de acceso de la ruta (`proxy`) y, además, cada página y el layout del backoffice (`requireAdmin()`), que **no se fían** de la primera. | UC-F01 | Implementado |
| RF-F07 | Con una sesión de administrador ya abierta, `/admin/login` no muestra el formulario: lleva al destino. | UC-F01 | Implementado |

### Marco y resumen

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-F08 | El backoffice tiene **su propio marco**: sidebar propia, **sin la barra ni el footer del catálogo**. Arriba, «Volver al sitio»; al pie, la cuenta y «Cerrar sesión» (solo el dispositivo actual). En el celular, la navegación se despliega y se cierra al elegir una sección o con Escape. | UC-F02 | Implementado |
| RF-F09 | El **resumen** muestra los **contadores reales** de torneos, equipos y usuarios. Una consulta fallida o sin conteo muestra «No disponible», **nunca un cero inventado**, y un aviso «No pudimos cargar todos los contadores». | UC-F02 | Implementado |
| RF-F10 | **Seguridad y acceso** muestra la cuenta actual, que su rol fue verificado en el servidor, que el rol se asigna a mano en la base y los controles de esta etapa. | UC-F02 | Implementado |
| RF-F11 | Las secciones **Usuarios, Torneos y equipos, Reportes, Registro de actividad, Soporte, Avisos y Configuración** figuran en la sidebar como **pendientes, sin enlaces ni acciones ficticias**. | UC-F02 | Implementado |

### Moderación

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-F12 | **Resolver un reporte de torneo** con una de tres resoluciones: descartar, marcar el torneo como **Observado**, o darlo de baja (con las mismas consecuencias que la baja del organizador, incluidos los Avisos a los planteles vinculados). | UC-F03 | **Pendiente** |
| RF-F13 | La marca **Observado** se ve en el catálogo y la ficha, y **solo el administrador la saca**: «Sigue vigente» del organizador no la toca. | UC-F03 | **Pendiente** |
| RF-F14 | **Resolver un reporte de equipo:** el administrador revisa la página del equipo y los comentarios privados de calificación que recibió, y elige **descartar** o **suspender al Capitán**, que responde por la conducta del Plantel. | UC-F04 | **Pendiente** |
| RF-F15 | **Suspender una cuenta** por 7 días, 30 días o indefinida, con un **motivo**. El usuario recibe un Aviso con el motivo y un email de contacto; no hay apelación dentro de la app. | UC-F05 | **Pendiente** |
| RF-F16 | **Efectos de la Suspensión:** la persona puede entrar y mirar, pero no publicar torneos, crear equipos, buscar rival ni recibir la capitanía. Sus torneos siguen visibles y los puede editar y verificar. Sus búsquedas se cancelan y las propuestas de su equipo se anulan, con aviso. Sus partidos futuros **se caen** con el motivo «Equipo suspendido», sin falta para nadie. Los partidos pendientes de resultado los puede terminar de cargar. Su equipo no aparece entre los compatibles, su página sigue visible y **no puede cambiar de capitán** mientras dure. | UC-F05 | **Pendiente** (hoy la base solo contempla que un suspendido no reciba la capitanía, y ni eso lo verifica) |
| RF-F17 | La **Suspensión no es el Bloqueo por faltas**: la Suspensión recae sobre una cuenta y la decide el administrador; el Bloqueo por faltas recae sobre un equipo y es automático. | UC-F05 | Regla vigente |
| RF-F18 | **Registro de acciones:** cada resolución del administrador (reporte descartado, torneo observado o dado de baja, cuenta suspendida) queda registrada con **quién, cuándo y qué decidió**. | UC-F03 a UC-F05 | **Pendiente** |
| RF-F19 | **Buscar usuarios** por nombre o email y abrir la cuenta para ver sus equipos, torneos y reportes, y suspenderla si corresponde. | UC-F06 | **Pendiente** |

## 4. Requerimientos no funcionales

| ID | Requisito | Evidencia |
|---|---|---|
| RNF-F01 | **La tabla `admins` no se puede leer ni escribir desde la API.** Tiene RLS sin policies; el rol se consulta solo con `is_admin()`, una función `security definer` que devuelve un booleano sin exponer los ids de los demás administradores. | `20260928000002_profiles.sql`, `20261007000001_is_admin_rpc.sql` |
| RNF-F02 | **`is_admin()` la ejecutan solo usuarios con sesión.** Revocar `anon` no alcanza, porque cada rol conserva el permiso de `PUBLIC`: se revocan los dos. | `20261013000001_is_admin_permissions.sql`, `is_admin_test.sql` |
| RNF-F03 | **El rol nunca se escribe desde el cliente** ni se decide con datos del formulario. | `authenticateAdmin` (`utils/supabase/admin-login.ts`) |
| RNF-F04 | **Dos capas de autorización**, ninguna sustituida por la presentación: el marco del backoffice (`AppFrame`) decide solo la presentación, no la autorización del servidor, de las acciones futuras ni las policies de RLS. | `proxy.ts`, `utils/admin.ts`, `AppFrame.tsx` |
| RNF-F05 | **El destino de regreso es siempre interno** y, en el acceso de administrador, limitado al backoffice. | `admin-access.ts` y `admin-access.test.ts` |
| RNF-F06 | **Al cliente solo llega la `anon key`.** La `service_role key` nunca sale de un contexto de servidor controlado. | `src/utils/supabase/` |
| RNF-F07 | **Las cookies renovadas no se pierden al redirigir** desde el control de acceso. | `proxy.ts` (`redirectWithCookies`) |
| RNF-F08 | **Datos honestos:** una consulta fallida muestra «No disponible», nunca un valor inventado. Y no hay módulos simulados: lo pendiente figura como pendiente. | `admin/(backoffice)/page.tsx` |
| RNF-F09 | **Accesibilidad.** Campos con etiqueta y `autoComplete`, errores anunciados (`role="alert"`), sidebar con `aria-label`, `aria-current` en la sección actual y menú móvil con `aria-expanded`, cerrable con Escape. | `admin/login/page.tsx`, `AdminSidebar.tsx` |
| RNF-F10 | **Pruebas:** la lógica del acceso (credenciales, sesión recién autenticada, cuenta sin rol, fallo de la verificación, destinos) y los permisos de `is_admin()` están cubiertos. | `admin-access.test.ts`, `is_admin_test.sql` |
| RNF-F11 | **Cada etapa nueva se define antes de implementarse.** MFA, gestión de sesiones, permisos granulares, controles sobre usuarios, auditoría, soporte y parámetros de negocio requieren decidir su regla antes de crear tablas, permisos o acciones. | [acceso-administrador.md](../especificaciones-y-requerimientos/acceso-administrador.md) |

## 5. Sin decisión

Hay que resolver estas preguntas antes de implementar las etapas pendientes. Al decidir cada una, agregar la regla a [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md).

| Tema | Pregunta |
|---|---|
| **Email de contacto de la Suspensión** | El Aviso de suspensión «incluye un email de contacto». Falta definir cuál es. |
| **Buscar usuarios por email (UC-F06)** | El email vive en la autenticación (`auth.users`), no en `profiles`, que es lo que se lee desde la app. Buscarlo exige una función de servidor con permisos especiales; hay que definir cómo hacerlo sin exponer la `service_role key` ni los emails de todos. |
| **Reportes repetidos** | Si una misma persona puede reportar más de una vez al mismo equipo (para los torneos es una sola vez por usuario y torneo). |
| **Comentarios de calificación** | El administrador los lee al revisar un equipo reportado; falta definir cómo accede la pantalla, porque los comentarios son privados y la tabla de calificaciones no es de lectura pública. |
| **Cuando vence una Suspensión** | Qué pasa al vencer con lo que la Suspensión canceló: los partidos caídos por «Equipo suspendido» no se reactivan solos, y las búsquedas hay que volver a publicarlas. Falta confirmar que es lo esperado. |
| **Varios administradores** | No hay permisos granulares ni registro de quién es cada administrador más allá de la fila en `admins`. |

## 6. Reglas de referencia

- **Administrador:** integrante del equipo de Torneos BA; el rol se asigna a mano en la base, nunca desde la app.
- **Suspensión:** sanción sobre una cuenta, por 7 días, 30 días o indefinida; impide crear o publicar cosas nuevas pero no entrar ni mirar. No confundir con el **Bloqueo por faltas**.
- **Observado:** marca que el administrador pone a un torneo reportado; la ven catálogo y ficha, y solo él la saca.
- **Términos:** «baja» (nunca «eliminar»); «Equipo disuelto»; el partido «se cae», nunca «se suspende».
