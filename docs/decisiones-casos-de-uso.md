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
| "Elegir perfil de entrada" (Jugar / Organizar) | Se reemplaza por una portada fija y el botón "Soy organizador" |
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
- **Registro:** se entra directo, sin confirmar el email. El único mail que manda la app es el de "Olvidé mi contraseña". El SMTP gratis de Supabase manda muy pocos por hora: alcanza para la entrega, pero con usuarios reales hace falta un servicio aparte (por ejemplo, Resend).
- **Portada:** `/` es siempre la vista de jugador (catálogo). La barra superior tiene "Soy organizador" (lleva al panel de organizador y pide sesión) y "Volver a jugador".
- **Perfil:** nombre, foto (JPG/PNG/WebP, máx. 2 MB), zona y **WhatsApp**. El WhatsApp es opcional, pero obligatorio para crear un equipo o tomar la capitanía.
- **El rol de administrador no se puede editar desde la app.** Se asigna a mano en la base. El usuario edita nombre, foto, zona y WhatsApp, y nunca el rol.
- **Cerrar sesión** cierra solo el dispositivo actual.
- **Volver a la acción después del login (`next`):** solo se aceptan rutas internas. Ojo: `//sitio.com` empieza con `/` y es externa, así que hay que rechazarla también.

## Torneos

### Quién publica

- **Organizadores:** cualquier usuario con sesión y sin suspensión.
- **Torneos copiados:** el administrador los carga a partir de Instagram. No tienen organizador (solo el nombre y el contacto del organizador real, como texto), **no admiten inscripciones** y solo el administrador los edita, los verifica o les da de baja.
- **Transferencia:** si el organizador real se crea una cuenta, el administrador le pasa el torneo después de comprobar su identidad por el mismo Instagram. Ver [ADR 0001](adr/0001-torneos-copiados-sin-organizador.md).

### Formulario

| Obligatorio | Opcional |
|---|---|
| Nombre | Precio (vacío → "Consultar", 0 → "Gratis") |
| Modalidad (F5, F7, F8, F11) | Flyer (JPG/PNG/WebP, máx. 3 MB) |
| Zona | Cupo |
| Cierre de inscripción, inicio y fin | Descripción |
| Al menos un contacto: WhatsApp o Instagram | Reglamento (texto) |
| | Dirección de la sede (si está, la ficha muestra un mapa; si no, solo la zona) |

- Las fechas cumplen **cierre ≤ inicio ≤ fin**. Si no, el formulario no guarda.
- **La fecha de fin es obligatoria.** Sin ella, el torneo nunca llegaría a "Finalizado".
- Torneos copiados: se suma el nombre del organizador real.

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
- Genera un aviso a cada capitán con una inscripción vinculada.
- La hace el organizador o el administrador.

### Inscripciones

- Las carga **solo el organizador**, desde su panel. Hay dos tipos:
  - **vinculada:** busca un equipo de la app (se muestra la zona al lado, porque los nombres se repiten)
  - **por nombre:** escribe el nombre de un equipo que no está en la app
- Las dos cuentan para el cupo. Solo la vinculada genera avisos y aparece en la historia del equipo.
- Un mismo equipo de la app tiene como mucho una inscripción por torneo. El capitán no confirma la vinculación.
- La ficha muestra públicamente los nombres de los equipos inscriptos.

## Equipos

- **Crear:** nombre, zona, modalidad habitual y nivel (recreativo, intermedio o competitivo). El escudo es opcional. Máximo 3 equipos como capitán. Hace falta tener WhatsApp en el perfil.
- **Invitar:** link con validez de 7 días. Regenerarlo invalida el anterior. Quien lo abre entra directo al plantel.
- **Editar:** solo el capitán (nombre, escudo, zona, modalidad, nivel).
- **Salir:** cualquier jugador. El capitán primero tiene que pasar la capitanía.
- **Sacar a un jugador:** el capitán puede sacar a cualquiera.
- **Disolver:** el equipo **no se borra**. Queda "disuelto", con su página pública y su historia. No puede buscar rival ni recibir inscripciones. No se puede disolver con un partido acordado pendiente. Las propuestas pendientes se cancelan. No se reactiva: si vuelven, crean un equipo nuevo.

## Partidos

### Búsqueda de rival

- Una búsqueda activa por modalidad y por equipo.
- **Toda franja es concreta:** una fecha y un rango de horas enteras, dentro de los próximos 14 días.
- "Martes de 20 a 22, repetir" es un atajo del formulario que genera los martes de las próximas dos semanas como franjas sueltas.
- La búsqueda vence cuando pasa su última franja.
- **Compatibles:** misma modalidad y al menos 1 h en común el mismo día. Los niveles con dos escalones de diferencia (recreativo vs. competitivo) no se cruzan.
- **Orden de los compatibles:** primero la cercanía (zona > corredor > región), después el nivel y por último el presentismo.

### Propuesta → partido

- La propuesta vence a las 72 h o cuando pasa la franja, lo que ocurra primero.
- **Nunca dos partidos superpuestos.** Al nacer un partido, se anulan todas las propuestas pendientes de los dos equipos (enviadas y recibidas) que se superponen con ese horario, con aviso a los afectados. Si al aceptar alguno de los dos ya tiene un partido en ese horario, se rechaza.
- **Coordinación:** al aceptar la propuesta, el partido queda **A coordinar** y cada capitán ve el WhatsApp del otro (siempre el del capitán actual). Arreglan por WhatsApp. Cualquiera de los dos carga la cancha y la hora exacta, y el otro **confirma** (el partido queda **Coordinado**) o **corrige** (y le toca confirmar al primero).
- **Confirmación previa:** desde 24 h antes, al entrar, cada capitán ve "¿Confirmás que van?" con dos botones, **Vamos** y **No vamos**.
  - Si los dos dicen "Vamos", el partido queda **Confirmado**.
  - "No vamos" hace que el partido se caiga.
  - Desde 12 h antes, si el rival no confirmó, se muestra "El rival todavía no confirmó".
  - Si nadie confirma, no pasa nada: el partido sigue en pie.

### Partido caído

- Un partido **se cae**, nunca "se suspende": esa palabra queda para las sanciones del administrador.
- Cualquier capitán lo puede tirar antes de la hora de inicio, eligiendo un motivo.
- Con **menos de 24 h** de anticipación, suma una **falta** al equipo que lo tiró. Con más de 24 h, no.
- El motivo queda visible en el historial.

### Después del partido

| Qué pasa | Resultado |
|---|---|
| Los dos cargan el mismo resultado | Jugado, con ese resultado |
| Uno carga y el otro no hace nada en 48 h | Jugado, con el resultado cargado |
| Resultados distintos | 48 h para corregir; si siguen sin coincidir, Jugado sin resultado |
| Nadie carga nada en 48 h | Jugado sin resultado, sin falta para nadie |
| "No vinieron" y el acusado no responde en 48 h | **Falta** para el ausente |
| "No vinieron" y el acusado responde "fuimos" | **En conflicto**: sin falta; los dos equipos suman un conflicto y se muestran las dos versiones |
| Los dos reportan "no vinieron" | Sin jugar, sin falta ni conflicto para nadie |

- **Nadie arbitra.** El administrador no interviene en partidos ([ADR 0002](adr/0002-conflictos-sin-arbitro.md)).
- La página del equipo muestra, por ejemplo: "Jugó 12 · Faltó 1 · 2 conflictos (con 2 rivales distintos)".
- **Penalizaciones (cuentan solo faltas):**
  - 2 faltas en 90 días: el equipo va al final de la lista de compatibles.
  - 3 faltas en 90 días: el equipo no puede publicar búsquedas durante 30 días.
- **Calificación:** de 1 a 5 estrellas, con promedio público. Solo se califica en partidos **jugados** (con o sin resultado), nunca en uno caído o en conflicto. El comentario es privado y solo lo lee el administrador cuando revisa un equipo reportado.

## Administración

- **Panel de administración** (solo para el rol administrador):
  - tablero con números
  - reportes pendientes
  - buscador de usuarios por nombre o email
  - carga y transferencia de torneos copiados
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
| Página del equipo (escudo, nombre, zona, modalidad, nivel, cantidad de jugadores, faltas y conflictos, estrellas, últimos 5 partidos) | ✅ | ✅ |
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

- **Migraciones versionadas en el repo** (`supabase/migrations/`). Hoy el esquema vive solo en el dashboard de Supabase.
- **Estados de torneo y partido calculados, no guardados.** El prototipo guarda `status: 'abierto'` a mano en `crear-torneo`, y eso hay que cambiarlo.
- **Todo lo de partidos va por funciones de Postgres (RPC).** RLS no puede expresar "cada capitán escribe solo su propia confirmación".
- **La tabla de visibilidad necesita vistas públicas.** RLS filtra filas, no columnas.
- **Bugs del prototipo:**
  - `login/actions.ts` no valida `next` y manda a `/admin` por defecto
  - `signOut()` cierra todas las sesiones: hay que pasarle `{ scope: 'local' }`
- **Orden de subida del flyer:** el id del torneo no existe antes de insertarlo, y no tienen que quedar archivos huérfanos si el insert falla.
- **Parámetros de URL del catálogo en español** (`modalidad`, `zona`, `precio_max`). El prototipo usa `modality` y `status`.
