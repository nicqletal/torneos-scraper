# Módulo Cuenta y acceso · Especificación de requerimientos

Versión del **04/11/2026**. Parte de la documentación del módulo: **requerimientos** → [casos de uso](02-casos-de-uso.md) → [pantallas](03-pantallas.md) → [diagramas de secuencia](04-diagramas-secuencia/README.md). El [README](README.md) tiene la matriz que los une.

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) (sección «Cuenta y acceso»), [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (módulo A, 03/11/2026), el glosario [CONTEXT.md](../../CONTEXT.md) y el código y las migraciones del repo al día de hoy.

## 1. Alcance

El módulo permite **crear una cuenta, entrar y salir**, volver a lo que la persona estaba haciendo después de entrar (`next`), **editar el perfil** (nombre, foto, Zona y WhatsApp) y **ver los Avisos** en la campanita. Cada persona tiene **una sola cuenta**, con la que puede ser Jugador, Capitán y Organizador a la vez.

**Fuera del módulo** (tienen su propio documento):

| Tema | Dónde está |
|---|---|
| Acceso del Administrador (`/admin/login`, el rol, el panel) | Módulo F — Administración |
| Quién publica torneos, el Panel de organizador | Módulo E — Organizador |
| Crear equipos, ser Capitán | Módulo C — Equipos (usa el WhatsApp del perfil) |
| Qué genera cada Aviso (propuestas, partidos, bajas de torneo) | Módulos D y E (el módulo A solo los **muestra**) |
| Bloqueo por intentos fallidos de login y confirmación de email | Los cubre Supabase (decisión del 27/09/2026) |

**Límite de producto:** la app no manda emails ni notificaciones push. El único mail que mandaría es el de recuperar la contraseña, que todavía no existe. Los Avisos viven solo en la campanita.

## 2. Actores

| Actor | Quién es | Qué hace en este módulo |
|---|---|---|
| **Invitado** | Persona sin sesión | Crea una cuenta, inicia sesión, pide recuperar la contraseña. |
| **Usuario** | Persona con sesión | Cierra sesión, edita su perfil, ve sus Avisos. |
| **Sistema** | La base de datos y la app | Crea el perfil con la cuenta, controla el acceso a las rutas y escribe los Avisos. |

El **Administrador** es un rol distinto del Usuario que se asigna a mano en la base; el módulo A garantiza que **nunca se pueda escribir desde la app** (RF-A15).

## 3. Requerimientos funcionales

**Estado:** `Implementado` está en `main`. `Pendiente` es alcance vigente sin programar. `Parcial` tiene una parte sin cumplir, que se indica.

### Crear cuenta e iniciar sesión

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-A01 | Crear una cuenta con **email**, **contraseña** y **nombre**. El nombre es público (lo ven todos en la página del organizador), así que **no se deriva del email**: tiene de 2 a 50 caracteres. | UC-A01 | Implementado |
| RF-A02 | Al crear la cuenta se crean **en el mismo acto** el perfil (con el nombre) y la fila de contacto, vacía. Se entra directo, **sin confirmar el email**. | UC-A01 | Implementado |
| RF-A03 | Una sola cuenta por persona: no se puede crear una segunda con un email ya registrado. | UC-A01 | Implementado (lo garantiza Supabase Auth) |
| RF-A04 | Iniciar sesión con email y contraseña. Con credenciales inválidas, mostrar el error y seguir sin sesión. | UC-A02 | Implementado |
| RF-A05 | Las rutas que exigen sesión (`/crear-torneo`, `/mis-torneos`, `/perfil`, `/crear-equipo`, `/mis-equipos`, `/partidos`) redirigen a «Iniciar sesión» conservando el destino. Cada página y cada acción vuelve a verificar la sesión: el control del acceso a la ruta es una primera capa, no la única. | UC-A02 | Implementado |
| RF-A06 | Después de entrar, volver al **destino pendiente** (`next`); sin destino, al catálogo. **Solo se aceptan rutas internas**: `//sitio.com` y `/\sitio.com` empiezan con `/` pero son externas, y se rechazan. | UC-A01, UC-A02 | Implementado |
| RF-A07 | Con una sesión ya abierta, `/login` no muestra el formulario: lleva al destino. | UC-A02 | Implementado |
| RF-A08 | El **modo** de la pantalla de acceso (Iniciar sesión o Crear cuenta) vive en la URL, así que cada pantalla es un link. Llegar desde «¿Organizás torneos? Publicalo» abre **Crear cuenta** con el aviso «Para publicar un torneo necesitás una cuenta. Es gratis.» y conserva el destino al panel; con cualquier otro destino se abre Iniciar sesión, sin aviso. El link para pasar de una pantalla a la otra conserva el destino. | UC-A01 | Implementado |
| RF-A09 | **Cerrar sesión** cierra **solo la sesión del dispositivo actual** y lleva al catálogo. | UC-A03 | Implementado |
| RF-A10 | **Recuperar la contraseña**: pedir un enlace por email, abrirlo y definir una contraseña nueva. Sería el único email que manda la app. | UC-A04 | **Pendiente**, a propósito (decisión del 27/09/2026: primero producto, después infraestructura de auth) |

### Perfil

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-A11 | Editar el perfil: **nombre** (2 a 50 caracteres), **foto**, **Zona** (opcional, de una lista cerrada) y **WhatsApp** (opcional). Cada persona edita solo el suyo. | UC-A05 | Implementado |
| RF-A12 | **Foto** JPG, PNG o WebP de hasta 2 MB. Cada foto nueva **reemplaza** a la anterior; no hay galería. La foto anterior se retira **después** de guardar la nueva; si el guardado falla, se conserva la anterior y se retira la subida nueva. | UC-A05 | Implementado |
| RF-A13 | El **WhatsApp** se guarda **solo con dígitos**, en formato argentino de celular: `549` + código de área sin 0 + número sin 15 (13 dígitos), que es lo que pide `wa.me`. La persona lo escribe sin el `+54 9`. El «15» se rechaza. | UC-A05 | Implementado |
| RF-A14 | El WhatsApp es **privado**: no está en la página pública ni en el perfil público. Cada persona ve solo el suyo; el capitán rival lo ve únicamente con un partido acordado. | UC-A05 | Implementado |
| RF-A15 | El **rol de administrador no se edita desde la app**: la persona edita nombre, foto, Zona y WhatsApp, nunca el rol. | UC-A05 | Implementado |
| RF-A16 | El WhatsApp es **obligatorio para crear un equipo, recibir la capitanía y buscar rival**. La app lo exige en cada una de esas acciones. | UC-A05 (dependencia) | Implementado en los módulos C y D |
| RF-A17 | El **Capitán de un equipo no disuelto no puede dejar el WhatsApp vacío** (sí cambiarlo): el rival lo necesita para coordinar. | UC-A05 | **Pendiente**: la regla está definida pero hoy ni la acción ni la base la hacen cumplir |
| RF-A18 | Si la persona llegó al perfil desde otra acción (por ejemplo, Crear equipo), el perfil le dice «Para seguir, cargá tu WhatsApp» y, al guardar, la devuelve al destino. | UC-A05 | Implementado |

### Avisos (campanita)

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-A19 | Con sesión, la barra muestra la **campanita** con el número rojo de **Avisos no leídos**. Al abrirla se listan los **últimos 30**, del más nuevo al más viejo, cada uno con texto, link y fecha. | UC-A06 | Implementado |
| RF-A20 | **Abrir la campanita marca como leídos** los Avisos que se ven (no «todos»: un Aviso que llega mientras está abierta sigue contando como no leído). Mientras está abierta, los que estaban sin leer siguen resaltados. | UC-A06 | Implementado |
| RF-A21 | El Aviso **no tiene botones**: es un link a donde está el estado actual (Partidos, el Equipo). La acción se hace en esa pantalla, que valida las reglas. El Aviso es un puntero, no la fuente de verdad. | UC-A06 | Implementado |
| RF-A22 | El **texto se arma en el momento del hecho** y no cambia aunque el rival cambie de nombre: se guarda el hecho (`kind`) y la foto de sus datos (`params`). Todo Aviso que abre un plazo dice cuándo vence y qué pasa si no se responde. | UC-A06 | Implementado |
| RF-A23 | Los Avisos **no se borran ni se archivan**. No existe email ni push. | UC-A06 | Implementado |
| RF-A24 | Cada persona **lee solo sus Avisos**. Los escribe el sistema desde las funciones de cada acción, nunca el cliente; y nunca le llegan a quien hizo la acción. | UC-A06 | Implementado |

### Barra superior

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-A25 | **Sin sesión:** logo, «Iniciar sesión» (texto) y «Crear cuenta» (único botón destacado). **Con sesión:** logo, la campanita y el menú de usuario con Mi perfil, Mis equipos, Partidos, Mis torneos, «Administración» (solo si es Administrador) y Cerrar sesión. Ningún botón destacado permanente. | UC-A01 a UC-A03, UC-A05, UC-A06 | Implementado |

## 4. Requerimientos no funcionales

| ID | Requisito | Evidencia |
|---|---|---|
| RNF-A01 | **Control de acceso en la base (RLS).** `profiles` se lee en público y cada persona edita solo el suyo, y solo las columnas `display_name`, `avatar_url` y `zone_id`. `profile_contacts` lo lee y edita solo su dueño, y solo la columna `whatsapp`. `admins` no tiene policies: nadie la lee ni la escribe por la API. | `20260928000002_profiles.sql` |
| RNF-A02 | **El WhatsApp no sale en ninguna lectura pública**, porque RLS filtra filas y no columnas: por eso vive en una tabla aparte. | `profile_contacts`; `organizadores/[id]/page.tsx` |
| RNF-A03 | **Perfil y contacto nacen con la cuenta**, en la misma transacción del alta. | Trigger `on_auth_user_created` y función `handle_new_user` (`security definer`) |
| RNF-A04 | **El destino `next` solo puede ser una ruta interna.** Se valida en la pantalla y de nuevo en la acción, porque el campo oculto se puede editar. | `safe-next-path.ts` y `safe-next-path.test.ts` |
| RNF-A05 | **Sesión por cookies y control del acceso en dos capas.** El middleware renueva la sesión y redirige las rutas protegidas; cada página y acción la verifica de nuevo. | `src/proxy.ts` |
| RNF-A06 | **Al cliente solo llega la `anon key`.** La `service_role key` nunca sale de un contexto de servidor controlado. | `src/utils/supabase/` |
| RNF-A07 | **Las fotos solo se sirven desde el bucket propio** y el servidor solo borra archivos de la carpeta del propio usuario, sin confiar en la URL ni en la extensión que vengan del formulario. El bucket limita tipo y tamaño (2 MB). | `profile-avatar.ts` (`avatarSrc`, `avatarObjectPath`), `20261013000002_profile_avatars.sql`, `profile_avatars_test.sql` |
| RNF-A08 | **Un cambio de foto no pierde la actual.** Dos pestañas no pueden reemplazar la misma foto a la vez: la segunda retira su subida y pide reintentar. | `saveProfile` (`utils/supabase/profile.ts`) |
| RNF-A09 | **Los Avisos los escribe solo el sistema.** `notices` no tiene privilegios de escritura para la API; `notify` no es ejecutable por el cliente; `mark_notices_read` solo toca avisos propios y un id ajeno se ignora sin error, para no confirmar que existe. | `20261028000001_notices.sql`, `notices_test.sql` |
| RNF-A10 | **Validación pura y verificable.** | `safeNextPath`, `loginScreen`, `normalizeWhatsapp`, `parseAvatar` y el texto de los Avisos, con sus `*.test.ts` (`pnpm test`) |
| RNF-A11 | **Formularios accesibles.** Cada campo tiene su etiqueta y su `autoComplete` (`new-password` al crear la cuenta, `current-password` al entrar, para el gestor de contraseñas); los errores se anuncian (`role="alert"`); la campanita y el menú declaran `aria-expanded` y se cierran con Escape. | `login/page.tsx`, `NoticeBell.tsx`, `UserMenu.tsx` |
| RNF-A12 | **Delegado a Supabase:** bloqueo por intentos fallidos de login, confirmación de email y política de contraseñas. | Decisión del 27/09/2026 |

## 5. Reglas de referencia

No son requerimientos nuevos: son las reglas que los de arriba concretan. El detalle está en [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md), secciones «Cuenta y acceso» y «Avisos».

- **No hay «vista de jugador» ni «vista de organizador».** `/` es el catálogo para cualquiera; la app se navega de una sola forma (decidido el 07/10/2026).
- **Una sola convención para volver:** un link arriba a la izquierda con el nombre del destino. Nunca dos formas de volver en la misma pantalla.
- **Quién ve un Aviso:** los que piden una acción van solo al Capitán; los informativos, a todo el Plantel del momento del hecho. Quien está en los dos planteles recibe uno solo. El nuevo Capitán no hereda los Avisos del anterior.
- **Términos:** «Aviso» y «campanita» (nunca «notificación»); «Zona» (nunca «barrio» ni «localidad»); «Capitán» (nunca «dueño del equipo»).
