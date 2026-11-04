# Módulo Cuenta y acceso · Casos de uso

Versión del **04/11/2026**. Detalla los casos de uso del módulo A de [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (UC-A01 a UC-A06) con lo que hace falta para la documentación completa: los requerimientos que cubre cada uno ([01-requerimientos.md](01-requerimientos.md)), la pantalla que lo representa ([03-pantallas.md](03-pantallas.md)) y su diagrama de secuencia ([04-diagramas-secuencia](04-diagramas-secuencia/README.md)).

**Cómo leerlo.** Cada caso expresa una meta y tiene **un actor iniciador**. **Estado** dice si está en `main`. Los mensajes entre comillas son los que ve la persona, tal como están en el código.

## Mapa de casos de uso

| Caso | Meta del actor | Actor | Estado | ID en el PDF original |
|---|---|---|---|---|
| [UC-A01](#uc-a01--crear-cuenta) | Crear cuenta | Invitado | Implementado | UC-01 |
| [UC-A02](#uc-a02--iniciar-sesión) | Iniciar sesión | Invitado | Implementado | UC-02 y UC-05 (volver a la acción pedida) |
| [UC-A03](#uc-a03--cerrar-sesión) | Cerrar sesión | Usuario | Implementado | UC-03 |
| [UC-A04](#uc-a04--recuperar-contraseña) | Recuperar contraseña | Invitado | **Pendiente** | UC-04 |
| [UC-A05](#uc-a05--editar-perfil) | Editar perfil | Usuario | **Parcial** (falta una regla) | UC-07 |
| [UC-A06](#uc-a06--ver-avisos-campanita) | Ver avisos (campanita) | Usuario | Implementado | — (caso nuevo) |

«Volver a la acción pedida después de iniciar sesión» (UC-05 del PDF) no es un caso aparte: es una regla de UC-A01 y UC-A02 (el destino `next`). El UC-06 del PDF, la elección de perfil, se retiró. La campanita (UC-A06) no existía en el PDF original.

**Qué no es un caso de uso acá:** ver el menú de usuario o navegar la barra no toma ninguna decisión. Va en [pantallas](03-pantallas.md#p4--barra-superior).

---

## UC-A01 · Crear cuenta

- **Actor:** Invitado.
- **Requerimientos:** RF-A01 a RF-A03, RF-A06, RF-A08, RF-A25. **Pantalla:** [P2 · Crear cuenta](03-pantallas.md#p2--crear-cuenta) (`/login?modo=registro`). **Diagrama:** [S01](04-diagramas-secuencia/uc-a01-crear-cuenta.md).
- **Precondiciones:** ninguna.
- **Flujo principal:**
  1. El Invitado abre «Crear cuenta» desde la barra, desde el link «Registrate» de Iniciar sesión, o desde un link que exige sesión.
  2. La pantalla valida el destino pendiente (`next`) y muestra el formulario.
  3. Completa **nombre**, **email** y **contraseña**, y pulsa «Registrarme».
  4. El sistema valida el nombre (de 2 a 50 caracteres).
  5. El sistema crea la cuenta y abre la sesión **en el acto, sin confirmar el email**. Con la cuenta se crean el **perfil** con el nombre y la fila de **contacto** (vacía).
  6. Si llegó con un destino pendiente, vuelve a esa pantalla; si no, al catálogo.
- **Flujos alternativos:**
  - **A1. Llega desde «¿Organizás torneos? Publicalo»:** la pantalla muestra «Para publicar un torneo necesitás una cuenta. Es gratis.» y conserva el destino al panel. Con cualquier otro destino no hay aviso.
  - **A2. Destino externo:** solo se aceptan rutas internas. `//sitio.com` empieza con `/` pero es externa, y también se rechaza; se vuelve al catálogo.
  - **A3. Nombre inválido:** se vuelve a Crear cuenta con «El nombre tiene que tener entre 2 y 50 caracteres». No se crea nada.
  - **A4. Email ya registrado u otro rechazo de la cuenta** (por ejemplo, una contraseña que Supabase no acepta): se vuelve a Crear cuenta con «Error en registro». No se crea nada. El mensaje es genérico, no dice cuál fue el motivo.
  - **A5. Ya tiene sesión:** `/login` no muestra el formulario; lo lleva al destino.
- **Postcondición:** existe el perfil con nombre; la persona está dentro.
- **Estado:** Implementado (`src/app/login`, función `signup`, trigger `handle_new_user`).

## UC-A02 · Iniciar sesión

- **Actor:** Invitado.
- **Requerimientos:** RF-A04 a RF-A08, RF-A25. **Pantalla:** [P1 · Iniciar sesión](03-pantallas.md#p1--iniciar-sesión) (`/login`). **Diagrama:** [S02](04-diagramas-secuencia/uc-a02-iniciar-sesion.md).
- **Precondiciones:** tiene una cuenta.
- **Flujo principal:**
  1. Abre «Iniciar sesión» (texto en la barra), o **es redirigido** por intentar entrar a una ruta que exige sesión (`/crear-torneo`, `/mis-torneos`, `/perfil`, `/crear-equipo`, `/mis-equipos`, `/partidos`).
  2. La pantalla valida el destino pendiente y muestra el formulario.
  3. Ingresa **email** y **contraseña** y pulsa «Ingresar».
  4. El sistema valida las credenciales y abre la sesión.
  5. Lo lleva al destino pendiente o, sin destino, al catálogo.
- **Flujos alternativos:**
  - **A1. Credenciales inválidas:** se vuelve a Iniciar sesión con el mensaje «Invalid Credentials» (en inglés, tal cual está en el código) y sin sesión. El destino pendiente se conserva. El mensaje no dice si falló el email o la contraseña.
  - **A2. Destino inválido o externo:** misma regla que UC-A01 A2.
  - **A3. Ya tiene sesión:** `/login` lo lleva directo al destino, sin mostrar el formulario.
  - **A4. Las páginas protegidas se verifican de nuevo:** aunque la persona llegue a una ruta protegida sin pasar por el control de acceso, cada página y cada acción comprueban la sesión y la mandan a `/login?next=…`.
  - **A5. Panel de administración:** `/admin` tiene su propio acceso (`/admin/login`, UC-F01); no es parte de este caso.
- **Postcondición:** sesión abierta en ese dispositivo.
- **Estado:** Implementado (`src/app/login`, función `login`; `src/proxy.ts`).

## UC-A03 · Cerrar sesión

- **Actor:** Usuario.
- **Requerimientos:** RF-A09, RF-A25. **Pantalla:** [P4 · Barra superior](03-pantallas.md#p4--barra-superior) (menú de usuario, «Cerrar sesión»). **Diagrama:** [S03](04-diagramas-secuencia/uc-a03-cerrar-sesion.md).
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. Elige «Cerrar sesión» en el menú de usuario.
  2. El sistema cierra **solo la sesión del dispositivo actual**.
  3. Lo lleva al catálogo.
- **Regla:** sin el alcance «local», Supabase revocaría las sesiones de la cuenta en **todos** los dispositivos. Por eso se pide explícitamente el cierre local.
- **Postcondición:** el dispositivo queda sin sesión; las demás sesiones de la cuenta siguen abiertas.
- **Estado:** Implementado (función `logout`, `signOut({ scope: 'local' })`).

## UC-A04 · Recuperar contraseña

- **Actor:** Invitado.
- **Requerimientos:** RF-A10. **Pantalla:** no existe todavía. **Diagrama:** [S04](04-diagramas-secuencia/uc-a04-recuperar-contrasena.md) (diseño objetivo).
- **Precondiciones:** tiene una cuenta.
- **Flujo principal:**
  1. Pide el enlace de recuperación por email («Olvidé mi contraseña»).
  2. El sistema le manda el enlace por email.
  3. Abre el enlace y define una contraseña nueva.
- **Reglas:** sería el **único email que manda la app**. El SMTP gratuito de Supabase manda muy pocos mensajes por hora: alcanza para la entrega académica, pero con usuarios reales hace falta un servicio aparte (por ejemplo, Resend).
- **Estado:** **Pendiente, a propósito** (decisión del 27/09/2026: primero producto, después infraestructura de auth). Todavía no hay pantalla, link ni acción.
- **Sin decidir:** qué se muestra si el email no tiene cuenta (decirlo permite averiguar quién está registrado) y si, al definir la contraseña nueva, la persona queda con la sesión abierta o debe iniciar sesión. Hay que decidirlo antes de implementar y agregar la regla a [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md).

## UC-A05 · Editar perfil

- **Actor:** Usuario.
- **Requerimientos:** RF-A11 a RF-A18. **Pantalla:** [P3 · Mi perfil](03-pantallas.md#p3--mi-perfil) (`/perfil`). **Diagrama:** [S05](04-diagramas-secuencia/uc-a05-editar-perfil.md).
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. Abre «Mi perfil» desde el menú de usuario.
  2. La pantalla carga los valores actuales y las **Zonas** del desplegable (lista cerrada, agrupada por corredor, con la opción «Sin zona»).
  3. Edita **nombre**, **foto**, **Zona** y **WhatsApp**, y pulsa «Guardar».
  4. El sistema valida el nombre, el WhatsApp y la foto.
  5. El sistema guarda nombre, Zona y foto, y después el WhatsApp. **Normaliza el WhatsApp a solo dígitos** en formato argentino de celular (`549` + 10 dígitos, lo que pide `wa.me`): la persona lo escribe como «11 2345 6789», sin `+54 9`.
  6. Se muestra «Perfil guardado.»; si llegó con un destino (`next`), vuelve a él.
- **Flujos alternativos:**
  - **A1. Foto nueva:** reemplaza a la anterior; no hay galería. La anterior se retira **después** de guardar la nueva. Si el guardado falla, se conserva la anterior y se retira la subida nueva.
  - **A2. WhatsApp vacío siendo Capitán:** la regla vigente dice que el Capitán de un equipo no disuelto no puede dejarlo vacío (sí cambiarlo), porque el rival lo necesita para coordinar. **Hoy no se hace cumplir:** ni la acción ni la base lo comprueban (ver «Estado»).
  - **A3. Rol:** el rol de administrador no aparece en el formulario y no se puede editar desde la app.
  - **A4. Nombre inválido:** «El nombre tiene que tener entre 2 y 50 caracteres». No se guarda nada.
  - **A5. WhatsApp inválido:** «El WhatsApp tiene que ser el código de área sin 0 y el número sin 15 (10 dígitos)». No se guarda nada. Vacío es válido (el WhatsApp es opcional).
  - **A6. Foto inválida:** «La foto tiene que ser JPG, PNG o WebP.» o «La foto no puede pesar más de 2 MB.». No se guarda nada.
  - **A7. Dos pestañas reemplazan la foto a la vez:** la segunda retira su subida y muestra «No se pudo guardar el perfil. Recargá la página y probá de nuevo.».
  - **A8. Falla el guardado del WhatsApp:** «No se pudo guardar el WhatsApp». El nombre, la Zona y la foto **ya quedaron guardados**: no hay una transacción que abarque las dos tablas.
  - **A9. Falla al retirar la foto anterior:** el perfil **ya se guardó**; se avisa «El perfil se guardó, pero no se pudo retirar la foto anterior.».
  - **A10. Llegó desde otra acción** (por ejemplo, Crear equipo sin WhatsApp): la pantalla dice «Para seguir, cargá tu WhatsApp.» y, al guardar, vuelve al destino.
- **Postcondición:** perfil actualizado; el nombre y la foto se ven en la página del organizador y en los partidos.
- **Estado:** **Parcial.** Todo está implementado (`src/app/perfil`) **salvo A2**: la regla del Capitán con WhatsApp vacío no se verifica en ningún lado. `casos-de-uso.md` marca el caso como «Implementado» sin esa salvedad.

## UC-A06 · Ver avisos (campanita)

- **Actor:** Usuario.
- **Requerimientos:** RF-A19 a RF-A24, RF-A25. **Pantalla:** [P5 · Campanita](03-pantallas.md#p5--campanita-de-avisos). **Diagrama:** [S06](04-diagramas-secuencia/uc-a06-ver-avisos.md).
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. En cualquier pantalla, la barra muestra la campanita con el **número rojo** de Avisos no leídos.
  2. Abre la campanita: se listan los **últimos 30**, cada uno con texto, link y fecha. Los no leídos se resaltan.
  3. Abrirla **marca como leídos** los que se ven.
  4. Toca un Aviso y va a donde está el estado actual (Partidos, el Equipo).
- **Flujos alternativos:**
  - **A1. Sin Avisos:** «Todavía no tenés avisos.»
  - **A2. Falla el marcado como leídos:** los Avisos siguen como no leídos y se marcan la próxima vez que se abra la campanita. No se muestra ningún error.
  - **A3. Llega un Aviso con la campanita abierta:** sigue contando como no leído, porque solo se marcaron los ids que se estaban mostrando.
  - **A4. Hay más de 30 no leídos:** el número cuenta todos; la lista muestra los últimos 30. Con más de 99, el número dice «99+».
  - **A5. Cerrar:** un clic fuera de la campanita o la tecla Escape la cierran.
- **Reglas:**
  - El Aviso **no tiene botones**: toda acción se hace en la pantalla de destino, que valida las reglas. El Aviso es un puntero, no la fuente de verdad.
  - El texto se arma en el momento del hecho y **no cambia** aunque el rival cambie de nombre.
  - No se borran ni se archivan. No existe email ni push.
  - Todo Aviso que abre un plazo dice cuándo vence y qué pasa si no se responde.
  - Cada persona lee solo los suyos; los escribe el sistema al ocurrir una acción de otro caso de uso, nunca la pantalla ni el cliente.
- **Estado:** Implementado (`NoticeBell`, `src/app/avisos`, función `mark_notices_read`). La lista cerrada de disparadores está en [casos-de-uso.md](../casos-de-uso/casos-de-uso.md#avisos-lista-cerrada-de-disparadores).
