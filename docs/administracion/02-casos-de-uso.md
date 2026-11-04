# Módulo Administración · Casos de uso

Versión del **04/11/2026**. Detalla los casos de uso del módulo F de [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (UC-F01 a UC-F06) con los requerimientos que cubre cada uno ([01-requerimientos.md](01-requerimientos.md)), la pantalla que lo representa ([03-pantallas.md](03-pantallas.md)) y su diagrama de secuencia ([04-diagramas-secuencia](04-diagramas-secuencia/README.md)).

**Cómo leerlo.** Cada caso expresa una meta y tiene **un actor iniciador**. **Estado** dice si está en `main`. Los casos pendientes son alcance vigente: solo faltan programarse. Para ellos, el diagrama es un **diseño objetivo** basado en las reglas escritas.

## Mapa de casos de uso

| Caso | Meta del actor | Actor | Estado | ID en el PDF original |
|---|---|---|---|---|
| [UC-F01](#uc-f01--acceder-al-panel-de-administración) | Acceder al Panel de administración | Administrador | Implementado | CU-F01 |
| [UC-F02](#uc-f02--consultar-el-tablero) | Consultar el tablero | Administrador | **Parcial** (resumen y seguridad) | — |
| [UC-F03](#uc-f03--resolver-un-reporte-de-torneo) | Resolver un reporte de torneo | Administrador | **Pendiente** | CU-F03 y CU-F06 (registrar la resolución) |
| [UC-F04](#uc-f04--resolver-un-reporte-de-equipo) | Resolver un reporte de equipo | Administrador | **Pendiente** | — |
| [UC-F05](#uc-f05--suspender-una-cuenta) | Suspender una cuenta | Administrador | **Pendiente** | CU-F05 |
| [UC-F06](#uc-f06--buscar-usuarios) | Buscar usuarios | Administrador | **Pendiente** | — |

La numeración de los casos del PDF original (CU-F01 a CU-F06) no coincide uno a uno con la vigente: el CU-F04 (arbitrar partidos) se retiró porque el administrador no arbitra partidos, y el tablero, el reporte de equipos y la búsqueda de usuarios son casos nuevos. Los diagramas generales de [`diagramas-secuencia.md`](../diagramas-de-secuencia/diagramas-secuencia.md) D30 a D33 cubren acceder, resolver un reporte, suspender y registrar la resolución.

**Qué no es un caso de uso acá:** abrir «Seguridad y acceso», desplegar la sidebar en el celular o «Volver al sitio» no toman ninguna decisión; van en [pantallas](03-pantallas.md).

---

## UC-F01 · Acceder al Panel de administración

- **Actor:** Administrador.
- **Requerimientos:** RF-F01 a RF-F07. **Pantalla:** [P1 · Acceso de administrador](03-pantallas.md#p1--acceso-de-administrador) (`/admin/login`). **Diagrama:** [S01](04-diagramas-secuencia/uc-f01-acceder-administracion.md).
- **Precondiciones:** tiene una cuenta y el rol asignado en la base.
- **Flujo principal:**
  1. Entra a `/admin/login` (desde el link «Acceso de administrador» de la pantalla de ingreso, o redirigido al abrir una ruta `/admin/…` sin sesión).
  2. Ingresa **email** y **contraseña** de su cuenta y pulsa «Ingresar como administrador».
  3. El servidor valida las credenciales y, **con esa sesión recién abierta**, verifica el rol con `is_admin()`.
  4. Si el rol está confirmado, entra al backoffice (con su sidebar propia, sin la barra ni el footer del catálogo), en el destino pedido o en el resumen.
- **Flujos alternativos:**
  - **A1. Credenciales inválidas:** «No pudimos iniciar sesión. Revisá tu email y contraseña.» No se habilita nada.
  - **A2. Cuenta común (sin rol):** conserva su sesión normal en el sitio, pero recibe «Tu cuenta no tiene acceso al Panel de administración.» y un link «Continuar en el catálogo con mi cuenta».
  - **A3. No se puede verificar el rol** (error de la función, o un resultado que no es `true`): acceso denegado, con «No pudimos verificar el acceso de administrador. Probá de nuevo.»
  - **A4. Entra a `/admin/…` sin sesión:** se lo redirige a `/admin/login` conservando el destino interno, con sus parámetros.
  - **A5. Destino inválido:** solo se aceptan destinos dentro del backoffice. Un destino externo, o el propio `/admin/login`, se reemplaza por `/admin` (esto evita bucles).
  - **A6. Ya tiene sesión de administrador:** `/admin/login` no muestra el formulario; lo lleva al destino.
  - **A7. Cada página vuelve a verificar:** aunque la persona llegue a una página del backoffice sin pasar por el control de acceso de la ruta, la página y el layout vuelven a comprobar la sesión y el rol, y la mandan al acceso si fallan.
- **Reglas:** **el rol se asigna a mano** (insertando el usuario en `admins` desde el SQL Editor) y no se puede cambiar desde el perfil ni desde ningún formulario. No hay registro de administradores ni selección de rol.
- **Postcondición:** sesión de administrador abierta en ese dispositivo. No existe una segunda sesión de administrador: es la misma cuenta.
- **Estado:** Implementado (`src/app/admin/login`, `src/utils/admin.ts`, `src/proxy.ts`).

## UC-F02 · Consultar el tablero

- **Actor:** Administrador.
- **Requerimientos:** RF-F08 a RF-F11. **Pantallas:** [P2 · Resumen](03-pantallas.md#p2--resumen-de-la-plataforma), [P3 · Seguridad y acceso](03-pantallas.md#p3--seguridad-y-acceso) y [P4 · Sidebar](03-pantallas.md#p4--sidebar-de-administración). **Diagrama:** [S02](04-diagramas-secuencia/uc-f02-consultar-tablero.md).
- **Precondiciones:** es Administrador y tiene la sesión abierta.
- **Flujo principal:**
  1. Entra al backoffice (UC-F01) y se abre el **resumen**.
  2. El sistema muestra los **contadores reales** de la plataforma: torneos, equipos y usuarios.
  3. Debajo, un bloque «Seguridad y acceso» con un link a «Ver acceso de mi cuenta» y otro, «Próximas etapas», que explica qué falta.
  4. Si abre «Seguridad y acceso», ve su cuenta, que el rol fue verificado en el servidor y los controles de la etapa.
- **Flujos alternativos:**
  - **A1. Una consulta falla:** ese contador dice «No disponible» (**nunca un cero inventado**) y aparece el aviso «No pudimos cargar todos los contadores. Recargá la página para volver a intentarlo».
  - **A2. Sidebar:** las secciones **Usuarios, Torneos y equipos, Reportes, Registro de actividad, Soporte, Avisos y Configuración** figuran como **pendientes, sin enlaces** (no hay enlaces ficticios).
  - **A3. Celular:** la sidebar se despliega con un botón y se cierra al elegir una sección o con Escape.
  - **A4. Salir del backoffice:** «Volver al sitio» lleva al catálogo; «Cerrar sesión» cierra solo este dispositivo.
- **Postcondición:** el administrador conoce el estado general de la plataforma.
- **Estado:** **Parcial.** Implementado el resumen y «Seguridad y acceso». Las demás secciones son pendientes.

## UC-F03 · Resolver un reporte de torneo

- **Actor:** Administrador.
- **Requerimientos:** RF-F12, RF-F13, RF-F18. **Pantalla:** no existe todavía. **Diagrama:** [S03](04-diagramas-secuencia/uc-f03-resolver-reporte-torneo.md) (diseño objetivo).
- **Precondiciones:** hay un **Reporte** pendiente (UC-B06).
- **Flujo principal:**
  1. Abre el reporte pendiente.
  2. Elige una de tres resoluciones:
     - **Descartar** el reporte.
     - **Marcar el torneo como Observado:** la marca se ve en el catálogo y la ficha, y solo el administrador la saca («Sigue vigente» del organizador no la toca).
     - **Dar de baja** el torneo, con las mismas consecuencias que UC-E05: desaparece del catálogo, su ficha devuelve 404, se borra el flyer y los planteles de los equipos con Inscripción vinculada reciben el Aviso de baja.
  3. El sistema aplica la resolución.
- **Postcondición:** la resolución queda en el **registro de acciones** (quién, cuándo, qué decidió).
- **Estado:** **Pendiente.**

## UC-F04 · Resolver un reporte de equipo

- **Actor:** Administrador.
- **Requerimientos:** RF-F14, RF-F18. **Pantalla:** no existe todavía. **Diagrama:** [S04](04-diagramas-secuencia/uc-f04-resolver-reporte-equipo.md) (diseño objetivo).
- **Precondiciones:** hay un reporte pendiente sobre un equipo (UC-C10).
- **Flujo principal:**
  1. Abre el reporte.
  2. Revisa la página del equipo y los **comentarios privados de calificación** que recibió (solo el administrador los lee).
  3. Elige **descartar** el reporte o **suspender al Capitán** (UC-F05), que responde por la conducta del Plantel.
- **Postcondición:** queda en el registro de acciones.
- **Estado:** **Pendiente.**

## UC-F05 · Suspender una cuenta

- **Actor:** Administrador.
- **Requerimientos:** RF-F15 a RF-F18. **Pantalla:** no existe todavía. **Diagrama:** [S05](04-diagramas-secuencia/uc-f05-suspender-cuenta.md) (diseño objetivo).
- **Precondiciones:** la cuenta existe (se llega desde un reporte, UC-F04, o desde la búsqueda, UC-F06).
- **Flujo principal:**
  1. Elige la **duración**: 7 días, 30 días o indefinida.
  2. Escribe el **motivo** y confirma.
  3. El sistema suspende la cuenta y avisa al usuario con el motivo y un email de contacto (no hay apelación dentro de la app).
- **Efectos de la Suspensión:**
  - Puede entrar y mirar, pero **no** publicar torneos, crear equipos, buscar rival ni recibir la capitanía.
  - Sus torneos siguen visibles y los puede editar y verificar.
  - Sus búsquedas de rival se cancelan y las propuestas pendientes de su equipo se anulan, con aviso.
  - Sus partidos futuros **se caen** con el motivo «Equipo suspendido» (lo escribe el sistema), sin falta para nadie.
  - Los partidos pendientes de resultado los puede terminar de cargar.
  - Su equipo no aparece entre los compatibles, su página sigue visible y **no puede cambiar de capitán** mientras dure.
- **No confundir** con el **Bloqueo por faltas**, que es automático, recae sobre el equipo y no lo decide nadie.
- **Postcondición:** la cuenta queda suspendida; la acción queda en el registro.
- **Estado:** **Pendiente.** Hoy la base solo contempla que un suspendido no reciba la capitanía, y ni eso se verifica todavía (hay un comentario «Pendiente cuando exista la suspensión» en `transfer_captaincy`).

## UC-F06 · Buscar usuarios

- **Actor:** Administrador.
- **Requerimientos:** RF-F19. **Pantalla:** no existe todavía. **Diagrama:** [S06](04-diagramas-secuencia/uc-f06-buscar-usuarios.md) (diseño objetivo).
- **Flujo principal:** busca por **nombre** o **email** y abre la cuenta para ver sus equipos, torneos y reportes, y suspenderla si corresponde (UC-F05).
- **Estado:** **Pendiente.** Buscar por email exige resolver cómo leerlo sin exponer datos (ver [«Sin decisión»](01-requerimientos.md#5-sin-decisión)).
