# Torneos Amateur BA

Webapp que centraliza torneos de fútbol amateur de Buenos Aires y ayuda a equipos a encontrar rivales para partidos amistosos. El contacto y los pagos ocurren siempre por fuera de la app (WhatsApp / Instagram).

Este archivo es el **glosario** del proyecto: define cada término una sola vez para que el equipo, el código y los agentes de IA hablen igual. Las reglas de negocio detalladas están en [docs/decisiones-casos-de-uso.md](docs/decisiones-casos-de-uso.md).

## Language

### Geografía

**Región**:
Primer nivel geográfico: CABA o GBA.

**Corredor**:
Agrupación de zonas dentro de una región (por ejemplo, GBA Norte).

**Zona**:
Barrio de CABA o partido de GBA, tomado de una lista cerrada; es el nivel en que se ubican torneos, equipos y perfiles.
_Avoid_: barrio, localidad (como términos del sistema)

### Roles y vistas

**Invitado**:
Persona que navega sin iniciar sesión; puede consultar el catálogo y las fichas públicas, pero no gestionar equipos ni torneos.
_Avoid_: cuenta de invitado, usuario anónimo registrado

**Organizador**:
Usuario que publicó al menos un torneo y lo gestiona desde su **Panel de organizador**.
_Avoid_: dueño, admin

**Administrador**:
Integrante del equipo de Torneos BA que modera toda la plataforma desde el **Panel de administración**.
_Avoid_: admin (a secas, porque se confunde con el organizador), moderador

**Panel de organizador**:
Sección "Mis torneos" y las pantallas de cada torneo (datos, inscripciones y las que se sumen) donde el organizador gestiona sus torneos; es una sección más de la app, como "Mis equipos", no una forma distinta de navegar.
_Avoid_: panel de admin, vista de organizador, modo organizador

**Panel de administración**:
Pantalla exclusiva del administrador para moderar la plataforma.

### Torneos

**Torneo**:
Competencia de fútbol amateur que un **Organizador** publica en la app.

**Estado del torneo**:
Uno de **Abierto**, **Cerrado**, **En curso** o **Finalizado**, que la app calcula a partir de las fechas y del cupo; nadie lo elige a mano.
_Avoid_: estado "Últimos cupos", estado "sin confirmar"

**Cupo**:
Cantidad máxima de inscripciones que admite un torneo; es opcional.

**Flyer**:
Imagen opcional de un torneo (JPG, PNG o WebP, hasta 3 MB) que se ve en su card y su ficha; cada torneo tiene como mucho uno, y subir otro reemplaza al anterior.
_Avoid_: foto, portada, banner

**Últimos cupos**:
Etiqueta que se muestra sobre un torneo **Abierto** cuando le quedan 2 lugares o menos; no es un estado.

**Verificación**:
Confirmación explícita de que un torneo sigue en pie, hecha con el botón "Sigue vigente" por su organizador.
_Avoid_: actualización (editar un torneo no lo verifica)

**Antigüedad de verificación**:
Tiempo transcurrido desde la última **Verificación**: a partir de 30 días se muestra en ámbar y a partir de 60, en rojo con "sin confirmar".

**Observado**:
Marca que el administrador pone sobre un torneo a raíz de reportes, y que solo él puede sacar.
_Avoid_: sin confirmar (ese texto es exclusivo de la antigüedad de verificación)

**Baja**:
Retiro definitivo de un torneo que todavía no finalizó: desaparece del catálogo y su ficha deja de existir. También se dice del retiro de una **Inscripción** por el organizador: el equipo deja de figurar entre los anotados y libera su lugar en el **Cupo**.
_Avoid_: eliminar, borrar, cancelar

**Inscripción**:
Registro de un equipo en un torneo, cargado por el organizador desde su panel después de haber arreglado todo con el capitán por fuera de la app.
_Avoid_: anotarse, inscribirse (el jugador nunca se inscribe desde la app)

**Inscripción vinculada**:
Inscripción que apunta a un **Equipo** existente en la app.

**Inscripción por nombre**:
Inscripción de un equipo que no está en la app, registrada solo con el nombre que escribe el organizador.
_Avoid_: inscripción manual, equipo externo

### Equipos

**Equipo**:
Grupo de jugadores registrado en la app, con un capitán, un plantel, una zona, una modalidad habitual y un nivel declarado.

**Capitán**:
Único miembro de un equipo que puede gestionarlo y actuar en su nombre (buscar rival, aceptar partidos, cargar resultados).
_Avoid_: dueño del equipo, admin del equipo

**Plantel**:
Conjunto de usuarios que integran un equipo, capitán incluido; solo lo ven sus propios miembros.

**Equipo disuelto**:
Equipo que su capitán dio por terminado; conserva su página pública y su historia, pero ya no puede operar.
_Avoid_: equipo eliminado, equipo borrado

### Partidos

**Búsqueda de rival**:
Anuncio que publica un capitán para encontrar un rival en una modalidad, con una o más franjas dentro de los próximos 14 días.
_Avoid_: búsqueda (a secas, se confunde con los filtros del catálogo), anuncio

**Franja**:
Horario concreto de una búsqueda de rival: una fecha, con hora de inicio y de fin en horas enteras.
_Avoid_: disponibilidad, horario recurrente

**Propuesta**:
Invitación que el capitán de un equipo le manda a un rival compatible para jugar en la parte en común de dos **Franjas**; vale hasta que el receptor la acepta o la rechaza, el emisor la cancela o vence.
_Avoid_: cruce, desafío

**Franja ocupada**:
**Franja** que se superpone con un **Partido** del equipo; sale de los compatibles y no recibe más **Propuestas**.

**Partido**:
Encuentro entre dos equipos que nace cuando se acepta una **Propuesta**.

**Partido caído**:
Partido que uno de los capitanes dio por no jugado antes de la hora de inicio, indicando un motivo.
_Avoid_: partido suspendido, partido cancelado

**Caída de común acuerdo**:
**Partido caído** que un capitán pidió y el rival aceptó antes de la hora de inicio; no suma **Falta** para nadie.
_Avoid_: cancelación mutua

**Falta**:
Incumplimiento que se suma al historial de un equipo por no presentarse a un partido o por tirarlo con menos de 24 h de anticipación.
_Avoid_: ausencia, penalización

**Presentismo**:
Qué tan cumplidor es un equipo, medido por sus **Faltas** en los últimos 90 días; un equipo sin historial no tiene faltas.

**Reporte de no presentado**:
Declaración de un capitán de que el equipo rival no se presentó a un partido.
_Avoid_: denuncia

**Partido en conflicto**:
Partido en el que un equipo reportó que el rival no se presentó y el rival respondió que sí fue o lo acusó de lo mismo; queda registrado con las dos versiones y sin falta para nadie.
_Avoid_: disputa (sugiere que alguien la resuelve)

**Conflicto**:
Marca que suman los dos equipos de un **Partido en conflicto** y que se muestra en su página pública, junto con la cantidad de rivales distintos con los que lo tuvieron.

### Moderación

**Reporte**:
Aviso que un usuario con sesión le hace al administrador sobre un torneo (datos falsos o inexistente) o sobre un equipo contra el que jugó (conducta).
_Avoid_: denuncia, queja

**Suspensión**:
Sanción del administrador sobre una cuenta, por 7 días, 30 días o indefinida, que le impide crear o publicar cosas nuevas pero no entrar ni mirar.
_Avoid_: bloqueo, baneo

### Avisos

**Aviso**:
Mensaje que un usuario ve en la campanita al entrar a la app, que le cuenta algo que hizo otro y lo lleva a donde mirarlo o responder; no existe ningún envío por email ni push.
_Avoid_: notificación

## Relationships

### Cuentas y roles

- Un usuario tiene una sola cuenta con la que puede ser jugador, capitán y **Organizador** a la vez, y navega la app de una sola forma; el **Panel de organizador** es una sección a la que entra desde su menú de usuario
- Un **Organizador** no tiene ningún poder de **Administrador**; ser organizador no es un rol asignado, sino que surge de haber publicado un torneo

### Geografía

- Una **Región** tiene varios **Corredores** y un **Corredor** tiene varias **Zonas**; torneos, equipos y perfiles siempre se ubican en una **Zona**, y filtrar por un **Corredor** incluye todas sus zonas

### Torneos

- Todo **Torneo** tiene exactamente un **Organizador**; si alguien del equipo quiere cargar torneos ajenos para que el catálogo no arranque vacío, lo hace con su propia cuenta, como cualquier organizador
- Un torneo **Abierto** pasa a **Cerrado** al vencer el cierre de inscripción o al completar su **Cupo**; si se da de baja una **Inscripción** antes del cierre, vuelve a **Abierto**
- Todo **Torneo** tiene fecha de fin; al pasarla queda **Finalizado** y sale del catálogo
- Un torneo **Finalizado** no admite **Baja**: queda para siempre como trayectoria de su organizador
- La **Baja** la hace el organizador o el administrador, y genera un **Aviso** para el **Plantel** de cada equipo con **Inscripción vinculada** en ese torneo
- Una **Inscripción** la crea siempre el organizador de ese torneo, y puede ser **vinculada** o **por nombre**; las dos cuentan igual para el **Cupo**
- Solo una **Inscripción vinculada** genera **Avisos** y aparece en la historia del **Equipo**
- Un **Equipo** tiene como mucho una **Inscripción vinculada** por torneo; el capitán no confirma la vinculación

### Equipos

- Un **Equipo** tiene exactamente un **Capitán**, que no puede salir del **Plantel** sin antes pasar la capitanía
- Un **Equipo disuelto** no busca rival ni recibe **Inscripciones**, y no se puede reactivar; no se puede disolver un equipo con un partido sin terminar, y disolverlo cancela sus búsquedas de rival

### Partidos

- Todo lo de **Partidos** lo opera el **Capitán**; el resto del **Plantel** solo mira
- Una **Búsqueda de rival** tiene una o más **Franjas** y vence cuando pasa la última; el capitán la puede cancelar antes, y con ella caen sus **Propuestas** pendientes
- El **Presentismo** de un equipo se mide por sus **Faltas** en los últimos 90 días
- Dos búsquedas son compatibles si comparten modalidad y al menos una hora dentro de alguna **Franja** del mismo día, y nunca son de dos equipos con el mismo **Capitán**
- Un equipo nunca tiene dos **Partidos** superpuestos: al nacer un partido, se anulan todas las **Propuestas** pendientes de ambos equipos (enviadas y recibidas) que se superponen con ese horario
- Un **Reporte de no presentado** sin respuesta en 48 h suma una **Falta** al ausente; si el acusado responde que fue, el partido queda **en conflicto** y ambos equipos suman un **Conflicto**
- Si ambos equipos reportan que el otro no vino, el partido también queda **en conflicto**: acusar de vuelta cuesta lo mismo que negar
- Tirar un partido con menos de 24 h suma una **Falta**, salvo que sea una **Caída de común acuerdo**
- Las penalizaciones automáticas se calculan solo con **Faltas**, nunca con **Conflictos**; el **Administrador** no interviene en partidos

### Avisos

- Todo **Aviso** nace de la acción de un usuario y nunca le llega a quien la hizo; lo que pasa solo por el paso del tiempo no genera avisos
- Un **Aviso** que pide una acción le llega solo al **Capitán**; uno informativo, a todo el **Plantel**, tal como estaban en el momento del hecho
- Un **Aviso** no es la fuente de verdad: lo pendiente se ve siempre en la pantalla de **Partidos**, haya o no aviso

### Moderación

- Un **Reporte** de equipo solo lo puede hacer alguien que jugó al menos un partido contra ese equipo; la responsabilidad por la conducta del **Plantel** es del **Capitán**, y la **Suspensión** recae sobre él
- La **Suspensión** de un **Capitán** deja a su **Equipo** fuera de las búsquedas de rival, hace caer sus partidos futuros sin **Falta** para nadie y bloquea el cambio de capitán mientras dure

## Example dialogue

> **Dev:** "Si 'Real Floresta' no aparece en la cancha, ¿el capitán de 'Los Pibes' lo puede **reportar** al **Administrador**?"
> **Experto:** "No, eso no es un **Reporte**: es un **Reporte de no presentado**, que va al rival, no al administrador. Si 'Real Floresta' no contesta en 48 h, suma una **Falta**. Si contesta que fue, el partido queda **en conflicto** y los dos equipos suman un **Conflicto**."
> **Dev:** "¿Y un **Conflicto** los baja en la lista de rivales, como una **Falta**?"
> **Experto:** "No. Las penalizaciones solo cuentan **Faltas**. El **Conflicto** solo se muestra, para que los próximos rivales saquen sus conclusiones."
> **Dev:** "Entendido. ¿Y si 'Los Pibes' tiran el partido la noche anterior?"
> **Experto:** "Queda como **Partido caído** con su motivo, y como faltaban menos de 24 h, 'Los Pibes' suman una **Falta**. Ojo: nunca decimos que el partido se 'suspendió', porque **Suspensión** es la sanción del administrador sobre una cuenta."

## Flagged ambiguities

- "Elegir perfil de entrada (Jugar / Organizar)" y "loguearse como organizador" sugerían dos tipos de cuenta — resuelto: hay una sola cuenta y una sola forma de navegar. Se probó una "vista de organizador" con un switch en la barra ("Soy organizador" / "Volver a jugador") y se descartó: modelaba dos mundos para una sección de dos pantallas, y el botón no se entendía. Si el **Panel de organizador** crece, crece con pestañas dentro de cada torneo, no con un modo global.
- "panel de admin" se usaba para el panel del organizador — resuelto: son el **Panel de organizador** y el **Panel de administración**, y cada uno tiene su propio rol.
- "Anotar mi equipo" aparecía como una acción del capitán dentro de la app — resuelto: la **Inscripción** la hace solo el organizador; el capitán lo contacta por WhatsApp.
- Los estados aparecían con dos listas distintas (con "En curso" y con "Últimos cupos") — resuelto: son 4 estados calculados, y "Últimos cupos" es solo una etiqueta.
- "Sin confirmar" se usaba para dos cosas: la marca automática por falta de verificación y la marca manual del administrador — resuelto: son la **Antigüedad de verificación** y **Observado**, y "Sigue vigente" solo reinicia la primera.
- Las franjas podían ser concretas o repetirse ("todos los martes") — resuelto: toda **Franja** es una fecha concreta; "repetir" es solo un atajo del formulario.
- "Suspender" se usaba para partidos y para cuentas — resuelto: un partido se cae (**Partido caído**); "suspensión" queda reservada para las sanciones del administrador.
- "Disputa de no presentado" suponía que el administrador decidía quién tenía razón — resuelto: nadie decide; el partido queda **en conflicto** y la app muestra las dos versiones.
- "Notificar" aparecía en muchos flujos sin definir el canal — resuelto: todo es un **Aviso** en la campanita.
- "Torneo copiado" y "Transferencia" aparecieron en los docs del 27/09/2026 como un tipo de torneo sin organizador que cargaba el administrador — descartados el 07/10/2026: nadie del equipo había pedido ese concepto; la carga manual inicial se hace con una cuenta de organizador común.
