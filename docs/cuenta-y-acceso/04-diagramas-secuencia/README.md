# Módulo Cuenta y acceso · Diagramas de secuencia

Versión del **04/11/2026**. Un diagrama por caso de uso, en [Mermaid](https://mermaid.js.org/) (GitHub los dibuja directo). Siguen a las [pantallas](../03-pantallas.md) y se apoyan en los [casos de uso](../02-casos-de-uso.md).

| Diagrama | Caso de uso | Pantalla | Estado | PNG |
|---|---|---|---|---|
| [S01 · Crear cuenta](uc-a01-crear-cuenta.md) | UC-A01 | P2 | Implementado | [img/s01-crear-cuenta.png](img/s01-crear-cuenta.png) |
| [S02 · Iniciar sesión](uc-a02-iniciar-sesion.md) | UC-A02 | P1 | Implementado | [img/s02-iniciar-sesion.png](img/s02-iniciar-sesion.png) |
| [S03 · Cerrar sesión](uc-a03-cerrar-sesion.md) | UC-A03 | P4 | Implementado | [img/s03-cerrar-sesion.png](img/s03-cerrar-sesion.png) |
| [S04 · Recuperar contraseña](uc-a04-recuperar-contrasena.md) | UC-A04 | — | **Pendiente** (diseño objetivo) | [img/s04-recuperar-contrasena.png](img/s04-recuperar-contrasena.png) |
| [S05 · Editar perfil](uc-a05-editar-perfil.md) | UC-A05 | P3 | Parcial (falta una regla) | [img/s05-editar-perfil.png](img/s05-editar-perfil.png) |
| [S06 · Ver avisos](uc-a06-ver-avisos.md) | UC-A06 | P5 | Implementado | [img/s06-ver-avisos.png](img/s06-ver-avisos.png) |

Los PNG están dibujados sobre fondo blanco, para pegarlos en un informe. La fuente de cada diagrama es el bloque Mermaid de su archivo: si se cambia uno, hay que regenerar su PNG.

**Relación con los diagramas generales.** [`docs/diagramas-de-secuencia/diagramas-secuencia.md`](../../diagramas-de-secuencia/diagramas-secuencia.md) tiene diagramas de todo el proyecto con participantes genéricos (`Navegador`, `Interfaz`, `Acceso a datos`). Los de este módulo los **detallan**: cada diagrama usa objetos por responsabilidad y fuente de datos, y el de Editar perfil muestra la carga de las Zonas del desplegable (D06 no la muestra). Los generales D01 a D06 corresponden a S01, S02, S03, S04 y S05, y D05 (volver a la acción pedida) está dentro de S01 y S02.

## Criterios aplicados

Son los de la guía para diagramas con formularios y desplegables.

1. **Un caso de uso por diagrama.** La carga de las opciones de un formulario y el guardado van **en el mismo diagrama**.
2. **Si el caso empieza con un formulario con desplegables**, el diagrama muestra al actor abriendo la pantalla y a la pantalla pidiendo las opciones **antes** de que el actor elija. De este módulo, solo **Editar perfil** tiene un desplegable (la Zona); Crear cuenta e Iniciar sesión solo tienen campos de texto.
3. **Un objeto por responsabilidad o fuente de datos.** Las Zonas se consultan en la base, así que las provee `ZonaRepository`. No se inventan repositorios para listas que no se guardan.
4. **Al enviar**, el método del caso de uso recibe **solo los valores elegidos** (`zonaId`), no la lista de Zonas.
5. **La validación se repite al guardar**: un valor que aparece en la pantalla no garantiza que siga siendo válido. Por eso el destino `next` se valida al abrir la pantalla y otra vez al enviar el formulario.
6. **Cada diagrama muestra solo los participantes que intervienen.**

## Participantes: responsabilidad y correspondencia en el repo

**Son responsabilidades conceptuales.** No existen como clases TypeScript con esos nombres: la app usa Server Actions, utilidades puras y funciones de Postgres. La columna de la derecha dice dónde vive hoy cada responsabilidad.

| Participante | Responsabilidad | Correspondencia en el repo |
|---|---|---|
| **Invitado, Usuario** | La persona que inicia el caso. | La sesión; el Invitado navega sin ella. |
| **FormularioAcceso** | La pantalla de acceso, en sus dos modos (Iniciar sesión y Crear cuenta). | `login/page.tsx`, con `loginScreen` y `loginHref` (`utils/login-screen.ts`). |
| **FormularioPerfil** | La pantalla de Mi perfil. | `perfil/page.tsx`. |
| **MenuDeUsuario** | El menú de la barra, con «Cerrar sesión». | `components/UserMenu.tsx`. |
| **Campanita** | La campanita de la barra y el layout que carga sus Avisos. | `components/NoticeBell.tsx` y `app/layout.tsx`. |
| **ControlDeAcceso** | Decide si una ruta exige sesión y, si falta, redirige al acceso conservando el destino. | `src/proxy.ts` (primera capa; cada página vuelve a verificar). |
| **ZonaRepository** | Entrega la lista cerrada de Zonas, que **se consulta en la base**. | `getZoneGroups()` en `ZoneSelect.tsx`: lee `zones` con sus corredores y regiones. |
| **CuentaService** | Coordina registrarse, iniciar y cerrar sesión. | Las Server Actions `signup`, `login` y `logout` (`login/actions.ts`). |
| **PerfilService** | Coordina la edición del perfil. | La Server Action `updateProfile` (`perfil/actions.ts`). |
| **AvisoService** | Coordina el marcado de Avisos como leídos. | La Server Action `markNoticesRead` (`avisos/actions.ts`). |
| **Validador** | Valida las entradas antes de escribir. | `safeNextPath`, la regla del nombre (2 a 50), `normalizeWhatsapp` y `parseAvatar` (`utils/`). |
| **CuentaRepository** | Crea cuentas y sesiones y las consulta. | Supabase Auth (`signUp`, `signInWithPassword`, `signOut`, `getUser`); el trigger `handle_new_user` crea el perfil. |
| **PerfilRepository** | Lee y escribe el perfil, el contacto y la foto. | Las tablas `profiles` y `profile_contacts` con RLS; la foto, en Storage (bucket `avatars`); `saveProfile` (`utils/supabase/profile.ts`). |
| **AvisoRepository** | Lee los Avisos propios y los marca leídos. | La tabla `notices` con RLS y la función `mark_notices_read`. |
| **ServicioCorreo** | Solo en S04: manda el email de recuperación. | **No existe todavía.** |

## Convenciones de dibujo

- Flecha continua (`->>`): una llamada. Flecha punteada (`-->>`): su respuesta.
- Un mensaje de un participante a sí mismo es un paso interno (por ejemplo, una verificación dentro de una función de Postgres).
- Una nota sobre un participante marca una regla que **hace cumplir la base** (o una regla pendiente).
- Entre paréntesis y en minúscula van los **valores que viajan**; entre comillas «así», los mensajes que ve la persona.
- `opt` es un paso opcional; `alt` / `else`, caminos que se excluyen.
