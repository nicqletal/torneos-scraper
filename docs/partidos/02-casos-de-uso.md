# Módulo Partidos · Casos de uso

Versión del **04/11/2026**. Detalla los casos de uso del módulo D de [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (UC-D01 a UC-D14) con los requerimientos que cubre cada uno ([01-requerimientos.md](01-requerimientos.md)), la pantalla que lo representa ([03-pantallas.md](03-pantallas.md)) y su diagrama de secuencia ([04-diagramas-secuencia](04-diagramas-secuencia/README.md)).

**Cómo leerlo.** Cada caso expresa una meta y tiene **un actor iniciador**. **Estado** dice si está en `main`. Los mensajes entre comillas son los que ve la persona. Todo el módulo lo opera **solo el Capitán**; el Plantel ve los partidos sin botones. Las dos pantallas son `/partidos` (lo que tenés) y `/partidos/buscar` (lo que querés).

## Mapa de casos de uso

| Caso | Meta del actor | Actor | Estado | ID en el PDF original |
|---|---|---|---|---|
| [UC-D01](#uc-d01--publicar-una-búsqueda-de-rival) | Publicar una búsqueda de rival | Capitán | **Parcial** (Suspensión) | UC-13 |
| [UC-D02](#uc-d02--editar-o-cancelar-la-búsqueda) | Editar o cancelar la búsqueda | Capitán | Implementado | — |
| [UC-D03](#uc-d03--ver-rivales-compatibles) | Ver rivales compatibles | Capitán | Implementado | UC-14 |
| [UC-D04](#uc-d04--proponer-un-partido) | Proponer un partido | Capitán | Implementado | UC-15 |
| [UC-D05](#uc-d05--cancelar-una-propuesta-enviada) | Cancelar una propuesta enviada | Capitán | Implementado | UC-17 |
| [UC-D06](#uc-d06--aceptar-o-rechazar-una-propuesta) | Aceptar o rechazar una propuesta | Capitán | Implementado | UC-16 |
| [UC-D07](#uc-d07--coordinar-cancha-y-hora) | Coordinar cancha y hora | Capitán | Implementado | UC-18 |
| [UC-D08](#uc-d08--confirmar-asistencia) | Confirmar asistencia | Capitán | Implementado | UC-19 |
| [UC-D09](#uc-d09--tirar-el-partido) | Tirar el partido | Capitán | Implementado | UC-20 |
| [UC-D10](#uc-d10--caída-de-común-acuerdo) | Caída de común acuerdo | Capitán | Implementado | — |
| [UC-D11](#uc-d11--cargar-el-resultado) | Cargar el resultado | Capitán | Implementado | — |
| [UC-D12](#uc-d12--reportar-que-el-rival-no-se-presentó) | Reportar que el rival no se presentó | Capitán | Implementado | — |
| [UC-D13](#uc-d13--calificar-al-rival) | Calificar al rival | Capitán | Implementado | — |
| [UC-D14](#uc-d14--ver-mis-partidos) | Ver mis partidos | Capitán o Jugador | Implementado | — |

Los diagramas generales de [`diagramas-secuencia.md`](../diagramas-de-secuencia/diagramas-secuencia.md) (D12 a D19) cubren los ocho primeros casos del PDF original (UC-13 a UC-20); el resto (editar, común acuerdo, resultado, «no vinieron», calificar y mis partidos) figura como «para otra tanda» y no tiene correspondencia exacta en los documentos del repo.

**Qué no es un caso de uso acá:** abrir una pestaña, desplegar «Historial» o «Más adelante», o los avisos de estado que la app calcula sola (vencimientos, faltas, bloqueo) no son casos: están en las [reglas transversales](../casos-de-uso/casos-de-uso.md#reglas-transversales-lo-que-calcula-el-sistema).

---

## UC-D01 · Publicar una búsqueda de rival

- **Actor:** Capitán.
- **Requerimientos:** RF-D01 a RF-D06, RF-D32. **Pantalla:** [P2 · Buscar rival](03-pantallas.md#p2--buscar-rival) (`/partidos/buscar`). **Diagrama:** [S01](04-diagramas-secuencia/uc-d01-publicar-busqueda.md).
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

## UC-D02 · Editar o cancelar la búsqueda

- **Actor:** Capitán.
- **Requerimientos:** RF-D07, RF-D08. **Pantalla:** [P2 · Buscar rival](03-pantallas.md#p2--buscar-rival). **Diagrama:** [S02](04-diagramas-secuencia/uc-d02-editar-cancelar-busqueda.md).
- **Precondiciones:** tiene una búsqueda activa.
- **Flujo principal (editar):** agrega franjas con «Agregar otro horario» o saca una con la ×. La modalidad no se cambia.
- **Flujo principal (cancelar):** toca «Cancelar la búsqueda» y confirma.
- **Reglas:**
  - Sacar una franja cancela sus propuestas pendientes (enviadas y recibidas) con el Aviso «Se canceló tu propuesta» al otro lado. Sacar la última franja cancela la búsqueda.
  - Cancelar la búsqueda cancela todas sus propuestas pendientes, con el mismo Aviso. **Los partidos que ya nacieron de ella siguen en pie.**
  - Que nazca un partido no cierra la búsqueda: sigue con sus otras franjas.
- **Estado:** Implementado (`save_rival_search` con el conjunto completo de franjas; vacío = cancelar).

## UC-D03 · Ver rivales compatibles

- **Actor:** Capitán.
- **Requerimientos:** RF-D09, RF-D10, RF-D31. **Pantalla:** [P2 · Buscar rival](03-pantallas.md#p2--buscar-rival) (sección «Rivales compatibles»). **Diagrama:** [S03](04-diagramas-secuencia/uc-d03-ver-rivales-compatibles.md).
- **Precondiciones:** búsqueda activa.
- **Flujo principal:** en `/partidos/buscar` ve una tarjeta por franja en común con cada rival compatible, con el horario en común calculado y el botón «Proponer partido».
- **Reglas de compatibilidad:** misma modalidad y al menos 1 h en común el mismo día; los niveles con dos escalones de diferencia no se cruzan; nunca dos equipos del mismo Capitán; una **Franja ocupada** o ya empezada sale de los compatibles.
- **Orden:** cercanía (Zona > Corredor > Región), después nivel, después **Presentismo**; los equipos con 2 faltas en 90 días van al final; empate: el horario en común más temprano.
- **Flujos alternativos:** **A1. Sin compatibles:** «Ningún equipo de la zona publicó esos horarios. Con más horarios, más chances de partido.»
- **Estado:** Implementado (`compatible_rivals`).

## UC-D04 · Proponer un partido

- **Actor:** Capitán.
- **Requerimientos:** RF-D11, RF-D12. **Pantalla:** [P2 · Buscar rival](03-pantallas.md#p2--buscar-rival). **Diagrama:** [S04](04-diagramas-secuencia/uc-d04-proponer-partido.md).
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
- **Estado:** Implementado (`send_proposal`).

## UC-D05 · Cancelar una propuesta enviada

- **Actor:** Capitán que la mandó.
- **Requerimientos:** RF-D13. **Pantalla:** [P2 · Buscar rival](03-pantallas.md#p2--buscar-rival). **Diagrama:** [S05](04-diagramas-secuencia/uc-d05-cancelar-propuesta.md).
- **Precondiciones:** la propuesta está pendiente.
- **Flujo principal:** toca «Cancelar» en la tarjeta. El sistema la cierra **sin Aviso**: el rival deja de verla al entrar. Se puede volver a proponer.
- **Regla:** solo avisan las cancelaciones en cascada (sacar una franja, cancelar la búsqueda, disolver, bloqueo).
- **Estado:** Implementado (la misma función `respond_proposal` que rechazar; el sistema distingue por quién la llama).

## UC-D06 · Aceptar o rechazar una propuesta

- **Actor:** Capitán que la recibió.
- **Requerimientos:** RF-D14 a RF-D18. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos) (sección «Te proponen jugar»). **Diagrama:** [S06](04-diagramas-secuencia/uc-d06-responder-propuesta.md).
- **Precondiciones:** la propuesta está pendiente (no venció ni la cancelaron).
- **Flujo principal (aceptar):**
  1. En `/partidos` ve «**Real Floresta** te propone jugar Sáb 7 · 20 a 22 h» con **Aceptar** y **Rechazar**.
  2. Acepta. El sistema crea el **Partido** con ese rango y lo deja **A coordinar**.
  3. Los dos planteles reciben «Partido acordado». Cada Capitán ve el WhatsApp del otro mientras el partido esté por jugarse.
  4. Las franjas de los dos equipos que se superponen con el partido quedan **ocupadas** enteras.
  5. Se anulan las propuestas pendientes de los dos equipos que se superponen con ese horario, con el Aviso «Se anuló tu propuesta: ya no tienen ese horario» (sin Aviso si era entre estos mismos dos equipos).
- **Flujo principal (rechazar):** el sistema cierra la propuesta y avisa «Rechazaron tu propuesta» a quien la mandó.
- **Flujos alternativos:**
  - **A1. Alguno de los dos ya tiene un partido en ese horario:** se rechaza la aceptación. **Nunca dos partidos superpuestos.**
  - **A2. Equipo bloqueado por faltas:** la propuesta figura cancelada, sin botones, con la nota «el equipo está bloqueado por faltas», hasta cuándo vencería.
  - **A3. La propuesta ya no está pendiente / equipo disuelto / no es el que la recibe:** «La propuesta ya no está pendiente», «El equipo está disuelto», «Solo el equipo que la recibe puede aceptarla».
- **Postcondición (aceptar):** partido por jugarse; las horas que ocupa son siempre el rango de la propuesta.
- **Estado:** Implementado (`respond_proposal`).

## UC-D07 · Coordinar cancha y hora

- **Actor:** cualquiera de los dos Capitanes.
- **Requerimientos:** RF-D19, RF-D20. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos) (el próximo partido y las filas). **Diagrama:** [S07](04-diagramas-secuencia/uc-d07-coordinar-cancha-hora.md).
- **Precondiciones:** partido por jugarse y **antes del inicio del rango**.
- **Flujo principal:**
  1. Los Capitanes arreglan por WhatsApp (la app no negocia).
  2. Uno carga la **cancha** (texto libre, obligatorio, hasta 120 caracteres; se muestra con «Ver en el mapa») y la **hora exacta** (desplegable de a 15 min, desde el inicio del rango incluido hasta el fin excluido: en 20 a 22, de 20:00 a 21:45).
  3. El Capitán rival recibe «Confirmá cancha y hora» y lo ve abierto en la fila con un botón para **confirmar** o **corregir**.
  4. Si confirma, el partido queda **Coordinado** y los dos planteles reciben «Partido coordinado» con cancha y hora. Si corrige, le toca confirmar al primero.
- **Flujos alternativos:**
  - **A1. Cambiar después de Coordinado:** cualquiera vuelve a cargar; el partido deja de estar Coordinado y le toca confirmar al otro. Mientras no se confirme, la **Hora de inicio** vuelve a ser el inicio del rango. Los «Vamos» ya dados no se borran.
  - **A2. Inicio del rango pasado:** ya no se carga, confirma ni corrige, aunque la hora coordinada sea más tarde (si no, corregir a las 20:30 un partido de 20 a 22 coordinado a las 21 lo des-coordinaría cuando ya habría empezado).
  - **A3. Datos inválidos:** «La cancha va de 1 a 120 caracteres.» o «La hora va de a 15 minutos, dentro del horario del partido.»
  - **A4. Para cambiar de día:** se tira el partido y se propone de nuevo.
- **Reglas:** coordinar es una ayuda, no un requisito. Un partido que llega a su hora sin coordinar sigue el flujo normal.
- **Estado:** Implementado (`coordinate_match`).

## UC-D08 · Confirmar asistencia

- **Actor:** cada Capitán.
- **Requerimientos:** RF-D21. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos) («¿Van?»). **Diagrama:** [S08](04-diagramas-secuencia/uc-d08-confirmar-asistencia.md).
- **Precondiciones:** faltan 24 h o menos para la **Hora de inicio** y el partido está por jugarse.
- **Flujo principal:**
  1. Al entrar ve «¿Van?» con **Vamos** y **No vamos**.
  2. Toca «Vamos». Cuando los dos lo hicieron, el partido queda **Confirmado**. No hay Aviso, a propósito.
- **Flujos alternativos:**
  - **A1. «No vamos»:** abre el formulario de tirar el partido, con «Suma una falta a tu equipo» (UC-D09).
  - **A2. Desde 12 h antes, si el rival no confirmó:** «El rival todavía no confirmó» (sin Aviso: lo ve al entrar).
  - **A3. Nadie confirma:** no pasa nada, el partido sigue en pie.
- **Estado:** Implementado (`confirm_going`).

## UC-D09 · Tirar el partido

- **Actor:** cualquiera de los dos Capitanes.
- **Requerimientos:** RF-D22, RF-D31. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos) («Tirar el partido»). **Diagrama:** [S09](04-diagramas-secuencia/uc-d09-tirar-partido.md).
- **Precondiciones:** partido por jugarse, antes de la **Hora de inicio**.
- **Flujo principal:**
  1. Toca «Tirar el partido» (o «Tirar el partido (suma falta)» si faltan menos de 24 h).
  2. Escribe el **motivo** (obligatorio, 1 a 140 caracteres; queda visible en el historial público, nadie lo modera).
  3. El sistema marca el **Partido caído** y avisa «Se cayó el partido» a los dos planteles, con el motivo y, si suma falta, a quién.
- **Reglas:** con **menos de 24 h**, suma una **Falta** al equipo que lo tiró, desde que lo tiró (con 24 h justas todavía no). Las franjas que ocupaba se liberan. Un partido caído entra al historial del equipo desde que se tira.
- **Flujos alternativos:** **A1.** Con menos de 24 h, en vez de tirarlo solo, puede pedir una **Caída de común acuerdo** (UC-D10). **A2.** Motivo inválido: «El motivo va de 1 a 140 caracteres.»
- **Estado:** Implementado (`drop_match`).

## UC-D10 · Caída de común acuerdo

- **Actor:** el Capitán que la pide; el Capitán rival responde.
- **Requerimientos:** RF-D23, RF-D35. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos). **Diagrama:** [S10](04-diagramas-secuencia/uc-d10-caida-comun-acuerdo.md).
- **Precondiciones:** faltan menos de 24 h (con más, tirarlo no suma falta y no se ofrece); nadie pidió una antes en este partido; antes de la hora de inicio.
- **Flujo principal:**
  1. El Capitán pide tirarlo de común acuerdo, con su motivo. El rival recibe «Piden tirar el partido de común acuerdo».
  2. El rival ve el pedido abierto en la fila y **acepta**: el partido se cae con ese motivo, **sin falta para nadie**, y los dos planteles reciben «Se cayó de común acuerdo». En el historial figura como tirado de común acuerdo.
- **Flujos alternativos:**
  - **A1. Rechaza:** el partido sigue en pie; el que pidió recibe «Rechazaron tirarlo de común acuerdo» y todavía puede tirarlo solo, con la falta. **No se vuelve a pedir** (ninguno de los dos).
  - **A2. No responde antes de la hora de inicio:** el partido sigue en pie; el que pidió puede tirarlo solo con la falta.
  - **A3. Cambio de Capitán en el medio:** el nuevo Capitán responde el pedido pendiente.
- **Estado:** Implementado (`request_mutual_drop`, `answer_mutual_drop`).

## UC-D11 · Cargar el resultado

- **Actor:** cada Capitán.
- **Requerimientos:** RF-D24, RF-D25, RF-D27. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos) («Contanos cómo salió»). **Diagrama:** [S11](04-diagramas-secuencia/uc-d11-cargar-resultado.md).
- **Precondiciones:** pasó la **Hora de inicio**; el partido está **esperando resultado**.
- **Flujo principal:**
  1. En «Contanos cómo salió» carga los goles como un **marcador** (de 0 a 99 por lado, el equipo propio a la izquierda).
  2. El Capitán rival recibe «Cargaron el resultado: confirmá o corregí» con el vencimiento.
  3. El rival confirma (carga el mismo resultado espejado): el partido queda **Jugado** con ese resultado y los dos planteles reciben «Jugado». Se habilita la calificación (UC-D13).
- **Flujos alternativos (plazos de 48 h, calculados al leer):**
  - **A1. El rival no hace nada en 48 h:** Jugado con el resultado cargado. Sin Aviso.
  - **A2. Resultados distintos:** 48 h para corregir, contadas desde la última carga de cualquiera. Cada corrección le da al otro 48 h enteras; no hay tope. Si siguen sin coincidir al vencer, **Jugado sin resultado**.
  - **A3. Nadie carga nada en 48 h desde el fin del rango:** Jugado sin resultado, sin falta para nadie.
  - **A4. Cargar un resultado equivale a decir «fuimos»:** si el rival reportó «no vinieron» (antes o después), el partido queda **en conflicto** (UC-D12).
  - **A5. Goles inválidos:** «Los goles van de 0 a 99.»
- **Reglas:** quien cargó un resultado ya no reporta «no vinieron» (solo corrige). Un partido Jugado, en conflicto o con falta queda cerrado y no se corrige más.
- **Estado:** Implementado (`report_result`).

## UC-D12 · Reportar que el rival no se presentó

- **Actor:** el Capitán que reporta; el Capitán acusado responde.
- **Requerimientos:** RF-D26, RF-D27, RF-D31, RF-D33. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos) («No vinieron»). **Diagrama:** [S12](04-diagramas-secuencia/uc-d12-reportar-no-se-presento.md).
- **Precondiciones:** pasó la hora de inicio; el que reporta no cargó resultado.
- **Flujo principal:**
  1. Toca «No vinieron» (link chico al lado de cargar el resultado).
  2. El Capitán acusado recibe «Dicen que no fueron: respondé antes del [fecha] o suman una falta».
  3. Si no responde en 48 h, el partido cierra como **no presentado** y el ausente suma una **Falta**, firme desde que venció el plazo. Sin Aviso: es por el paso del tiempo.
- **Flujos alternativos:**
  - **A1. El acusado responde «fuimos» (o carga un resultado):** el partido queda **en conflicto**: sin falta para nadie, los dos equipos suman un **Conflicto** visible en su página con las dos versiones, y los dos planteles reciben «Partido en conflicto».
  - **A2. Los dos reportan «no vinieron»** («Ellos tampoco vinieron»): también en conflicto. Acusar de vuelta cuesta lo mismo que negar.
- **Reglas:** **nadie arbitra**; el administrador no interviene en partidos ([ADR 0002](../adr/0002-conflictos-sin-arbitro.md)). Quien reportó ya no carga resultado. Un partido en conflicto no se califica.
- **Estado:** Implementado (`report_no_show`, `reply_went`).

## UC-D13 · Calificar al rival

- **Actor:** Capitán.
- **Requerimientos:** RF-D28, RF-D29. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos) («Calificar a …»). **Diagrama:** [S13](04-diagramas-secuencia/uc-d13-calificar-rival.md).
- **Precondiciones:** el partido está **Jugado** (con o sin resultado) y no pasaron 7 días desde que quedó Jugado.
- **Flujo principal:**
  1. Toca «Calificar» en la fila del partido.
  2. Pone de 1 a 5 estrellas y, opcionalmente, un comentario de hasta 500 caracteres (privado; solo lo lee el administrador al revisar un equipo reportado).
  3. El sistema guarda una calificación por equipo y partido. No se edita.
- **Reglas de revelación (para que nadie califique en represalia):** cada Capitán ve la que le pusieron recién cuando los dos calificaron o vencieron los 7 días. Cuando la segunda calificación revela las dos, el que calificó primero recibe «Ya podés ver tu calificación» (revelar por vencimiento no avisa). El promedio público cuenta solo calificaciones reveladas.
- **Flujos alternativos:** **A1.** Partido caído, en conflicto o con falta: no se califica. **A2.** Equipo disuelto: se sigue calificando hasta vencer los 7 días. **A3.** Datos inválidos: «Elegí de 1 a 5 estrellas.» o «El comentario va hasta 500 caracteres.»
- **Estado:** Implementado (`rate_rival`).

## UC-D14 · Ver mis partidos

- **Actor:** Capitán o Jugador.
- **Requerimientos:** RF-D01, RF-D30. **Pantalla:** [P1 · Partidos](03-pantallas.md#p1--partidos). **Diagrama:** [S14](04-diagramas-secuencia/uc-d14-ver-mis-partidos.md).
- **Flujo principal:** entra a `/partidos` y ve, de arriba abajo: las propuestas recibidas (solo Capitán), el **próximo partido** en grande (cuándo, contra quién, dónde o «Falta cancha y hora», con una sola acción visible), los partidos esperando resultado, los otros por jugarse («Más adelante») y el **historial** plegado con los cerrados («Ganamos», «Perdimos», «Empatamos», «Se cayó», «En conflicto», «Falta»).
- **Reglas:**
  - El Jugador ve todo sin botones. El WhatsApp del Capitán rival lo ve solo el Capitán, con un partido acordado.
  - Lo que pide una respuesta va abierto en la fila con un solo botón primario; lo que no, plegado detrás de un link.
  - Todo lo pendiente se ve acá, haya o no Aviso: esta pantalla es la fuente de verdad.
  - Muestra lo de **todos** los equipos del usuario juntos; el nombre del equipo propio aparece solo cuando el usuario está en más de uno.
- **Flujos alternativos:** **A1.** Sin equipo o sin partidos: estado vacío («Todavía no hay partidos») que lleva a Buscar rival (si es Capitán) o a Mis equipos.
- **Estado:** Implementado.
