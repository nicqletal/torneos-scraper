# Módulo Cuenta y acceso · Documentación

Documentación completa del módulo A (Cuenta y acceso) de Torneos Amateur BA, versión del **04/11/2026**. Sigue el mismo orden que la del módulo [Equipos](../equipos/README.md):

| Paso | Documento | Qué contiene |
|---|---|---|
| 1 | [01-requerimientos.md](01-requerimientos.md) | Alcance, actores, requerimientos funcionales (RF-A) y no funcionales (RNF-A), con su estado. |
| 2 | [02-casos-de-uso.md](02-casos-de-uso.md) | Los casos de uso UC-A01 a UC-A06: actor, precondiciones, flujo principal, alternativos y postcondición. |
| 3 | [03-pantallas.md](03-pantallas.md) y [`pantallas/`](pantallas/) | La pantalla que representa cada caso, con su captura, sus estados y el origen de cada desplegable. |
| 4 | [04-diagramas-secuencia/](04-diagramas-secuencia/README.md) | Un diagrama de secuencia por caso de uso (Mermaid y PNG), con los criterios y los participantes. |

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) → [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) → [CONTEXT.md](../../CONTEXT.md) → código y migraciones.

## Matriz de trazabilidad

| Caso de uso | Requerimientos | Pantalla | Diagrama | Estado |
|---|---|---|---|---|
| **UC-A01** Crear cuenta | RF-A01 a A03, A06, A08, A25 | [P2](03-pantallas.md#p2--crear-cuenta) `/login?modo=registro` | [S01](04-diagramas-secuencia/uc-a01-crear-cuenta.md) | Implementado |
| **UC-A02** Iniciar sesión | RF-A04 a A08, A25 | [P1](03-pantallas.md#p1--iniciar-sesión) `/login` | [S02](04-diagramas-secuencia/uc-a02-iniciar-sesion.md) | Implementado |
| **UC-A03** Cerrar sesión | RF-A09, A25 | [P4](03-pantallas.md#p4--barra-superior) menú de usuario | [S03](04-diagramas-secuencia/uc-a03-cerrar-sesion.md) | Implementado |
| **UC-A04** Recuperar contraseña | RF-A10 | — (no existe) | [S04](04-diagramas-secuencia/uc-a04-recuperar-contrasena.md) | **Pendiente** |
| **UC-A05** Editar perfil | RF-A11 a A18 | [P3](03-pantallas.md#p3--mi-perfil) `/perfil` | [S05](04-diagramas-secuencia/uc-a05-editar-perfil.md) | **Parcial** (RF-A17) |
| **UC-A06** Ver avisos | RF-A19 a A24, A25 | [P5](03-pantallas.md#p5--campanita-de-avisos) campanita | [S06](04-diagramas-secuencia/uc-a06-ver-avisos.md) | Implementado |

## Equivalencia con el PDF original

| Vigente | PDF original |
|---|---|
| UC-A01 Crear cuenta | UC-01 |
| UC-A02 Iniciar sesión | UC-02 y UC-05 (volver a la acción pedida) |
| UC-A03 Cerrar sesión | UC-03 |
| UC-A04 Recuperar contraseña | UC-04 |
| UC-A05 Editar perfil | UC-07 |
| UC-A06 Ver avisos | — (caso nuevo) |
| — | UC-06, elección de perfil: se retiró |

## Hallazgos y pendientes

1. **El Capitán con WhatsApp vacío no se bloquea (RF-A17).** `casos-de-uso.md` marca UC-A05 como «Implementado» y dice que un Capitán de un equipo no disuelto no puede dejar el WhatsApp vacío. No hay nada que lo haga cumplir: la acción `updateProfile` guarda `null` sin consultar los equipos, y la base solo tiene un trigger (`on_auth_user_created`). Consecuencia: un Capitán puede borrar su WhatsApp y el rival ya no tendría cómo coordinar. Por eso documenté el caso como **Parcial**. Hay que decidir dónde se comprueba (lo razonable es en la base, junto a las demás reglas de WhatsApp) y corregir el estado en `casos-de-uso.md`.
2. **Mensajes de error inconsistentes.** Iniciar sesión con datos incorrectos muestra «Invalid Credentials» (en inglés, tal cual está en el código); registrarse con un rechazo muestra «Error en registro», genérico. El resto de la app está en español y con mensajes específicos. Los documenté tal cual; conviene decidir el texto definitivo.
3. **Guardar el perfil no es atómico.** Nombre, Zona y foto se guardan en `profiles` y el WhatsApp después, en `profile_contacts`. Si el segundo paso falla, el primero ya quedó guardado (el mensaje lo dice). Es aceptable, pero queda documentado como UC-A05 A8.
4. **Recuperar contraseña (UC-A04) sigue pendiente a propósito.** Antes de implementarlo hay que decidir qué se responde si el email no tiene cuenta y si la persona queda con sesión al cambiar la contraseña.
5. **Capturas faltantes:** Mi perfil, la barra con sesión y la campanita, que requieren una cuenta con sesión. Hay una lista con los pasos en [03-pantallas.md](03-pantallas.md#capturas-pendientes). Las de Iniciar sesión y Crear cuenta ya están, sacadas de la app el 04/11/2026.
6. **Tests de base:** hay pgTAP para las fotos de perfil (`profile_avatars_test.sql`) y los avisos (`notices_test.sql`), y pruebas unitarias para `safeNextPath`, `loginScreen`, `normalizeWhatsapp` y `parseAvatar`. No encontré pruebas pgTAP de las policies de `profiles` y `profile_contacts` (que solo el dueño edite lo suyo y solo las columnas permitidas). La regla del proyecto es que toda policy de RLS tenga su test.
7. **Si se cambia un diagrama,** hay que regenerar su PNG (el bloque Mermaid de cada archivo es la fuente).
