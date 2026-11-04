# Casos de uso de Torneos Amateur BA

Versión del **03/11/2026**. Reemplaza a los documentos de casos de uso dispersos en Google Docs (última versión del 27/09/2026, módulos A–F y T) y al PDF `docs/casos-de-uso.pdf`. Está escrito a partir de las reglas vigentes en [decisiones-casos-de-uso.md](../decisiones-casos-de-uso.md), el glosario [CONTEXT.md](../../CONTEXT.md), los ADR y el código del repo al día de hoy.

**Cómo leerlo**

- Cada caso de uso tiene actor, precondiciones, flujo principal, flujos alternativos (reglas que cambian el camino) y postcondición.
- **Estado** dice si hoy está en el código: `Implementado` o `Pendiente`. Un caso pendiente es parte del alcance igual; solo no está programado todavía.
- Los términos en negrita son los del glosario: un partido **se cae**, una inscripción se **da de baja**, un **Aviso** es la campanita. No se usan sinónimos.

**Qué no es un caso de uso acá**: abrir una pantalla sin tomar ninguna decisión (ver un `loading`, navegar el menú), ni las reglas que la app calcula sola (estado del torneo, vencimientos, faltas). Esas reglas van en la sección [Reglas transversales](#reglas-transversales-lo-que-calcula-el-sistema), porque cruzan varios casos.

---

## Actores

| Actor | Quién es |
|---|---|
| **Invitado** | Navega sin iniciar sesión. Ve el catálogo, las fichas y las páginas públicas; no gestiona nada. |
| **Usuario** | Tiene sesión. Una sola cuenta por persona, con la que puede ser jugador, capitán y organizador a la vez. |
| **Jugador** | Usuario que integra el **Plantel** de un equipo. Mira lo del equipo; no opera. |
| **Capitán** | Único miembro de un equipo que lo gestiona y actúa en su nombre en todo el módulo de Partidos. |
| **Organizador** | Usuario que publicó al menos un torneo. Lo gestiona desde el **Panel de organizador** ("Mis torneos"). No tiene ningún poder de administración. |
| **Administrador** | Integrante del equipo de Torneos BA. El rol se asigna a mano en la base, nunca desde la app. Modera desde el **Panel de administración**. |
| **Sistema** | La app calculando estados y plazos al momento de leer. No hay tareas programadas: nada ocurre "a las 48 h", ocurre cuando alguien mira la pantalla. |

Límite de producto que atraviesa todo: **la app nunca inscribe ni cobra**. Todo flujo de torneos termina en un deep link a WhatsApp o Instagram del organizador, y toda coordinación de partido se arregla por WhatsApp. La app registra lo acordado.

---

## Módulo A — Cuenta y acceso

### UC-A01 · Crear cuenta

- **Actor:** Invitado.
- **Precondiciones:** ninguna.
- **Flujo principal:**
  1. El invitado abre "Crear cuenta" desde la barra o desde un link que exige sesión.
  2. Completa email, contraseña y **nombre** (el nombre es público, así que no se deriva del email).
  3. El sistema crea la cuenta y la sesión en el acto, sin confirmar el email.
  4. Si llegó con un destino pendiente (`next`), vuelve a esa pantalla; si no, al catálogo.
- **Flujos alternativos:**
  - **A1. Llega desde "¿Organizás torneos? Publicalo":** la pantalla muestra "Para publicar un torneo necesitás una cuenta" y conserva el destino al panel. Con cualquier otro destino no hay aviso.
  - **A2. Destino externo:** solo se aceptan rutas internas. `//sitio.com` empieza con `/` pero es externa y también se rechaza; se vuelve al catálogo.
  - **A3. Email ya registrado o datos inválidos:** se muestra el error y no se crea nada.
- **Postcondición:** existe el perfil con nombre; el usuario está dentro.
- **Estado:** Implementado (`src/app/login`). No hay confirmación de email ni bloqueo por intentos: lo cubre Supabase.

### UC-A02 · Iniciar sesión

- **Actor:** Invitado.
- **Precondiciones:** tiene cuenta.
- **Flujo principal:**
  1. Abre "Iniciar sesión" (texto en la barra) o es redirigido por intentar entrar a una ruta protegida (`/crear-torneo`, `/mis-torneos`, `/perfil`, `/crear-equipo`, `/mis-equipos`, `/partidos`).
  2. Ingresa email y contraseña.
  3. El sistema valida y lo lleva al destino pendiente, o al catálogo.
- **Flujos alternativos:**
  - **A1. Credenciales inválidas:** mensaje de error, sigue sin sesión.
  - **A2. Destino inválido:** misma regla que UC-A01 A2.
- **Postcondición:** sesión abierta en ese dispositivo.
- **Estado:** Implementado.

### UC-A03 · Cerrar sesión

- **Actor:** Usuario.
- **Flujo principal:** elige "Cerrar sesión" en el menú de usuario; el sistema cierra **solo la sesión del dispositivo actual** y vuelve al catálogo.
- **Estado:** Implementado (`signOut({ scope: 'local' })`).

### UC-A04 · Recuperar contraseña

- **Actor:** Invitado.
- **Flujo principal:** pide el enlace de recuperación por email, lo abre y define una contraseña nueva.
- **Reglas:** sería el **único email que manda la app**. El SMTP gratuito de Supabase alcanza para la entrega académica; con usuarios reales hace falta un servicio aparte.
- **Estado:** Pendiente, a propósito (decisión del 27/09/2026: primero producto, después infraestructura de auth).

### UC-A05 · Editar perfil

- **Actor:** Usuario.
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. Abre "Mi perfil" desde el menú de usuario.
  2. Edita nombre, foto (JPG/PNG/WebP, máx. 2 MB), **Zona** y WhatsApp.
  3. Guarda. El sistema normaliza el WhatsApp a solo dígitos en formato argentino de celular (`549` + 10 dígitos, lo que pide `wa.me`).
- **Flujos alternativos:**
  - **A1. Foto nueva:** reemplaza a la anterior; no hay galería. Si el guardado falla, se conserva la anterior y se retira la subida nueva.
  - **A2. WhatsApp vacío siendo capitán:** el capitán de un equipo no disuelto no puede dejarlo vacío (sí cambiarlo), porque el rival lo necesita para coordinar.
  - **A3. Rol:** el rol de administrador no aparece en el formulario y no se puede editar desde la app.
- **Postcondición:** perfil actualizado; el nombre y la foto se ven en la página del organizador y en los partidos.
- **Estado:** Implementado (`src/app/perfil`).

### UC-A06 · Ver avisos (campanita)

- **Actor:** Usuario.
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. Ve el número rojo con los **Avisos** no leídos en la barra.
  2. Abre la campanita: se listan los últimos 30, cada uno con texto, link y fecha.
  3. Abrir la campanita marca como leídos todos los que se ven.
  4. Toca un aviso y va a donde está el estado actual (Partidos, el equipo).
- **Reglas:**
  - El aviso no tiene botones: toda acción se hace en la pantalla de destino, que valida las reglas. El aviso es un puntero, no la fuente de verdad.
  - El texto se arma en el momento del hecho y no cambia aunque el rival cambie de nombre.
  - No se borran ni se archivan. No existe email ni push.
  - Todo aviso que abre un plazo dice cuándo vence y qué pasa si no se responde.
- **Estado:** Implementado (`NoticeBell`, `src/app/avisos`). La lista cerrada de disparadores está en [Avisos](#avisos-lista-cerrada-de-disparadores).

---

## Módulo B — Catálogo de torneos (público)

### UC-B01 · Ver catálogo de torneos

- **Actor:** Invitado (y cualquier usuario).
- **Precondiciones:** ninguna. `/` es el catálogo.
- **Flujo principal:**
  1. Entra a la portada.
  2. El sistema lista los torneos no finalizados, paginados, ordenados por fecha de inicio.
  3. Cada card muestra **Flyer** (o un marcador con el nombre), nombre, zona, modalidad, precio, **Estado del torneo** y **Antigüedad de verificación**.
- **Flujos alternativos:**
  - **A1. Precio:** vacío se muestra como "Consultar"; 0, como "Gratis".
  - **A2. Antigüedad de verificación:** desde 30 días completos sin verificar, en ámbar; desde 60, en rojo con "sin confirmar".
  - **A3. Últimos cupos:** etiqueta sobre un torneo **Abierto** con 2 lugares o menos. No es un estado.
  - **A4. Finalizados:** solo aparecen si se filtra explícitamente por ese estado.
- **Estado:** Implementado (`src/app/page.tsx`, `TournamentList`, `TournamentCard`).

### UC-B02 · Filtrar torneos y compartir la búsqueda

- **Actor:** Invitado.
- **Precondiciones:** está en el catálogo.
- **Flujo principal:**
  1. Abre los filtros (panel en el celular, columna lateral en pantalla grande).
  2. Elige modalidad, estado, zona o **Corredor**, precio máximo y fechas de inicio.
  3. El sistema combina todos los filtros (AND), los escribe en la URL y vuelve a la página 1.
  4. Copia la URL y la comparte; quien la abre ve el mismo listado con los mismos filtros activos.
- **Flujos alternativos:**
  - **A1. Corredor:** elegir un corredor incluye todas sus zonas.
  - **A2. Parámetro desconocido en la URL:** se ignora solo ese filtro, se mantienen los válidos y la página no se rompe.
  - **A3. Sin resultados:** mensaje "No hay torneos con esos filtros" y la opción de limpiar.
- **Regla de diseño:** los filtros viven en la URL, nunca en estado local; una vista filtrada es siempre un link compartible.
- **Estado:** Implementado (`Filters`, `ZoneSelect`).

### UC-B03 · Ver ficha pública de un torneo

- **Actor:** Invitado.
- **Precondiciones:** el torneo existe y no fue dado de baja.
- **Flujo principal:**
  1. Elige un torneo del catálogo.
  2. El sistema muestra flyer, nombre, organizador (con link a su página), modalidad, zona, dirección de la sede (abre el mapa), cierre de inscripción, inicio y fin, precio, estado, descripción, reglamento, antigüedad de verificación, cupo e inscriptos, y los **nombres** de los equipos anotados.
  3. Debajo del precio y las fechas aparecen los botones de contacto (UC-B04).
- **Flujos alternativos:**
  - **A1. Torneo dado de baja:** la ficha devuelve 404 con un link al catálogo.
  - **A2. Torneo finalizado:** se muestra la ficha, pero sin botones de contacto ("Este torneo ya terminó").
  - **A3. Es el organizador:** la ficha es idéntica a la de cualquiera, más una barra arriba "Este torneo es tuyo · Gestionar".
  - **A4. Compartir:** la URL es estable y la página tiene metadatos (flyer, nombre, zona) para la vista previa en WhatsApp.
- **Estado:** Implementado (`src/app/torneos/[id]`). Los inscriptos salen de una vista pública que expone solo nombres (ver [Visibilidad](#visibilidad)).

### UC-B04 · Contactar al organizador

- **Actor:** Invitado.
- **Precondiciones:** el torneo no está finalizado y tiene al menos un contacto.
- **Flujo principal (WhatsApp):**
  1. Toca "Contactar por WhatsApp".
  2. El sistema abre `wa.me` con el número del organizador y el mensaje sugerido ("Hola, vi el torneo [nombre] en Torneos BA y quiero anotar a mi equipo").
  3. El usuario edita si quiere y envía desde WhatsApp. **Acá termina el flujo en la app**: la inscripción se arregla afuera y la carga el organizador (UC-E06).
- **Flujo principal (Instagram):** toca "Ver Instagram" y el sistema abre el perfil del organizador.
- **Flujos alternativos:**
  - **A1. Falta un medio:** ese botón no se muestra.
  - **A2. No hay ninguno:** se muestra "El organizador no suministró datos de contacto directo" (solo puede pasar con torneos viejos: al publicar es obligatorio al menos uno).
- **Estado:** Implementado.

### UC-B05 · Ver página pública del organizador

- **Actor:** Invitado.
- **Flujo principal:** desde una ficha toca el nombre del organizador; ve nombre, foto, zona, "Organiza desde…" y sus torneos (incluidos los finalizados, que son su trayectoria).
- **Reglas:** no se muestra ningún contacto personal del organizador; el contacto es siempre el de cada torneo.
- **Estado:** Implementado (`src/app/organizadores/[id]`).

### UC-B06 · Reportar un torneo

- **Actor:** Usuario.
- **Precondiciones:** sesión; no reportó antes ese torneo.
- **Flujo principal:**
  1. En la ficha toca "Reportar".
  2. Elige un motivo: "Ya no existe", "Datos incorrectos" o "No es un torneo".
  3. El sistema guarda el **Reporte** para el administrador (UC-F03).
- **Flujos alternativos:** **A1.** Una sola vez por usuario y torneo; el segundo intento se rechaza.
- **Postcondición:** el reporte queda pendiente en el panel de administración. Cada usuario ve solo los suyos.
- **Estado:** Pendiente.

---

## Módulo C — Equipos

### UC-C01 · Crear equipo

- **Actor:** Usuario.
- **Precondiciones:** sesión, WhatsApp cargado en el perfil, menos de 3 equipos como capitán, sin **Suspensión**.
- **Flujo principal:**
  1. Abre "Mis equipos" y elige crear.
  2. Carga nombre, zona, modalidad habitual y nivel (recreativo, intermedio o competitivo). El escudo es opcional (JPG/PNG/WebP, máx. 2 MB).
  3. El sistema crea el equipo con el usuario como **Capitán** y único miembro del **Plantel**.
- **Flujos alternativos:**
  - **A1. Sin WhatsApp:** se rechaza y se lo manda al perfil.
  - **A2. Ya capitanea 3:** se rechaza. Cuentan las capitanías actuales, creadas o recibidas; los disueltos no cuentan.
  - **A3. Nombre repetido:** se permite; públicamente se distingue por la zona.
- **Estado:** Implementado (`src/app/crear-equipo`).

### UC-C02 · Invitar jugadores al equipo

- **Actor:** Capitán.
- **Precondiciones:** equipo no disuelto.
- **Flujo principal:**
  1. En la página del equipo ve el link de invitación y lo copia.
  2. Lo comparte por fuera (WhatsApp del grupo).
- **Flujos alternativos:**
  - **A1. Regenerar:** crea un link nuevo e invalida el anterior.
  - **A2. Vencimiento:** cada link vale 7 días.
- **Estado:** Implementado (`regenerateInvite`, `CopyLinkButton`).

### UC-C03 · Unirse a un equipo con el link

- **Actor:** Usuario.
- **Precondiciones:** tiene un link vigente.
- **Flujo principal:**
  1. Abre `/unirse/<token>`. Si no tiene sesión, pasa por UC-A01/UC-A02 y vuelve.
  2. El sistema lo suma al plantel y lo lleva a la página del equipo.
- **Flujos alternativos:**
  - **A1. Link vencido o regenerado:** mensaje de link vencido.
  - **A2. Equipo disuelto:** mismo mensaje que vencido.
  - **A3. Ya está en el plantel:** sin error, va a la página del equipo.
  - **A4. Usuario suspendido:** puede sumarse, pero no podrá recibir la capitanía.
- **Postcondición:** el jugador ve el plantel y los partidos del equipo, sin poder operar.
- **Estado:** Implementado (`src/app/unirse/[token]`).

### UC-C04 · Ver página pública del equipo

- **Actor:** Invitado.
- **Flujo principal:** abre `/equipos/<id>` y ve escudo, nombre, zona, modalidad, nivel, cantidad de jugadores, estrellas ("★ 4,3 (12)" o "Sin calificaciones"), el contador de historial ("Jugó 12 · 1 falta · 2 conflictos (con 2 rivales distintos)") y los **últimos 5 partidos cerrados**.
- **Reglas del historial:**
  - "Jugó" suma solo partidos **Jugados** (con o sin resultado). Las faltas se muestran aunque sean 0; los conflictos, solo si hay.
  - Cada fila: fecha, "vs" rival con zona y link, y el desenlace: "Ganó 3–1" / "Perdió 0–2" / "Empató 1–1" / "Jugado, sin resultado" / `Se cayó · lo tiró X: "motivo" · falta para X` / `Se cayó de común acuerdo: "motivo"` / `En conflicto · X: "no vinieron" · Y: "fuimos"` / "X no se presentó · falta para X".
  - Los equipos se nombran siempre por su nombre y zona actuales, nunca "Nosotros".
  - El promedio de estrellas cuenta solo calificaciones reveladas.
- **Flujos alternativos:**
  - **A1. Miembro del plantel:** además ve los nombres del plantel y, si es capitán, las acciones de gestión (UC-C02, C05 a C09).
  - **A2. Equipo disuelto:** la página sigue, marcada como disuelta, con su historia.
- **Estado:** Implementado (`src/app/equipos/[id]`, vistas `team_history`).

### UC-C05 · Editar equipo

- **Actor:** Capitán.
- **Precondiciones:** equipo no disuelto.
- **Flujo principal:** edita nombre, escudo, zona, modalidad habitual y nivel; guarda.
- **Flujos alternativos:** **A1.** Dejar vacío el archivo conserva el escudo; se puede reemplazar o quitar. **A2.** Cambiar zona o nivel cambia en el acto la cercanía y el nivel con que el equipo aparece en los compatibles: la búsqueda no los guarda.
- **Estado:** Implementado (`/equipos/[id]/editar`).

### UC-C06 · Pasar la capitanía

- **Actor:** Capitán.
- **Precondiciones:** el destinatario está en el plantel, tiene WhatsApp en el perfil, no está suspendido y capitanea menos de 3 equipos. El capitán actual no está suspendido.
- **Flujo principal:** elige a un jugador del plantel y confirma. El sistema lo hace capitán; el anterior queda como jugador.
- **Reglas:**
  - **Nunca se bloquea por partidos en curso:** las búsquedas, propuestas y partidos son del equipo. El capitán nuevo opera todo lo pendiente, incluido un pedido de caída de común acuerdo sin responder. El anterior deja de ver las propuestas y sigue viendo los partidos.
  - El nuevo capitán no hereda los **Avisos** del anterior: ve lo pendiente en Partidos.
- **Estado:** Implementado (`transferCaptaincy`).

### UC-C07 · Sacar a un jugador del plantel

- **Actor:** Capitán.
- **Flujo principal:** elige a un jugador y lo saca. Quien sale deja de ver los partidos del equipo y conserva los avisos que ya recibió.
- **Flujos alternativos:** **A1.** No se puede sacar a sí mismo: primero tiene que pasar la capitanía (UC-C06).
- **Estado:** Implementado (`removeMember`).

### UC-C08 · Salir del equipo

- **Actor:** Jugador.
- **Flujo principal:** desde la página del equipo elige salir y confirma.
- **Flujos alternativos:** **A1.** El capitán no puede salir sin antes pasar la capitanía.
- **Estado:** Implementado (`leaveTeam`).

### UC-C09 · Disolver equipo

- **Actor:** Capitán.
- **Precondiciones:** el equipo no tiene ningún partido por jugarse ni esperando resultado.
- **Flujo principal:**
  1. Elige "Disolver" y confirma.
  2. El sistema marca el equipo como **Equipo disuelto**: conserva su página, su plantel, su escudo y su historia, pero ya no puede operar.
  3. Se cancelan sus búsquedas de rival activas, como si el capitán las cancelara una por una: caen sus propuestas pendientes (enviadas y recibidas) con el aviso "Se canceló tu propuesta" al otro lado.
  4. Los links de invitación dejan de valer.
- **Flujos alternativos:**
  - **A1. Partido sin terminar:** se rechaza con el mensaje de que primero lo tire o cierre el resultado. Así el rival no queda esperando y un equipo acusado de no presentarse no se escapa disolviéndose.
  - **A2. Calificaciones:** un partido **Jugado** se sigue pudiendo calificar hasta que venzan los 7 días, aunque uno de los dos se haya disuelto.
- **Postcondición:** no se reactiva. Si vuelven, crean un equipo nuevo. Deja de contar para el tope de 3 capitanías.
- **Estado:** Implementado (`dissolveTeam`).

### UC-C10 · Reportar un equipo

- **Actor:** Capitán o jugador de un equipo que jugó al menos un partido contra el reportado.
- **Flujo principal:** en la página del equipo toca "Reportar", elige el motivo ("Violencia o agresiones", "Cuenta falsa" o "Abuso de calificaciones") y lo envía al administrador (UC-F04).
- **Reglas:** la responsabilidad por la conducta del plantel es del capitán: la eventual **Suspensión** recae sobre él. El botón solo aparece con sesión y con un partido jugado en común.
- **Estado:** Pendiente.

---

## Módulo D — Partidos (buscar rival)

Todo este módulo lo opera **solo el Capitán**. El plantel ve los partidos de sus equipos sin botones. Las búsquedas y las propuestas las ve solo el capitán. Si otro jugador tiene que encargarse, se pasa la capitanía (UC-C06).

Las dos pantallas son `/partidos` (lo que tenés: propuestas recibidas, próximo partido, partidos esperando resultado, "Más adelante" e historial plegado) y `/partidos/buscar` (lo que querés: equipo, modalidad, horarios y rivales compatibles). Muestran todo lo de todos los equipos del usuario juntos.

### UC-D01 · Publicar una búsqueda de rival

- **Actor:** Capitán.
- **Precondiciones:** equipo no disuelto, capitán no suspendido y con WhatsApp en el perfil, equipo sin **Bloqueo por faltas**, y sin otra búsqueda activa del equipo en esa modalidad.
- **Flujo principal:**
  1. Entra a `/partidos/buscar`; elige el equipo (solo si capitanea más de uno) y la modalidad (viene cargada la habitual del equipo).
  2. Carga la primera **Franja**: toca un día en la grilla de 14 días y un **Turno** (Mañana 9–12, Tarde 14–18, Noche 20–23) u "Otro horario" con dos horas enteras. Puede marcar "Repetir la semana que viene".
  3. El sistema guarda la búsqueda con sus franjas y muestra los rivales compatibles (UC-D03).
- **Flujos alternativos:**
  - **A1. Franja inválida:** dura al menos 1 h, va de 8 a 24 sin cruzar la medianoche, es de una sola fecha dentro de los próximos 14 días y, si es hoy, empieza en una hora que no pasó. Si "repetir" cae fuera de los 14 días, se rechaza entera.
  - **A2. Franja que choca:** se rechaza si se superpone con un partido acordado del equipo o con otra franja de la misma búsqueda. Entre búsquedas de distinta modalidad del mismo equipo sí se pueden superponer.
  - **A3. Equipo bloqueado:** en vez del formulario ve hasta cuándo dura el bloqueo.
- **Reglas:** la cercanía y el nivel salen de la zona y el nivel actuales del equipo; la búsqueda guarda solo modalidad y franjas. Publicar no genera ningún aviso.
- **Postcondición:** búsqueda activa mientras le quede alguna franja por empezar; vence sola al pasar la última.
- **Estado:** Implementado (`save_rival_search`).

### UC-D02 · Editar o cancelar la búsqueda

- **Actor:** Capitán.
- **Precondiciones:** tiene una búsqueda activa.
- **Flujo principal (editar):** agrega franjas con "Agregar otro horario" o saca una con la ×. La modalidad no se cambia.
- **Flujo principal (cancelar):** toca "Cancelar la búsqueda" y confirma.
- **Reglas:**
  - Sacar una franja cancela sus propuestas pendientes (enviadas y recibidas) con el aviso "Se canceló tu propuesta" al otro lado. Sacar la última franja cancela la búsqueda.
  - Cancelar la búsqueda cancela todas sus propuestas pendientes, con el mismo aviso. **Los partidos que ya nacieron de ella siguen en pie.**
  - Que nazca un partido no cierra la búsqueda: sigue con sus otras franjas.
- **Estado:** Implementado.

### UC-D03 · Ver rivales compatibles

- **Actor:** Capitán.
- **Precondiciones:** búsqueda activa.
- **Flujo principal:** en `/partidos/buscar` ve una tarjeta por franja en común con cada rival compatible, con el horario en común calculado y el botón "Proponer partido".
- **Reglas de compatibilidad:**
  - Misma modalidad y al menos 1 h en común el mismo día.
  - Los niveles con dos escalones de diferencia (recreativo vs. competitivo) no se cruzan.
  - **Nunca dos equipos del mismo capitán:** no aparecen entre sí.
  - Una **Franja ocupada** (superpuesta con un partido del equipo) sale de los compatibles y no recibe propuestas. Una franja ya empezada también se ignora.
- **Orden:** cercanía (zona > corredor > región), después nivel, después **Presentismo** (faltas en 90 días, de menos a más; sin historial cuenta 0). Los equipos con 2 faltas en 90 días van al final igual. Empate: el horario en común más temprano primero.
- **Estado:** Implementado.

### UC-D04 · Proponer un partido

- **Actor:** Capitán.
- **Precondiciones:** ve al rival en los compatibles.
- **Flujo principal:**
  1. Toca "Proponer partido" en la tarjeta de una franja en común.
  2. El sistema crea la **Propuesta** con el horario en común (la parte compartida de las dos franjas, calculada por la app; nadie elige un rango) y sin mensaje.
  3. El capitán rival recibe el aviso "Te propusieron un partido". La tarjeta del proponente pasa a "Propuesta enviada".
- **Flujos alternativos:**
  - **A1. Ya hay una pendiente al mismo rival para el mismo horario:** se rechaza.
  - **A2. Mismo capitán de los dos lados:** se rechaza.
  - **A3. Propuesta anterior ya cerrada:** la tarjeta muestra qué pasó ("Tu propuesta venció", "Rechazaron tu propuesta") y se puede volver a proponer.
- **Reglas:** sin límite de propuestas pendientes por equipo. La propuesta vence a las 72 h o cuando **empieza** su rango, lo que ocurra primero; vencer no avisa.
- **Estado:** Implementado (`send_proposal`).

### UC-D05 · Cancelar una propuesta enviada

- **Actor:** Capitán que la mandó.
- **Precondiciones:** la propuesta está pendiente.
- **Flujo principal:** toca "Cancelar" en la tarjeta. El sistema la cierra **sin aviso**: el rival deja de verla al entrar. Se puede volver a proponer.
- **Regla:** solo avisan las cancelaciones en cascada (sacar una franja, cancelar la búsqueda, disolver, bloqueo).
- **Estado:** Implementado (misma RPC `respond_proposal` que rechazar; el sistema distingue por quién la llama).

### UC-D06 · Aceptar o rechazar una propuesta

- **Actor:** Capitán que la recibió.
- **Precondiciones:** la propuesta está pendiente (no venció ni la cancelaron).
- **Flujo principal (aceptar):**
  1. En `/partidos` ve "**Real Floresta** te propone jugar Sáb 7 · 20 a 22 h" con **Aceptar** y **Rechazar**.
  2. Acepta. El sistema crea el **Partido** con ese rango y lo deja **A coordinar**.
  3. Los dos planteles reciben "Partido acordado". Cada capitán ve el WhatsApp del otro (siempre el del capitán actual) mientras el partido esté por jugarse.
  4. Las franjas de los dos equipos que se superponen con el partido quedan **ocupadas** enteras.
  5. Se anulan todas las propuestas pendientes de los dos equipos (enviadas y recibidas) que se superponen con ese horario, con el aviso "Se anuló tu propuesta: ya no tienen ese horario" al capitán del otro lado de cada una. Si la anulada era entre estos mismos dos equipos (la que venía en sentido contrario), no hay aviso: ya les llegó "Partido acordado".
- **Flujo principal (rechazar):** el sistema cierra la propuesta y avisa "Rechazaron tu propuesta" al que la mandó.
- **Flujos alternativos:**
  - **A1. Alguno de los dos ya tiene un partido en ese horario:** se rechaza la aceptación. **Nunca dos partidos superpuestos.**
  - **A2. Equipo bloqueado por faltas:** la propuesta figura cancelada, sin botones, con la nota "el equipo está bloqueado por faltas", hasta cuando vencería. Es la única forma de que el rival se entere, porque el bloqueo no avisa.
- **Postcondición (aceptar):** partido por jugarse; las horas que ocupa son siempre el rango de la propuesta.
- **Estado:** Implementado (`respond_proposal`).

### UC-D07 · Coordinar cancha y hora

- **Actor:** cualquiera de los dos capitanes.
- **Precondiciones:** partido por jugarse y **antes del inicio del rango**.
- **Flujo principal:**
  1. Los capitanes arreglan por WhatsApp (la app no negocia).
  2. Uno carga la **cancha** (texto libre, obligatorio, hasta 120 caracteres; la app lo muestra con "Ver en el mapa") y la **hora exacta** (de a 15 min, desde el inicio del rango incluido hasta el fin excluido: en 20 a 22, de 20:00 a 21:45).
  3. El capitán rival recibe "Confirmá cancha y hora" y lo ve abierto en la fila con un botón para **confirmar** o **corregir**.
  4. Si confirma, el partido queda **Coordinado** y los dos planteles reciben "Partido coordinado" con cancha y hora. Si corrige, le toca confirmar al primero.
- **Flujos alternativos:**
  - **A1. Cambiar después de Coordinado:** cualquiera vuelve a cargar cancha y hora; el partido deja de estar Coordinado y le toca confirmar al otro. Mientras no se confirme, la **Hora de inicio** vuelve a ser el inicio del rango. Los "Vamos" ya dados no se borran.
  - **A2. Inicio del rango pasado:** ya no se carga, confirma ni corrige, aunque la hora coordinada sea más tarde. Si no, corregir a las 20:30 un partido de 20 a 22 coordinado a las 21 lo des-coordinaría y ya habría empezado.
  - **A3. Para cambiar de día:** se tira el partido y se propone de nuevo.
- **Reglas:** coordinar es una ayuda, no un requisito. Un partido que llega a su hora sin coordinar sigue el flujo normal (UC-D11).
- **Estado:** Implementado (`coordinate_match`).

### UC-D08 · Confirmar asistencia

- **Actor:** cada capitán.
- **Precondiciones:** faltan 24 h o menos para la **Hora de inicio** y el partido está por jugarse.
- **Flujo principal:**
  1. Al entrar ve "¿Confirmás que van?" con **Vamos** y **No vamos**.
  2. Toca "Vamos". Cuando los dos lo hicieron, el partido queda **Confirmado**. No hay aviso de esto, a propósito.
- **Flujos alternativos:**
  - **A1. "No vamos":** abre el formulario de tirar el partido con el aviso "Suma una falta a tu equipo" (UC-D09).
  - **A2. Desde 12 h antes, si el rival no confirmó:** se muestra "El rival todavía no confirmó" (sin aviso: lo ve al entrar).
  - **A3. Nadie confirma:** no pasa nada, el partido sigue en pie.
- **Estado:** Implementado (`confirm_going`).

### UC-D09 · Tirar el partido

- **Actor:** cualquiera de los dos capitanes.
- **Precondiciones:** partido por jugarse, antes de la **Hora de inicio**.
- **Flujo principal:**
  1. Toca "Tirar el partido" (o "Tirar el partido (suma falta)" si faltan menos de 24 h).
  2. Escribe el **motivo** (obligatorio, 1 a 140 caracteres; queda visible en el historial público, nadie lo modera).
  3. El sistema marca el **Partido caído** y avisa "Se cayó el partido" a los dos planteles, con el motivo y, si suma falta, a quién.
- **Reglas:**
  - Con **menos de 24 h** para la hora de inicio, suma una **Falta** al equipo que lo tiró, desde el momento en que lo tiró. Con 24 h justas, todavía no.
  - Las franjas que el partido ocupaba se liberan.
  - Un partido caído entra al historial del equipo desde que se tira, aunque su fecha no haya llegado.
- **Flujos alternativos:** **A1.** Con menos de 24 h, en vez de tirarlo solo puede pedir una **Caída de común acuerdo** (UC-D10).
- **Estado:** Implementado (`drop_match`).

### UC-D10 · Caída de común acuerdo

- **Actor:** el capitán que la pide; el capitán rival responde.
- **Precondiciones:** faltan menos de 24 h (con más, tirarlo no suma falta y no se ofrece); nadie pidió una antes en este partido; antes de la hora de inicio.
- **Flujo principal:**
  1. El capitán pide tirarlo de común acuerdo, con su motivo. El rival recibe "Piden tirar el partido de común acuerdo".
  2. El rival ve el pedido abierto en la fila y **acepta**: el partido se cae con ese motivo, **sin falta para nadie**, y los dos planteles reciben "Se cayó de común acuerdo". En el historial figura como tirado de común acuerdo.
- **Flujos alternativos:**
  - **A1. Rechaza:** el partido sigue en pie; el que pidió recibe "Rechazaron tirarlo de común acuerdo" y todavía puede tirarlo solo, con la falta (UC-D09). **No se vuelve a pedir** (ninguno de los dos).
  - **A2. No responde antes de la hora de inicio:** el partido sigue en pie; el que pidió puede tirarlo solo con la falta.
  - **A3. Cambio de capitán en el medio:** el nuevo capitán responde el pedido pendiente.
- **Estado:** Implementado (`request_mutual_drop`, `answer_mutual_drop`).

### UC-D11 · Cargar el resultado

- **Actor:** cada capitán.
- **Precondiciones:** pasó la **Hora de inicio**; el partido está **esperando resultado**.
- **Flujo principal:**
  1. En "Contanos cómo salió" carga los goles como un marcador (0 a 99 por lado, equipo propio a la izquierda).
  2. El capitán rival recibe "Cargaron el resultado: confirmá o corregí" con el vencimiento.
  3. El rival confirma (carga el mismo resultado espejado): el partido queda **Jugado** con ese resultado y los dos planteles reciben "Jugado". Se habilita la calificación (UC-D13).
- **Flujos alternativos (plazos de 48 h, calculados al leer):**
  - **A1. El rival no hace nada en 48 h:** Jugado con el resultado cargado. Sin aviso: quedar Jugado por vencimiento no avisa.
  - **A2. Resultados distintos:** 48 h para corregir, contadas desde la última carga de cualquiera. Cada corrección le da al otro 48 h enteras; no hay tope. Si siguen sin coincidir al vencer, **Jugado sin resultado**.
  - **A3. Nadie carga nada en 48 h desde el fin del rango:** Jugado sin resultado, sin falta para nadie.
  - **A4. Cargar un resultado equivale a decir "fuimos":** si el rival reportó "no vinieron" (antes o después), el partido queda **en conflicto** (UC-D12).
- **Reglas:** quien cargó un resultado ya no reporta "no vinieron" (solo corrige). Un partido Jugado, en conflicto o con falta queda cerrado y no se corrige más.
- **Estado:** Implementado (`report_result`).

### UC-D12 · Reportar que el rival no se presentó

- **Actor:** el capitán que reporta; el capitán acusado responde.
- **Precondiciones:** pasó la hora de inicio; el que reporta no cargó resultado.
- **Flujo principal:**
  1. Toca "No vinieron" (link chico al lado de cargar el resultado).
  2. El capitán acusado recibe "Dicen que no fueron: respondé antes del [fecha] o suman una falta".
  3. Si no responde en 48 h, el partido cierra como **no presentado** y el ausente suma una **Falta**, firme desde que venció el plazo. Sin aviso: es por el paso del tiempo.
- **Flujos alternativos:**
  - **A1. El acusado responde "fuimos" (o carga un resultado):** el partido queda **en conflicto**: sin falta para nadie, los dos equipos suman un **Conflicto** visible en su página con las dos versiones, y los dos planteles reciben "Partido en conflicto".
  - **A2. Los dos reportan "no vinieron":** también en conflicto. Acusar de vuelta cuesta lo mismo que negar (ADR 0002, revisión del 27/10/2026).
- **Reglas:** nadie arbitra; el administrador no interviene en partidos ([ADR 0002](../adr/0002-conflictos-sin-arbitro.md)). Quien reportó ya no carga resultado. Un partido en conflicto no se califica.
- **Estado:** Implementado (`report_no_show`, `reply_went`).

### UC-D13 · Calificar al rival

- **Actor:** Capitán.
- **Precondiciones:** el partido está **Jugado** (con o sin resultado) y no pasaron 7 días desde que quedó Jugado.
- **Flujo principal:**
  1. Toca "Calificar" en la fila del partido.
  2. Pone de 1 a 5 estrellas y, opcionalmente, un comentario de hasta 500 caracteres (privado; solo lo lee el administrador al revisar un equipo reportado).
  3. El sistema guarda una calificación por equipo y partido. No se edita.
- **Reglas de revelación (para que nadie califique en represalia):**
  - Cada capitán ve la que le pusieron recién cuando los dos calificaron o vencieron los 7 días.
  - Cuando la segunda calificación revela las dos, el que calificó primero recibe "Ya podés ver tu calificación". Revelar por vencimiento no avisa.
  - El promedio público cuenta solo calificaciones reveladas.
- **Flujos alternativos:** **A1.** Partido caído, en conflicto o con falta: no se califica. **A2.** Equipo disuelto: se sigue calificando hasta vencer los 7 días.
- **Estado:** Implementado (`rate_rival`).

### UC-D14 · Ver mis partidos

- **Actor:** Capitán o Jugador.
- **Flujo principal:** entra a `/partidos` y ve, de arriba abajo, las propuestas recibidas (solo capitán), el próximo partido en grande (cuándo, contra quién, dónde o "Falta cancha y hora", con una sola acción visible), los partidos esperando resultado, los otros por jugarse e historial plegado con los cerrados ("Ganamos", "Perdimos", "Empatamos", "Se cayó", "En conflicto", "Falta").
- **Reglas:**
  - El jugador ve todo sin botones. El WhatsApp del capitán rival lo ve solo el capitán, con un partido acordado.
  - Lo que pide una respuesta va abierto en la fila con un solo botón primario; lo que no, plegado detrás de un link.
  - Todo lo pendiente se ve acá, haya o no aviso: esta pantalla es la fuente de verdad.
- **Flujos alternativos:** **A1.** Sin equipo o sin partidos: estado vacío que lleva a Buscar rival (si es capitán) o a Mis equipos.
- **Estado:** Implementado.

---

## Módulo E — Organizador

### UC-E01 · Publicar un torneo

- **Actor:** Usuario (pasa a ser **Organizador** al publicar).
- **Precondiciones:** sesión, sin **Suspensión**.
- **Flujo principal:**
  1. Llega a "Cargar torneo" desde el menú o desde "¿Organizás torneos? Publicalo" (al pie del catálogo y en el footer).
  2. Completa los **obligatorios**: nombre, modalidad (F5, F7, F8, F11), zona, cierre de inscripción, inicio y fin, dirección de la sede, y al menos un contacto (WhatsApp o Instagram). **Opcionales**: precio, flyer (JPG/PNG/WebP, máx. 3 MB), cupo, descripción, reglamento.
  3. El sistema valida **cierre ≤ inicio ≤ fin** y guarda el torneo con el usuario como organizador. El flyer se sube después del alta, como `flyers/<id>`, para no dejar archivos huérfanos.
  4. El torneo nace verificado y aparece en el catálogo con su estado calculado.
- **Flujos alternativos:**
  - **A1. Fechas fuera de orden, sin dirección o sin contacto:** no guarda y marca el error.
  - **A2. Carga manual de torneos de Instagram:** alguien del equipo los carga con su propia cuenta, como organizador común, poniendo el contacto del organizador real. No existe un torneo "copiado" sin organizador (descartado el 07/10/2026).
- **Postcondición:** el torneo tiene exactamente un organizador; el usuario ve "Mis torneos" en su menú.
- **Estado:** Implementado (`src/app/crear-torneo`).

### UC-E02 · Ver mis torneos (Panel de organizador)

- **Actor:** Organizador.
- **Flujo principal:** abre "Mis torneos" y ve una fila por torneo (nombre, zona, modalidad, cupo, estado, antigüedad de verificación) con dos acciones: "Sigue vigente" y "Gestionar".
- **Reglas de orden:** primero los que llevan 30 días o más sin verificar, del más viejo al más nuevo; los **Finalizados** al final, sin antigüedad ni botón de verificar.
- **Niveles del panel:** (1) esta lista; (2) la pantalla de gestión de cada torneo, con cabecera (números clave, "Ver ficha pública", "Sigue vigente"), pestañas **Datos** e **Inscripciones**, y "Dar de baja" al final, aparte; (3) la ficha pública (UC-B03 A3).
- **Estado:** Implementado (`src/app/mis-torneos`).

### UC-E03 · Editar un torneo

- **Actor:** Organizador del torneo.
- **Precondiciones:** es el dueño.
- **Flujo principal:** en la pestaña Datos edita cualquier campo del formulario (incluido reemplazar el flyer) con las mismas validaciones de UC-E01 y guarda; vuelve a la pantalla de gestión.
- **Reglas:** **editar no cuenta como verificar**: la antigüedad de verificación no se reinicia. Subir el cupo es la forma de admitir más inscripciones cuando está completo.
- **Estado:** Implementado (`/mis-torneos/[id]/editar`).

### UC-E04 · Verificar que el torneo sigue vigente

- **Actor:** Organizador del torneo.
- **Precondiciones:** el torneo no está Finalizado.
- **Flujo principal:** toca "Sigue vigente" (en la lista o en la gestión). El sistema reinicia la **Antigüedad de verificación**; el torneo vuelve a mostrarse sin ámbar ni rojo.
- **Reglas:** no saca la marca **Observado**, que solo quita el administrador.
- **Estado:** Implementado (`verifyTournament`).

### UC-E05 · Dar de baja un torneo

- **Actor:** Organizador del torneo (o Administrador, UC-F03).
- **Precondiciones:** el torneo está Abierto, Cerrado o En curso. **Nunca Finalizado**: los finalizados son la trayectoria del organizador.
- **Flujo principal:**
  1. En la pantalla de gestión toca "Dar de baja".
  2. Confirma con el nombre del torneo y la cantidad de equipos anotados (aunque sea 0): no se puede deshacer.
  3. El sistema retira el torneo: desaparece del catálogo, su ficha devuelve 404 y se borra el flyer de Storage.
  4. Cada jugador del plantel de cada equipo con **Inscripción vinculada** recibe un único aviso (aunque esté en dos equipos anotados) con link a la página del equipo: "Se dio de baja el torneo 'X', en el que estaba anotado tu equipo. Hablá con el organizador por lo que hayas pagado."
- **Estado:** Implementado (`withdrawTournament`, RPC con avisos).

### UC-E06 · Cargar una inscripción

- **Actor:** Organizador del torneo.
- **Precondiciones:** ya arregló todo con el capitán por fuera de la app. El torneo no está Finalizado. Hay lugar en el **Cupo**.
- **Flujo principal:**
  1. En la pestaña Inscripciones elige el tipo:
     - **Inscripción vinculada:** busca un equipo de la app por nombre (se muestra la zona, porque los nombres se repiten) y lo selecciona.
     - **Inscripción por nombre:** escribe el nombre de un equipo que no está en la app.
  2. El sistema la guarda; cuenta para el cupo y aparece por nombre en la ficha pública.
- **Flujos alternativos:**
  - **A1. Cupo completo:** se rechaza y se sugiere subir el cupo desde Editar.
  - **A2. El equipo ya está inscripto en este torneo:** se rechaza (como mucho una vinculada por equipo y torneo).
  - **A3. Equipo disuelto:** no recibe inscripciones.
  - **A4. Torneo Cerrado o En curso:** sí se puede: el organizador sigue acomodando la lista aunque nadie nuevo se inscriba.
- **Reglas:** el capitán no confirma la vinculación. Solo la vinculada genera avisos (hoy, el de baja del torneo) y figura en la historia del equipo. El organizador no ve el WhatsApp del capitán: ya lo tiene, porque el capitán le escribió.
- **Postcondición:** si el cupo se completó, el torneo pasa a **Cerrado**.
- **Estado:** Implementado (`addInscription`, `addLinkedInscription`).

### UC-E07 · Dar de baja una inscripción

- **Actor:** Organizador del torneo.
- **Precondiciones:** el torneo no está Finalizado.
- **Flujo principal:** en Inscripciones toca "Dar de baja" sobre un equipo y confirma. El equipo deja de figurar y libera su lugar.
- **Postcondición:** si el torneo estaba Cerrado por cupo y no pasó el cierre de inscripción, vuelve a **Abierto**.
- **Estado:** Implementado (`removeInscription`).

---

## Módulo F — Administración

El **Administrador** es un rol distinto del organizador. Se asigna insertando el usuario en `public.admins` desde el SQL Editor; no hay registro de administradores ni selección de rol en ningún formulario.

### UC-F01 · Acceder al Panel de administración

- **Actor:** Administrador.
- **Flujo principal:**
  1. Entra a `/admin/login` con la misma cuenta de Supabase.
  2. El servidor verifica el rol con `is_admin()`. Si confirma, entra al backoffice (sidebar propia, sin la barra ni el footer del catálogo).
- **Flujos alternativos:**
  - **A1. Cuenta común:** conserva su sesión normal pero recibe acceso denegado.
  - **A2. No se puede verificar el rol:** acceso denegado.
  - **A3. Entra a `/admin/...` sin sesión:** se lo redirige al login de administrador conservando el destino.
- **Estado:** Implementado (`src/app/admin`).

### UC-F02 · Consultar el tablero

- **Actor:** Administrador.
- **Flujo principal:** en el resumen ve los contadores reales de la plataforma (usuarios, torneos, equipos) y en "Seguridad y acceso", los datos de su propia cuenta.
- **Reglas:** una consulta fallida muestra "No disponible", nunca un cero inventado. Las secciones Usuarios, Torneos y equipos, Reportes, Registro de actividad, Soporte, Avisos y Configuración figuran como pendientes, sin enlaces ficticios.
- **Estado:** Implementado parcialmente (resumen y seguridad); el resto, Pendiente.

### UC-F03 · Resolver un reporte de torneo

- **Actor:** Administrador.
- **Precondiciones:** hay un **Reporte** pendiente (UC-B06).
- **Flujo principal:** abre el reporte y elige una de tres resoluciones:
  - **Descartar** el reporte.
  - **Marcar el torneo como Observado:** la marca se ve en el catálogo y la ficha; solo él la saca ("Sigue vigente" del organizador no la toca).
  - **Dar de baja** el torneo, con las mismas consecuencias que UC-E05 (avisos a los planteles vinculados).
- **Postcondición:** la resolución queda en el registro de acciones (quién, cuándo, qué decidió).
- **Estado:** Pendiente.

### UC-F04 · Resolver un reporte de equipo

- **Actor:** Administrador.
- **Precondiciones:** hay un reporte pendiente sobre un equipo (UC-C10).
- **Flujo principal:** abre el reporte, revisa la página del equipo y los comentarios privados de calificación que recibió, y elige **descartar** o **suspender al capitán** (UC-F05), que responde por la conducta del plantel.
- **Postcondición:** queda en el registro de acciones.
- **Estado:** Pendiente.

### UC-F05 · Suspender una cuenta

- **Actor:** Administrador.
- **Flujo principal:** elige 7 días, 30 días o indefinida, escribe el motivo y confirma. El usuario recibe un aviso con el motivo y un email de contacto (no hay apelación dentro de la app).
- **Efectos de la Suspensión:**
  - Puede entrar y mirar, pero no publicar torneos, crear equipos, buscar rival ni recibir la capitanía.
  - Sus torneos siguen visibles y los puede editar y verificar.
  - Sus búsquedas de rival se cancelan y las propuestas pendientes de su equipo se anulan, con aviso.
  - Sus partidos futuros **se caen** con el motivo "Equipo suspendido" (lo escribe el sistema), sin falta para nadie.
  - Los partidos pendientes de resultado los puede terminar de cargar.
  - Su equipo no aparece en los compatibles, su página sigue visible y **no puede cambiar de capitán** mientras dure.
- **No confundir** con el **Bloqueo por faltas**, que es automático, recae sobre el equipo y no lo decide nadie.
- **Estado:** Pendiente. Hoy la base solo contempla que un suspendido no reciba la capitanía.

### UC-F06 · Buscar usuarios

- **Actor:** Administrador.
- **Flujo principal:** busca por nombre o email y abre la cuenta para ver sus equipos, torneos y reportes, y suspenderla si corresponde.
- **Estado:** Pendiente.

---

## Reglas transversales: lo que calcula el sistema

No son casos de uso porque nadie las ejecuta: la app las calcula cuando alguien mira la pantalla, con la hora actual. No hay tareas programadas ni relojes. Los hechos se guardan con su fecha; los estados salen de funciones de Postgres.

| Regla | Cómo funciona |
|---|---|
| **Estado del torneo** | **Abierto**: no pasó el cierre y hay lugar. **Cerrado**: pasó el cierre sin empezar, o se completó el cupo. **En curso**: entre inicio y fin. **Finalizado**: pasó el fin; sale del catálogo y no se puede dar de baja. |
| **Antigüedad de verificación** | Días completos desde la última verificación: 30 → ámbar, 60 → rojo con "sin confirmar". Crear verifica; editar no. |
| **Búsqueda activa** | No cancelada, con al menos una franja que no empezó, de un equipo no disuelto, no bloqueado y con capitán no suspendido. |
| **Vencimiento de la propuesta** | A las 72 h o al empezar su rango. No avisa. |
| **Hora de inicio** | La hora exacta coordinada, o el inicio del rango. Antes: solo tirar el partido. Después: solo resultado o "no vinieron". |
| **Plazos de 48 h** | Desde la última carga de cualquiera de los dos; si nadie cargó, desde el fin del rango. |
| **Cuándo cuenta una falta** | Por tirar con menos de 24 h: desde que se tiró. Por no presentarse: al vencer las 48 h sin respuesta. Esa fecha entra en los 90 días. |
| **Presentismo** | Faltas en los últimos 90 días. Con 2, el equipo va al final de los compatibles. |
| **Bloqueo por faltas** | 3 faltas en 90 días: 30 días sin publicar búsquedas ni proponer, desde la tercera. Se cancelan sus búsquedas y propuestas pendientes. Los partidos acordados siguen. No avisa: el rival lo ve en la propuesta cancelada. |
| **Conflictos** | Solo se muestran (contador y rivales distintos). Nunca penalizan. |
| **Revelación de calificaciones** | Cuando los dos calificaron o pasaron 7 días desde que el partido quedó Jugado. |

## Avisos: lista cerrada de disparadores

Todo **Aviso** nace de la acción de un usuario y nunca le llega a quien la hizo. Los que piden una acción van solo al **capitán**; los informativos, a todo el **plantel** tal como estaba en ese momento. Quien está en los dos planteles recibe uno solo.

| Acción | Aviso | Para quién |
|---|---|---|
| Manda una propuesta (UC-D04) | "Te propusieron un partido" | capitán rival |
| Rechaza una propuesta (UC-D06) | "Rechazaron tu propuesta" | capitán que la mandó |
| Acepta → nace el partido (UC-D06) | "Partido acordado" | los dos planteles |
| Acepta → se anulan propuestas superpuestas (UC-D06) | "Se anuló tu propuesta: ya no tienen ese horario" | capitán del otro lado |
| Saca una franja o cancela la búsqueda (UC-D02, UC-C09) | "Se canceló tu propuesta" | capitán del otro lado |
| Carga o corrige cancha y hora (UC-D07) | "Confirmá cancha y hora" | capitán rival |
| Confirma → Coordinado (UC-D07) | "Partido coordinado" | los dos planteles |
| "No vamos" o tira el partido (UC-D08, UC-D09) | "Se cayó el partido" (motivo; si suma falta, a quién) | los dos planteles |
| Pide la caída de común acuerdo (UC-D10) | "Piden tirar el partido de común acuerdo" | capitán rival |
| Acepta la caída de común acuerdo (UC-D10) | "Se cayó de común acuerdo" | los dos planteles |
| Rechaza la caída de común acuerdo (UC-D10) | "Rechazaron tirarlo de común acuerdo" | capitán que la pidió |
| Carga o corrige el resultado (UC-D11) | "Cargaron el resultado: confirmá o corregí" | capitán rival |
| Los resultados coinciden → Jugado (UC-D11) | "Jugado" (con el resultado) | los dos planteles |
| Reporta "No vinieron" (UC-D12) | "Dicen que no fueron: respondé" | capitán acusado |
| Responde "fuimos" o acusación cruzada → en conflicto (UC-D12) | "Partido en conflicto" | los dos planteles |
| La segunda calificación revela las dos (UC-D13) | "Ya podés ver tu calificación" | capitán que calificó primero |
| Baja de un torneo con inscriptos vinculados (UC-E05, UC-F03) | "Se dio de baja el torneo 'X'…" | plantel de cada equipo vinculado |

**Sin aviso, a propósito:** quedar Confirmado, publicar una búsqueda, cancelar una propuesta propia, y todo lo que pasa solo por el tiempo (vencer una propuesta, quedar Jugado a las 48 h, la falta por no responder, la calificación revelada al vencer, "El rival todavía no confirmó", el bloqueo por faltas).

## Visibilidad

Base de las policies de RLS. Cada fila existe como policy o vista, no solo como filtro de UI.

| Dato | Sin sesión | Con sesión |
|---|---|---|
| Catálogo y ficha de torneos, inscriptos (solo nombres) | ✅ | ✅ |
| Página del organizador | ✅ | ✅ |
| Página del equipo (datos públicos, contador, estrellas, últimos 5 cerrados) | ✅ | ✅ |
| Las dos versiones de un partido en conflicto | ✅ | ✅ |
| Nombres del plantel | ❌ | Solo los integrantes |
| WhatsApp de un capitán | ❌ | Solo el capitán rival, con un partido acordado |
| Búsquedas de rival y compatibles | ❌ | Solo capitanes con búsqueda activa |
| Propuestas y detalle del partido (cancha, hora) | ❌ | Solo los dos equipos |
| Comentarios de calificación | ❌ | Solo el administrador |
| Reportes | ❌ | El administrador; cada usuario los suyos |
| Gestión de inscripciones | ❌ | Solo el organizador del torneo |

Reglas de seguridad que acompañan: el rol de administrador nunca se escribe desde el cliente; las transiciones de partidos y propuestas van por funciones de Postgres, no por `update` directos; al cliente solo llega la `anon key`.
