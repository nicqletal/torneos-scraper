# Integración de la rama `franco-equipos`

Qué tocó esta rama fuera de su tarea (perfil, equipos y plantel) y qué tienen que tener en cuenta los otros módulos antes de unir todo.

Rama: `franco-equipos` (5 commits sobre `feat/ui-design`). Migraciones: `supabase/migrations/2026092800000{1-4}`, `2026092900000{1-3}` y `20260930000001`.

---

## 1. Cosas que modificamos y no eran de la rama

Fueron necesarias porque equipos depende de ellas (cuentas, zonas, modalidad). Conviene revisarlas y acordarlas.

### 1.1 Registro y login (`src/app/login/`)
- **El registro ahora pide nombre** (`display_name`, 2 a 50 caracteres). Viaja en `options.data.display_name` del `signUp`; un trigger de la base crea el perfil con ese valor.
- **Login y registro son la misma página con un modo por URL** (`/login?modo=registro`), en vez de dos botones. Sigue siendo Server Component.
- Un error en el registro ahora vuelve a `/login?modo=registro&error=...`.
- **Sigue sin resolverse** (está en "Pendientes técnicos" del doc de decisiones): `login/actions.ts` no valida `next` y usa `/admin` por defecto, y `logout` llama `signOut()` sin `{ scope: 'local' }`. Dejamos el helper `src/utils/safe-next-path.ts` listo; hoy solo lo usa `/perfil`. **Quien toque auth debería usarlo también en login/signup.**
- El estilo de `/login` sigue siendo el viejo (esmeralda). No se tocó el diseño.

### 1.2 Middleware (`src/proxy.ts`)
- Se agregaron `/perfil`, `/crear-equipo` y `/mis-equipos` a las rutas protegidas, como lista `protectedPrefixes`.
- Es un chequeo optimista: cada página y Server Action vuelve a verificar la sesión.
- **Cada módulo que agregue rutas con sesión tiene que sumarlas a esa lista.** Ojo: `/equipos/[id]` y `/unirse/[token]` no están protegidas a propósito (la ficha del equipo es pública y `/unirse` maneja su propio redirect a login).

### 1.3 Menú de usuario (`src/components/UserMenu.tsx`)
- Se sumaron los links "Mi perfil" y "Mis equipos". Quien agregue entradas (p. ej. "Mis partidos", "Admin") edita el mismo archivo: **probable conflicto de merge**.

### 1.4 Estilos (`src/app/globals.css`)
- Nuevo token `--color-brand-danger` (`#f87171`). Usarlo para errores y acciones destructivas en lugar de hex o `red-*`.

### 1.5 Documentación
- Se agregaron `CONTEXT.md`, `docs/decisiones-casos-de-uso.md`, `docs/adr/0001` y `0002`, `docs/casos-de-uso.pdf` y el contexto del proyecto en `AGENTS.md`. Son la base común: **todos deberían leerlos** y, si deciden una regla nueva, agregarla ahí.

### 1.6 Supabase en el repo
- `supabase/config.toml` y `supabase/.gitignore` (proyecto de Supabase CLI).
- Las migraciones son **lo primero versionado del esquema**: hasta ahora vivía solo en el dashboard. Cumple el pendiente "Migraciones versionadas".
- Las tablas del prototipo (`tournaments`, etc.) **no están en las migraciones**. Quien trabaje torneos debería agregar su migración para que el esquema sea reproducible.

---

## 1 bis. Reglas de negocio que definimos

Están escritas en `docs/decisiones-casos-de-uso.md` (fuente de verdad) y en `CONTEXT.md`. Acá va el resumen de lo que afecta a otros módulos.

### Zonas
- **Tres niveles:** región (CABA, GBA) > corredor (p. ej. GBA Norte) > zona (barrio o partido).
- **Torneos, equipos y perfiles se ubican siempre en una zona.** El filtro del catálogo permite elegir una zona o un corredor completo (incluye todas sus zonas).
- **La lista es cerrada:** se arma en una planilla (región, corredor, zona) y se carga una vez por SQL. No hay pantalla para editarla.
- **Pendiente:** que alguien del equipo arme la planilla real. Hoy hay solo 5 zonas de prueba. Los ids son slugs (`san-isidro`), así que conviene no cambiarlos una vez que haya datos que los referencien.
- El orden de los rivales compatibles usa la cercanía: zona > corredor > región.

### Cuenta y perfil
- **Una sola cuenta por persona**: con ella se es jugador, capitán y organizador.
- **Registro:** email, contraseña y **nombre** (público, no se deriva del email). Se entra directo, **sin confirmar el email**. El único mail de la app es "Olvidé mi contraseña" (el SMTP gratis de Supabase manda pocos por hora; con usuarios reales hace falta Resend u otro).
- **Perfil:** nombre, foto (JPG/PNG/WebP, máx. 2 MB), zona y WhatsApp.
- **WhatsApp:** opcional, pero obligatorio para crear un equipo o tomar la capitanía. Se guarda solo con dígitos: `549` + 10 dígitos (lo que pide `wa.me`).
- **El rol de administrador nunca se edita desde la app**: se asigna a mano en la base.
- **Cerrar sesión** cierra solo el dispositivo actual.
- **`next` tras el login:** solo rutas internas (`//sitio.com` empieza con `/` y es externa, hay que rechazarla).

### Equipos
- **Crear:** nombre, zona, modalidad habitual y nivel (recreativo, intermedio, competitivo). Escudo opcional (JPG/PNG/WebP, máx. 2 MB). **Los nombres se pueden repetir**: públicamente se distinguen por la zona (mostrar siempre la zona junto al nombre).
- **Máximo 3 equipos como capitán:** cuentan las capitanías actuales (creadas o recibidas). Los equipos disueltos no cuentan. No se puede pasar la capitanía a quien ya capitanea 3.
- **Plantel:** sin tope de jugadores por ahora. Lo ve cualquier usuario con sesión (nombre, foto y capitán, nunca contactos); sin sesión solo se ve la cantidad. **Esto cambió respecto de la regla original** (antes solo los integrantes): migración `20260930000001`.
- **Buscador de equipos:** `/equipos`, lista equipos activos y filtra por zona (`?zona=`).
- **Invitar:** link de 7 días, uno vigente por equipo (regenerarlo invalida el anterior). Quien lo abre entra directo al plantel. Si el equipo está disuelto, el link se comporta como vencido. Si ya está en el plantel, lo lleva al equipo sin error.
- **Editar:** solo el capitán (nombre, escudo, zona, modalidad, nivel).
- **Salir:** cualquier jugador; el capitán primero pasa la capitanía. **Sacar jugadores:** solo el capitán, y no a sí mismo.
- **Suspendido:** puede sumarse a un equipo, pero no recibir la capitanía (todavía no implementado, ver 3.3).
- **Disolver:** el equipo no se borra, queda "disuelto" con su página pública y su historia. No puede buscar rival ni recibir inscripciones; no se puede disolver con un partido acordado pendiente; las propuestas pendientes se cancelan; no se reactiva. **Decidido pero no implementado.**

### Visibilidad (base de las policies de RLS)
Ya implementado para esta rama: zonas, perfiles y equipos públicos; plantel para cualquier usuario con sesión; WhatsApp solo el propio. **Falta para los otros módulos** (según la tabla del doc de decisiones): WhatsApp del capitán rival visible solo con un partido acordado, búsquedas de rival solo para capitanes con búsqueda activa, propuestas y detalle del partido solo para los dos equipos, comentarios de calificación y reportes solo admin.

### Términos (`CONTEXT.md`)
Usar exactamente el glosario: un partido "se cae" (nunca "se suspende"), se dice "baja" (no "eliminar"), "disolver" un equipo, "capitán", "plantel", "corredor".

---

## 2. Base de datos que los otros módulos pueden usar

| Objeto | Qué es | Para quién |
|---|---|---|
| `regions`, `corridors`, `zones` | Geografía cerrada (región > corredor > zona). Lectura pública, sin escritura. **Hoy tiene datos de prueba** (5 zonas) hasta que esté la planilla real. | Torneos (filtro por zona), búsqueda de rival |
| `profiles` | Perfil público (`display_name`, `avatar_url`, `zone_id`). Se crea por trigger `handle_new_user` al registrarse. | Todos (nombre del organizador, capitanes) |
| `profile_contacts` | WhatsApp **privado**, en tabla aparte porque RLS no filtra columnas. | Ver 3.3 |
| `admins` | Sin policies: no se lee ni escribe por la API. Se carga a mano por SQL. | Módulo admin |
| `public.sport_modality` | Enum `futbol_5 / futbol_7 / futbol_8 / futbol_11`. | Torneos, búsquedas de rival |
| `teams`, `team_members` | Equipos y plantel (el capitán es una marca `is_captain`). | Partidos, búsqueda de rival |
| `team_invites` | Link de invitación (un solo vigente por equipo). Sin policies. | Solo equipos |
| `team_level` | Enum `recreativo < intermedio < competitivo` (el orden importa). | Búsqueda de rival |

Funciones disponibles (todas `security definer`, `search_path = ''`, solo `authenticated`):
`create_team`, `join_team`, `leave_team`, `remove_team_member`, `transfer_captaincy`, `regenerate_team_invite`, `get_team_invite`.
Helpers para policies: `is_team_member(team_id)` e `is_team_captain(team_id)`. Columna calculada: `player_count` (se pide en `select` como columna de `teams`).

---

## 3. Qué tienen que tener en cuenta los otros módulos

### 3.1 Torneos
- **`tournaments.sport_modality` hoy es texto libre** en el prototipo. Existe el enum `public.sport_modality` con los mismos valores; conviene migrar la columna al enum para que "misma modalidad" se compare igual entre torneos, equipos y búsquedas. Pasarlo con `alter column ... type public.sport_modality using sport_modality::public.sport_modality` (verificar antes que no haya valores fuera de los 4).
- El filtro por zona debería usar `zones`/`corridors`/`regions` (ya hay un `<ZoneSelect>` en `src/components/ZoneSelect.tsx`, Server Component que agrupa por región > corredor).
- El organizador se muestra con `profiles.display_name`. Su WhatsApp vive en `profile_contacts` y **no es legible por otros usuarios** (RLS). Para el deep link a WhatsApp del torneo hace falta una vista o función pública que exponga solo el contacto del torneo, según la tabla de visibilidad. No lo resolvimos porque es decisión de RLS del módulo torneos.
- Helper `src/utils/whatsapp.ts`: `normalizeWhatsapp`, `whatsappLink(stored, mensaje?)`, `toNationalNumber`. El formato guardado es `549` + característica + número (13 dígitos), el que pide `wa.me`. **Usar estos helpers y no reimplementar el formato.**

### 3.2 Búsqueda de rival / partidos (siguientes etapas)
- **Alcance de esta rama:** crear equipo, invitar por link, plantel, salir/sacar/pasar capitanía, ficha pública del equipo (`/equipos/[id]`) y `/mis-equipos`. Incluye el buscador de equipos (`/equipos`). **No incluye** búsquedas de rival, propuestas, partidos, resultados, presentismo, calificaciones ni la función de disolver equipo.
- Las reglas de compatibilidad (misma modalidad, al menos 1 h en común, niveles a dos escalones no se cruzan, orden por cercanía > nivel > presentismo) están en `docs/decisiones-casos-de-uso.md`, sección "Búsqueda de rival".
- Los partidos y propuestas van por **funciones de Postgres**, siguiendo el patrón de `supabase/migrations/20260929000002/3`: `security definer`, `set search_path = ''`, chequeo de `auth.uid()` adentro, `revoke ... from public, anon` y `grant ... to authenticated`.
- **El plantel lo ve cualquier usuario con sesión** (policy `team_members: lectura con sesión`), pero **no los contactos**: el WhatsApp del capitán rival sigue oculto hasta tener un partido acordado y tiene que exponerse vía función o vista, no ampliando `profile_contacts`.
- Usar `is_team_captain()` / `is_team_member()` en las policies y funciones nuevas. No consultar `team_members` desde una policy de `team_members` (recursión infinita: por eso los helpers son `security definer`).
- `team_level` es enum ordenado: `level` se compara con `<`/`>` para la regla de "no cruzar dos escalones".
- Un equipo disuelto tiene `dissolved_at` no nulo. **Todavía no existe la función para disolver** (queda pendiente, y `dissolved_at` no es editable por el cliente). Las funciones de plantel ya rechazan equipos disueltos; las de partidos también deberían.
- Reglas ya aplicadas que afectan a partidos: máximo **3 equipos como capitán** por usuario, y hace falta **WhatsApp cargado** para crear un equipo o recibir la capitanía.

### 3.3 Administración / suspensión
- `admins` está creada pero sin policies y sin pantalla. Cargar admins por SQL con el `user_id`.
- **Pendiente explícito en `transfer_captaincy`**: un usuario suspendido no puede recibir la capitanía (hay un comentario en la migración `..0003`). Cuando exista la suspensión, agregar esa validación también en `create_team`.
- `team_members.user_id` es `on delete restrict`: **la baja de cuenta no está definida** y hoy borrar un usuario capitán falla. Hay que decidirlo junto con este módulo.
- Las zonas no tienen pantalla de edición (lista cerrada, por SQL).

### 3.4 Autenticación / cuentas
- Todo usuario nuevo **necesita `display_name`** en el metadata, o el trigger falla con "Database error saving new user" (violaría el check). Si se agrega otro método de registro (OAuth, invitación), tiene que enviar ese dato.
- Los usuarios que ya existían se migraron con el prefijo del email como nombre. Es solo para cuentas de prueba.

---

## 4. Para unir las ramas

1. **Orden de migraciones:** nuestras migraciones usan timestamps `20260928…` y `20260929…`. Si otra rama tiene migraciones propias, verificar que los timestamps no choquen y que nada dependa de tablas que aún no existen. `20260928000003_sport_modality.sql` debe ir antes que cualquier migración que use el enum.
2. **Aplicar en una base limpia** (`supabase db reset`) antes del merge final para comprobar que todo corre de cero, incluido el insert de datos de prueba de zonas.
3. **Archivos con riesgo de conflicto:** `src/components/UserMenu.tsx`, `src/proxy.ts`, `src/app/login/*`, `src/app/globals.css`, `AGENTS.md`.
4. **Convenciones que seguimos** (conviene mantener): rutas en español y código en inglés; Server Components por defecto; `revalidatePath` después de escribir; colores por token; términos exactos de `CONTEXT.md`.
5. **Deuda de diseño:** las pantallas nuevas (`/perfil`, `/crear-equipo`, `/mis-equipos`, `/equipos/[id]`, `/unirse/[token]`) usan el sistema lima/negro. `/login`, `/crear-torneo` y `/mis-torneos` siguen con el estilo viejo.
6. **Componentes reutilizables nuevos:** `ZoneSelect`, `ConfirmButton` (submit con `confirm()`), `CopyLinkButton`, `TeamCrest`; utilidades `safe-next-path`, `whatsapp`, `teams`.

## 5. Revisión pendiente antes de aplicar en producción

Según `AGENTS.md`, toda policy de RLS se revisa línea por línea y se explica antes de aplicarse. Policies y funciones que conviene que revise todo el equipo:
- `profiles`, `profile_contacts`, `teams`, `team_members` (policies y `grant update (columnas)`).
- `handle_new_user`, `create_team` y las funciones de plantel (`security definer`).
- `team_invites` sin policies: el token es la credencial para entrar al plantel.
