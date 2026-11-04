# Módulo Partidos · Pantallas

Versión del **04/11/2026**. Cada pantalla de Partidos, con su ruta, los casos, los requerimientos, lo que muestra y la captura. Siguen a los [casos de uso](02-casos-de-uso.md) y preceden a los [diagramas de secuencia](04-diagramas-secuencia/README.md).

**Estado de las capturas**

| Marca | Significa |
|---|---|
| ✅ **Vigente** | Sacada de `main` con la UI actual. |
| ⏳ **Pendiente** | Todavía no hay captura. |

**Hoy no hay ninguna captura de este módulo.** Las dos pantallas exigen sesión de un Capitán o de un Jugador (sin ella, el control de acceso redirige a Iniciar sesión) y la base de desarrollo no respondía. Para sacarlas hacen falta las **cuentas QA** del equipo (ver [diseno-partidos.md](../especificaciones-y-requerimientos/diseno-partidos.md)) y el script de escenarios `scripts/qa/partidos.ts` para armar los estados que dependen de plazos. Al final está la lista con los pasos.

## Mapa de pantallas

| Pantalla | Ruta | Casos de uso | Sesión |
|---|---|---|---|
| [P1 · Partidos](#p1--partidos) | `/partidos` | UC-D06 a UC-D14 | Obligatoria |
| [P2 · Buscar rival](#p2--buscar-rival) | `/partidos/buscar` | UC-D01 a UC-D05 | Obligatoria (solo Capitanes con equipo) |

Las dos son **pestañas** de un mismo módulo («Partidos» y «Buscar rival»), que son links: cada vista es una URL compartible. La pestaña «Partidos» muestra un punto lima cuando hay algo que responder. En el celular no hay título «Partidos» ni «Buscar rival»: las pestañas son el encabezado. **Las dos muestran lo de todos los equipos del usuario juntos**; el nombre del equipo propio aparece solo cuando el usuario está en más de uno.

---

## P1 · Partidos

**Ruta:** `/partidos` · **Casos de uso:** [UC-D06](02-casos-de-uso.md#uc-d06--aceptar-o-rechazar-una-propuesta) a [UC-D14](02-casos-de-uso.md#uc-d14--ver-mis-partidos) · **Requerimientos:** RF-D14 a RF-D30 · **Diagramas:** [S06](04-diagramas-secuencia/uc-d06-responder-propuesta.md) a [S14](04-diagramas-secuencia/uc-d14-ver-mis-partidos.md)

> ⏳ **Captura pendiente** (varias, una por estado).

**Qué muestra, de arriba abajo:**

1. **Te proponen jugar** (solo el Capitán): una tarjeta por propuesta recibida, «**Real Floresta** te propone jugar Sáb 7 · 20 a 22 h», con **Aceptar** y **Rechazar**. Una propuesta cancelada por el bloqueo del rival se ve sin botones, con la nota «el equipo está bloqueado por faltas».
2. **El próximo partido**, en grande: tres líneas (cuándo, contra quién, dónde o «Falta cancha y hora») y **una sola acción visible**:
   - desde 24 h antes: «**¿Van?**» con **Vamos** y **No vamos**;
   - si no: «Cargar cancha y hora» (abre el formulario) o el link para cambiarlas.
   El **WhatsApp del Capitán rival** es el ícono de arriba a la derecha. «Tirar el partido» (o «Tirar el partido (suma falta)») es un link chico al pie que abre el formulario del motivo.
3. **Contanos cómo salió**: los partidos esperando resultado, con el resultado como un **marcador** (los dos escudos y los goles en el medio, el equipo propio a la izquierda), «No vinieron» como link chico, y el vencimiento del plazo.
4. **Más adelante**: los otros partidos por jugarse.
5. **Historial · N partidos**, plegado: los cerrados, del más nuevo al más viejo, una línea cada uno con la fecha, el marcador con los dos nombres y «Ganamos», «Perdimos», «Empatamos», «Se cayó», «En conflicto» o «Falta». Va en primera persona, porque «Ganó» no dice quién. El detalle (quién lo tiró, las dos versiones) vive en la página del equipo.

**Lo que pide una respuesta va abierto en la fila** con un solo botón primario: confirmar o corregir cancha y hora, «¿Cómo salió?», confirmar el resultado del rival, «Fuimos», la caída de común acuerdo, **Calificar**. Lo que no pide nada va plegado detrás de un link («Cambiar cancha y hora», «Corregir el resultado», «Tirar el partido»).

**Formularios de la pantalla:**

| Formulario | Campos | De dónde salen las opciones |
|---|---|---|
| Cargar cancha y hora | **Cancha** (texto, 1 a 120 caracteres); **hora** (desplegable) | La hora es un **desplegable de a 15 minutos dentro del rango del partido**, que calcula la app (`coordinationTimes`); no se guarda en la base |
| Tirar el partido / pedir la caída | **Motivo** (texto, 1 a 140 caracteres) | — |
| Resultado | Dos goles (0 a 99) | — |
| Calificar | **Estrellas** (1 a 5, botones de opción) y comentario (hasta 500 caracteres, privado) | Lista fija del código |

**Estados de la pantalla:** *con partidos*; *vacío* («Todavía no hay partidos», que lleva a Buscar rival si es Capitán o a Mis equipos); *error* (banda con el motivo que devolvió la base); *Jugador* (todo visible, **sin botones**); *sin sesión* (redirige al login).

---

## P2 · Buscar rival

**Ruta:** `/partidos/buscar` · **Casos de uso:** [UC-D01](02-casos-de-uso.md#uc-d01--publicar-una-búsqueda-de-rival) a [UC-D05](02-casos-de-uso.md#uc-d05--cancelar-una-propuesta-enviada) · **Requerimientos:** RF-D02 a RF-D13 · **Diagramas:** [S01](04-diagramas-secuencia/uc-d01-publicar-busqueda.md) a [S05](04-diagramas-secuencia/uc-d05-cancelar-propuesta.md)

> ⏳ **Captura pendiente.**

**Qué muestra:** tres pasos en una sola columna.

1. **El equipo y la modalidad.** El equipo solo si el Capitán capitanea más de uno; la modalidad como chips (en el celular, plegados en una línea «Los Pibes · Fútbol 5 · Cambiar»). La modalidad viene cargada con la habitual del equipo.
2. **¿Cuándo pueden jugar?** Sin búsqueda activa, el formulario de la primera franja: una **grilla de 14 días** para tocar un día, un **Turno** (Mañana 9–12, Tarde 14–18, Noche 20–23) u «Otro horario» con dos horas enteras, y la casilla «**Repetir la semana que viene**». Con una búsqueda activa, el título **«Buscando rival»**, cada franja como una tarjeta con el bloque del día y una **×**, el botón «**Agregar otro horario**» que abre el formulario y el link «**Cancelar la búsqueda**».
3. **Rivales compatibles.** Una tarjeta por franja en común con cada rival compatible, con el horario en común y el botón «**Proponer partido**». Una propuesta ya mandada muestra «Propuesta enviada» y «Cancelar»; si la última ya no está pendiente, una nota con lo que pasó («Tu propuesta venció», «Rechazaron tu propuesta»).

**Opciones de los formularios:**

| Elección | De dónde salen las opciones |
|---|---|
| Equipo | Se **consultan en la base**: los equipos que el usuario capitanea |
| Modalidad | Lista **fija del código** (`SPORT_MODALITIES`: Fútbol 5, 7, 8 y 11) |
| Día | Los próximos 14 días, que calcula la app |
| Turno | Lista **fija del código** (Mañana, Tarde, Noche y «Otro horario») |

**Estados de la pantalla:** *sin búsqueda* (formulario de la primera franja); *buscando* (tarjetas de franjas y compatibles); *sin compatibles* («Ningún equipo de la zona publicó esos horarios. Con más horarios, más chances de partido.»); *equipo bloqueado* (en vez del formulario, hasta cuándo dura el bloqueo); *no es Capitán* («Buscar rival es cosa del capitán», con el texto «Si capitaneás un equipo, publicás cuándo pueden jugar y te mostramos rivales de tu zona»); *sin sesión* (redirige al login).

> En la interfaz, la **franja se llama «horario»** («Agregar otro horario», «¿Cuándo pueden jugar?»): «franja» es el término del dominio, en el código y en los documentos.

---

## Capturas pendientes

Convención: PNG en `docs/partidos/pantallas/`, ventana de unos 1280 px de ancho (y ~390 px para el celular, donde se piensa esta pantalla), con **datos de prueba**. Hacen falta las cuentas QA (Capitán de un equipo, un Jugador de ese equipo, un Capitán rival y un usuario ajeno) y `scripts/qa/partidos.ts` para armar los casos con plazos.

| Archivo | Pantalla y estado | Cómo conseguirlo |
|---|---|---|
| `buscar-sin-busqueda.png` | P2 con el formulario de la primera franja | Un Capitán sin búsqueda activa. |
| `buscar-buscando.png` | P2 «Buscando rival» con franjas | Con una búsqueda activa y dos horarios. |
| `buscar-compatibles.png` | P2 con rivales compatibles | Con un rival (por ejemplo, «Los Rivales de Prueba») que publicó un horario que se pisa. |
| `buscar-propuesta-enviada.png` | P2 con «Propuesta enviada» | Después de proponer. |
| `buscar-bloqueado.png` | P2 con el equipo bloqueado | Con el escenario `bloqueado`. |
| `partidos-propuesta-recibida.png` | P1 con «Te proponen jugar» | El Capitán rival con una propuesta pendiente. |
| `partidos-proximo.png` | P1 con el próximo partido | Un partido acordado, sin coordinar y coordinado. |
| `partidos-van.png` | P1 con «¿Van?» | Un partido a menos de 24 h. |
| `partidos-resultado.png` | P1 con «Contanos cómo salió» | Un partido que ya empezó. |
| `partidos-historial.png` | P1 con el historial desplegado | Con el escenario `historial`. |
| `partidos-jugador.png` | P1 vista del Jugador, sin botones | La cuenta de un Jugador del plantel. |
| `partidos-vacio.png` | P1 vacío | Una cuenta sin equipo. |
