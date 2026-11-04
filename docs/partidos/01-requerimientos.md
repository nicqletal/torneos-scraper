# Módulo Partidos · Especificación de requerimientos

Versión del **04/11/2026**. Parte de la documentación del módulo: **requerimientos** → [casos de uso](02-casos-de-uso.md) → [pantallas](03-pantallas.md) → [diagramas de secuencia](04-diagramas-secuencia/README.md). El [README](README.md) tiene la matriz que los une.

Fuentes, en orden de autoridad: [decisiones-casos-de-uso.md](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md) (sección «Partidos»), [diseno-partidos.md](../especificaciones-y-requerimientos/diseno-partidos.md) (cómo se construye), [ADR 0002](../adr/0002-conflictos-sin-arbitro.md), [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (módulo D, 03/11/2026), el glosario [CONTEXT.md](../../CONTEXT.md) y el código y las migraciones del repo al día de hoy.

> **No confundir los prefijos.** Los `RF-D##` de este módulo son los del módulo D (Partidos). La especificación vieja del módulo Equipos (28/10/2026) usaba `RF-D##` para los suyos, cuando llamaba «módulo D» a Equipos; esos hoy son los `RF-C##` de [Equipos](../equipos/01-requerimientos.md).

## 1. Alcance

El módulo permite que los **equipos busquen rival y jueguen**: el **Capitán** publica cuándo puede jugar su equipo, la app muestra los **rivales compatibles**, se **proponen** y **aceptan** partidos, los capitanes **coordinan** cancha y hora, **confirman** asistencia, **tiran** el partido si hace falta, **cargan el resultado**, **califican** al rival y todo queda en un **historial público** con presentismo.

**Todo el módulo lo opera solo el Capitán.** El Plantel ve los partidos de sus equipos sin botones. Las búsquedas y las propuestas las ve solo el Capitán. Si otro jugador tiene que encargarse, se pasa la capitanía.

**Límites de producto:**

- La app **no inscribe ni cobra**, y **no negocia**: los capitanes arreglan cancha y hora **por WhatsApp**; la app **registra lo acordado**.
- **No hay árbitro.** Si un equipo dice «no vinieron» y el otro dice «fuimos», el partido queda **en conflicto**, sin falta para nadie. El administrador no interviene en partidos ([ADR 0002](../adr/0002-conflictos-sin-arbitro.md)).
- **No hay tareas programadas.** Nada ocurre «a las 48 h»: ocurre cuando alguien mira la pantalla. Los plazos y los estados se calculan al leer.

**Fuera del módulo:**

| Tema | Dónde está |
|---|---|
| Crear y gestionar equipos, pasar la capitanía | Módulo C — Equipos |
| La campanita (cómo se muestran los Avisos) | Módulo A — Cuenta y acceso (UC-A06) |
| Suspender una cuenta, que cancela búsquedas y tira partidos | Módulo F — Administración (UC-F05) |

## 2. Actores

| Actor | Quién es | Qué hace en este módulo |
|---|---|---|
| **Capitán** | Único miembro de un equipo que lo gestiona | Opera todo: busca rival, propone, acepta, coordina, confirma, tira, carga el resultado y califica. |
| **Jugador** | Integrante del Plantel | Ve los partidos de su equipo, sin botones. |
| **Sistema** | La base de datos y la app | Calcula fases, plazos, faltas y bloqueos al leer, y reparte los Avisos. |

## 3. Requerimientos funcionales

**Estado:** `Implementado` está en `main`. `Parcial` tiene una parte sin cumplir, que se indica. `Pendiente` es alcance vigente sin programar.

### Búsqueda de rival

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-D01 | **Solo el Capitán opera** el módulo. El Plantel solo mira los partidos; las búsquedas y las propuestas las ve solo el Capitán. | Todos | Implementado |
| RF-D02 | **Publicar una búsqueda** por equipo y modalidad (la modalidad habitual del equipo viene cargada y se puede cambiar). Hay **una sola búsqueda activa por equipo y modalidad**. Requiere: equipo no disuelto, Capitán con WhatsApp en el perfil, equipo sin **Bloqueo por faltas** y Capitán no suspendido. | UC-D01 | **Parcial**: la Suspensión no se verifica todavía |
| RF-D03 | **Franjas:** un día de los **próximos 14**, con un **Turno** (Mañana 9–12, Tarde 14–18, Noche 20–23) o «Otro horario» con dos horas enteras. Va de **8 a 24** sin cruzar la medianoche, dura **al menos 1 h** y, si es hoy, empieza en una hora que no pasó. «**Repetir la semana que viene**» crea la misma franja 7 días después; si cae fuera de los 14 días, se rechaza entera. | UC-D01 | Implementado |
| RF-D04 | Se **rechaza una franja que choca** con un partido acordado del equipo o con otra franja de la misma búsqueda. Entre búsquedas de **distinta modalidad** del mismo equipo sí se pueden superponer. | UC-D01 | Implementado |
| RF-D05 | La búsqueda guarda **solo la modalidad y las franjas**: la cercanía y el nivel salen de la **Zona y el nivel actuales del equipo**, así que cambiarlos en el equipo se refleja en el acto. | UC-D01, UC-D03 | Implementado |
| RF-D06 | La búsqueda está **activa** mientras le quede alguna franja por empezar y **vence sola** al pasar la última. Publicarla no genera ningún Aviso. Que nazca un partido no la cierra. | UC-D01, UC-D02 | Implementado |
| RF-D07 | **Editar la búsqueda:** agregar horarios o sacar uno con la ×; la modalidad no se cambia. Sacar una franja **cancela sus propuestas pendientes** (enviadas y recibidas) con el Aviso «Se canceló tu propuesta»; sacar la última cancela la búsqueda. | UC-D02 | Implementado |
| RF-D08 | **Cancelar la búsqueda** cancela todas sus propuestas pendientes, con el mismo Aviso. **Los partidos que ya nacieron de ella siguen en pie.** | UC-D02 | Implementado |
| RF-D09 | **Rivales compatibles:** misma modalidad y al menos **1 h en común el mismo día**; los niveles a dos escalones (recreativo contra competitivo) **no se cruzan**; **nunca dos equipos del mismo Capitán**; una **franja ocupada** o ya empezada se ignora. | UC-D03 | Implementado |
| RF-D10 | **Orden de los compatibles:** primero la cercanía (Zona > Corredor > Región), después el nivel y por último el **presentismo** (faltas en 90 días, de menos a más; sin historial cuenta 0). Los equipos con 2 faltas en 90 días van al final igual. Desempate: el horario en común más temprano. | UC-D03 | Implementado |

### Propuestas

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-D11 | **Proponer un partido** con el **horario en común**, que calcula la app (nadie elige un rango) y **sin mensaje**. El Capitán rival recibe el Aviso «Te propusieron un partido». **Sin límite** de propuestas pendientes por equipo; no se puede mandar otra al mismo rival para el mismo horario mientras la anterior está pendiente; nunca entre dos equipos del mismo Capitán. | UC-D04 | Implementado |
| RF-D12 | La propuesta **vence a las 72 h o cuando empieza su rango**, lo que ocurra primero. **Vencer no avisa.** | UC-D04 | Implementado |
| RF-D13 | **Cancelar** una propuesta enviada la cierra **sin Aviso**: el rival deja de verla al entrar. Se puede volver a proponer. Solo avisan las cancelaciones en cascada (sacar una franja, cancelar la búsqueda, disolver, bloqueo). | UC-D05 | Implementado |
| RF-D14 | **Aceptar** una propuesta crea el **Partido** con ese rango, **A coordinar**. Los dos planteles reciben «Partido acordado». Cada Capitán ve el **WhatsApp del otro** (siempre el del Capitán actual) mientras el partido esté por jugarse. Las franjas de los dos equipos que se superponen quedan **ocupadas** enteras. | UC-D06 | Implementado |
| RF-D15 | Al nacer un partido se **anulan** las propuestas pendientes de los dos equipos que se superponen con ese horario, con el Aviso «Se anuló tu propuesta: ya no tienen ese horario» al Capitán del otro lado. Si la anulada era entre estos mismos dos equipos (la que venía en sentido contrario), **no hay Aviso**: ya les llegó «Partido acordado». | UC-D06 | Implementado |
| RF-D16 | **Rechazar** una propuesta la cierra y avisa «Rechazaron tu propuesta» a quien la mandó. | UC-D06 | Implementado |
| RF-D17 | **Nunca dos partidos superpuestos:** si al aceptar alguno de los dos equipos ya tiene un partido en ese horario, la aceptación se rechaza. | UC-D06 | Implementado |
| RF-D18 | Si un equipo está **bloqueado por faltas**, la propuesta figura **cancelada, sin botones**, con la nota «el equipo está bloqueado por faltas», hasta cuando vencería: es la única forma de que el rival se entere, porque el bloqueo no avisa. | UC-D06 | Implementado |

### Coordinación, asistencia y caída

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-D19 | **Coordinar cancha y hora:** uno de los dos Capitanes carga la **cancha** (texto libre obligatorio, de 1 a 120 caracteres; se muestra con «Ver en el mapa») y la **hora exacta** (de a 15 min, desde el inicio del rango incluido hasta el fin excluido). El otro **confirma** o **corrige**; al confirmar, el partido queda **Coordinado**. Solo se puede **antes del inicio del rango**. Coordinar es una ayuda, no un requisito. | UC-D07 | Implementado |
| RF-D20 | **Cambiar después de Coordinado:** cualquiera vuelve a cargar cancha y hora; el partido deja de estar Coordinado, le toca confirmar al otro y mientras tanto la **Hora de inicio** vuelve a ser el inicio del rango. Los «Vamos» ya dados no se borran. Para cambiar de día, se tira y se propone de nuevo. | UC-D07 | Implementado |
| RF-D21 | **Confirmar asistencia:** desde **24 h** antes de la Hora de inicio, cada Capitán ve «¿Van?» con **Vamos** y **No vamos**. Si los dos dicen «Vamos», el partido queda **Confirmado** (sin Aviso, a propósito). Desde 12 h antes, si el rival no confirmó, se muestra «El rival todavía no confirmó». Si nadie confirma, el partido sigue en pie. «No vamos» abre el formulario de tirar el partido. | UC-D08 | Implementado |
| RF-D22 | **Tirar el partido** antes de la Hora de inicio, con un **motivo** obligatorio de 1 a 140 caracteres, que queda **visible en el historial público** (nadie lo modera). Con **menos de 24 h**, suma una **Falta** al equipo que lo tiró, desde que lo tiró. Las franjas que ocupaba se liberan y el partido entra al historial desde que se tira. Aviso «Se cayó el partido» a los dos planteles. | UC-D09 | Implementado |
| RF-D23 | **Caída de común acuerdo:** con menos de 24 h, el Capitán puede pedir tirarlo de común acuerdo (con su motivo). Si el rival acepta antes de la Hora de inicio, el partido se cae **sin falta para nadie**. Si rechaza o no responde, el partido sigue en pie y el que pidió puede tirarlo solo, con la falta. **No se vuelve a pedir.** Un cambio de Capitán en el medio no lo bloquea: el nuevo responde. | UC-D10 | Implementado |

### Resultado, calificación y mis partidos

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-D24 | **Cargar el resultado** una vez pasada la Hora de inicio, como un **marcador** (de 0 a 99 por lado, el equipo propio a la izquierda). El rival recibe «Cargaron el resultado: confirmá o corregí»; si confirma, el partido queda **Jugado** y los dos planteles reciben «Jugado». | UC-D11 | Implementado |
| RF-D25 | **Plazos de 48 h**, calculados al leer, contados desde la última carga de cualquiera (o desde el fin del rango, si nadie cargó): si el rival no hace nada, Jugado con el resultado cargado (sin Aviso); con resultados distintos, cada corrección da 48 h al otro y, si siguen sin coincidir al vencer, **Jugado sin resultado**; si nadie carga, **Jugado sin resultado**, sin falta para nadie. Un partido Jugado, en conflicto o con falta queda **cerrado** y no se corrige más. | UC-D11 | Implementado |
| RF-D26 | **«No vinieron»:** pasada la hora de inicio, quien no cargó resultado puede reportar que el rival no se presentó. El acusado recibe «Dicen que no fueron: respondé» y tiene 48 h. Si no responde, el partido cierra como **no presentado** y el ausente suma una **Falta**, firme al vencer el plazo (sin Aviso). | UC-D12 | Implementado |
| RF-D27 | **Conflicto:** si el acusado responde «fuimos» o carga un resultado, o si los dos reportan «no vinieron», el partido queda **en conflicto**: sin falta para nadie, los dos equipos suman un **Conflicto** visible en su página con las dos versiones, y los dos planteles reciben «Partido en conflicto». Cargar un resultado equivale a decir «fuimos». **Nadie arbitra.** | UC-D11, UC-D12 | Implementado |
| RF-D28 | **Calificar al rival** en un partido **Jugado** (con o sin resultado), hasta 7 días después: de **1 a 5 estrellas** y un comentario opcional de hasta 500 caracteres, **privado**. Una calificación por equipo y partido; no se edita. Un partido caído, en conflicto o con falta no se califica. Un equipo disuelto se sigue calificando hasta vencer los 7 días. | UC-D13 | Implementado |
| RF-D29 | **Revelación cruzada** (para que nadie califique en represalia): cada Capitán ve la calificación que le pusieron recién cuando los dos calificaron o pasaron 7 días. Quien calificó primero recibe «Ya podés ver tu calificación» (revelar por vencimiento no avisa). El promedio público cuenta solo las calificaciones reveladas. | UC-D13 | Implementado |
| RF-D30 | **Ver mis partidos** en `/partidos`: las propuestas recibidas (solo Capitán), el próximo partido en grande, los partidos esperando resultado, «Más adelante» y el historial plegado. El Jugador ve todo sin botones. El WhatsApp del Capitán rival lo ve solo el Capitán. **Esta pantalla es la fuente de verdad:** todo lo pendiente se ve acá, haya o no Aviso. | UC-D14 | Implementado |

### Reglas calculadas por el sistema

| ID | Requerimiento | Casos de uso | Estado |
|---|---|---|---|
| RF-D31 | **Presentismo y faltas:** una Falta cuenta por tirar con menos de 24 h (desde que se tiró) o por no presentarse (al vencer las 48 h). Cuentan las de los últimos 90 días. | UC-D03, UC-D09, UC-D12 | Implementado |
| RF-D32 | **Bloqueo por faltas:** 3 faltas en 90 días bloquean al equipo 30 días, desde la tercera: no puede publicar búsquedas ni proponer, y se cancelan sus búsquedas y propuestas pendientes. Los partidos acordados siguen. **No avisa.** | UC-D01, UC-D06 | Implementado |
| RF-D33 | **Los Conflictos solo se muestran** (contador y cantidad de rivales distintos); nunca penalizan. | UC-D12 | Implementado |
| RF-D34 | **Los Avisos de Partidos** son una lista cerrada de disparadores; los que piden acción van solo al Capitán y los informativos a todo el Plantel del momento; nunca a quien hizo la acción. Los detalles están en [casos-de-uso.md](../casos-de-uso/casos-de-uso.md#avisos-lista-cerrada-de-disparadores). | Todos | Implementado |
| RF-D35 | **Cambios de Capitán o de Plantel con partidos en curso:** nunca se bloquean; las búsquedas, propuestas y partidos son del equipo. | UC-D10 | Implementado |

## 4. Requerimientos no funcionales

| ID | Requisito | Evidencia |
|---|---|---|
| RNF-D01 | **Se guardan hechos con su hora, nunca estados.** El estado sale de funciones puras que reciben la hora actual (`match_phase`, `match_deadline`, `proposal_status`). **Sin tareas programadas.** | [diseno-partidos.md](../especificaciones-y-requerimientos/diseno-partidos.md), `20261028000006_matches.sql` |
| RNF-D02 | **El cálculo vive solo en Postgres:** las funciones validan contra la misma función que lee la pantalla; TypeScript solo traduce a texto. | `src/utils/match-display.ts` |
| RNF-D03 | **Ninguna tabla de Partidos se escribe desde el cliente.** No hay policies de insert, update ni delete: todo pasa por funciones (`save_rival_search`, `send_proposal`, `respond_proposal`, `coordinate_match`, `confirm_going`, `drop_match`, `request_mutual_drop`, `answer_mutual_drop`, `report_result`, `report_no_show`, `reply_went`, `rate_rival`). RLS no puede expresar «cada capitán escribe solo su propia confirmación». | `20261028000003` a `20261028000014` |
| RNF-D04 | **Visibilidad por tabla** (RLS): búsquedas y franjas, solo el Capitán dueño; propuestas, los Capitanes de los dos equipos; partidos, el Plantel de los dos equipos; calificaciones, nadie por la API (el comentario lo lee el administrador). | `diseno-partidos.md`, tests pgTAP |
| RNF-D05 | **El historial público nunca expone cancha ni hora.** Lo arman funciones `security definer` y dos vistas (`team_match_history`, `team_record`). | `20261028000012_team_history.sql`, `team_history_test.sql` |
| RNF-D06 | **El WhatsApp del Capitán rival** lo entrega una función `security definer`, solo al Capitán actual de un equipo con ese partido acordado y mientras esté por jugarse. | `rival_captain_whatsapp` |
| RNF-D07 | **«Nunca dos partidos superpuestos»** se hace cumplir bloqueando las filas de `teams` involucradas (`for update`, ordenadas por id) y consultando si hay un partido no caído superpuesto. No hay restricción de exclusión sobre partidos porque obligaría a duplicar un «activo» guardado. | `respond_proposal`, `save_rival_search` |
| RNF-D08 | **Las validaciones se repiten:** TypeScript las hace para dar un mensaje claro; **la función de la base es la que manda**. Los ids que llegan del cliente no son de confiar. | `rival-search-form.ts`, `match-forms.ts`, `actions.ts` |
| RNF-D09 | **Zona horaria fija:** los rangos se arman en `America/Argentina/Buenos_Aires` (UTC-3, sin horario de verano) a partir de fecha y horas enteras. | `save_rival_search`, `match-forms.ts` |
| RNF-D10 | **Los plazos se pueden probar sin esperar:** un script de escenarios versionado arma los casos que no se pueden esperar (72 h, 48 h, 7 días, faltas en 90 días), con la `service_role key` **local**, sin pasar por las funciones. | `scripts/qa/partidos.ts` |
| RNF-D11 | **Pruebas:** pgTAP para cada frontera de fase y plazo (23:59 h contra 24 h, 48 h justas, 72 h), cada función con sus rechazos y cada policy y vista; y pruebas unitarias de la validación y el texto. | `rival_searches_test.sql`, `proposals_test.sql`, `matches_test.sql`, `match_coordination_test.sql`, `match_drops_test.sql`, `match_results_test.sql`, `ratings_test.sql`, `team_faults_test.sql`, `team_history_test.sql`, `compatible_rivals_test.sql`, `notices_test.sql`; `match-forms.test.ts`, `rival-search-form.test.ts`, `match-display.test.ts`, `proposals.test.ts` |
| RNF-D12 | **Cada vista es una URL:** las dos pantallas son pestañas que son links (`/partidos`, `/partidos/buscar`); la búsqueda guarda el equipo y la modalidad en la URL. | `PartidosTabs.tsx` |

## 5. Sin decisión y diferencias con la documentación

| Tema | Situación |
|---|---|
| **«Copiar horarios de la última búsqueda»** | `decisiones-casos-de-uso.md` dice que reemplaza a la grilla de disponibilidad eliminada. **No existe en el código** y `casos-de-uso.md` no lo menciona. Hay que decidir si se programa o si se quita esa frase de las decisiones. |
| **Suspensión** | UC-D01 pide «Capitán no suspendido», pero la Suspensión no existe todavía (UC-F05). Hoy no se verifica en ninguna función de Partidos. |
| **Leer las calificaciones y sus comentarios** | Los lee el administrador al revisar un equipo reportado (UC-F04), pero la tabla no la lee nadie por la API: falta definir cómo accede el backoffice. |
| **Bloqueo por faltas** | Es automático y no avisa; el rival se entera por la propuesta cancelada. Está implementado; se documenta aquí porque no tiene pantalla propia. |
| **El motivo de tirar un partido no se modera** | Riesgo aceptado (27/10/2026): queda visible en el historial público tal cual lo escribió el Capitán. |

## 6. Reglas de referencia

- **Fases de un partido:** por jugarse (con las marcas **A coordinar**, **Coordinado** y **Confirmado**, que son datos y no fases), esperando resultado, **Jugado** (con o sin resultado), **caído**, **en conflicto** y **no presentado**. Las cuatro últimas son los «cerrados» del historial.
- **Hora de inicio:** la hora exacta coordinada, o el inicio del rango. Antes: solo tirar el partido. Después: solo resultado o «no vinieron».
- **Términos:** un partido **se cae** (nunca «se suspende»); se dice «tirar el partido»; «Aviso» y «campanita»; «Franja» es el término del dominio y **«horario»** en la interfaz.
