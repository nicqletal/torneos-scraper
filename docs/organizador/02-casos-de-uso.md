# Módulo Organizador · Casos de uso

Versión del **04/11/2026**. Detalla los casos de uso del módulo E de [casos-de-uso.md](../casos-de-uso/casos-de-uso.md) (UC-E01 a UC-E07) con los requerimientos que cubre cada uno ([01-requerimientos.md](01-requerimientos.md)), la pantalla que lo representa ([03-pantallas.md](03-pantallas.md)) y su diagrama de secuencia ([04-diagramas-secuencia](04-diagramas-secuencia/README.md)).

**Cómo leerlo.** Cada caso expresa una meta y tiene **un actor iniciador**. **Estado** dice si está en `main`. Los mensajes entre comillas son los que ve la persona.

## Mapa de casos de uso

| Caso | Meta del actor | Actor | Estado | ID en el PDF original |
|---|---|---|---|---|
| [UC-E01](#uc-e01--publicar-un-torneo) | Publicar un torneo | Usuario | **Parcial** (Suspensión) | SPEC-E01 |
| [UC-E02](#uc-e02--ver-mis-torneos-panel-de-organizador) | Ver mis torneos | Organizador | Implementado | SPEC-E02 |
| [UC-E03](#uc-e03--editar-un-torneo) | Editar un torneo | Organizador | Implementado | SPEC-E01 |
| [UC-E04](#uc-e04--verificar-que-el-torneo-sigue-vigente) | Verificar que el torneo sigue vigente | Organizador | Implementado | SPEC-E02 |
| [UC-E05](#uc-e05--dar-de-baja-un-torneo) | Dar de baja un torneo | Organizador | Implementado | SPEC-E02 |
| [UC-E06](#uc-e06--cargar-una-inscripción) | Cargar una inscripción | Organizador | Implementado | SPEC-E03 |
| [UC-E07](#uc-e07--dar-de-baja-una-inscripción) | Dar de baja una inscripción | Organizador | Implementado | SPEC-E03 |

El PDF original agrupaba publicar y editar en SPEC-E01, y consultar, verificar y dar de baja en SPEC-E02; los diagramas generales de [`diagramas-secuencia.md`](../diagramas-de-secuencia/diagramas-secuencia.md) ya los separan (D23 a D28). El flujo del PDF donde el capitán se anotaba desde la app se retiró. La carga manual por el equipo no es un caso aparte: es UC-E01 con una cuenta propia.

**Qué no es un caso de uso acá:** cambiar de pestaña en la pantalla de gestión (`?tab=`) o abrir «Ver ficha pública» no toman ninguna decisión.

---

## UC-E01 · Publicar un torneo

- **Actor:** Usuario (pasa a ser **Organizador** al publicar).
- **Requerimientos:** RF-E01 a RF-E08. **Pantalla:** [P2 · Publicar torneo](03-pantallas.md#p2--publicar-torneo) (`/crear-torneo`). **Diagrama:** [S01](04-diagramas-secuencia/uc-e01-publicar-torneo.md).
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

## UC-E02 · Ver mis torneos (Panel de organizador)

- **Actor:** Organizador.
- **Requerimientos:** RF-E12 a RF-E15. **Pantallas:** [P1 · Mis torneos](03-pantallas.md#p1--mis-torneos) y [P3 · Gestión del torneo](03-pantallas.md#p3--gestión-del-torneo). **Diagrama:** [S02](04-diagramas-secuencia/uc-e02-ver-mis-torneos.md).
- **Precondiciones:** sesión.
- **Flujo principal:**
  1. Abre «Mis torneos» desde el menú de usuario.
  2. Ve **una fila por torneo**: nombre, Zona, modalidad, cupo, Estado y antigüedad de verificación, con dos acciones: «Sigue vigente» y «Gestionar».
  3. Toca «Gestionar» y abre la pantalla de gestión del torneo.
- **Reglas de orden:** primero los que llevan **30 días o más sin verificar**, del más viejo al más nuevo; después el resto; y los **Finalizados** al final, sin antigüedad ni botón de verificar.
- **Niveles del panel:** (1) esta lista; (2) la **pantalla de gestión** de cada torneo, con cabecera (números clave, «Ver ficha pública», «Sigue vigente»), pestañas **Datos** e **Inscripciones** y «Dar de baja» al final, aparte; (3) la ficha pública (UC-B03 A3).
- **Flujos alternativos:**
  - **A1. Sin torneos:** «Todavía no publicaste torneos», con «Publicar mi primer torneo».
  - **A2. Sin sesión:** se redirige a `/login?next=/mis-torneos` (con aviso de «Publicalo» si viene de ese link).
  - **A3. Torneo ajeno o inexistente:** la pantalla de gestión da **404**, igual que si no existiera: no se confirma que exista un torneo con ese id que no es tuyo.
  - **A4. Rutas viejas:** `/mis-torneos/{id}/editar` y `/inscripciones` redirigen a la pestaña correspondiente.
- **Estado:** Implementado (`src/app/mis-torneos`).

## UC-E03 · Editar un torneo

- **Actor:** Organizador del torneo.
- **Requerimientos:** RF-E02 a RF-E06, RF-E09 a RF-E11. **Pantalla:** [P3 · Gestión del torneo](03-pantallas.md#p3--gestión-del-torneo) (pestaña Datos). **Diagrama:** [S03](04-diagramas-secuencia/uc-e03-editar-torneo.md).
- **Precondiciones:** es el dueño.
- **Flujo principal:**
  1. En la pestaña **Datos** de la pantalla de gestión, abre el formulario con los **valores actuales** y los dos desplegables (Zona y modalidad).
  2. Edita cualquier campo (incluido reemplazar el flyer) y pulsa guardar.
  3. Si hay **equipos anotados**, la app pide confirmación: «Hay N equipos anotados, ¿confirmás el cambio?».
  4. El sistema valida con las mismas reglas de UC-E01 y guarda.
  5. Vuelve a la pantalla de gestión.
- **Reglas:** **editar no cuenta como verificar**: la antigüedad de verificación no se reinicia. **Subir el cupo** es la forma de admitir más inscripciones cuando está completo.
- **Flujos alternativos:**
  - **A1. Datos o flyer inválidos:** mismos mensajes que UC-E01 A2 y A3; no se guarda nada y se conserva lo cargado.
  - **A2. El torneo ya no existe o no es tuyo:** «Este torneo ya no existe o no es tuyo.» (la base no da error: la actualización afecta cero filas).
  - **A3. Falla el guardado:** «No pudimos guardar los cambios. Probá de nuevo.»
  - **A4. Falla la subida del flyer:** «Guardamos los cambios, pero no pudimos subir el flyer. Probá de nuevo.» Un flyer nuevo **pisa** al anterior.
  - **A5. Dejar el flyer vacío:** conserva el actual.
- **Estado:** Implementado (`src/app/mis-torneos/[id]/editar`).

## UC-E04 · Verificar que el torneo sigue vigente

- **Actor:** Organizador del torneo.
- **Requerimientos:** RF-E16 a RF-E18. **Pantallas:** [P1](03-pantallas.md#p1--mis-torneos) y [P3](03-pantallas.md#p3--gestión-del-torneo) (botón «Sigue vigente»). **Diagrama:** [S04](04-diagramas-secuencia/uc-e04-verificar-torneo.md).
- **Precondiciones:** el torneo no está Finalizado.
- **Flujo principal:**
  1. Toca «Sigue vigente» (en la lista o en la pantalla de gestión).
  2. El sistema reinicia la **antigüedad de verificación**.
  3. El torneo vuelve a mostrarse sin ámbar ni rojo, en el panel, el catálogo y la ficha.
- **Flujos alternativos:**
  - **A1. Torneo Finalizado:** el botón sale apagado: un Finalizado no muestra antigüedad ni se verifica.
  - **A2. Ya confirmado hoy** (menos de 24 h): el botón sale apagado. ⚠️ Regla del código que no figura en `casos-de-uso.md`.
  - **A3. Torneo ajeno, dado de baja o id inválido:** la base lo rechaza; el panel no ofrece ninguno de esos casos al dueño, así que alcanza con un registro en el servidor.
- **Reglas:** «Sigue vigente» **no saca la marca Observado**, que solo quita el administrador (la marca todavía no existe).
- **Estado:** Implementado (`verifyTournament`, función `verify_tournament`).

## UC-E05 · Dar de baja un torneo

- **Actor:** Organizador del torneo (o Administrador, UC-F03).
- **Requerimientos:** RF-E19 a RF-E22. **Pantalla:** [P3 · Gestión del torneo](03-pantallas.md#p3--gestión-del-torneo) («Dar de baja», al final). **Diagrama:** [S05](04-diagramas-secuencia/uc-e05-dar-de-baja-torneo.md).
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

## UC-E06 · Cargar una inscripción

- **Actor:** Organizador del torneo.
- **Requerimientos:** RF-E23 a RF-E30. **Pantalla:** [P3 · Gestión del torneo](03-pantallas.md#p3--gestión-del-torneo) (pestaña Inscripciones). **Diagrama:** [S06](04-diagramas-secuencia/uc-e06-cargar-inscripcion.md).
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

## UC-E07 · Dar de baja una inscripción

- **Actor:** Organizador del torneo.
- **Requerimientos:** RF-E28, RF-E31. **Pantalla:** [P3 · Gestión del torneo](03-pantallas.md#p3--gestión-del-torneo) (pestaña Inscripciones). **Diagrama:** [S07](04-diagramas-secuencia/uc-e07-dar-de-baja-inscripcion.md).
- **Precondiciones:** el torneo no está Finalizado.
- **Flujo principal:**
  1. En Inscripciones toca «Dar de baja» sobre un equipo y confirma.
  2. El equipo deja de figurar y **libera su lugar**.
- **Flujos alternativos:**
  - **A1. El torneo finalizó entre tanto:** «Este torneo ya finalizó: sus inscripciones no cambian.»
  - **A2. La inscripción no existe o no es tuya:** «Este torneo ya no existe o no es tuyo.»
- **Postcondición:** si el torneo estaba Cerrado por cupo y no pasó el cierre de inscripción, vuelve a **Abierto**.
- **Estado:** Implementado (`removeInscription`, función `remove_inscription`).
