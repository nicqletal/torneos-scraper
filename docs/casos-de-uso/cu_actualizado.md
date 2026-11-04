# Casos de uso actualizados - Torneos Amateur BA

Versión: 04/11/2026. Referencia de código y documentación: main, commit 7c8cb08.

## Alcance y lectura

Documento consolidado de los casos de uso vigentes y de su estado real en el repositorio. Incluye Cuenta y acceso, Catálogo de torneos, Equipos, Partidos, Organizador y Administración. El PDF original queda como antecedente histórico. Los casos pendientes describen alcance previsto, no funciones disponibles.

La app centraliza torneos amateur de Buenos Aires y permite formar Equipos y coordinar Partidos. La inscripción y el pago se acuerdan fuera de la app; después el Organizador registra la Inscripción. El Organizador y el Administrador son roles distintos. Una persona puede ser Jugador, Capitán y Organizador con una misma cuenta.

Implementado significa que hay un flujo en el código de main; no certifica el despliegue ni las migraciones aplicadas a la base compartida. Parcial identifica las reglas o pasos faltantes. Pendiente indica alcance aún no programado. Por definir identifica una decisión abierta y no agrega funciones aprobadas.

Se conserva la numeración vigente. Las acciones separadas reciben identificadores nuevos al final de su módulo; no reemplazan los números de otras funciones. Un caso tiene un actor iniciador y una meta concreta. La respuesta posterior de otro Capitán se especifica por separado. Un caso de consulta también puede expresar una meta del Usuario.

## Actores

- Invitado: persona sin sesión; consulta información pública.
- Usuario: persona con sesión; gestiona su cuenta y participa de los flujos autorizados.
- Jugador: Usuario que integra el Plantel de un Equipo; consulta sus Partidos y puede salir si no es Capitán.
- Capitán: único integrante que gestiona el Equipo y opera en su nombre en Partidos.
- Organizador: Usuario que publica y gestiona sus propios torneos e Inscripciones.
- Administrador: rol asignado en la base; accede al panel y a las funciones de moderación previstas.

La propia aplicación no es un actor externo de sus casos. Los estados calculados, los vencimientos, las validaciones y el registro automático de acciones se describen como reglas transversales.

## Carga de formularios

Antes de que el Usuario elija valores, el formulario carga sus opciones. Las Zonas provienen de la base mediante la responsabilidad conceptual ZonaRepository. Modalidad y nivel son listas fijas, representadas por OpcionesEquipo u otro proveedor de opciones equivalente. No se necesita un repositorio distinto por cada desplegable. El envío contiene los valores elegidos; se vuelven a validar al guardar. Editar requiere además recuperar los datos actuales.

## Catálogo de casos

| ID | Caso | Estado | Origen PDF |
|---|---|---|---|
| UC-A01 | Crear cuenta | Implementado (`src/app/login`, función `signup`, trigger `handle_new_user`) | UC-01 |
| UC-A02 | Iniciar sesión | Implementado (`src/app/login`, función `login`; `src/proxy | UC-02 |
| UC-A03 | Cerrar sesión | Implementado (función `logout`, `signOut({ scope: 'local' })`) | UC-03 |
| UC-A04 | Recuperar contraseña | **Pendiente, a propósito** (decisión del 27/09/2026: primero producto, después infraestructura de auth) | UC-04 |
| UC-A05 | Editar perfil | **Parcial | UC-07 |
| UC-A06 | Ver avisos (campanita) | Implementado (`NoticeBell`, `src/app/avisos`, función `mark_notices_read`) | Incorporación o desglose vigente |
| UC-B01 | Ver el catálogo de torneos | **Parcial** (`src/app/page | UC-08 |
| UC-B02 | Filtrar torneos | Parcial: modalidad y estado disponibles; faltan los demás filtros y la validación de valores de URL | UC-09 |
| UC-B03 | Ver la ficha pública de un torneo | **Parcial** (`src/app/torneos/[id]`): funciona, pero con las salvedades A1, A2 y A4 | UC-11 |
| UC-B04 | Contactar al organizador | Implementado | UC-12 |
| UC-B05 | Ver la página pública del organizador | Implementado (`src/app/organizadores/[id]`) | SPEC-E04 |
| UC-B06 | Reportar un torneo | **Pendiente | Incorporación o desglose vigente |
| UC-B07 | Compartir una búsqueda filtrada | Implementado para modalidad y estado; limitado por UC-B02 | UC-10 |
| UC-C01 | Crear equipo | Parcial: la operación está implementada, pero todavía no se comprueban las restricciones por Suspensión | UC-25 |
| UC-C02 | Generar un enlace de invitación | Implementado | UC-27 |
| UC-C03 | Unirse a un equipo con el link | Implementado (`src/app/unirse/[token]`, función `join_team`) | UC-28 |
| UC-C04 | Ver la página pública del equipo | Implementado (`src/app/equipos/[id]`, vistas `team_record` y `team_match_history`) | UC-29; UC-30 solo en la parte pública |
| UC-C05 | Editar equipo | Implementado (`updateTeam`, `saveTeam`) | Incorporación o desglose vigente |
| UC-C06 | Pasar la capitanía | Parcial: la operación está implementada, pero todavía no se comprueban las restricciones por Suspensión | UC-26 |
| UC-C07 | Sacar a un jugador del plantel | Implementado (`removeMember`, función `remove_team_member`) | Incorporación o desglose vigente |
| UC-C08 | Salir del equipo | Implementado (`leaveTeam`, función `leave_team`) | Incorporación o desglose vigente |
| UC-C09 | Disolver equipo | Implementado (`dissolveTeam`, función `dissolve_team`) | Incorporación o desglose vigente |
| UC-C10 | Reportar un equipo | **Pendiente | Incorporación o desglose vigente |
| UC-C11 | Regenerar el enlace de invitación | Implementado | UC-27 (regeneración) |
| UC-C12 | Consultar mis equipos | Implementado | Incorporación o desglose vigente |
| UC-D01 | Publicar una búsqueda de rival | **Parcial** (`save_rival_search`): todo salvo la verificación de la Suspensión | UC-13 |
| UC-D02 | Editar una búsqueda de rival | Implementado | Incorporación o desglose vigente |
| UC-D03 | Ver rivales compatibles | Implementado (`compatible_rivals`) | UC-14 |
| UC-D04 | Proponer un partido | Implementado (`send_proposal`) | UC-15 |
| UC-D05 | Cancelar una propuesta enviada | Implementado (la misma función `respond_proposal` que rechazar; el sistema distingue por quién la llama) | UC-17 |
| UC-D06 | Aceptar una propuesta de partido | Implementado | UC-16 (aceptar) |
| UC-D07 | Cargar cancha y hora del Partido | Implementado | UC-18 (cargar) |
| UC-D08 | Confirmar asistencia | Implementado (`confirm_going`) | UC-19 |
| UC-D09 | Tirar el partido | Implementado (`drop_match`) | UC-20 |
| UC-D10 | Solicitar una caída de común acuerdo | Implementado | Incorporación o desglose vigente |
| UC-D11 | Cargar el resultado del Partido | Implementado | UC-21 (cargar) |
| UC-D12 | Reportar que el rival no se presentó | Implementado | UC-23 |
| UC-D13 | Calificar al rival | Implementado (`rate_rival`) | UC-22 |
| UC-D14 | Ver mis partidos | Implementado | Incorporación o desglose vigente |
| UC-D15 | Cancelar una búsqueda de rival | Implementado | Incorporación o desglose vigente |
| UC-D16 | Rechazar una propuesta de partido | Implementado | UC-16 (rechazar) |
| UC-D17 | Confirmar cancha y hora del Partido | Implementado | UC-18 (confirmar) |
| UC-D18 | Corregir cancha y hora del Partido | Implementado | UC-18 (corregir) |
| UC-D19 | Aceptar una caída de común acuerdo | Implementado | Incorporación o desglose vigente |
| UC-D20 | Rechazar una caída de común acuerdo | Implementado | Incorporación o desglose vigente |
| UC-D21 | Confirmar el resultado del Partido | Implementado | UC-21 (confirmar) |
| UC-D22 | Corregir el resultado del Partido | Implementado | UC-21 (corregir) |
| UC-D23 | Responder que el Equipo sí se presentó | Implementado | UC-24 (flujo reformulado) |
| UC-E01 | Publicar un torneo | **Parcial** (`src/app/crear-torneo`): todo, salvo la verificación de la Suspensión | SPEC-E01 (publicar) |
| UC-E02 | Ver mis torneos (Panel de organizador) | Implementado (`src/app/mis-torneos`) | SPEC-E02 (consultar) |
| UC-E03 | Editar un torneo | Implementado (`src/app/mis-torneos/[id]/editar`) | SPEC-E01 (editar) |
| UC-E04 | Verificar que el torneo sigue vigente | Implementado (`verifyTournament`, función `verify_tournament`) | SPEC-E02 (verificar) |
| UC-E05 | Dar de baja un torneo | Implementado (`withdrawTournament`, función `withdraw_tournament`) | SPEC-E02 (baja) |
| UC-E06 | Cargar una inscripción | Implementado (`addInscription`, `addLinkedInscription`, `TeamSearch`) | SPEC-E03 (flujo reemplazado) |
| UC-E07 | Dar de baja una inscripción | Implementado (`removeInscription`, función `remove_inscription`) | SPEC-E03 (baja) |
| UC-F01 | Acceder al Panel de administración | Implementado (`src/app/admin/login`, `src/utils/admin | CU-F01 (solo acceso) |
| UC-F02 | Consultar el tablero | **Parcial | CU-F02 |
| UC-F03 | Resolver un reporte de torneo | **Pendiente | CU-F03; CU-F06 como registro automático |
| UC-F04 | Resolver un reporte de equipo | **Pendiente | Incorporación o desglose vigente |
| UC-F05 | Suspender una cuenta | Pendiente: no existe la gestión de suspensiones ni su comprobación al transferir la capitanía | CU-F05 |
| UC-F06 | Buscar usuarios | **Pendiente | Incorporación o desglose vigente |
| UC-F07 | Retirar la marca Observado de un torneo | Pendiente: la marca y su gestión todavía no existen | Incorporación o desglose vigente |

## Módulo A - Cuenta y acceso

### UC-A01 - Crear cuenta

- **Origen PDF:** UC-01
- **Objetivo:** Crear cuenta.
- **Actor:** Invitado.
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

### UC-A02 - Iniciar sesión

- **Origen PDF:** UC-02
- **Objetivo:** Iniciar sesión.
- **Actor:** Invitado.
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

### UC-A03 - Cerrar sesión

- **Origen PDF:** UC-03
- **Objetivo:** Cerrar sesión.
- **Actor:** Usuario.
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. Elige «Cerrar sesión» en el menú de usuario.
  2. El sistema cierra **solo la sesión del dispositivo actual**.
  3. Lo lleva al catálogo.
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Regla:** sin el alcance «local», Supabase revocaría las sesiones de la cuenta en **todos** los dispositivos. Por eso se pide explícitamente el cierre local.
- **Postcondición:** el dispositivo queda sin sesión; las demás sesiones de la cuenta siguen abiertas.
- **Estado:** Implementado (función `logout`, `signOut({ scope: 'local' })`).

### UC-A04 - Recuperar contraseña

- **Origen PDF:** UC-04
- **Objetivo:** Recuperar contraseña.
- **Actor:** Invitado.
- **Precondiciones:** tiene una cuenta.
- **Flujo principal:**
  1. Pide el enlace de recuperación por email («Olvidé mi contraseña»).
  2. El sistema le manda el enlace por email.
  3. Abre el enlace y define una contraseña nueva.
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Reglas:** sería el **único email que manda la app**. El SMTP gratuito de Supabase manda muy pocos mensajes por hora: alcanza para la entrega académica, pero con usuarios reales hace falta un servicio aparte (por ejemplo, Resend).
- **Sin decidir:** qué se muestra si el email no tiene cuenta (decirlo permite averiguar quién está registrado) y si, al definir la contraseña nueva, la persona queda con la sesión abierta o debe iniciar sesión. Hay que decidirlo antes de implementar y agregar la regla a [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md).
- **Postcondición:** En caso de éxito, la contraseña queda actualizada; el comportamiento de sesión debe definirse antes de implementar.
- **Estado:** **Pendiente, a propósito** (decisión del 27/09/2026: primero producto, después infraestructura de auth). Todavía no hay pantalla, link ni acción.

### UC-A05 - Editar perfil

- **Origen PDF:** UC-07
- **Objetivo:** Editar perfil.
- **Actor:** Usuario.
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

### UC-A06 - Ver avisos (campanita)

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Ver avisos (campanita).
- **Actor:** Usuario.
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
- **Postcondición:** Avisos consultados; los mostrados se marcan leídos si la operación tuvo éxito.
- **Estado:** Implementado (`NoticeBell`, `src/app/avisos`, función `mark_notices_read`). La lista cerrada de disparadores está en [casos-de-uso.md](../casos-de-uso/casos-de-uso.md#avisos-lista-cerrada-de-disparadores).

## Módulo B - Catálogo de torneos

### UC-B01 - Ver el catálogo de torneos

- **Origen PDF:** UC-08
- **Objetivo:** Ver el catálogo de torneos.
- **Actor:** Invitado (y cualquier usuario).
- **Precondiciones:** ninguna. `/` es el catálogo para cualquiera.
- **Flujo principal:**
  1. Entra a la portada.
  2. El sistema lista los torneos **no finalizados**, ordenados por **fecha de inicio**.
  3. Cada tarjeta muestra el **flyer** (o un marcador con el nombre), el nombre, la Zona con su corredor, la modalidad, el precio, el **Estado del torneo** y la **antigüedad de verificación**.
  4. Toca una tarjeta y se abre la ficha (UC-B03).
- **Flujos alternativos:**
  - **A1. Precio:** vacío se muestra como «Consultar»; 0, como «Gratis».
  - **A2. Antigüedad de verificación:** desde 30 días completos sin verificar, en ámbar; desde 60, en rojo con «Sin confirmar».
  - **A3. Últimos cupos:** etiqueta sobre un torneo **Abierto** con 2 lugares o menos. No es un Estado.
  - **A4. Finalizados:** Diferencia vigente: `casos-de-uso.md` dice que solo aparecen si se filtra explícitamente por ese Estado. **En el código nunca aparecen**: la consulta los excluye siempre y el filtro no ofrece «Finalizado». Coincide con la regla transversal («el Finalizado sale del catálogo»).
  - **A5. Sin torneos:** «No hay torneos registrados».
  - **A6. Falla la consulta:** «Hubo un error al cargar los torneos deportivos.» El panel de filtros sigue visible.
  - **A7. Paginación:** Diferencia vigente: `casos-de-uso.md` dice «paginados». **Hoy no hay paginación**: se traen todos los torneos de una vez.
- **Postcondición:** la persona ve los torneos vigentes y puede abrir uno.
- **Estado:** **Parcial** (`src/app/page.tsx`, `TournamentList`, `TournamentCard`): todo salvo la paginación.

### UC-B02 - Filtrar torneos

- **Origen PDF:** UC-09
- **Objetivo:** Filtrar torneos.
- **Actor:** Invitado o Usuario
- **Precondiciones:** Está en el catálogo.
- **Flujo principal:**
  1. La pantalla presenta las modalidades y los estados disponibles; esas opciones son listas fijas de la app.
  2. El actor selecciona modalidad y/o estado.
  3. El sistema conserva los filtros en la URL y consulta los torneos que cumplen ambos criterios.
  4. Muestra el listado y las opciones seleccionadas.
- **Flujos alternativos:**
  - **A1.** Sin resultados: se informa y se pueden quitar los filtros seleccionando Todas/Todos.
  - **A2.** Zona o Corredor, precio máximo y fechas: requeridos en el alcance, todavía sin implementar.
  - **A3.** Una clave desconocida se ignora; un valor inválido de modality o status todavía no se valida antes de consultar.
  - **A4.** Finalizados: el código los excluye siempre; no ofrece ese filtro. La documentación previa que promete incluirlos mediante un filtro necesita una decisión de alcance.
- **Postcondición:** Listado filtrado y URL que conserva la selección.
- **Estado:** Parcial: modalidad y estado disponibles; faltan los demás filtros y la validación de valores de URL.

### UC-B03 - Ver la ficha pública de un torneo

- **Origen PDF:** UC-11
- **Objetivo:** Ver la ficha pública de un torneo.
- **Actor:** Invitado.
- **Precondiciones:** el torneo existe y no fue dado de baja.
- **Flujo principal:**
  1. Elige un torneo del catálogo (o abre un link compartido).
  2. El sistema muestra flyer, nombre, **organizador** (con link a su página), modalidad, Zona, **dirección de la sede** (abre el mapa), cierre de inscripción, inicio y fin, precio, Estado, descripción, reglamento, antigüedad de verificación, cupo e inscriptos, y los **nombres** de los equipos anotados.
  3. Debajo del precio y las fechas aparecen los botones de contacto (UC-B04).
- **Flujos alternativos:**
  - **A1. Torneo dado de baja o inexistente:** la ficha devuelve 404. Diferencia vigente: `casos-de-uso.md` dice «con un link al catálogo»; hoy es la página 404 genérica de Next («This page could not be found.»), en inglés y **sin link**.
  - **A2. Torneo finalizado:** se muestra la ficha. Diferencia vigente: `casos-de-uso.md` dice que **sin botones de contacto** («Este torneo ya terminó»); **hoy los botones se muestran** igual que en cualquier ficha.
  - **A3. Es el organizador:** la ficha es idéntica a la de cualquiera, más una barra arriba «Este torneo es tuyo · Gestionar».
  - **A4. Compartir:** la URL es estable. Diferencia vigente: `casos-de-uso.md` dice que la página tiene metadatos (flyer, nombre, Zona) para la vista previa en WhatsApp; **no hay metadatos propios** de la ficha.
  - **A5. Inscriptos:** solo los **nombres**; los de una Inscripción vinculada son un link a la página del equipo. Sin inscriptos, la sección no aparece.
  - **A6. Sin flyer:** la ficha usa una sola columna, sin placeholder. Un `image_url` que no es del bucket propio cuenta como «sin flyer».
  - **A7. Cupo:** con cupo, «3/8 equipos»; sin cupo, cuántos hay anotados.
- **Postcondición:** la persona conoce las condiciones del torneo y puede contactar al organizador.
- **Estado:** **Parcial** (`src/app/torneos/[id]`): funciona, pero con las salvedades A1, A2 y A4.

### UC-B04 - Contactar al organizador

- **Origen PDF:** UC-12
- **Objetivo:** Contactar al organizador.
- **Actor:** Invitado.
- **Precondiciones:** el torneo tiene al menos un medio de contacto.
- **Flujo principal (WhatsApp):**
  1. Toca «Contactar por WhatsApp».
  2. El sistema abre `wa.me` con el número del organizador y un **mensaje sugerido** (hoy: «Hola, vengo de Torneos Scraper. Me interesa el torneo "[nombre]"!»).
  3. La persona edita el mensaje si quiere y lo envía desde WhatsApp. **Acá termina el flujo en la app:** la inscripción se arregla afuera y la carga el organizador (UC-E06).
- **Flujo principal (Instagram):** toca «Ver Instagram» y el sistema abre el perfil del organizador en una pestaña nueva.
- **Flujos alternativos:**
  - **A1. Falta un medio:** ese botón no se muestra.
  - **A2. No hay ninguno:** «El organizador no suministró datos de contacto directo». Solo puede pasar con torneos viejos: al publicar es obligatorio al menos un contacto.
  - **A3. Texto del mensaje:** Diferencia vigente: `casos-de-uso.md` documenta otro texto («Hola, vi el torneo [nombre] en Torneos BA y quiero anotar a mi equipo»). El código usa el de arriba.
- **Postcondición:** la persona está en WhatsApp o Instagram, fuera de la app.
- **Estado:** Implementado.

### UC-B05 - Ver la página pública del organizador

- **Origen PDF:** SPEC-E04
- **Objetivo:** Ver la página pública del organizador.
- **Actor:** Invitado.
- **Precondiciones:** el organizador existe.
- **Flujo principal:**
  1. Desde una ficha, toca el nombre del organizador.
  2. El sistema muestra su **nombre**, **foto** (o su inicial), **Zona** y «Organiza desde [mes y año]».
  3. Debajo, sus **torneos vigentes** (del que empieza antes al que empieza después) y su **trayectoria**: los finalizados, del más reciente al más viejo.
- **Flujos alternativos:**
  - **A1. No existe** (o el id no es un uuid): 404.
  - **A2. Sin torneos:** «Todavía no publicó torneos».
  - **A3. Falla la consulta de torneos:** «No pudimos cargar sus torneos. Probá de nuevo.»
- **Reglas:** no se muestra ningún contacto personal del organizador; el contacto es siempre el de cada torneo.
- **Postcondición:** la persona ve la trayectoria del organizador.
- **Estado:** Implementado (`src/app/organizadores/[id]`).

### UC-B06 - Reportar un torneo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Reportar un torneo.
- **Actor:** Usuario.
- **Precondiciones:** sesión; no reportó antes ese torneo.
- **Flujo principal:**
  1. En la ficha toca «Reportar».
  2. Elige un motivo: «Ya no existe», «Datos incorrectos» o «No es un torneo».
  3. El sistema guarda el **Reporte** para el administrador (UC-F03).
- **Flujos alternativos:** **A1.** Una sola vez por usuario y torneo; el segundo intento se rechaza.
- **Postcondición:** el reporte queda pendiente en el panel de administración. Cada usuario ve solo los suyos.
- **Estado:** **Pendiente.** No hay tabla, función ni botón.

### UC-B07 - Compartir una búsqueda filtrada

- **Origen PDF:** UC-10
- **Objetivo:** Compartir una búsqueda filtrada.
- **Actor:** Invitado o Usuario
- **Precondiciones:** Dispone de una URL del catálogo con filtros aplicados.
- **Flujo principal:**
  1. Copia la URL del catálogo y la comparte por un medio externo.
  2. Otra persona abre la URL.
  3. El sistema interpreta los filtros soportados y consulta el listado correspondiente.
- **Flujos alternativos:**
  - **A1.** Si cambiaron los torneos desde que se compartió, el listado refleja los datos actuales.
  - **A2.** Los filtros todavía no implementados no se reproducen; los valores inválidos mantienen la limitación de UC-B02.
- **Postcondición:** Se reproduce el criterio de búsqueda soportado; no se guarda una copia histórica del listado.
- **Estado:** Implementado para modalidad y estado; limitado por UC-B02.

## Módulo C - Equipos

### UC-C01 - Crear equipo

- **Origen PDF:** UC-25
- **Objetivo:** Crear equipo.
- **Actor:** Usuario.
- **Precondiciones:** sesión; **WhatsApp cargado en el perfil**; menos de 3 equipos como Capitán (los disueltos no cuentan); sin **Suspensión** (regla vigente, hoy la base no la verifica).
- **Flujo principal:**
  1. El Usuario abre «Mis equipos» y elige «Crear equipo».
  2. La pantalla carga las opciones de los tres desplegables: las **Zonas** (de la base, agrupadas por corredor), las **modalidades** y los **niveles** (listas fijas de la app).
  3. El Usuario completa el **nombre**, elige **Zona**, **modalidad habitual** y **nivel**, y opcionalmente adjunta un **escudo**. Confirma con «Crear equipo».
  4. El sistema valida los datos y el escudo.
  5. El sistema crea el Equipo y al Usuario como **Capitán** y único integrante del **Plantel**, en una sola transacción.
  6. Si había escudo, el sistema lo guarda.
  7. Se abre la página del Equipo.
- **Flujos alternativos:**
  - **A1. Sin sesión:** se redirige a `/login?next=/crear-equipo` y, al iniciar sesión, vuelve al formulario.
  - **A2. Sin WhatsApp:** el formulario se ve **deshabilitado** con el aviso «Para crear un equipo necesitás tener tu WhatsApp en el perfil…» y el botón «Cargar mi WhatsApp», que lleva al perfil y devuelve acá. Si igual se intentara enviar, la base lo rechaza.
  - **A3. Ya capitanea 3 equipos:** en lugar del formulario se muestra «Ya sos capitán de 3 equipos, que es el máximo. Para crear otro, pasá la capitanía de alguno o disolvelo».
  - **A4. Datos inválidos:** vuelve al formulario con el error y no se crea nada. Mensajes: «El nombre tiene que tener entre 2 y 50 caracteres», «Elegí la zona del equipo», «Elegí una modalidad válida», «Elegí un nivel válido».
  - **A5. Escudo inválido:** «El escudo tiene que ser JPG, PNG o WebP» o «El escudo no puede pesar más de 2 MB». No se crea nada.
  - **A6. Nombre repetido:** se permite; públicamente se distingue por la Zona.
  - **A7. Falla el guardado del escudo después del alta:** el Equipo **ya está creado**; se abre «Editar equipo» con el mensaje «El equipo se creó. …» para reintentar el escudo.
  - **A8. La Zona ya no existe al guardar:** la base rechaza el alta (clave foránea) aunque la opción se haya mostrado en el desplegable.
- **Postcondición:** Equipo activo, con el creador como único integrante y Capitán.
- **Estado:** Parcial: la operación está implementada, pero todavía no se comprueban las restricciones por Suspensión.

### UC-C02 - Generar un enlace de invitación

- **Origen PDF:** UC-27
- **Objetivo:** Generar un enlace de invitación.
- **Actor:** Capitán
- **Precondiciones:** Sesión y capitanía del Equipo activo; no dispone de un enlace vigente.
- **Flujo principal:**
  1. Abre la ficha del Equipo y la sección Invitar jugadores.
  2. Pulsa Generar link.
  3. El sistema comprueba permisos, genera un token y un enlace válido durante siete días.
  4. Muestra el enlace y su vencimiento; el Capitán lo copia y lo comparte por fuera.
- **Flujos alternativos:**
  - **A1.** Sin capitanía o Equipo disuelto: se rechaza.
  - **A2.** Si ya existe un enlace vigente y desea reemplazarlo, utiliza UC-C11.
  - **A3.** Copiar el enlace no cambia su vencimiento ni incorpora jugadores.
- **Postcondición:** Un único enlace vigente permite invitar al Plantel.
- **Estado:** Implementado.

### UC-C03 - Unirse a un equipo con el link

- **Origen PDF:** UC-28
- **Objetivo:** Unirse a un equipo con el link.
- **Actor:** Usuario.
- **Precondiciones:** tiene un link vigente.
- **Flujo principal:**
  1. Abre `/unirse/{token}`.
  2. La pantalla muestra «Te invitaron a un equipo» y el botón «Unirme al equipo». **Abrir el link no suma a nadie.**
  3. Pulsa «Unirme al equipo».
  4. El sistema valida el link (que exista, no haya vencido y su Equipo no esté disuelto) y lo suma al Plantel, sin aprobación del Capitán.
  5. Se abre la página del Equipo.
- **Flujos alternativos:**
  - **A1. Sin sesión:** se redirige al login conservando `/unirse/{token}` como destino (UC-A01 o UC-A02) y vuelve a la pantalla de invitación.
  - **A2. Link inexistente, vencido, regenerado o de un Equipo disuelto:** el mismo mensaje en todos los casos, «El link de invitación no es válido o venció». No se revela cuál fue el motivo.
  - **A3. Ya integra el Plantel:** sin error; lo lleva a la página del Equipo.
  - **A4. Usuario suspendido:** puede sumarse. La prohibición de recibir la capitanía es una regla vigente todavía pendiente de implementar con UC-F05.
- **Postcondición:** el Jugador ve el Plantel y los partidos del Equipo, sin poder operar.
- **Estado:** Implementado (`src/app/unirse/[token]`, función `join_team`).

### UC-C04 - Ver la página pública del equipo

- **Origen PDF:** UC-29; UC-30 solo en la parte pública
- **Objetivo:** Ver la página pública del equipo.
- **Actor:** Invitado (también cualquier Usuario).
- **Precondiciones:** el Equipo existe. No hace falta sesión.
- **Flujo principal:**
  1. Abre `/equipos/{id}` (por ejemplo, desde el nombre de un rival o desde «Mis equipos»).
  2. El sistema muestra **escudo, nombre, Zona (con su corredor), modalidad, nivel y cantidad de jugadores**.
  3. Muestra la sección **Partidos**: el contador («Jugó 12 · 1 falta · 2 conflictos (con 2 rivales distintos)»), las estrellas («★ 4,3 (12)» o «Sin calificaciones») y los **últimos 5 partidos cerrados**.
  4. Muestra la sección **Torneos** con los torneos donde el Equipo tiene una **Inscripción vinculada**, con su estado.
- **Flujos alternativos:**
  - **A1. Es integrante del Plantel:** además ve los **nombres del Plantel**. Si es Capitán de un Equipo activo, ve también las acciones de gestión: «Editar equipo» (UC-C05), «Hacer capitán» y «Sacar» (UC-C06, UC-C07), «Invitar jugadores» (UC-C02) y «Disolver equipo» (UC-C09). Un Jugador que no es Capitán ve «Salir del equipo» (UC-C08).
  - **A2. Equipo disuelto:** la página sigue, marcada **«Equipo disuelto»**, con su historia; no muestra acciones de gestión.
  - **A3. El Equipo no existe:** se muestra la página de «no encontrado» (404).
  - **A4. Sin partidos o sin torneos:** «Todavía no tiene partidos cerrados» / «Todavía no está anotado en ningún torneo».
- **Reglas del historial:**
  - «Jugó» suma solo partidos **Jugados**, con o sin resultado. Las faltas se muestran aunque sean 0; los conflictos, solo si hay.
  - Cada fila muestra fecha, «vs» el rival con su zona y un link a su página, y el desenlace («Ganó 3–1», «Perdió 0–2», «Empató 1–1», «Jugado, sin resultado», «Se cayó…», «En conflicto…», «X no se presentó…»).
  - Los equipos se nombran siempre por su nombre y zona **actuales**.
  - El promedio de estrellas cuenta solo calificaciones **reveladas**. Nunca se muestran cancha ni hora.
- **Privacidad:** el Plantel y los contactos no son públicos; el WhatsApp no aparece nunca en esta página.
- **Postcondición:** Datos públicos consultados; el Plantel solo se revela a sus integrantes.
- **Estado:** Implementado (`src/app/equipos/[id]`, vistas `team_record` y `team_match_history`).

### UC-C05 - Editar equipo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Editar equipo.
- **Actor:** Capitán.
- **Precondiciones:** Equipo no disuelto; el actor es su Capitán.
- **Flujo principal:**
  1. Desde «Editar equipo» (en «Mis equipos» o en la página del Equipo), el Capitán abre el formulario.
  2. La pantalla carga las opciones de los tres desplegables (Zonas, modalidades, niveles) y los **valores actuales** del Equipo.
  3. Cambia nombre, Zona, modalidad, nivel o escudo, y pulsa «Guardar cambios».
  4. El sistema comprueba que sigue siendo el Capitán, valida los datos y el escudo y guarda los cambios.
  5. Se abre la página del Equipo con «Los cambios del equipo se guardaron».
- **Flujos alternativos:**
  - **A1. No es Capitán o el Equipo está disuelto:** no se muestra el formulario; se vuelve a la página del Equipo. Si dejó de ser Capitán mientras editaba, «Solo el capitán puede editar el equipo».
  - **A2. Escudo:** dejar vacío el archivo **conserva** el actual; se puede **reemplazar** o **quitar** («Quitar el escudo actual»). Elegir reemplazarlo y quitarlo a la vez se rechaza («Elegí reemplazar el escudo o quitarlo, no ambas cosas»).
  - **A3. Datos o escudo inválidos:** vuelve al formulario con el error; no se guarda nada y el escudo anterior se conserva.
  - **A4. Falla al retirar el escudo anterior:** la edición **ya se guardó**; se avisa «El equipo se guardó, pero no se pudo retirar el escudo anterior».
  - **A5. Cambio concurrente** (otro capitán, disolución o escudo reemplazado desde otra pestaña): «No se pudo guardar el equipo. Recargá la página y probá de nuevo».
  - **A6. Efecto del cambio de Zona o nivel:** cambia en el acto la cercanía y el nivel con que el Equipo aparece entre los rivales compatibles; la búsqueda no los guarda.
- **Postcondición:** ficha actualizada.
- **Estado:** Implementado (`updateTeam`, `saveTeam`).

### UC-C06 - Pasar la capitanía

- **Origen PDF:** UC-26
- **Objetivo:** Pasar la capitanía.
- **Actor:** Capitán.
- **Precondiciones:** Equipo no disuelto; el destinatario está en el Plantel, tiene WhatsApp en el perfil, no está suspendido y capitanea menos de 3 equipos; el Capitán actual no está suspendido.
- **Flujo principal:**
  1. En el Plantel, el Capitán pulsa «Hacer capitán» en la fila de un jugador.
  2. La app pide confirmación: «¿Pasarle la capitanía a {nombre}? Vas a quedar como jugador».
  3. El sistema transfiere la capitanía en una transacción; el anterior queda como Jugador.
- **Flujos alternativos:**
  - **A1. Destinatario no elegible:** se rechaza con el motivo («Ese jugador no está en el equipo», «Ese jugador tiene que cargar su WhatsApp en el perfil para ser capitán», «Ese jugador ya es capitán de 3 equipos, que es el máximo»).
  - **A2. Equipo disuelto o actor sin capitanía:** se rechaza («El equipo está disuelto», «Solo el capitán puede pasar la capitanía»).
- **Reglas:**
  - **Nunca se bloquea por partidos en curso:** las búsquedas, propuestas y partidos son del Equipo. El Capitán nuevo opera todo lo pendiente, incluido un pedido de caída de común acuerdo sin responder. El anterior deja de ver las propuestas y sigue viendo los partidos.
  - El Capitán nuevo **no hereda los Avisos** del anterior: ve lo pendiente en Partidos.
- **Postcondición:** exactamente un Capitán vigente.
- **Estado:** Parcial: la operación está implementada, pero todavía no se comprueban las restricciones por Suspensión.

### UC-C07 - Sacar a un jugador del plantel

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Sacar a un jugador del plantel.
- **Actor:** Capitán.
- **Precondiciones:** Equipo no disuelto; el actor es su Capitán.
- **Flujo principal:**
  1. En el Plantel, el Capitán pulsa «Sacar» en la fila de otro jugador.
  2. La app pide confirmación: «¿Sacar a {nombre} del equipo?».
  3. El sistema retira al jugador del Plantel.
- **Flujos alternativos:**
  - **A1. Sacarse a sí mismo:** se rechaza («El capitán no puede sacarse a sí mismo: pasá la capitanía primero»). La fila del Capitán no tiene el botón.
  - **A2. El jugador ya no está:** «Ese jugador no está en el equipo».
  - **A3. Equipo disuelto o actor sin capitanía:** se rechaza.
- **Reglas:** quien sale deja de ver los partidos del Equipo y **conserva los Avisos** que ya recibió.
- **Postcondición:** Plantel actualizado.
- **Estado:** Implementado (`removeMember`, función `remove_team_member`).

### UC-C08 - Salir del equipo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Salir del equipo.
- **Actor:** Jugador.
- **Precondiciones:** integra el Plantel y no es su Capitán; Equipo no disuelto.
- **Flujo principal:**
  1. En la página del Equipo, el Jugador pulsa «Salir del equipo».
  2. La app pide confirmación: «¿Salir del equipo?».
  3. El sistema retira su pertenencia del Plantel y lo lleva a «Mis equipos».
- **Flujos alternativos:**
  - **A1. Es el Capitán:** no se ofrece el botón; en su lugar, «Para salir, primero pasale la capitanía a otro jugador». Si igual se intentara, se rechaza («Pasá la capitanía antes de salir del equipo»).
  - **A2. Equipo disuelto:** no admite salidas («El equipo está disuelto»).
- **Postcondición:** el Jugador deja de integrar el Equipo; conserva los Avisos que ya recibió.
- **Estado:** Implementado (`leaveTeam`, función `leave_team`).

### UC-C09 - Disolver equipo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Disolver equipo.
- **Actor:** Capitán.
- **Precondiciones:** Equipo no disuelto; el actor es su Capitán; el Equipo **no tiene ningún partido por jugarse ni esperando resultado**.
- **Flujo principal:**
  1. El Capitán lee la advertencia, tilda «Entiendo que no podré reactivar este equipo» y pulsa «Disolver equipo».
  2. La app pide confirmación: «¿Disolver "{nombre}"? La página y la historia se conservan. No se puede deshacer».
  3. El sistema marca al Equipo como **Equipo disuelto**: conserva su página, su Plantel, su escudo y su historia, pero ya no puede operar.
  4. Los links de invitación dejan de valer.
  5. Se cancelan las **búsquedas de rival activas** del Equipo, como si el Capitán las cancelara una por una: caen sus propuestas pendientes (enviadas y recibidas) y el capitán del otro lado recibe el Aviso «Se canceló tu propuesta».
  6. Se muestra la página del Equipo con «El equipo quedó disuelto. Su página y su historia se conservan».
- **Flujos alternativos:**
  - **A1. Sin confirmar la casilla:** «Confirmá que entendés que la disolución es definitiva». No se disuelve.
  - **A2. Partido sin terminar:** «Tenés un partido pendiente: tiralo o cerrá el resultado antes de disolver». Así el rival no queda esperando y un Equipo acusado de no presentarse no se escapa disolviéndose.
  - **A3. Actor sin capitanía o Equipo ya disuelto:** se rechaza («Solo el capitán puede disolver el equipo», «El equipo ya está disuelto»).
  - **A4. Calificaciones:** un partido **Jugado** se sigue pudiendo calificar hasta que venzan los 7 días, aunque uno de los dos Equipos se haya disuelto.
- **Postcondición:** Equipo disuelto, **sin reactivación**. Si vuelven, crean un Equipo nuevo. Deja de contar para el tope de 3 capitanías.
- **Estado:** Implementado (`dissolveTeam`, función `dissolve_team`).

### UC-C10 - Reportar un equipo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Reportar un equipo.
- **Actor:** Usuario (Capitán o Jugador de un Equipo que jugó al menos un partido contra el reportado).
- **Precondiciones:** sesión; **un partido Jugado en común** con el Equipo reportado.
- **Flujo principal:**
  1. En la página del Equipo toca «Reportar». El botón solo aparece con sesión y con un partido jugado en común.
  2. Elige el motivo: «Violencia o agresiones», «Cuenta falsa» o «Abuso de calificaciones».
  3. El sistema guarda el **Reporte** para el administrador (UC-F04).
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Reglas:** la responsabilidad por la conducta del Plantel es del Capitán: la eventual **Suspensión** recae sobre él.
- **Postcondición:** el reporte queda pendiente en el panel de administración.
- **Estado:** **Pendiente.** Todavía no hay tabla, función ni pantalla. Queda por decidir si un Usuario puede reportar más de una vez al mismo Equipo (para los torneos, UC-B06, es una sola vez por Usuario y torneo; para los Equipos no está definido).

### UC-C11 - Regenerar el enlace de invitación

- **Origen PDF:** UC-27 (regeneración)
- **Objetivo:** Regenerar el enlace de invitación.
- **Actor:** Capitán
- **Precondiciones:** Sesión y capitanía del Equipo activo; desea reemplazar el enlace anterior.
- **Flujo principal:**
  1. Pulsa Regenerar en la sección Invitar jugadores.
  2. El sistema comprueba permisos, reemplaza el token y fija un nuevo vencimiento de siete días.
  3. Muestra el nuevo enlace para copiar y compartir.
- **Flujos alternativos:**
  - **A1.** El enlace anterior deja de servir, aunque todavía no haya vencido.
  - **A2.** Equipo disuelto o actor sin capitanía: se rechaza.
- **Postcondición:** Solo el enlace nuevo permite incorporarse al Plantel.
- **Estado:** Implementado.

### UC-C12 - Consultar mis equipos

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Consultar mis equipos.
- **Actor:** Usuario
- **Precondiciones:** Sesión activa.
- **Flujo principal:**
  1. Abre Mis equipos.
  2. El sistema obtiene los Equipos de los que integra el Plantel.
  3. Muestra los activos primero y los disueltos después, con nombre, Zona, modalidad y nivel; identifica las capitanías.
  4. El Usuario consulta una ficha o, si es Capitán de un Equipo activo, accede a Editar.
- **Flujos alternativos:**
  - **A1.** Sin equipos: se ofrece crear uno o pedir un enlace de invitación.
  - **A2.** Sin sesión: se solicita acceso y se conserva el destino.
  - **A3.** Error de consulta: se informa y no se muestra una lista vacía como si fuera un resultado válido.
- **Postcondición:** El Usuario identifica sus Equipos y su rol en cada uno.
- **Estado:** Implementado. Individualiza la consulta ya prevista por RF-C15; no agrega una función nueva.

## Módulo D - Partidos

### UC-D01 - Publicar una búsqueda de rival

- **Origen PDF:** UC-13
- **Objetivo:** Publicar una búsqueda de rival.
- **Actor:** Capitán.
- **Precondiciones:** equipo no disuelto; Capitán con WhatsApp en el perfil y no suspendido (hoy no se verifica); equipo sin **Bloqueo por faltas**; sin otra búsqueda activa del equipo en esa modalidad.
- **Flujo principal:**
  1. Entra a `/partidos/buscar`. Elige el equipo (solo si capitanea más de uno) y la modalidad (viene cargada la habitual del equipo).
  2. Carga la primera **Franja**: toca un día de la grilla de 14 días y un **Turno** (Mañana 9–12, Tarde 14–18, Noche 20–23) u «Otro horario» con dos horas enteras. Puede marcar «Repetir la semana que viene».
  3. El sistema guarda la búsqueda con sus franjas y muestra los rivales compatibles (UC-D03).
- **Flujos alternativos:**
  - **A1. Franja inválida:** dura al menos 1 h, va de 8 a 24 sin cruzar la medianoche, es de una sola fecha dentro de los próximos 14 días y, si es hoy, empieza en una hora que no pasó. Si «repetir» cae fuera de los 14 días, se rechaza entera. Mensajes: «Las franjas tienen que ser de los próximos 14 días», «Cada franja va de 8 a 24, en horas enteras, y dura al menos 1 h», «Una franja de hoy tiene que empezar en una hora que todavía no pasó».
  - **A2. Franja que choca:** se rechaza si se superpone con un partido acordado del equipo o con otra franja de la misma búsqueda («Hay franjas que se pisan: cada horario va una sola vez»). Entre búsquedas de distinta modalidad del mismo equipo sí se pueden superponer.
  - **A3. Equipo bloqueado:** en vez del formulario ve hasta cuándo dura el bloqueo.
  - **A4. Sin WhatsApp / no es Capitán / equipo disuelto:** «Cargá tu WhatsApp en el perfil para buscar rival», «Solo el capitán puede buscar rival», «El equipo está disuelto».
  - **A5. No es Capitán de ningún equipo:** la pantalla explica «Buscar rival es cosa del capitán».
- **Reglas:** la cercanía y el nivel salen de la Zona y el nivel **actuales** del equipo; la búsqueda guarda solo modalidad y franjas. Publicar no genera ningún Aviso. En la interfaz, la franja se llama «horario».
- **Postcondición:** búsqueda activa mientras le quede alguna franja por empezar; vence sola al pasar la última.
- **Estado:** **Parcial** (`save_rival_search`): todo salvo la verificación de la Suspensión.

### UC-D02 - Editar una búsqueda de rival

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Editar una búsqueda de rival.
- **Actor:** Capitán
- **Precondiciones:** Tiene una búsqueda activa de su Equipo.
- **Flujo principal:**
  1. Abre Buscar rival y la búsqueda activa.
  2. Agrega una Franja o retira una existente; la modalidad se conserva.
  3. El sistema valida las Franjas y guarda el conjunto actualizado.
  4. Al retirar una Franja, cancela sus Propuestas pendientes y avisa al Capitán del otro lado.
  5. Actualiza los rivales compatibles.
- **Flujos alternativos:**
  - **A1.** Franja inválida, superpuesta con otra o con un Partido: se rechaza el guardado.
  - **A2.** Retirar la última Franja cancela la búsqueda, con las consecuencias de UC-D15.
  - **A3.** Los Partidos ya acordados siguen en pie.
- **Postcondición:** Búsqueda actualizada; solo quedan disponibles sus Franjas vigentes.
- **Estado:** Implementado.

### UC-D03 - Ver rivales compatibles

- **Origen PDF:** UC-14
- **Objetivo:** Ver rivales compatibles.
- **Actor:** Capitán.
- **Precondiciones:** búsqueda activa.
- **Flujo principal:** en `/partidos/buscar` ve una tarjeta por franja en común con cada rival compatible, con el horario en común calculado y el botón «Proponer partido».
- **Flujos alternativos:** **A1. Sin compatibles:** «Ningún equipo de la zona publicó esos horarios. Con más horarios, más chances de partido.»
- **Reglas de compatibilidad:** misma modalidad y al menos 1 h en común el mismo día; los niveles con dos escalones de diferencia no se cruzan; nunca dos equipos del mismo Capitán; una **Franja ocupada** o ya empezada sale de los compatibles.
- **Orden:** cercanía (Zona > Corredor > Región), después nivel, después **Presentismo**; los equipos con 2 faltas en 90 días van al final; empate: el horario en común más temprano.
- **Postcondición:** Compatibles consultados sin revelar el contacto del rival.
- **Estado:** Implementado (`compatible_rivals`).

### UC-D04 - Proponer un partido

- **Origen PDF:** UC-15
- **Objetivo:** Proponer un partido.
- **Actor:** Capitán.
- **Precondiciones:** ve al rival en los compatibles.
- **Flujo principal:**
  1. Toca «Proponer partido» en la tarjeta de una franja en común.
  2. El sistema crea la **Propuesta** con el horario en común (la parte compartida de las dos franjas, calculada por la app; nadie elige un rango) y sin mensaje.
  3. El Capitán rival recibe el Aviso «Te propusieron un partido». La tarjeta del proponente pasa a «Propuesta enviada».
- **Flujos alternativos:**
  - **A1. Ya hay una pendiente al mismo rival para el mismo horario:** «Ya le mandaste una propuesta a ese equipo por ese horario».
  - **A2. Mismo Capitán de los dos lados:** «No podés proponerle un partido a un equipo que capitaneás».
  - **A3. El rival ya no busca en ese horario / ya no es compatible / tu búsqueda ya no está activa:** se rechaza con ese motivo.
  - **A4. Propuesta anterior ya cerrada:** la tarjeta muestra qué pasó («Tu propuesta venció», «Rechazaron tu propuesta») y se puede volver a proponer.
- **Reglas:** sin límite de propuestas pendientes por equipo. Vence a las **72 h** o cuando **empieza** su rango, lo que ocurra primero; vencer no avisa.
- **Postcondición:** Propuesta pendiente registrada y Aviso emitido al Capitán receptor.
- **Estado:** Implementado (`send_proposal`).

### UC-D05 - Cancelar una propuesta enviada

- **Origen PDF:** UC-17
- **Objetivo:** Cancelar una propuesta enviada.
- **Actor:** Capitán que la mandó.
- **Precondiciones:** la propuesta está pendiente.
- **Flujo principal:** toca «Cancelar» en la tarjeta. El sistema la cierra **sin Aviso**: el rival deja de verla al entrar. Se puede volver a proponer.
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Regla:** solo avisan las cancelaciones en cascada (sacar una franja, cancelar la búsqueda, disolver, bloqueo).
- **Postcondición:** Propuesta cancelada, sin crear un Partido.
- **Estado:** Implementado (la misma función `respond_proposal` que rechazar; el sistema distingue por quién la llama).

### UC-D06 - Aceptar una propuesta de partido

- **Origen PDF:** UC-16 (aceptar)
- **Objetivo:** Aceptar una propuesta de partido.
- **Actor:** Capitán receptor
- **Precondiciones:** Propuesta pendiente; Equipos disponibles, sin Partido superpuesto.
- **Flujo principal:**
  1. Consulta la Propuesta recibida y pulsa Aceptar.
  2. El sistema vuelve a validar el estado de la Propuesta, la capitanía y la disponibilidad de ambos Equipos.
  3. Crea el Partido con el rango compartido y deja pendiente la coordinación.
  4. Ocupa las Franjas superpuestas y anula las Propuestas pendientes de ambos Equipos que se superponen.
  5. Avisa a los dos Planteles del Partido acordado y a los Capitanes afectados por otras anulaciones.
  6. Cada Capitán puede consultar el WhatsApp del rival mientras el Partido está por jugarse.
- **Flujos alternativos:**
  - **A1.** Propuesta vencida, cancelada o ya respondida: no se crea otro Partido.
  - **A2.** Algún Equipo ya tiene un Partido superpuesto: se rechaza.
  - **A3.** Equipo bloqueado por faltas: la Propuesta aparece cancelada y no admite aceptación.
  - **A4.** Una Propuesta inversa entre los mismos dos Equipos se anula sin aviso adicional.
- **Postcondición:** Un Partido acordado, sin superposición, asociado a ambos Equipos.
- **Estado:** Implementado.

### UC-D07 - Cargar cancha y hora del Partido

- **Origen PDF:** UC-18 (cargar)
- **Objetivo:** Cargar cancha y hora del Partido.
- **Actor:** Capitán de cualquiera de los dos Equipos
- **Precondiciones:** Partido por jugarse; todavía no comenzó el rango acordado.
- **Flujo principal:**
  1. Los Capitanes acuerdan por WhatsApp la cancha y la hora.
  2. Uno carga la cancha (texto obligatorio, hasta 120 caracteres) y una hora exacta dentro del rango, en intervalos de quince minutos.
  3. El sistema valida y guarda los datos a confirmar.
  4. Avisa al Capitán rival para que confirme mediante UC-D17 o corrija mediante UC-D18.
- **Flujos alternativos:**
  - **A1.** Dato inválido o hora fuera del rango: se rechaza.
  - **A2.** Rango ya iniciado: no se permite cargar ni modificar la coordinación.
  - **A3.** Para cambiar de día o rango, se debe tirar el Partido y proponer otro.
- **Reglas:** La coordinación es una ayuda; un Partido puede jugarse sin completar este paso.
- **Postcondición:** Datos de coordinación cargados; el Partido todavía no queda Coordinado.
- **Estado:** Implementado.

### UC-D08 - Confirmar asistencia

- **Origen PDF:** UC-19
- **Objetivo:** Confirmar asistencia.
- **Actor:** cada Capitán.
- **Precondiciones:** faltan 24 h o menos para la **Hora de inicio** y el partido está por jugarse.
- **Flujo principal:**
  1. Al entrar ve «¿Van?» con **Vamos** y **No vamos**.
  2. Toca «Vamos». Cuando los dos lo hicieron, el partido queda **Confirmado**. No hay Aviso, a propósito.
- **Flujos alternativos:**
  - **A1. «No vamos»:** abre el formulario de tirar el partido, con «Suma una falta a tu equipo» (UC-D09).
  - **A2. Desde 12 h antes, si el rival no confirmó:** «El rival todavía no confirmó» (sin Aviso: lo ve al entrar).
  - **A3. Nadie confirma:** no pasa nada, el partido sigue en pie.
- **Postcondición:** Asistencia propia registrada; si ambos confirmaron, el Partido queda Confirmado.
- **Estado:** Implementado (`confirm_going`).

### UC-D09 - Tirar el partido

- **Origen PDF:** UC-20
- **Objetivo:** Tirar el partido.
- **Actor:** cualquiera de los dos Capitanes.
- **Precondiciones:** partido por jugarse, antes de la **Hora de inicio**.
- **Flujo principal:**
  1. Toca «Tirar el partido» (o «Tirar el partido (suma falta)» si faltan menos de 24 h).
  2. Escribe el **motivo** (obligatorio, 1 a 140 caracteres; queda visible en el historial público, nadie lo modera).
  3. El sistema marca el **Partido caído** y avisa «Se cayó el partido» a los dos planteles, con el motivo y, si suma falta, a quién.
- **Flujos alternativos:** **A1.** Con menos de 24 h, en vez de tirarlo solo, puede pedir una **Caída de común acuerdo** (UC-D10 / UC-D19 / UC-D20). **A2.** Motivo inválido: «El motivo va de 1 a 140 caracteres.»
- **Reglas:** con **menos de 24 h**, suma una **Falta** al equipo que lo tiró, desde que lo tiró (con 24 h justas todavía no). Las franjas que ocupaba se liberan. Un partido caído entra al historial del equipo desde que se tira.
- **Postcondición:** Partido caído con su motivo y, cuando corresponde, una Falta.
- **Estado:** Implementado (`drop_match`).

### UC-D10 - Solicitar una caída de común acuerdo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Solicitar una caída de común acuerdo.
- **Actor:** Capitán solicitante
- **Precondiciones:** Menos de 24 horas para el inicio; Partido por jugarse; nadie solicitó antes una caída de común acuerdo.
- **Flujo principal:**
  1. Elige pedir la caída de común acuerdo y escribe el motivo obligatorio (1 a 140 caracteres).
  2. El sistema registra la solicitud y avisa al Capitán rival.
  3. Muestra la solicitud pendiente; el Partido sigue en pie.
- **Flujos alternativos:**
  - **A1.** Con 24 horas o más, puede tirar el Partido sin Falta; no se ofrece este pedido.
  - **A2.** Motivo inválido, pedido anterior o inicio pasado: se rechaza.
  - **A3.** Sin respuesta, el Partido sigue en pie; solo antes de su inicio el solicitante puede tirarlo unilateralmente, con Falta.
- **Postcondición:** Solicitud pendiente, sin cerrar el Partido ni generar una Falta.
- **Estado:** Implementado.

### UC-D11 - Cargar el resultado del Partido

- **Origen PDF:** UC-21 (cargar)
- **Objetivo:** Cargar el resultado del Partido.
- **Actor:** Capitán
- **Precondiciones:** Ya pasó la Hora de inicio y el Partido está esperando resultado; el actor no reportó No vinieron.
- **Flujo principal:**
  1. Abre Contanos cómo salió.
  2. Carga los goles propios y del rival, de 0 a 99 por lado.
  3. El sistema valida y guarda el resultado de ese lado.
  4. Avisa al Capitán rival con el plazo para confirmar o corregir.
- **Flujos alternativos:**
  - **A1.** Sin respuesta durante 48 horas: queda Jugado con el resultado cargado; el vencimiento no genera Aviso.
  - **A2.** Si ya había resultado del rival y coincide, queda Jugado; si discrepa, rige UC-D22.
  - **A3.** Si el rival reportó No vinieron, cargar resultado equivale a decir Fuimos y deja el Partido en conflicto.
  - **A4.** Nadie carga nada durante 48 horas desde el fin del rango: queda Jugado sin resultado.
  - **A5.** Goles inválidos o Partido cerrado: se rechaza.
- **Postcondición:** Resultado registrado; Partido pendiente de respuesta o cerrado si los resultados ya coinciden.
- **Estado:** Implementado.

### UC-D12 - Reportar que el rival no se presentó

- **Origen PDF:** UC-23
- **Objetivo:** Reportar que el rival no se presentó.
- **Actor:** Capitán que reporta
- **Precondiciones:** Pasó la Hora de inicio; Partido esperando resultado; el actor no cargó un resultado.
- **Flujo principal:**
  1. Pulsa No vinieron.
  2. El sistema registra la declaración y avisa al Capitán acusado el vencimiento y la consecuencia de no responder.
  3. Mantiene abierto el plazo de 48 horas para UC-D23.
- **Flujos alternativos:**
  - **A1.** Sin respuesta al vencer: cierra como no presentado y el Equipo ausente suma una Falta desde ese vencimiento, sin Aviso temporal.
  - **A2.** El rival ya cargó un resultado o ambos se acusan: queda en conflicto, sin Falta para nadie; ambos Equipos suman un Conflicto.
  - **A3.** Quien ya cargó resultado no puede usar No vinieron; quien reportó no puede cargar resultado.
  - **A4.** Partido cerrado o actor sin permiso: se rechaza.
- **Reglas:** El Administrador no resuelve estos conflictos; se muestran las dos versiones.
- **Postcondición:** Reporte registrado y plazo abierto, o conflicto registrado si ya existe una versión incompatible.
- **Estado:** Implementado.

### UC-D13 - Calificar al rival

- **Origen PDF:** UC-22
- **Objetivo:** Calificar al rival.
- **Actor:** Capitán.
- **Precondiciones:** el partido está **Jugado** (con o sin resultado) y no pasaron 7 días desde que quedó Jugado.
- **Flujo principal:**
  1. Toca «Calificar» en la fila del partido.
  2. Pone de 1 a 5 estrellas y, opcionalmente, un comentario de hasta 500 caracteres (privado; solo lo lee el administrador al revisar un equipo reportado).
  3. El sistema guarda una calificación por equipo y partido. No se edita.
- **Flujos alternativos:** **A1.** Partido caído, en conflicto o con falta: no se califica. **A2.** Equipo disuelto: se sigue calificando hasta vencer los 7 días. **A3.** Datos inválidos: «Elegí de 1 a 5 estrellas.» o «El comentario va hasta 500 caracteres.»
- **Reglas de revelación (para que nadie califique en represalia):** cada Capitán ve la que le pusieron recién cuando los dos calificaron o vencieron los 7 días. Cuando la segunda calificación revela las dos, el que calificó primero recibe «Ya podés ver tu calificación» (revelar por vencimiento no avisa). El promedio público cuenta solo calificaciones reveladas.
- **Postcondición:** Calificación guardada, sujeta a la regla de revelación.
- **Estado:** Implementado (`rate_rival`).

### UC-D14 - Ver mis partidos

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Ver mis partidos.
- **Actor:** Capitán o Jugador.
- **Precondiciones:** Sesión activa y permisos del actor sobre los datos involucrados.
- **Flujo principal:** entra a `/partidos` y ve, de arriba abajo: las propuestas recibidas (solo Capitán), el **próximo partido** en grande (cuándo, contra quién, dónde o «Falta cancha y hora», con una sola acción visible), los partidos esperando resultado, los otros por jugarse («Más adelante») y el **historial** plegado con los cerrados («Ganamos», «Perdimos», «Empatamos», «Se cayó», «En conflicto», «Falta»).
- **Flujos alternativos:** **A1.** Sin equipo o sin partidos: estado vacío («Todavía no hay partidos») que lleva a Buscar rival (si es Capitán) o a Mis equipos.
- **Reglas:**
  - El Jugador ve todo sin botones. El WhatsApp del Capitán rival lo ve solo el Capitán, con un partido acordado.
  - Lo que pide una respuesta va abierto en la fila con un solo botón primario; lo que no, plegado detrás de un link.
  - Todo lo pendiente se ve acá, haya o no Aviso: esta pantalla es la fuente de verdad.
  - Muestra lo de **todos** los equipos del usuario juntos; el nombre del equipo propio aparece solo cuando el usuario está en más de uno.
- **Postcondición:** Partidos de los Equipos del Usuario consultados con los permisos de su rol.
- **Estado:** Implementado.

### UC-D15 - Cancelar una búsqueda de rival

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Cancelar una búsqueda de rival.
- **Actor:** Capitán
- **Precondiciones:** Tiene una búsqueda activa de su Equipo.
- **Flujo principal:**
  1. Pulsa Cancelar la búsqueda y confirma.
  2. El sistema comprueba la capitanía y cancela la búsqueda.
  3. Cancela sus Propuestas pendientes, enviadas y recibidas, y avisa al Capitán del otro lado.
  4. Retira la búsqueda de los compatibles.
- **Flujos alternativos:**
  - **A1.** Cancela la confirmación: no se modifica nada.
  - **A2.** Sin permiso: se rechaza.
  - **A3.** Los Partidos que ya nacieron de esa búsqueda siguen en pie.
- **Postcondición:** La búsqueda deja de operar y sus Propuestas pendientes quedan canceladas.
- **Estado:** Implementado.

### UC-D16 - Rechazar una propuesta de partido

- **Origen PDF:** UC-16 (rechazar)
- **Objetivo:** Rechazar una propuesta de partido.
- **Actor:** Capitán receptor
- **Precondiciones:** La Propuesta recibida sigue pendiente.
- **Flujo principal:**
  1. Consulta la Propuesta y pulsa Rechazar.
  2. El sistema valida que sea el receptor autorizado y que la Propuesta siga pendiente.
  3. La cierra como rechazada y avisa al Capitán emisor.
- **Flujos alternativos:**
  - **A1.** Propuesta vencida, cancelada, aceptada o actor sin permiso: se rechaza la operación.
  - **A2.** Rechazar no crea un Partido ni ocupa las Franjas.
- **Postcondición:** Propuesta rechazada; el emisor puede volver a proponer si siguen siendo compatibles.
- **Estado:** Implementado.

### UC-D17 - Confirmar cancha y hora del Partido

- **Origen PDF:** UC-18 (confirmar)
- **Objetivo:** Confirmar cancha y hora del Partido.
- **Actor:** Capitán rival de quien hizo la última carga
- **Precondiciones:** Datos de coordinación pendientes; Partido por jugarse; rango todavía no iniciado.
- **Flujo principal:**
  1. Consulta cancha y hora cargadas por el rival.
  2. Pulsa Confirmar.
  3. El sistema comprueba que sea el otro Capitán y que los datos sigan vigentes.
  4. Deja el Partido Coordinado y avisa a ambos Planteles.
- **Flujos alternativos:**
  - **A1.** Datos cambiados, Partido cerrado o rango iniciado: no confirma datos anteriores.
  - **A2.** Si no coincide con lo acordado, utiliza UC-D18.
- **Postcondición:** Cancha y hora confirmadas por ambos lados.
- **Estado:** Implementado.

### UC-D18 - Corregir cancha y hora del Partido

- **Origen PDF:** UC-18 (corregir)
- **Objetivo:** Corregir cancha y hora del Partido.
- **Actor:** Capitán de cualquiera de los Equipos
- **Precondiciones:** Partido por jugarse; rango todavía no iniciado.
- **Flujo principal:**
  1. Abre la corrección de cancha y hora.
  2. Carga los nuevos valores acordados y los envía.
  3. El sistema valida, reemplaza los valores y deja pendiente la confirmación del otro Capitán.
  4. Avisa al rival; si ya estaba Coordinado, deja de estarlo hasta la nueva confirmación.
- **Flujos alternativos:**
  - **A1.** Se aplican los mismos límites de cancha y hora de UC-D07.
  - **A2.** El rango ya empezó: no se permite corregir aunque la hora coordinada fuera posterior.
- **Reglas:** Mientras la nueva coordinación no se confirme, la Hora de inicio vuelve a ser el inicio del rango.
- **Postcondición:** Nueva coordinación pendiente del otro lado; los Vamos anteriores se conservan.
- **Estado:** Implementado.

### UC-D19 - Aceptar una caída de común acuerdo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Aceptar una caída de común acuerdo.
- **Actor:** Capitán receptor de la solicitud
- **Precondiciones:** Pedido pendiente y Partido todavía por jugarse, antes de la Hora de inicio.
- **Flujo principal:**
  1. Consulta el motivo y pulsa Aceptar.
  2. El sistema valida que sea el Capitán rival actual y que el pedido siga abierto.
  3. Deja el Partido caído de común acuerdo, sin Falta para ninguno.
  4. Libera las Franjas ocupadas y avisa a los dos Planteles.
- **Flujos alternativos:**
  - **A1.** Cambió la capitanía: responde el Capitán actual.
  - **A2.** Inicio pasado, pedido resuelto o Partido cerrado: se rechaza.
- **Postcondición:** Partido cerrado como caída de común acuerdo, con el motivo en su historial.
- **Estado:** Implementado.

### UC-D20 - Rechazar una caída de común acuerdo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Rechazar una caída de común acuerdo.
- **Actor:** Capitán receptor de la solicitud
- **Precondiciones:** Pedido pendiente y Partido por jugarse antes de su inicio.
- **Flujo principal:**
  1. Consulta el motivo y pulsa Rechazar.
  2. El sistema registra el rechazo y avisa al solicitante.
  3. Mantiene el Partido en pie.
- **Flujos alternativos:**
  - **A1.** No se puede presentar otra solicitud de común acuerdo en ese Partido, por ninguno de los lados.
  - **A2.** Antes del inicio, el solicitante todavía puede tirar el Partido unilateralmente con Falta.
  - **A3.** Pedido resuelto, inicio pasado o falta de permiso: se rechaza.
- **Postcondición:** Solicitud rechazada y Partido vigente.
- **Estado:** Implementado.

### UC-D21 - Confirmar el resultado del Partido

- **Origen PDF:** UC-21 (confirmar)
- **Objetivo:** Confirmar el resultado del Partido.
- **Actor:** Capitán rival de quien cargó el resultado
- **Precondiciones:** Partido esperando resultado y carga del rival pendiente de respuesta.
- **Flujo principal:**
  1. Consulta el resultado expresado desde su propio Equipo.
  2. Pulsa Confirmar; el sistema registra el mismo marcador desde el lado inverso.
  3. Al coincidir ambos resultados, deja el Partido Jugado con ese marcador.
  4. Avisa a ambos Planteles y habilita la calificación.
- **Flujos alternativos:**
  - **A1.** Si discrepa, utiliza UC-D22.
  - **A2.** Partido ya cerrado o estado cambiado: no reabre el resultado.
- **Postcondición:** Partido Jugado, con un resultado confirmado por ambos lados.
- **Estado:** Implementado.

### UC-D22 - Corregir el resultado del Partido

- **Origen PDF:** UC-21 (corregir)
- **Objetivo:** Corregir el resultado del Partido.
- **Actor:** Capitán
- **Precondiciones:** Partido esperando resultado; el actor no declaró No vinieron.
- **Flujo principal:**
  1. Consulta el resultado y carga su marcador corregido.
  2. El sistema valida los goles y guarda la nueva carga con su fecha.
  3. Si coincide con el rival, cierra como Jugado; si discrepa, deja abierta la respuesta del rival y lo avisa.
- **Flujos alternativos:**
  - **A1.** Cada corrección reinicia las 48 horas desde la última carga; no hay tope de correcciones mientras el Partido siga abierto.
  - **A2.** Si al vencer el plazo los resultados discrepan, queda Jugado sin resultado.
  - **A3.** Partido Jugado, en conflicto o con Falta: ya está cerrado y no se corrige.
  - **A4.** Resultado frente a un reporte No vinieron: deja el Partido en conflicto.
- **Postcondición:** Resultado actualizado y plazo renovado, o Partido cerrado por coincidencia.
- **Estado:** Implementado.

### UC-D23 - Responder que el Equipo sí se presentó

- **Origen PDF:** UC-24 (flujo reformulado)
- **Objetivo:** Responder que el Equipo sí se presentó.
- **Actor:** Capitán acusado
- **Precondiciones:** Reporte No vinieron pendiente, antes de su vencimiento, con Partido todavía abierto.
- **Flujo principal:**
  1. Consulta el reporte y pulsa Fuimos.
  2. El sistema registra su declaración y deja el Partido en conflicto.
  3. No asigna Falta por ese reporte; suma un Conflicto a ambos Equipos.
  4. Avisa a los Planteles y publica las dos versiones en el historial.
- **Flujos alternativos:**
  - **A1.** Cargar un resultado también declara que el Equipo fue y produce el mismo conflicto.
  - **A2.** Acusar al rival de no presentarse también produce conflicto.
  - **A3.** Si el plazo venció o el Partido está cerrado, no admite una respuesta tardía.
- **Postcondición:** Partido cerrado en conflicto, sin arbitraje administrativo y sin posibilidad de calificarlo.
- **Estado:** Implementado.

## Módulo E - Organizador

### UC-E01 - Publicar un torneo

- **Origen PDF:** SPEC-E01 (publicar)
- **Objetivo:** Publicar un torneo.
- **Actor:** Usuario (pasa a ser **Organizador** al publicar).
- **Precondiciones:** sesión; sin **Suspensión** (regla vigente; hoy no se verifica).
- **Flujo principal:**
  1. Llega a «Publicar torneo» desde el panel «Mis torneos» o desde «¿Organizás torneos? Publicalo» (al pie del catálogo y en el footer; sin sesión, pasa por Crear cuenta).
  2. La pantalla carga las opciones de los dos desplegables: las **Zonas** (de la base, agrupadas por corredor) y las **modalidades** (Fútbol 5, 7, 8 y 11).
  3. Completa los **obligatorios**: nombre, modalidad, Zona, cierre de inscripción, inicio y fin, dirección de la sede, y al menos un contacto (WhatsApp o Instagram). **Opcionales**: precio, flyer (JPG/PNG/WebP, máx. 3 MB), cupo, descripción, reglamento.
  4. El sistema valida (incluido **cierre ≤ inicio ≤ fin**) y guarda el torneo con el usuario como organizador.
  5. El flyer se sube **después del alta**, con el id del torneo.
  6. Se abre la ficha pública con «Publicado. Así lo ve la gente»; el torneo aparece en el catálogo con su Estado calculado y **verificado**.
- **Flujos alternativos:**
  - **A1. Sin sesión:** se redirige a `/login?next=/crear-torneo`.
  - **A2. Datos inválidos:** el formulario **no guarda**, marca el error y **conserva lo cargado**. Mensajes, por ejemplo: «Poné el nombre del torneo.», «Elegí una modalidad.», «Elegí la zona del torneo.», «Poné la dirección de la sede: es lo que dice si se puede llegar.», «Completá las fechas: cierre de inscripción, inicio y fin.», «El cierre de inscripción no puede ser después del inicio.», «El fin no puede ser antes del inicio.», «El precio tiene que ser un número (0 si es gratis).», «El cupo tiene que ser un número entero de al menos 1.», «Dejá al menos un contacto: WhatsApp o Instagram.», «El WhatsApp no es válido…», «El Instagram no es válido…».
  - **A3. Flyer inválido:** «El flyer tiene que ser JPG, PNG o WebP.» o «El flyer pesa más de 3 MB. Subí una imagen más liviana.»; no se guarda nada.
  - **A4. Falla la subida del flyer:** el torneo **ya está publicado**; la ficha muestra «No pudimos subir el flyer. Probá de nuevo desde Gestionar» y el flyer se sube desde la pestaña Datos.
  - **A5. Falla el guardado:** «No pudimos publicar el torneo: …» con el motivo; se conserva lo cargado.
  - **A6. La Zona ya no existe al guardar:** la base rechaza el alta (clave foránea).
  - **A7. Carga manual de torneos de Instagram:** alguien del equipo los carga con su propia cuenta, como organizador común, poniendo el contacto del organizador real. **No existe un torneo «copiado» sin organizador** (descartado el 07/10/2026).
- **Postcondición:** el torneo tiene exactamente un organizador; el usuario ve «Mis torneos» en su menú.
- **Estado:** **Parcial** (`src/app/crear-torneo`): todo, salvo la verificación de la Suspensión.

### UC-E02 - Ver mis torneos (Panel de organizador)

- **Origen PDF:** SPEC-E02 (consultar)
- **Objetivo:** Ver mis torneos (Panel de organizador).
- **Actor:** Organizador.
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. Abre «Mis torneos» desde el menú de usuario.
  2. Ve **una fila por torneo**: nombre, Zona, modalidad, cupo, Estado y antigüedad de verificación, con dos acciones: «Sigue vigente» y «Gestionar».
  3. Toca «Gestionar» y abre la pantalla de gestión del torneo.
- **Flujos alternativos:**
  - **A1. Sin torneos:** «Todavía no publicaste torneos», con «Publicar mi primer torneo».
  - **A2. Sin sesión:** se redirige a `/login?next=/mis-torneos` (con aviso de «Publicalo» si viene de ese link).
  - **A3. Torneo ajeno o inexistente:** la pantalla de gestión da **404**, igual que si no existiera: no se confirma que exista un torneo con ese id que no es tuyo.
  - **A4. Rutas viejas:** `/mis-torneos/{id}/editar` y `/inscripciones` redirigen a la pestaña correspondiente.
- **Reglas de orden:** primero los que llevan **30 días o más sin verificar**, del más viejo al más nuevo; después el resto; y los **Finalizados** al final, sin antigüedad ni botón de verificar.
- **Niveles del panel:** (1) esta lista; (2) la **pantalla de gestión** de cada torneo, con cabecera (números clave, «Ver ficha pública», «Sigue vigente»), pestañas **Datos** e **Inscripciones** y «Dar de baja» al final, aparte; (3) la ficha pública (UC-B03 A3).
- **Postcondición:** El Organizador consulta sus torneos y puede abrir su gestión.
- **Estado:** Implementado (`src/app/mis-torneos`).

### UC-E03 - Editar un torneo

- **Origen PDF:** SPEC-E01 (editar)
- **Objetivo:** Editar un torneo.
- **Actor:** Organizador del torneo.
- **Precondiciones:** es el dueño.
- **Flujo principal:**
  1. En la pestaña **Datos** de la pantalla de gestión, abre el formulario con los **valores actuales** y los dos desplegables (Zona y modalidad).
  2. Edita cualquier campo (incluido reemplazar el flyer) y pulsa guardar.
  3. Si hay **equipos anotados**, la app pide confirmación: «Hay N equipos anotados, ¿confirmás el cambio?».
  4. El sistema valida con las mismas reglas de UC-E01 y guarda.
  5. Vuelve a la pantalla de gestión.
- **Flujos alternativos:**
  - **A1. Datos o flyer inválidos:** mismos mensajes que UC-E01 A2 y A3; no se guarda nada y se conserva lo cargado.
  - **A2. El torneo ya no existe o no es tuyo:** «Este torneo ya no existe o no es tuyo.» (la base no da error: la actualización afecta cero filas).
  - **A3. Falla el guardado:** «No pudimos guardar los cambios. Probá de nuevo.»
  - **A4. Falla la subida del flyer:** «Guardamos los cambios, pero no pudimos subir el flyer. Probá de nuevo.» Un flyer nuevo **pisa** al anterior.
  - **A5. Dejar el flyer vacío:** conserva el actual.
- **Reglas:** **editar no cuenta como verificar**: la antigüedad de verificación no se reinicia. **Subir el cupo** es la forma de admitir más inscripciones cuando está completo.
- **Postcondición:** Datos válidos guardados; editar no reinicia la verificación.
- **Estado:** Implementado (`src/app/mis-torneos/[id]/editar`).

### UC-E04 - Verificar que el torneo sigue vigente

- **Origen PDF:** SPEC-E02 (verificar)
- **Objetivo:** Verificar que el torneo sigue vigente.
- **Actor:** Organizador del torneo.
- **Precondiciones:** el torneo no está Finalizado.
- **Flujo principal:**
  1. Toca «Sigue vigente» (en la lista o en la pantalla de gestión).
  2. El sistema reinicia la **antigüedad de verificación**.
  3. El torneo vuelve a mostrarse sin ámbar ni rojo, en el panel, el catálogo y la ficha.
- **Flujos alternativos:**
  - **A1. Torneo Finalizado:** el botón sale apagado: un Finalizado no muestra antigüedad ni se verifica.
  - **A2. Ya confirmado hoy** (menos de 24 h): el botón sale apagado. Diferencia vigente: Regla del código que no figura en `casos-de-uso.md`.
  - **A3. Torneo ajeno, dado de baja o id inválido:** la base lo rechaza; el panel no ofrece ninguno de esos casos al dueño, así que alcanza con un registro en el servidor.
- **Reglas:** «Sigue vigente» **no saca la marca Observado**, que solo quita el administrador (la marca todavía no existe).
- **Postcondición:** Verificación actualizada si la operación fue admitida.
- **Estado:** Implementado (`verifyTournament`, función `verify_tournament`).

### UC-E05 - Dar de baja un torneo

- **Origen PDF:** SPEC-E02 (baja)
- **Objetivo:** Dar de baja un torneo.
- **Actor:** Organizador del torneo (o Administrador, UC-F03).
- **Precondiciones:** el torneo está Abierto, Cerrado o En curso. **Nunca Finalizado:** los finalizados son la trayectoria del organizador.
- **Flujo principal:**
  1. En la pantalla de gestión toca «Dar de baja».
  2. Confirma con el nombre del torneo y la cantidad de equipos anotados (aunque sea 0): «¿Dar de baja “X” con N equipos anotados? No se puede deshacer.»
  3. El sistema retira el torneo: desaparece del catálogo, su ficha devuelve 404 y se borra el flyer de Storage.
  4. Cada jugador del Plantel de cada equipo con **Inscripción vinculada** recibe **un único Aviso** (aunque esté en dos equipos anotados), con link a la página del equipo.
  5. Vuelve a «Mis torneos».
- **Flujos alternativos:**
  - **A1. El torneo finalizó entre que se cargó la página y se tocó el botón** (por ejemplo, a medianoche): «Este torneo ya finalizó: queda en tu trayectoria y no se da de baja.»
  - **A2. Otro fallo:** «No pudimos dar de baja el torneo. Probá de nuevo.»
  - **A3. Cancelar la confirmación:** no pasa nada.
- **Aviso a los planteles:** «Se dio de baja el torneo 'X', en el que estaba anotado tu equipo. Hablá con el organizador por lo que hayas pagado.» Solo las inscripciones **vinculadas** avisan; las por nombre no tienen plantel al que avisar.
- **Postcondición:** el torneo no existe; los equipos vinculados dejan de tenerlo en su historia (la baja se lleva sus inscripciones).
- **Estado:** Implementado (`withdrawTournament`, función `withdraw_tournament`).

### UC-E06 - Cargar una inscripción

- **Origen PDF:** SPEC-E03 (flujo reemplazado)
- **Objetivo:** Cargar una inscripción.
- **Actor:** Organizador del torneo.
- **Precondiciones:** ya arregló todo con el capitán **por fuera de la app**. El torneo no está Finalizado. Hay lugar en el cupo.
- **Flujo principal:**
  1. En la pestaña **Inscripciones** elige el tipo:
     - **Inscripción vinculada:** escribe parte del nombre de un equipo de la app (al menos 2 letras), ve los resultados con su **Zona** al lado (porque los nombres se repiten) y selecciona uno.
     - **Inscripción por nombre:** escribe el nombre de un equipo que no está en la app.
  2. El sistema la guarda; cuenta para el cupo y aparece por nombre en la ficha pública.
- **Flujos alternativos:**
  - **A1. Cupo completo:** «El cupo está completo. Subí el cupo desde la pestaña “Datos” para anotar más equipos.»
  - **A2. El equipo ya está inscripto en este torneo:** «Ese equipo ya está anotado en este torneo.» (como mucho una vinculada por equipo y torneo).
  - **A3. Equipo disuelto:** «Ese equipo está disuelto: no recibe inscripciones.» El buscador ni los ofrece.
  - **A4. Torneo Cerrado o En curso:** sí se puede: el organizador sigue acomodando la lista aunque nadie nuevo se inscriba.
  - **A5. Torneo Finalizado:** «Este torneo ya finalizó: sus inscripciones no cambian.»
  - **A6. Nombre inválido (por nombre):** «Escribí el nombre del equipo.», «El nombre tiene que tener al menos 2 caracteres.» o «El nombre puede tener hasta 50 caracteres.»
  - **A7. Búsqueda corta:** «Escribí al menos 2 letras del nombre.» Sin resultados: «No hay equipos activos con ese nombre. Si no está en la app, anotalo solo con el nombre.»
  - **A8. El equipo ya no existe:** «Ese equipo ya no existe.» Torneo ajeno: «Este torneo ya no existe o no es tuyo.»
- **Reglas:** el capitán **no confirma** la vinculación. Solo la vinculada genera Avisos (hoy, el de baja del torneo) y figura en la historia del equipo. El organizador **no ve el WhatsApp** del capitán: ya lo tiene, porque el capitán le escribió.
- **Postcondición:** si el cupo se completó, el torneo pasa a **Cerrado**.
- **Estado:** Implementado (`addInscription`, `addLinkedInscription`, `TeamSearch`).

### UC-E07 - Dar de baja una inscripción

- **Origen PDF:** SPEC-E03 (baja)
- **Objetivo:** Dar de baja una inscripción.
- **Actor:** Organizador del torneo.
- **Precondiciones:** el torneo no está Finalizado.
- **Flujo principal:**
  1. En Inscripciones toca «Dar de baja» sobre un equipo y confirma.
  2. El equipo deja de figurar y **libera su lugar**.
- **Flujos alternativos:**
  - **A1. El torneo finalizó entre tanto:** «Este torneo ya finalizó: sus inscripciones no cambian.»
  - **A2. La inscripción no existe o no es tuya:** «Este torneo ya no existe o no es tuyo.»
- **Postcondición:** si el torneo estaba Cerrado por cupo y no pasó el cierre de inscripción, vuelve a **Abierto**.
- **Estado:** Implementado (`removeInscription`, función `remove_inscription`).

## Módulo F - Administración

### UC-F01 - Acceder al Panel de administración

- **Origen PDF:** CU-F01 (solo acceso)
- **Objetivo:** Acceder al Panel de administración.
- **Actor:** Administrador.
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

### UC-F02 - Consultar el tablero

- **Origen PDF:** CU-F02
- **Objetivo:** Consultar el tablero.
- **Actor:** Administrador.
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

### UC-F03 - Resolver un reporte de torneo

- **Origen PDF:** CU-F03; CU-F06 como registro automático
- **Objetivo:** Resolver un reporte de torneo.
- **Actor:** Administrador.
- **Precondiciones:** hay un **Reporte** pendiente (UC-B06).
- **Flujo principal:**
  1. Abre el reporte pendiente.
  2. Elige una de tres resoluciones:
     - **Descartar** el reporte.
     - **Marcar el torneo como Observado:** la marca se ve en el catálogo y la ficha, y solo el administrador la saca («Sigue vigente» del organizador no la toca).
     - **Dar de baja** el torneo, con las mismas consecuencias que UC-E05: desaparece del catálogo, su ficha devuelve 404, se borra el flyer y los planteles de los equipos con Inscripción vinculada reciben el Aviso de baja.
  3. El sistema aplica la resolución.
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Postcondición:** la resolución queda en el **registro de acciones** (quién, cuándo, qué decidió).
- **Estado:** **Pendiente.**

### UC-F04 - Resolver un reporte de equipo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Resolver un reporte de equipo.
- **Actor:** Administrador.
- **Precondiciones:** hay un reporte pendiente sobre un equipo (UC-C10).
- **Flujo principal:**
  1. Abre el reporte.
  2. Revisa la página del equipo y los **comentarios privados de calificación** que recibió (solo el administrador los lee).
  3. Elige **descartar** el reporte o **suspender al Capitán** (UC-F05), que responde por la conducta del Plantel.
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Postcondición:** queda en el registro de acciones.
- **Estado:** **Pendiente.**

### UC-F05 - Suspender una cuenta

- **Origen PDF:** CU-F05
- **Objetivo:** Suspender una cuenta.
- **Actor:** Administrador.
- **Precondiciones:** la cuenta existe (se llega desde un reporte, UC-F04, o desde la búsqueda, UC-F06).
- **Flujo principal:**
  1. Elige la **duración**: 7 días, 30 días o indefinida.
  2. Escribe el **motivo** y confirma.
  3. El sistema suspende la cuenta y avisa al usuario con el motivo y un email de contacto (no hay apelación dentro de la app).
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Efectos de la Suspensión:**
  - Puede entrar y mirar, pero **no** publicar torneos, crear equipos, buscar rival ni recibir la capitanía.
  - Sus torneos siguen visibles y los puede editar y verificar.
  - Sus búsquedas de rival se cancelan y las propuestas pendientes de su equipo se anulan, con aviso.
  - Sus partidos futuros **se caen** con el motivo «Equipo suspendido» (lo escribe el sistema), sin falta para nadie.
  - Los partidos pendientes de resultado los puede terminar de cargar.
  - Su equipo no aparece entre los compatibles, su página sigue visible y **no puede cambiar de capitán** mientras dure.
- **No confundir** con el **Bloqueo por faltas**, que es automático, recae sobre el equipo y no lo decide nadie.
- **Postcondición:** la cuenta queda suspendida; la acción queda en el registro.
- **Estado:** Pendiente: no existe la gestión de suspensiones ni su comprobación al transferir la capitanía.

### UC-F06 - Buscar usuarios

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Buscar usuarios.
- **Actor:** Administrador.
- **Precondiciones:** Sesión activa y permisos del actor sobre los datos involucrados.
- **Flujo principal:** busca por **nombre** o **email** y abre la cuenta para ver sus equipos, torneos y reportes, y suspenderla si corresponde (UC-F05).
- **Flujos alternativos:** sin permiso se rechaza; si falla la consulta o el guardado, se informa y no se declara éxito. Para los casos pendientes, el detalle de errores se completará al implementar.
- **Postcondición:** Usuarios coincidentes consultados dentro del acceso administrativo.
- **Estado:** **Pendiente.** Buscar por email exige resolver cómo leerlo sin exponer datos (ver [«Sin decisión»](01-requerimientos.md#5-sin-decisión)).

### UC-F07 - Retirar la marca Observado de un torneo

- **Origen PDF:** Incorporación o desglose de un objetivo vigente.
- **Objetivo:** Retirar la marca Observado de un torneo.
- **Actor:** Administrador
- **Precondiciones:** Sesión y rol administrativo; el torneo existe y está marcado Observado.
- **Flujo principal:**
  1. Consulta el torneo observado y elige retirar la marca.
  2. El sistema verifica el rol y retira la marca administrativa.
  3. Registra quién hizo la acción, cuándo y qué decidió.
- **Flujos alternativos:**
  - **A1.** Actor sin rol administrativo: se rechaza.
  - **A2.** Torneo inexistente o sin marca: no se modifica otro recurso.
  - **A3.** El Organizador no puede retirar la marca usando Sigue vigente.
- **Reglas:** El permiso para retirar la marca ya está en las decisiones vigentes; el detalle de pantalla queda pendiente de implementación.
- **Postcondición:** El torneo deja de estar Observado; la antigüedad de verificación conserva su cálculo independiente.
- **Estado:** Pendiente: la marca y su gestión todavía no existen.

## Reglas transversales y permisos

- Estado del torneo: Abierto si no pasó el cierre y hay cupo; Cerrado por cierre o cupo antes del inicio; En curso entre inicio y fin; Finalizado después del fin. Últimos cupos es una etiqueta, no otro estado. Editar no verifica el torneo.
- Antigüedad de verificación: desde 30 días completos, ámbar; desde 60, rojo con Sin confirmar. Observado es una marca administrativa independiente y todavía pendiente.
- Búsqueda de rival: una activa por Equipo y modalidad; Franjas de fechas concretas en los próximos catorce días, en horas enteras de 8 a 24, de al menos una hora, sin cruzar medianoche. Solo cuentan Franjas que no comenzaron.
- Propuesta: vence a las 72 horas o al inicio de su rango, lo que ocurra primero. Un Partido ocupa todo el rango acordado. Nunca dos Partidos superpuestos por Equipo. Los Equipos con el mismo Capitán no se proponen entre sí.
- Hora de inicio: hora exacta confirmada o, sin coordinación confirmada, inicio del rango. Antes de esa hora se puede tirar el Partido; desde ella, cargar resultado o No vinieron. La coordinación solo se cambia antes del inicio del rango.
- Plazos de resultado: 48 horas desde la última carga; si nadie cargó, desde el fin del rango. Una única carga sin respuesta deja Jugado con resultado; discrepancia vencida o falta de cargas deja Jugado sin resultado.
- Falta: tirar con menos de 24 horas o no responder al reporte No vinieron en 48 horas. Con 24 horas exactas no suma Falta por tirar. La caída de común acuerdo no suma Falta.
- Presentismo: Faltas en los últimos noventa días. Dos Faltas relegan al Equipo en compatibles. Tres generan un Bloqueo por faltas durante treinta días desde la tercera; los Partidos acordados siguen en pie. Conflicto y Suspensión son conceptos distintos.
- Calificaciones: una por Equipo y Partido, una vez Jugado y durante siete días; no se editan. Se revelan al calificar ambos o al vencer los siete días. Solo las reveladas integran el promedio público; comentarios privados para Administración.
- No hay tareas programadas. Los estados temporales se calculan al consultar; el mero paso del tiempo no emite Avisos.
- Cada Aviso nace de una acción, tiene texto, fecha y enlace, y excluye al autor. Los que requieren respuesta van al Capitán; los informativos, al Plantel del momento. Una persona recibe uno solo aunque integre ambos lados. Los plazos y sus consecuencias se explican en el Aviso.
- La campanita muestra los últimos treinta Avisos y marca leídos los visibles. Las decisiones se ejecutan en la pantalla destino, que vuelve a validar permisos y estado.
- Son públicas las fichas de torneos, de organizadores y de Equipos, los nombres de inscriptos y el historial público limitado. El Plantel solo lo ven sus integrantes. Propuestas, cancha y hora se limitan a los participantes; el contacto rival se limita al Capitán autorizado. Los Reportes son privados para Administración y su autor.
- Cada escritura exige comprobar propiedad o rol en el servidor y la base. Las transiciones de Partidos y Plantel van por funciones de Postgres. El rol administrativo no se asigna desde el formulario; la clave de servicio no llega al cliente.
- La Suspensión administrativa y sus efectos todavía están pendientes; no se debe dar por implementada su comprobación en altas, búsquedas o transferencias de capitanía.

## Equivalencias y decisiones pendientes

- UC-05 original: volver al destino después del acceso se integra a Crear cuenta e Iniciar sesión, sin actor Sistema separado.
- UC-06 original: elegir perfil de entrada fue retirado. La navegación es única.
- UC-24 original: la defensa se reemplaza por UC-D23; no se eleva al Administrador. CU-F04 original, arbitrar el conflicto, fue retirado.
- CU-F01 original: se conserva solo el acceso administrativo. La carga de torneos se hace con una cuenta de Organizador, sin un torneo copiado ni sin organizador.
- CU-F06 original: registrar quién, cuándo y qué decidió es un efecto de la resolución, no una acción manual adicional del Administrador.
- UC-51, UC-52 y UC-53 originales: pasan a las reglas de lectura, escritura y permisos; no se presentan como objetivos del actor Sistema.
- UC-30 original: la ficha pública cubre los últimos cinco Partidos cerrados. Mis partidos incluye el historial del Usuario. El pedido original de historial completo por Equipo y de búsquedas realizadas no se declara cubierto por la ficha: queda por definir si se conserva ese objetivo adicional.
- Catálogo público de Equipos: no existe en main ni está incorporado al catálogo general vigente. Su inclusión y sus filtros quedan por decidir con el equipo; no se lo presenta como implementado.
- Finalizados en catálogo: resolver la contradicción entre el filtro prometido y la regla/código que los excluye siempre. Los finalizados sí forman parte de la trayectoria pública del Organizador.
- Recuperación de contraseña: decidir la respuesta ante correo sin cuenta y el comportamiento de sesión al completar la recuperación. No se presupone una decisión nueva.
- Reportes de Equipos: definir si una persona puede reportar más de una vez al mismo Equipo. Búsqueda administrativa por email: definir el acceso sin exponer correos públicamente.
- La regla que impide vaciar el WhatsApp a un Capitán activo está escrita pero no aplicada; el guardado de perfil y contacto puede ser parcial. Debe completarse la implementación o revisarse la decisión con el equipo.
- Confirmación de edición con inscriptos y espera de menos de 24 horas para volver a verificar: están en el código; su formalización en decisiones sigue pendiente.
- Consultar reportes propios y consultar el registro de acciones necesitan especificación adicional si se ofrecerán como pantallas autónomas; la regla de visibilidad por sí sola no acredita una pantalla implementada.

## Fuentes y mantenimiento

Referencia: main, 7c8cb08, consultada el 04/11/2026. Las reglas de alcance están en docs/especificaciones-y-requerimientos/decisiones-casos-de-uso.md; el vocabulario, en CONTEXT.md; los conflictos, en docs/adr/0002-conflictos-sin-arbitro.md. Los detalles por módulo provienen de docs/cuenta-y-acceso, docs/catalogo-de-torneos, docs/equipos, docs/partidos, docs/organizador y docs/administracion. Se contrastaron con src/app, src/components y supabase/migrations.

Esta consolidación corrige la trazabilidad del PDF original y agrega desgloses de acciones. Las secuencias y las matrices anteriores deberán adoptar estos desgloses cuando se revisen; compartir una RPC no obliga a compartir un caso de uso. Este documento no implica que los diagramas anteriores hayan sido modificados.
