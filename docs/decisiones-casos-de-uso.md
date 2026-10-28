# Decisiones sobre los casos de uso

Revisión de [casos-de-uso.pdf](casos-de-uso.pdf) (módulos A–F y T) antes de empezar a programar. El documento se escribió sin código de por medio y tenía contradicciones entre módulos y casos sin definir. Acá está lo que se decidió el **27/09/2026**.

**Cuando este archivo y el PDF no coinciden, manda este archivo.** El PDF se corrige después a partir de acá.

- Vocabulario: [CONTEXT.md](../CONTEXT.md). Usar esos términos en código, issues y PRs.
- Decisiones grandes, con su porqué: [docs/adr/](adr/).

---

## Alcance

- **Entran todos los módulos**, incluidos equipos y buscar partido.
- **La app nunca inscribe ni cobra.** El jugador contacta al organizador por WhatsApp/Instagram, y el organizador carga la inscripción desde su panel.
- **Avisos:** solo una campanita dentro de la app. Nada de email ni push.
- **Sin tareas programadas por ahora.** Todos los plazos (48 h, 24 h, vencimientos) se calculan cuando alguien mira la pantalla, no los ejecuta un reloj. Todos los avisos se disparan por una acción de un usuario.

## Se elimina del PDF

| Qué | Por qué |
|---|---|
| "Elegir perfil de entrada" (Jugar / Organizar) | Una sola cuenta, vista de jugador predeterminada y botón "Soy organizador" |
| Botón "Anotar mi equipo" del capitán | La inscripción la carga el organizador |
| El organizador ve el WhatsApp del capitán | Ya lo tiene: el capitán le escribió |
| Grilla de disponibilidad del equipo (mañana/tarde/noche) | No se traducía a horas; la reemplaza "copiar horarios de la última búsqueda" |
| Negociación de cancha y hora dentro de la app | Se arregla por WhatsApp; la app solo registra lo acordado |
| Bloqueo por intentos fallidos de login | Lo cubre Supabase |
| Confirmación de email al registrarse | Se entra directo |
| El administrador resuelve disputas de no presentado | Ver [ADR 0002](adr/0002-conflictos-sin-arbitro.md) |

---

## Cuenta y acceso

- **Una sola cuenta por persona.** Con ella se puede ser jugador, capitán y organizador a la vez.
- **Registro:** pide email, contraseña y **nombre** (el nombre es público, así que no se deriva del email). Se entra directo, sin confirmar el email. Recuperar la contraseña ("Olvidé mi contraseña") **todavía no se hace**; cuando entre, va a ser el único mail que manda la app. El SMTP gratis de Supabase manda muy pocos por hora: alcanza para la entrega, pero con usuarios reales hace falta un servicio aparte (por ejemplo, Resend).
- **Portada:** `/` es el catálogo, para cualquiera. No hay "vista de jugador" ni "vista de organizador": la app se navega de una sola forma (decidido el 07/10/2026; antes hubo un switch "Soy organizador" / "Volver a jugador" que se descartó porque no se entendía). El PR #26 propuso otra entrada (al visitar `/` sin sesión se mostraba `/login` con "entrar como invitado", el catálogo en `/torneos` y una navbar con "Soy organizador"); al integrarlo el 14/10/2026 se descartó por lo mismo, y `/torneos` quedó solo como redirección a `/`.
- **Barra superior mínima.** Sin sesión: logo, "Iniciar sesión" (texto) y "Crear cuenta" (único botón destacado). Con sesión: logo y menú de usuario con Mi perfil, Mis equipos, Mis torneos y Cerrar sesión. Ningún botón destacado permanente.
- **Captar organizadores:** el link "¿Organizás torneos? Publicalo" va al pie del catálogo y en el footer, no en la barra. Lleva a Crear cuenta con `next` al panel.
- **Panel de organizador en tres niveles:** (1) la lista "Mis torneos", con una fila por torneo (nombre, zona, modalidad, cupo, estado, antigüedad de verificación) y solo dos acciones, "Sigue vigente" y "Gestionar"; (2) la **pantalla de gestión del torneo**, con cabecera (números clave, "Ver ficha pública", "Sigue vigente"), pestañas (Datos, Inscripciones, y las que se sumen) y "Dar de baja" al final, aparte; (3) la **ficha pública**, que para el dueño es idéntica a la de cualquiera más una barra arriba "Este torneo es tuyo · Gestionar". Editar, inscripciones y baja viven solo en la pantalla de gestión. Guardar en Datos vuelve a la pantalla de gestión; la ficha pública se abre con "Ver ficha pública".
- **Una sola convención para volver:** un link arriba a la izquierda con el nombre del destino ("← Mis torneos", "← Volver al catálogo"). Nunca dos formas de volver en la misma pantalla.
- **Perfil:** nombre, foto (JPG/PNG/WebP, máx. 2 MB), zona y **WhatsApp**. El WhatsApp es opcional, pero obligatorio para crear un equipo o tomar la capitanía, y el capitán de un equipo no disuelto no lo puede dejar vacío (sí cambiarlo): el rival lo necesita para coordinar. Se guarda solo con dígitos, en formato argentino de celular (`549` + 10 dígitos), que es lo que pide `wa.me`.
  - Cada foto nueva reemplaza a la anterior; no hay una galería. Se retira la anterior de Storage después de guardar la nueva URL. Si el guardado falla, se conserva la anterior y se intenta retirar la subida nueva.
- **El rol de administrador no se puede editar desde la app.** Se asigna a mano en la base. El usuario edita nombre, foto, zona y WhatsApp, y nunca el rol.
- **Cerrar sesión** cierra solo el dispositivo actual.
- **Llegar desde "¿Organizás torneos? Publicalo":** se abre **Crear cuenta** con un aviso ("Para publicar un torneo necesitás una cuenta") y el link a iniciar sesión conservando el `next`. Con cualquier otro `next` se abre Iniciar sesión, sin aviso. El copy de las dos pantallas es neutro: no habla solo de torneos.
- **Volver a la acción después del login (`next`):** solo se aceptan rutas internas. Ojo: `//sitio.com` empieza con `/` y es externa, así que hay que rechazarla también.

## Torneos

### Quién publica

- **Organizadores:** cualquier usuario con sesión y sin suspensión.
- **Carga manual inicial:** si alguien del equipo carga torneos de Instagram para que el catálogo no arranque vacío, lo hace con su propia cuenta, como organizador común, y pone el contacto del organizador real. No existe un tipo de torneo "copiado" ni una "transferencia" (se descartaron el 07/10/2026).

### Formulario

| Obligatorio | Opcional |
|---|---|
| Nombre | Precio (vacío → "Consultar", 0 → "Gratis") |
| Modalidad (F5, F7, F8, F11) | Flyer (JPG/PNG/WebP, máx. 3 MB) |
| Zona | Cupo |
| Cierre de inscripción, inicio y fin | Descripción |
| Dirección de la sede (la ficha la abre en el mapa) | Reglamento (texto) |
| Al menos un contacto: WhatsApp o Instagram | |

- Las fechas cumplen **cierre ≤ inicio ≤ fin**. Si no, el formulario no guarda.
- **La fecha de fin es obligatoria.** Sin ella, el torneo nunca llegaría a "Finalizado".
- **La dirección de la sede es obligatoria** al publicar y al editar: la zona dice si queda cerca a grandes rasgos, la dirección dice si se puede llegar. En la base la columna sigue admitiendo vacío hasta que no queden torneos viejos sin dirección (decidido el 07/10/2026).

### Estado (calculado, nadie lo elige)

| Estado | Cuándo |
|---|---|
| Abierto | No pasó el cierre de inscripción y hay lugar |
| Cerrado | Pasó el cierre (sin empezar) **o** se completó el cupo |
| En curso | Entre la fecha de inicio y la de fin |
| Finalizado | Pasó la fecha de fin; sale del catálogo |

- Si se borra una inscripción antes del cierre, un torneo cerrado por cupo vuelve a **Abierto**.
- **"Últimos cupos"** es una etiqueta, no un estado: se muestra cuando quedan 2 lugares o menos.

### Verificación y "Observado"

- **"Sigue vigente"** actualiza la fecha de verificación. **Editar el torneo no cuenta como verificarlo.**
- Pasados 30 días sin verificar, el torneo se muestra en ámbar; pasados 60, en rojo con "sin confirmar". Se cuentan días completos desde la última verificación: el día 30 ya es ámbar y el 60 ya es rojo.
- Un torneo recién creado cuenta como verificado al crearlo.
- Un torneo **Finalizado** no se verifica: no muestra antigüedad ni botón "Sigue vigente", y en el panel va al final.
- En el panel del organizador van primero los que llevan 30 días o más sin verificar, del más viejo al más nuevo.
- **Observado** es una marca aparte, que pone el administrador por reportes. "Sigue vigente" no la saca: solo la saca el administrador.

### Baja

- Se llama **baja** (no "eliminar"). Se puede hacer en Abierto, Cerrado o En curso, **nunca en Finalizado**, porque los finalizados son la trayectoria del organizador.
- El torneo desaparece del catálogo y su ficha devuelve 404.
- Siempre pide confirmación con el nombre del torneo y cuántos equipos tiene anotados (también con 0): no se puede deshacer.
- Genera un aviso a todo el plantel de cada equipo con una inscripción vinculada (el plantel del momento de la baja), con link a la página del equipo, porque la ficha ya devuelve 404: "Se dio de baja el torneo 'X', en el que estaba anotado tu equipo. Hablá con el organizador por lo que hayas pagado."
- La hace el organizador o el administrador.

### Inscripciones

- Las carga **solo el organizador**, desde su panel. Hay dos tipos:
  - **vinculada:** busca un equipo de la app (se muestra la zona al lado, porque los nombres se repiten)
  - **por nombre:** escribe el nombre de un equipo que no está en la app
- Las dos cuentan para el cupo. Solo la vinculada genera avisos y aparece en la historia del equipo.
- Un mismo equipo de la app tiene como mucho una inscripción por torneo. El capitán no confirma la vinculación.
- La ficha muestra públicamente los nombres de los equipos inscriptos.
- **No se puede cargar una inscripción con el cupo completo:** la app la rechaza y sugiere subir el cupo desde Editar.
- **En un torneo Finalizado no se cargan ni se borran inscripciones.** En Cerrado y En curso, sí: el organizador puede seguir acomodando la lista aunque ya no se inscriba nadie nuevo.

## Equipos

- **Crear:** nombre, zona, modalidad habitual y nivel (recreativo, intermedio o competitivo). El escudo es opcional (JPG/PNG/WebP, máx. 2 MB). Los nombres se pueden repetir: públicamente se distinguen por la zona. Hace falta tener WhatsApp en el perfil.
- **Máximo 3 equipos como capitán:** cuentan las capitanías actuales, sin importar si el equipo lo creó o recibió la capitanía. Los equipos disueltos no cuentan. No se puede pasar la capitanía a alguien que ya capitanea 3.
- **Plantel:** sin tope de jugadores por ahora.
- **Invitar:** link con validez de 7 días. Regenerarlo invalida el anterior. Quien lo abre entra directo al plantel.
  - Si el equipo está disuelto, el link deja de valer y muestra el mismo mensaje que un link vencido.
  - Si quien lo abre ya está en el plantel, no hay error: lo lleva a la página del equipo.
  - Un usuario suspendido puede sumarse a un equipo, pero no puede recibir la capitanía.
- **Editar:** solo el capitán (nombre, escudo, zona, modalidad, nivel).
- **Escudo:** se puede subir al crear, reemplazar o quitar al editar. Dejar
  vacío el archivo conserva el actual. Un equipo disuelto conserva su escudo.
- **Salir:** cualquier jugador. El capitán primero tiene que pasar la capitanía.
- **Sacar a un jugador:** el capitán puede sacar a cualquiera.
- **Disolver:** el equipo **no se borra**. Queda "disuelto", con su página pública y su historia. No puede buscar rival ni recibir inscripciones. No se reactiva: si vuelven, crean un equipo nuevo.
  - **Se bloquea con un partido sin terminar (28/10/2026):** no se puede disolver mientras el equipo tenga un partido por jugarse o esperando el resultado. El mensaje le dice que primero lo tire o cierre el resultado. Así el rival no queda esperando una respuesta que nunca llega, y un equipo acusado de no presentarse no se puede escapar disolviéndose.
  - **Cancela sus búsquedas:** disolver cancela todas las búsquedas activas del equipo, como si el capitán las cancelara una por una. Caen sus propuestas pendientes (enviadas y recibidas) y el otro lado recibe el aviso de siempre, "Se canceló tu propuesta". No hay motivo ni aviso propio de la disolución.
  - **No toca la calificación:** los dos capitanes pueden calificar un partido Jugado hasta que venzan los 7 días, aunque uno de los equipos se haya disuelto.
  - **Etapa actual (14/10/2026):** se implementa la disolución del módulo de
    equipos, conservando plantel y escudo e invalidando invitaciones. El
    bloqueo y la cancelación de búsquedas entran con la etapa 2 de Partidos
    (Propuesta y partido acordado).
- **Cambios de capitán y de plantel con partidos en curso (28/10/2026):** nunca se bloquean. Las búsquedas, propuestas y partidos son del equipo: el capitán nuevo opera todo lo que está en curso, incluido un pedido de caída de común acuerdo sin responder. El capitán anterior deja de ver las propuestas y sigue viendo los partidos si queda en el plantel. Quien sale del plantel deja de ver los partidos del equipo y conserva los avisos que ya recibió.

## Partidos

- **Todo el módulo lo opera solo el capitán:** publicar, proponer, aceptar, coordinar, confirmar, tirar el partido y cargar el resultado. El plantel solo mira. Si otro jugador tiene que encargarse, se pasa la capitanía.

### Búsqueda de rival

- **Publicar** requiere: equipo no disuelto, capitán no suspendido, equipo no bloqueado por faltas y WhatsApp en el perfil del capitán.
- **Modalidad propia:** el formulario la completa con la modalidad habitual del equipo y se puede cambiar. Una búsqueda activa por modalidad y por equipo.
- La cercanía y el nivel salen de la **zona y el nivel actuales del equipo**; la búsqueda no los guarda.
- **Toda franja es concreta:** una fecha y un rango de horas enteras, dentro de los próximos 14 días.
- "Martes de 20 a 22, repetir" es un atajo del formulario que genera los martes de las próximas dos semanas como franjas sueltas.
- **Cargar una franja (28/10/2026):** se toca el día en el calendario y se elige "de [20] a [23]" con dos selectores de hora entera; no hay bloques fijos. Dura al menos 1 h, va de 8 a 24 (no cruza la medianoche: es de una sola fecha) y, si es hoy, solo empieza en una hora que no pasó. "Repetir la semana que viene" es una casilla debajo.
- **Franjas que chocan:** se rechaza una franja que se superpone con un partido acordado del equipo o con otra franja de la misma búsqueda. Entre búsquedas de distinta modalidad del mismo equipo sí se pueden superponer.
- **Franja vigente (28/10/2026, etapa 1):** una franja cuenta (se muestra, se edita, da compatibles) mientras no empezó. Una franja en curso ya no se puede proponer, así que se ignora; la búsqueda deja de estar activa cuando ya no le queda ninguna por empezar.
- **"Repetir" fuera de los 14 días (28/10/2026, etapa 1):** si la franja repetida cae después de los próximos 14 días, el formulario la rechaza con el mensaje de siempre en vez de cargar solo la primera.
- **Empates en los compatibles (28/10/2026, etapa 1):** con la misma cercanía, nivel y presentismo, primero el horario en común más temprano.
- La búsqueda vence cuando pasa su última franja. Que nazca un partido no la cierra: sigue con sus otras franjas.
- **Editar:** se agregan y se sacan franjas; la modalidad no se cambia. Sacar una franja cancela sus propuestas pendientes (enviadas y recibidas), con aviso. Sacar la última cancela la búsqueda.
- **Cancelar:** el capitán la cancela cuando quiera. Se cancelan sus propuestas pendientes (enviadas y recibidas), con aviso. Los partidos que ya nacieron de ella siguen en pie.
- **Compatibles:** misma modalidad y al menos 1 h en común el mismo día. Los niveles con dos escalones de diferencia (recreativo vs. competitivo) no se cruzan.
- **Sin partidos contra uno mismo (28/10/2026):** un capitán no puede armar un partido entre dos equipos que capitanea él. Esos equipos no aparecen en sus compatibles y la propuesta se rechaza. Si no, una sola persona cargaría los dos resultados y las dos calificaciones, e inflaría el historial público sin confirmación cruzada. Si un cambio de capitán posterior deja a la misma persona en los dos lados, no se hace nada. Compartir jugadores entre los dos planteles sí se permite.
- **Orden de los compatibles:** primero la cercanía (zona > corredor > región), después el nivel y por último el presentismo. El **presentismo** es la cantidad de faltas en los últimos 90 días, de menos a más; sin historial cuenta como 0. Los equipos con 2 faltas en 90 días van al final igual.

### Propuesta → partido

- **Horario de la propuesta:** la parte en común de las dos franjas, que calcula la app. Nadie elige un rango.
- **Solo lleva el horario**, sin mensaje: todo lo demás se arregla por WhatsApp después de aceptar.
- **Sin límite** de propuestas pendientes por equipo. No se puede mandar otra al mismo rival para el mismo horario mientras la anterior está pendiente.
- La propuesta vence a las 72 h o cuando **empieza** su rango, lo que ocurra primero.
- **Horas que ocupa un partido:** siempre el rango de la propuesta, para la superposición y para el choque de franjas. La hora exacta que se carga al coordinar tiene que caer dentro de ese rango. Para cambiar de día, se tira el partido y se propone de nuevo.
- **Franja ocupada:** al nacer un partido, las franjas de los dos equipos que se superponen con él quedan ocupadas enteras: salen de los compatibles y no reciben más propuestas. Las horas sobrantes no se cortan en franjas nuevas; si el capitán quiere jugar otra vez ese día, agrega una franja.
- **Nunca dos partidos superpuestos.** Al nacer un partido, se anulan todas las propuestas pendientes de los dos equipos (enviadas y recibidas) que se superponen con ese horario, con aviso a los afectados. Si al aceptar alguno de los dos ya tiene un partido en ese horario, se rechaza.
- **Coordinación:** al aceptar la propuesta, el partido queda **A coordinar** y cada capitán ve el WhatsApp del otro (siempre el del capitán actual). Arreglan por WhatsApp. Cualquiera de los dos carga la cancha y la hora exacta, y el otro **confirma** (el partido queda **Coordinado**) o **corrige** (y le toca confirmar al primero).
  - **Cancha:** texto libre, obligatorio, hasta 120 caracteres. Se muestra con un link "Ver en el mapa" que busca ese texto en Google Maps.
  - **Hora exacta:** de a 15 minutos, desde el inicio del rango (incluido) hasta su fin (excluido). En un rango de 20 a 22: de 20:00 a 21:45.
  - Coordinar es una ayuda, no un requisito: un partido que llega a su hora sin coordinar sigue el flujo normal de "Después del partido".
- **Hora de inicio:** la hora exacta o, si nunca se coordinó, el inicio del rango. Antes de la hora de inicio solo se puede tirar el partido; desde ahí, solo cargar el resultado o el "No vinieron".
- **Confirmación previa:** desde 24 h antes, al entrar, cada capitán ve "¿Confirmás que van?" con dos botones, **Vamos** y **No vamos**.
  - Si los dos dicen "Vamos", el partido queda **Confirmado**.
  - "No vamos" hace que el partido se caiga.
  - Desde 12 h antes, si el rival no confirmó, se muestra "El rival todavía no confirmó".
  - Si nadie confirma, no pasa nada: el partido sigue en pie.

### Partido caído

- Un partido **se cae**, nunca "se suspende": esa palabra queda para las sanciones del administrador.
- Cualquier capitán lo puede tirar antes de la hora de inicio, con un motivo.
- **Motivo:** texto libre, obligatorio, de 1 a 140 caracteres. Queda visible en el historial público. Nadie lo modera (riesgo aceptado, 27/10/2026). "Equipo suspendido" lo escribe el sistema en el mismo campo.
- Con **menos de 24 h** de anticipación, suma una **falta** al equipo que lo tiró. Con más de 24 h, no.
- **Caída de común acuerdo:** con menos de 24 h, el capitán puede pedir tirarlo de común acuerdo (con su motivo). Si el rival acepta antes de la hora de inicio, el partido se cae sin falta para nadie. Si rechaza o no responde, el partido sigue en pie, y el que lo pidió todavía puede tirarlo solo, con la falta.

### Después del partido

| Qué pasa | Resultado |
|---|---|
| Los dos cargan el mismo resultado | Jugado, con ese resultado |
| Uno carga y el otro no hace nada en 48 h | Jugado, con el resultado cargado |
| Resultados distintos | 48 h para corregir; si siguen sin coincidir, Jugado sin resultado |
| Nadie carga nada en 48 h | Jugado sin resultado, sin falta para nadie |
| "No vinieron" y el acusado no responde en 48 h | **Falta** para el ausente |
| "No vinieron" y el acusado responde "fuimos" | **En conflicto**: sin falta; los dos equipos suman un conflicto y se muestran las dos versiones |
| Los dos reportan "no vinieron" | **En conflicto**, igual que con "fuimos": acusar de vuelta cuesta lo mismo que negar |

- **Resultado:** goles de cada lado (0 a 99), que cada capitán carga como "Nosotros / Ellos". Coinciden si son el mismo resultado espejado.
- **Plazos de 48 h:** corren desde la última carga de cualquiera de los dos (resultado, corrección, "no vinieron" o respuesta). Si nadie cargó nada, desde el fin del rango. Cada carga le da al otro 48 h enteras; no hay tope.
- **Nadie arbitra.** El administrador no interviene en partidos ([ADR 0002](adr/0002-conflictos-sin-arbitro.md)).
- **Historial en la página del equipo (27/10/2026):**
  - **Contador** de todo el historial, no de 90 días: "Jugó 12 · 1 falta · 2 conflictos (con 2 rivales distintos)". "Jugó" suma solo los partidos **Jugados** (con o sin resultado); los caídos, en conflicto o con falta no. Dice "falta" y no "Faltó", porque tirar un partido con menos de 24 h también es una falta. Las faltas se muestran aunque sean 0; la aclaración de rivales distintos, solo si hay al menos un conflicto. Los 90 días quedan para las penalizaciones y el orden de compatibles.
  - **Últimos 5 partidos:** solo los cerrados (jugado, caído, en conflicto o con falta), del más nuevo al más viejo por hora de inicio. Los por jugarse y los que tienen plazos abiertos no aparecen. No hay "Ver todos".
  - **Cada fila:** fecha (sin hora), "vs" rival con su zona y link a su página, y el desenlace. No hay página pública por partido: el detalle va en la fila.
    - Jugado: "Ganó 3–1", "Perdió 0–2", "Empató 1–1" (desde el lado del dueño de la página) o "Jugado, sin resultado".
    - Caído: `Se cayó · lo tiró La 12 FC: "nos faltan dos" · falta para La 12 FC`, o `Se cayó de común acuerdo: "lluvia"`.
    - En conflicto: `En conflicto · Real Floresta: "no vinieron" · Deportivo X: "fuimos"`.
    - Falta por no presentarse: "Barrio Unido no se presentó · falta para Barrio Unido".
  - Los equipos se nombran siempre por su nombre, nunca "Nosotros" (la página la mira otro). Se usa el **nombre y la zona actuales**, aunque el equipo los haya cambiado.
  - **Estrellas:** promedio con un decimal y cantidad, "★ 4,3 (12)", sin mínimo de calificaciones. Con 0: "Sin calificaciones".
- **Cuándo cuenta una falta (28/10/2026):** la de tirar el partido con menos de 24 h, desde que lo tiró; la de no presentarse, desde que vencen las 48 h sin respuesta, porque recién ahí es firme. Esa fecha es la que entra en los 90 días y, si es la tercera, la que arranca los 30 días de bloqueo.
- **Penalizaciones (cuentan solo faltas):**
  - 2 faltas en 90 días: el equipo va al final de la lista de compatibles.
  - 3 faltas en 90 días: el equipo no puede publicar búsquedas durante 30 días, contados desde la tercera falta. Sus búsquedas activas se cancelan, con sus propuestas pendientes. Los partidos ya acordados siguen en pie (a diferencia de la Suspensión).
- **Calificación:** de 1 a 5 estrellas, con promedio público. Solo se califica en partidos **jugados** (con o sin resultado), nunca en uno caído o en conflicto. El comentario es privado y solo lo lee el administrador cuando revisa un equipo reportado.
  - Una por equipo y partido: el capitán califica al rival.
  - Se habilita cuando el partido queda **Jugado** y vence a los 7 días. No se edita.
  - Comentario opcional, hasta 500 caracteres.
  - Cada uno ve la que le pusieron recién cuando los dos calificaron o venció el plazo, para que nadie califique en represalia. El promedio cuenta solo las calificaciones ya visibles.

### Avisos de Partidos

- **Para quién:** los avisos que piden una acción (que solo puede hacer el capitán) van solo al **capitán**; los informativos van a **todo el plantel**, capitán incluido. Nunca se le avisa a quien hizo la acción.
- **Plantel y capitán del momento del hecho:** el que entra después no recibe avisos viejos; el que se va conserva los que ya recibió y no recibe más. Si se pasa la capitanía, el nuevo capitán no hereda los avisos: ve lo pendiente en Partidos. Quien está en los dos planteles de un partido recibe un solo aviso por hecho.
- **Lista cerrada de disparadores:**

| Acción | Aviso | Para quién |
|---|---|---|
| Manda una propuesta | "Te propusieron un partido" | capitán rival |
| Rechaza una propuesta | "Rechazaron tu propuesta" | capitán que la mandó |
| Acepta → nace el partido | "Partido acordado" | los dos planteles |
| Acepta → se anulan propuestas superpuestas | "Se anuló tu propuesta: ya no tienen ese horario" | capitán del otro lado de cada propuesta anulada |
| Saca una franja o cancela la búsqueda → se cancelan propuestas | "Se canceló tu propuesta" | capitán del otro lado de cada una |
| Carga o corrige cancha y hora | "Confirmá cancha y hora" | capitán rival |
| Confirma → **Coordinado** | "Partido coordinado" (cancha y hora) | los dos planteles |
| "No vamos" o tira el partido → se cae | "Se cayó el partido" (motivo; si suma falta, a quién) | los dos planteles |
| Pide la caída de común acuerdo | "Piden tirar el partido de común acuerdo" | capitán rival |
| Acepta la caída de común acuerdo | "Se cayó de común acuerdo" | los dos planteles |
| Rechaza la caída de común acuerdo | "Rechazaron tirarlo de común acuerdo" | capitán que la pidió |
| Carga o corrige el resultado | "Cargaron el resultado: confirmá o corregí" | capitán rival |
| …y coincide → **Jugado** | "Jugado" (con el resultado) | los dos planteles |
| Reporta "No vinieron" | "Dicen que no fueron: respondé" | capitán acusado |
| Responde "fuimos", o los dos reportan "no vinieron" → **en conflicto** | "Partido en conflicto" | los dos planteles |
| La segunda calificación revela las dos | "Ya podés ver tu calificación" | capitán que calificó primero |

- **Sin aviso, a propósito:** quedar **Confirmado** (los dos dijeron "Vamos") y publicar una búsqueda.
- **Lo que pasa solo por el tiempo no avisa:** vencer una propuesta, quedar Jugado a las 48 h, la falta por no responder un "No vinieron", la calificación revelada al vencer el plazo, "El rival todavía no confirmó". Se ve al entrar a Partidos o al partido. Para compensar, **todo aviso que abre un plazo dice cuándo vence y qué pasa si no se responde** ("respondé antes del jue 22:00 o suman una falta").
- **El bloqueo por 3 faltas no avisa:** como se calcula al leer, el rival ve la propuesta cancelada ("El equipo está bloqueado por faltas") cuando entra a Partidos.

### Campanita

- Un aviso lleva **texto, link y fecha**. El texto se arma en el momento del hecho y queda así (si el rival cambia de nombre, el aviso viejo no cambia). El link va a donde está el estado actual: la propuesta, el partido o el equipo.
- **Sin botones en el aviso:** toda acción se hace en la pantalla de Partidos, que valida las reglas. El aviso es un puntero, no la fuente de verdad.
- **Leído:** abrir la campanita marca como leídos todos los que se ven. El número rojo cuenta los no leídos.
- Se muestran los **últimos 30**. No se borran ni se archivan.

### Pantalla de Partidos (28/10/2026)

Se eligió con un prototipo (rama `prototype/partidos-navegacion`). Las reglas de arriba no cambian: el otro capitán sigue confirmando cancha, hora y resultado, y sigue el "¿Confirmás que van?".

- **Una sola página, `/partidos`**, con lo de **todos** los equipos del usuario juntos. Cada cosa dice de qué equipo es. No hay selector de equipo en la lista.
- **Arriba, el próximo partido** en grande: rival, día y hora, cancha ("Ver en el mapa") y WhatsApp del capitán rival. Desde 24 h antes, ahí mismo, "¿Van?" con **Vamos** y **No vamos**.
- **Propuestas recibidas:** una tarjeta por propuesta, con su horario y dos botones (aceptar o rechazar).
- **Tus partidos:** una fila por partido, ordenados por hora de inicio: fecha, rival, equipo propio y el dato del momento (cancha y hora, "Falta cancha y hora", el resultado cargado). **Lo que pide una respuesta se responde en la fila** (confirmar o corregir el resultado, confirmar o cambiar cancha y hora, cargarlas). No hay una página por partido.
- **Acciones del partido en la fila (28/10/2026):** lo que cambia según la fase aparece en la fila, nunca todo junto.
  - Las respuestas al rival (aceptar o rechazar la caída de común acuerdo, "fuimos" o "no vinieron") y **Calificar** al rival se ven en la fila, como cualquier cosa pendiente.
  - Desde la hora de inicio, "**No vinieron**" es un link chico al lado de "Cargar resultado", porque lo reemplaza.
  - Antes de la hora de inicio, un menú **⋯** de la fila tiene "Tirar el partido" (con más de 24 h) o "Tirar el partido (suma falta)" y "Pedir tirarlo de común acuerdo" (con menos). El motivo se escribe en la fila, que se despliega.
  - "**No vamos**" abre ese mismo formulario: motivo, el aviso "Suma una falta a tu equipo" y la opción de pedir tirarlo de común acuerdo. Nadie suma una falta sin saberlo.
  - El "¿Van?" de un partido que no es el próximo (capitán de dos equipos que juegan el mismo día) aparece en su fila.
- **Buscar rival vive en la misma página**, en un panel al costado (abajo en el celular): el equipo (solo si es capitán de más de uno), un calendario de los próximos 14 días, el horario, y los compatibles con un botón para mandarles la propuesta.
- **Textos de la propuesta:** se dice "proponer", nunca "invitar". En el compatible, el botón es "**Proponer partido**"; una vez mandada, dice "**Propuesta enviada**" con un link "Cancelar". La tarjeta recibida dice "**Real Floresta te propone jugar** · mar 4/11, de 20 a 22", con **Aceptar** y **Rechazar**.
- **El plantel** ve los partidos de sus equipos sin botones. El panel de Buscar rival y las propuestas los ve solo el capitán.
- Los links de la campanita llevan a `/partidos`.

## Administración

- **Acceso diferenciado (14/10/2026):** `/admin/login` usa la misma cuenta de Supabase; exige que `is_admin()` confirme el rol en el servidor. No hay registro de administradores ni selección de rol en el formulario. El rol sigue asignándose manualmente en `public.admins`, nunca desde la app. Una cuenta común que se autentica aquí conserva su sesión normal, pero recibe acceso denegado al backoffice. Si no se puede verificar el rol, también se deniega el acceso.
- **Backoffice inicial:** `/admin` muestra el resumen y `/admin/seguridad` muestra el acceso de la cuenta actual, ambos con comprobación de sesión y rol junto a sus datos. Sidebar propia, desplegable en móvil, sin navbar ni footer del catálogo. Usuarios, contenido, reportes, actividad, soporte, avisos y configuración se señalan como etapas pendientes, sin enlaces ni acciones ficticias. Alcance y verificación en [acceso-administrador.md](acceso-administrador.md).
- **Panel de administración** (solo para el rol administrador):
  - tablero con números
  - reportes pendientes
  - buscador de usuarios por nombre o email
- **Reportar un torneo:** botón en la ficha, solo con sesión. Motivos: "Ya no existe", "Datos incorrectos" o "No es un torneo". Una vez por usuario y torneo. El administrador puede **descartar** el reporte, **marcar el torneo como Observado** o **darle de baja**.
- **Reportar un equipo:** botón en la página del equipo, solo con sesión y **solo si jugaste contra ellos**. Motivos: "Violencia o agresiones", "Cuenta falsa" o "Abuso de calificaciones". El administrador puede **descartar** el reporte o **suspender al capitán**, que responde por la conducta del plantel.
- **Suspensión:** 7 días, 30 días o indefinida, con un motivo. El usuario puede entrar y mirar, pero no puede publicar torneos, crear equipos ni buscar rival. No hay apelación dentro de la app: el aviso incluye un email de contacto. Sobre lo que ya existía:

| Lo que ya existía | Qué pasa |
|---|---|
| Sus torneos publicados | Siguen visibles y los puede editar y verificar |
| Sus búsquedas de rival | Se cancelan |
| Propuestas pendientes de su equipo | Se anulan, con aviso |
| Partidos futuros | Se caen con el motivo "Equipo suspendido", sin falta para nadie |
| Partidos pendientes de resultado | Los puede terminar de cargar |
| Su equipo | No aparece en las búsquedas; su página sigue visible; **no puede cambiar de capitán** |

- **Registro de acciones:** toda resolución del administrador queda guardada (quién, cuándo y qué decidió).

## Visibilidad

Esta tabla es la base de las reglas de acceso (RLS) de la base de datos.

| Dato | Sin sesión | Con sesión |
|---|---|---|
| Catálogo y ficha de torneos, inscriptos (solo nombres de equipo) | ✅ | ✅ |
| Página del organizador (nombre, foto, zona, "Organiza desde…", torneos) | ✅ | ✅ |
| Página del equipo (escudo, nombre, zona, modalidad, nivel, cantidad de jugadores, contador de jugados, faltas y conflictos, estrellas, últimos 5 partidos cerrados) | ✅ | ✅ |
| Las dos versiones de un partido en conflicto | ✅ | ✅ |
| Nombres del plantel | ❌ | Solo los integrantes del equipo |
| WhatsApp de un capitán | ❌ | Solo el capitán rival, con un partido acordado |
| Búsquedas de rival y rivales compatibles | ❌ | Solo capitanes con una búsqueda activa |
| Propuestas y detalle del partido (cancha, hora) | ❌ | Solo los dos equipos |
| Comentarios de calificación | ❌ | Solo el administrador |
| Reportes | ❌ | El administrador; cada usuario ve solo los suyos |
| Gestión de inscripciones | ❌ | Solo el organizador del torneo |

## Zonas

- Tres niveles: **región** (CABA, GBA) > **corredor** (por ejemplo, GBA Norte) > **zona** (barrio o partido).
- Torneos, equipos y perfiles se ubican siempre en una zona. En el filtro del catálogo se puede elegir una zona o un corredor completo.
- La lista se arma en una planilla (región, corredor, zona) y se carga una vez en la base. No hay pantalla para editarla.
- **Pendiente:** que alguien del equipo arme la planilla.

---

## Pendientes técnicos (no son de producto, se resuelven al programar)

- **Gestión de equipos y diseño (14/10/2026):** acuerdos de edición,
  disolución, escudos, navegación y legibilidad en
  [mejoras-equipos-ux.md](mejoras-equipos-ux.md). La disolución se integra con
  partidos y propuestas cuando exista ese módulo.

- **Diseño de módulos de Partidos (28/10/2026):** tablas, estados calculados,
  RPC, visibilidad y lógica en TypeScript en
  [diseno-partidos.md](diseno-partidos.md).

- **Migraciones versionadas en el repo** (`supabase/migrations/`). Hoy el esquema vive solo en el dashboard de Supabase.
- **Estados de torneo y partido calculados, no guardados.** El prototipo guarda `status: 'abierto'` a mano en `crear-torneo`, y eso hay que cambiarlo.
- **Todo lo de partidos va por funciones de Postgres (RPC).** RLS no puede expresar "cada capitán escribe solo su propia confirmación".
- **La tabla de visibilidad necesita vistas públicas.** RLS filtra filas, no columnas.
- **Bugs del prototipo** (resueltos en #8): `login/actions.ts` y `login/page.tsx` validan `next` con `safeNextPath` y vuelven a `/` por defecto; `signOut({ scope: 'local' })` cierra solo el dispositivo actual.
- **Panel de organizador:** la gestión vive en `/mis-torneos`; `/panel` conserva los links anteriores redirigiendo allí.
- **Orden de subida del flyer:** el id del torneo no existe antes de insertarlo, y no tienen que quedar archivos huérfanos si el insert falla. Resuelto: el flyer se sube después del insert, como `flyers/<id del torneo>`. En la baja lo borra la Server Action por la API de Storage, después de la función de baja, porque Postgres no puede borrar archivos de Storage.
- **Parámetros de URL del catálogo en español** (`modalidad`, `zona`, `precio_max`). El prototipo usa `modality` y `status`.
- **Filtro de zona del catálogo:** el torneo guarda `zone_id` (FK a `zones`), ya no la zona como texto. `?zona=` recibe el id de una zona o de un corredor: una zona filtra por `zone_id` y un corredor, por `zones.corridor_id` con el embed `zones!inner(corridor_id)`. El filtro de `feat/dynamic-filters`, que compara el texto `zone`, deja de andar.
- **Fotos de perfil:** bucket público `avatars`, limitado a JPG/PNG/WebP de hasta 2 MB. Las policies de Storage permiten subir, ver las filas y retirar fotos solo en la carpeta del usuario autenticado (`<id del usuario>/<uuid>`). La acción valida el archivo, guarda la URL y retira la anterior; una actualización concurrente obliga a reintentar. Perfil y página del organizador usan `next/image` y solo muestran URLs de ese bucket de nuestro Supabase.
