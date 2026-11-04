# Módulo Equipos · Casos de uso

Versión del **04/11/2026**. Detalla los casos de uso del módulo C de [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (UC-C01 a UC-C10) con lo que hace falta para la documentación completa: los requerimientos que cubre cada uno ([01-requerimientos.md](01-requerimientos.md)), la pantalla que lo representa ([03-pantallas.md](03-pantallas.md)) y su diagrama de secuencia ([04-diagramas-secuencia](04-diagramas-secuencia/README.md)).

**Cómo leerlo.** Cada caso expresa una meta y tiene **un actor iniciador**. **Estado** dice si está en `main`. Los términos en negrita son los del glosario ([CONTEXT.md](../../CONTEXT.md)). Los mensajes entre comillas son los que ve la persona.

## Mapa de casos de uso

| Caso | Meta del actor | Actor | Estado | ID anterior (PDF 28/10) |
|---|---|---|---|---|
| [UC-C01](#uc-c01--crear-equipo) | Crear equipo | Usuario | Implementado | UC-25 |
| [UC-C02](#uc-c02--invitar-jugadores-al-equipo) | Invitar jugadores al equipo | Capitán | Implementado | UC-27 |
| [UC-C03](#uc-c03--unirse-a-un-equipo-con-el-link) | Unirse a un equipo con el link | Usuario | Implementado | UC-28 |
| [UC-C04](#uc-c04--ver-la-página-pública-del-equipo) | Ver la página pública del equipo | Invitado | Implementado | UC-29 y UC-30 |
| [UC-C05](#uc-c05--editar-equipo) | Editar equipo | Capitán | Implementado | «Editar Equipo» (sin número) |
| [UC-C06](#uc-c06--pasar-la-capitanía) | Pasar la capitanía | Capitán | Implementado | UC-26 |
| [UC-C07](#uc-c07--sacar-a-un-jugador-del-plantel) | Sacar a un jugador del plantel | Capitán | Implementado | «Sacar a un Jugador» (sin número) |
| [UC-C08](#uc-c08--salir-del-equipo) | Salir del equipo | Jugador | Implementado | «Salir del Equipo» (sin número) |
| [UC-C09](#uc-c09--disolver-equipo) | Disolver equipo | Capitán | Implementado | «Disolver Equipo» (sin número) |
| [UC-C10](#uc-c10--reportar-un-equipo) | Reportar un equipo | Usuario | **Pendiente** | — |

La numeración vigente es la de `casos-de-uso.md` (módulo C). El PDF del 28/10 usaba «módulo D» y los números UC-25 a UC-30; el historial público (antes UC-30, «pendiente») hoy está implementado y forma parte de UC-C04, porque no hay un actor ni una meta distintos de «ver la página del equipo».

**Qué no es un caso de uso acá:** abrir **Mis equipos** (`/mis-equipos`) no toma ninguna decisión: es la lista desde la que se llega a los casos. Está en [pantallas](03-pantallas.md#p2--mis-equipos) y en RF-C15.

---

## UC-C01 · Crear equipo

- **Actor:** Usuario.
- **Requerimientos:** RF-C01 a RF-C06, RF-C27. **Pantalla:** [P1 · Crear equipo](03-pantallas.md#p1--crear-equipo) (`/crear-equipo`). **Diagrama:** [S01](04-diagramas-secuencia/uc-c01-crear-equipo.md).
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
- **Estado:** Implementado (`src/app/crear-equipo`, función `create_team`).

## UC-C02 · Invitar jugadores al equipo

- **Actor:** Capitán.
- **Requerimientos:** RF-C07, RF-C25. **Pantalla:** [P4 · Equipo, vista del Capitán](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) (sección «Invitar jugadores»). **Diagrama:** [S02](04-diagramas-secuencia/uc-c02-invitar-jugadores.md).
- **Precondiciones:** Equipo no disuelto; el actor es su Capitán.
- **Flujo principal:**
  1. En la página del Equipo, la sección «Invitar jugadores» muestra el link vigente, si lo hay, con su vencimiento; si no hay, «No hay un link vigente».
  2. El Capitán pulsa «Generar link».
  3. El sistema crea un link con un token aleatorio, válido **7 días**, y lo muestra.
  4. El Capitán lo **copia** y lo comparte por fuera (por ejemplo, el WhatsApp del grupo).
- **Flujos alternativos:**
  - **A1. Regenerar:** con un link vigente, «Regenerar» crea otro y **el anterior deja de valer**. Hay un solo link vigente por Equipo.
  - **A2. Vencimiento:** pasados los 7 días el link no sirve y la página vuelve a mostrar «Generar link».
  - **A3. Sin capitanía o Equipo disuelto:** la base rechaza («Solo el capitán puede invitar jugadores», «El equipo está disuelto»).
  - **A4. Copiar:** no toca el servidor; se comparte el mismo enlace sin cambiar su vencimiento.
- **Postcondición:** un único link vigente por Equipo.
- **Estado:** Implementado (`regenerateInvite`, `get_team_invite`, `CopyLinkButton`).

## UC-C03 · Unirse a un equipo con el link

- **Actor:** Usuario.
- **Requerimientos:** RF-C08, RF-C09, RF-C10, RF-C27. **Pantalla:** [P6 · Unirse al equipo](03-pantallas.md#p6--unirse-al-equipo) (`/unirse/{token}`). **Diagrama:** [S03](04-diagramas-secuencia/uc-c03-unirse-al-equipo.md).
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
  - **A4. Usuario suspendido:** puede sumarse, pero no podrá recibir la capitanía.
- **Postcondición:** el Jugador ve el Plantel y los partidos del Equipo, sin poder operar.
- **Estado:** Implementado (`src/app/unirse/[token]`, función `join_team`).

## UC-C04 · Ver la página pública del equipo

- **Actor:** Invitado (también cualquier Usuario).
- **Requerimientos:** RF-C11 a RF-C14, RF-C25. **Pantalla:** [P3 · Equipo, vista pública](03-pantallas.md#p3--equipo-vista-pública) y [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) (`/equipos/{id}`). **Diagrama:** [S04](04-diagramas-secuencia/uc-c04-ver-pagina-equipo.md).
- **Precondiciones:** el Equipo existe. No hace falta sesión.
- **Flujo principal:**
  1. Abre `/equipos/{id}` (por ejemplo, desde el nombre de un rival o desde «Mis equipos»).
  2. El sistema muestra **escudo, nombre, Zona (con su corredor), modalidad, nivel y cantidad de jugadores**.
  3. Muestra la sección **Partidos**: el contador («Jugó 12 · 1 falta · 2 conflictos (con 2 rivales distintos)»), las estrellas («★ 4,3 (12)» o «Sin calificaciones») y los **últimos 5 partidos cerrados**.
  4. Muestra la sección **Torneos** con los torneos donde el Equipo tiene una **Inscripción vinculada**, con su estado.
- **Reglas del historial:**
  - «Jugó» suma solo partidos **Jugados**, con o sin resultado. Las faltas se muestran aunque sean 0; los conflictos, solo si hay.
  - Cada fila muestra fecha, «vs» el rival con su zona y un link a su página, y el desenlace («Ganó 3–1», «Perdió 0–2», «Empató 1–1», «Jugado, sin resultado», «Se cayó…», «En conflicto…», «X no se presentó…»).
  - Los equipos se nombran siempre por su nombre y zona **actuales**.
  - El promedio de estrellas cuenta solo calificaciones **reveladas**. Nunca se muestran cancha ni hora.
- **Flujos alternativos:**
  - **A1. Es integrante del Plantel:** además ve los **nombres del Plantel**. Si es Capitán de un Equipo activo, ve también las acciones de gestión: «Editar equipo» (UC-C05), «Hacer capitán» y «Sacar» (UC-C06, UC-C07), «Invitar jugadores» (UC-C02) y «Disolver equipo» (UC-C09). Un Jugador que no es Capitán ve «Salir del equipo» (UC-C08).
  - **A2. Equipo disuelto:** la página sigue, marcada **«Equipo disuelto»**, con su historia; no muestra acciones de gestión.
  - **A3. El Equipo no existe:** se muestra la página de «no encontrado» (404).
  - **A4. Sin partidos o sin torneos:** «Todavía no tiene partidos cerrados» / «Todavía no está anotado en ningún torneo».
- **Privacidad:** el Plantel y los contactos no son públicos; el WhatsApp no aparece nunca en esta página.
- **Estado:** Implementado (`src/app/equipos/[id]`, vistas `team_record` y `team_match_history`).

## UC-C05 · Editar equipo

- **Actor:** Capitán.
- **Requerimientos:** RF-C01, RF-C02, RF-C16, RF-C25. **Pantalla:** [P5 · Editar equipo](03-pantallas.md#p5--editar-equipo) (`/equipos/{id}/editar`). **Diagrama:** [S05](04-diagramas-secuencia/uc-c05-editar-equipo.md).
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

## UC-C06 · Pasar la capitanía

- **Actor:** Capitán.
- **Requerimientos:** RF-C05, RF-C17, RF-C20, RF-C21, RF-C27. **Pantalla:** [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) (sección «Plantel»). **Diagrama:** [S06](04-diagramas-secuencia/uc-c06-pasar-capitania.md).
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
- **Estado:** Implementado (`transferCaptaincy`, función `transfer_captaincy`). La verificación de la Suspensión del destinatario está pendiente (UC-F05).

## UC-C07 · Sacar a un jugador del plantel

- **Actor:** Capitán.
- **Requerimientos:** RF-C18, RF-C20, RF-C21, RF-C25. **Pantalla:** [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) (sección «Plantel»). **Diagrama:** [S07](04-diagramas-secuencia/uc-c07-sacar-jugador.md).
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

## UC-C08 · Salir del equipo

- **Actor:** Jugador.
- **Requerimientos:** RF-C19, RF-C20, RF-C21, RF-C25. **Pantalla:** [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) (botón «Salir del equipo»). **Diagrama:** [S08](04-diagramas-secuencia/uc-c08-salir-del-equipo.md).
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

## UC-C09 · Disolver equipo

- **Actor:** Capitán.
- **Requerimientos:** RF-C22 a RF-C25. **Pantalla:** [P4](03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) (sección «Disolver equipo»). **Diagrama:** [S09](04-diagramas-secuencia/uc-c09-disolver-equipo.md).
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

## UC-C10 · Reportar un equipo

- **Actor:** Usuario (Capitán o Jugador de un Equipo que jugó al menos un partido contra el reportado).
- **Requerimientos:** RF-C26. **Pantalla:** [P3/P4](03-pantallas.md#p3--equipo-vista-pública) (botón «Reportar», todavía no existe). **Diagrama:** [S10](04-diagramas-secuencia/uc-c10-reportar-equipo.md) (diseño objetivo).
- **Precondiciones:** sesión; **un partido Jugado en común** con el Equipo reportado.
- **Flujo principal:**
  1. En la página del Equipo toca «Reportar». El botón solo aparece con sesión y con un partido jugado en común.
  2. Elige el motivo: «Violencia o agresiones», «Cuenta falsa» o «Abuso de calificaciones».
  3. El sistema guarda el **Reporte** para el administrador (UC-F04).
- **Reglas:** la responsabilidad por la conducta del Plantel es del Capitán: la eventual **Suspensión** recae sobre él.
- **Postcondición:** el reporte queda pendiente en el panel de administración.
- **Estado:** **Pendiente.** Todavía no hay tabla, función ni pantalla. Queda por decidir si un Usuario puede reportar más de una vez al mismo Equipo (para los torneos, UC-B06, es una sola vez por Usuario y torneo; para los Equipos no está definido).
