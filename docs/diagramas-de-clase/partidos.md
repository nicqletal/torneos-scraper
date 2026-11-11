# Módulo D — Partidos

> Documenta las clases de dominio y de diseño que participan en el **Módulo D — Partidos** (`UC-D01` a `UC-D14`).
> Fuentes del módulo: [01-requerimientos.md](../partidos/01-requerimientos.md) · [02-casos-de-uso.md](../partidos/02-casos-de-uso.md) · [03-pantallas.md](../partidos/03-pantallas.md) · [04-diagramas-secuencia/](../partidos/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades y enumeraciones involucradas en la **Búsqueda de rival**, el cruce de **Franjas**, las **Propuestas**, la máquina de estados del **Partido**, el presentismo (**Faltas** y **Bloqueo por faltas**) y la **Calificación** con revelación cruzada (`UC-D01` a `UC-D14`).

```mermaid
classDiagram
direction TB
class BusquedaDeRival {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +modalidades: Modalidad[]
  +notaOpcional: texto [0..1]
  +activa: booleano
  +actualizadaEn: fechaHora
  +franjasFuturasVigentes() Franja[]
  +tieneAlMenosUnaFranjaVigente() booleano
}
class Franja {
  <<entidad>>
  +id: uuid
  +busquedaId: uuid
  +fecha: fecha
  +turno: Turno
  +ocupadaPorPartidoId: uuid [0..1]
  +esFutura() booleano
  +estaDisponible() booleano
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +equipoEmisorId: uuid
  +equipoReceptorId: uuid
  +fecha: fecha
  +turno: Turno
  +modalidad: Modalidad
  +creadaEn: fechaHora
  +respondidaEn: fechaHora [0..1]
  +estado() EstadoPropuesta
}
class Partido {
  <<entidad>>
  +id: uuid
  +propuestaId: uuid
  +equipoAId: uuid
  +equipoBId: uuid
  +fecha: fecha
  +turno: Turno
  +modalidad: Modalidad
  +canchaElegida: texto [0..1]
  +horaExacta: hora [0..1]
  +coordinadoEn: fechaHora [0..1]
  +solicitudCaidaMutuaDeId: uuid [0..1]
  +reporteNoShowDeId: uuid [0..1]
  +reporteNoShowEn: fechaHora [0..1]
  +motivoCaida: texto [0..1]
  +fase() FasePartido
  +plazo() fechaHora [0..1]
  +faltanMenosDe24Horas() booleano
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +canchaPropuesta: texto [0..1]
  +horaPropuesta: hora [0..1]
  +asistenciaConfirmadaEn: fechaHora [0..1]
  +golesPropiosCargados: entero [0..1]
  +golesRivalCargados: entero [0..1]
  +resultadoCargadoEn: fechaHora [0..1]
}
class Calificacion {
  <<entidad>>
  +id: uuid
  +partidoId: uuid
  +equipoEvaluadorId: uuid
  +equipoEvaluadoId: uuid
  +respeto: entero
  +comentarioPrivado: texto [0..1]
  +creadaEn: fechaHora
  +esVisibleEnPromedio() booleano
}
class Falta {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +partidoId: uuid
  +tipo: TipoFalta
  +registradaEn: fechaHora
  +estaEnVentana90Dias() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +tieneBloqueoPorFaltas() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
  +parametros: json
  +enlace: texto
}
class Turno {
  <<enumeracion>>
  Manana
  Tarde
  Noche
}
class Modalidad {
  <<enumeracion>>
  Futbol5
  Futbol7
  Futbol8
  Futbol11
}
class EstadoPropuesta {
  <<enumeracion>>
  Pendiente
  Aceptada
  Rechazada
  Cancelada
}
class FasePartido {
  <<enumeracion>>
  PendienteDeCoordinacion
  Coordinado
  Confirmado
  Jugado
  SinAcuerdo
  PartidoCaido
  NoSePresento
  PartidoEnConflicto
}
class TipoFalta {
  <<enumeracion>>
  CaidaSobreLaHora
  NoPresentacion
}
Equipo "1" *-- "0..1" BusquedaDeRival : mantiene
BusquedaDeRival "1" *-- "1..*" Franja : ofrece
Franja ..> Turno
Equipo "1" --> "0..*" Propuesta : envía o recibe
Propuesta ..> Turno
Propuesta ..> Modalidad
Propuesta ..> EstadoPropuesta : calcula al leer
Propuesta "1" --> "0..1" Partido : origina al aceptarse
Partido "1" *-- "2" LadoPartido : involucra dos equipos
Partido ..> FasePartido : calcula al leer
Partido "1" --> "0..2" Calificacion : recibe hasta dos
Partido "0..1" --> "0..1" Falta : puede generar
Equipo "1" *-- "0..*" Falta : registra en 90 días
Partido ..> Aviso : notifica transiciones
```

---

## Clases por caso de uso

### UC-D01 · Publicar una búsqueda de rival

**Requerimientos:** `RF-D01`, `RF-D02`, `RNF-D01` · **Pantalla:** [P-D01 · Buscar rival](../partidos/03-pantallas.md) (`/buscar-rival`) · **Secuencia:** [`uc-d01-publicar-busqueda.md`](../partidos/04-diagramas-secuencia/uc-d01-publicar-busqueda.md)

```mermaid
classDiagram
direction TB
class PantallaBuscarRival {
  <<boundary>>
  +abrirBuscarRival()
  +seleccionarEquipoCapitan(equipoId)
  +guardarBusqueda(equipoId, modalidades, franjas, nota)
  +mostrarAvisoBloqueoPorFaltas(fechaFinBloqueo)
}
class OpcionesBusqueda {
  <<proveedor de opciones>>
  +listarTurnos() Turno[]
}
class BusquedaService {
  <<control>>
  +cargarEquiposCapitan(usuarioId) Equipo[]
  +publicarBusqueda(usuarioId, equipoId, modalidades, franjas, nota) BusquedaDeRival
}
class ValidadorPartido {
  <<validador>>
  +validarBusquedaRival(modalidades, franjas, nota) booleano
  +validarFranjasFuturas(franjas) booleano
}
class EquipoRepository {
  <<repositorio>>
  +listarEquiposComoCapitan(usuarioId) Equipo[]
}
class BusquedaRepository {
  <<repositorio>>
  +guardarBusqueda(equipoId, modalidades, franjas, nota) BusquedaDeRival
}
class BusquedaDeRival {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +modalidades: Modalidad[]
  +notaOpcional: texto [0..1]
  +activa: booleano
}
class Franja {
  <<entidad>>
  +id: uuid
  +fecha: fecha
  +turno: Turno
}
class Turno {
  <<enumeracion>>
  Manana
  Tarde
  Noche
}
PantallaBuscarRival ..> OpcionesBusqueda : obtiene turnos fijos
PantallaBuscarRival ..> BusquedaService : consulta equipos propios y envía búsqueda
BusquedaService ..> EquipoRepository : obtiene equipos donde es Capitán
BusquedaService ..> ValidadorPartido : valida modalidades, franjas futuras y nota
BusquedaService ..> BusquedaRepository : ejecuta save_rival_search
BusquedaRepository ..> BusquedaDeRival : verifica sin bloqueo por faltas y guarda búsqueda única
BusquedaDeRival "1" *-- "1..*" Franja : contiene
OpcionesBusqueda ..> Turno
```

---

### UC-D02 · Editar o cancelar la búsqueda

**Requerimientos:** `RF-D01`, `RF-D03`, `RNF-D01` · **Pantalla:** [P-D01 · Buscar rival](../partidos/03-pantallas.md) (`/buscar-rival`) · **Secuencia:** [`uc-d02-editar-cancelar-busqueda.md`](../partidos/04-diagramas-secuencia/uc-d02-editar-cancelar-busqueda.md)

```mermaid
classDiagram
direction TB
class PantallaBuscarRival {
  <<boundary>>
  +modificarModalidadesYFranjas(equipoId, modalidades, franjas, nota)
  +pulsarCancelarBusqueda(equipoId)
}
class BusquedaService {
  <<control>>
  +actualizarBusqueda(usuarioId, equipoId, modalidades, franjas, nota)
  +cancelarBusqueda(usuarioId, equipoId)
}
class ValidadorPartido {
  <<validador>>
  +validarBusquedaRival(modalidades, franjas, nota) booleano
}
class BusquedaRepository {
  <<repositorio>>
  +actualizarBusqueda(equipoId, modalidades, franjas, nota)
  +cancelarBusqueda(equipoId)
}
class AvisoRepository {
  <<repositorio>>
  +notificarPropuestasCanceladas(propuestasIds)
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +estado() EstadoPropuesta
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaBuscarRival ..> BusquedaService : solicita actualizar o cancelar búsqueda
BusquedaService ..> ValidadorPartido : valida modalidades, franjas y nota
BusquedaService ..> BusquedaRepository : ejecuta save_rival_search o cancel_rival_search
BusquedaRepository ..> Propuesta : cancela pendientes de franjas eliminadas
BusquedaRepository ..> AvisoRepository : avisa a capitanes de la contraparte
AvisoRepository ..> Aviso : persiste aviso
```

---

### UC-D03 · Ver rivales compatibles

**Requerimientos:** `RF-D04` · **Pantalla:** [P-D01 · Buscar rival](../partidos/03-pantallas.md) (`/buscar-rival`) · **Secuencia:** [`uc-d03-ver-rivales-compatibles.md`](../partidos/04-diagramas-secuencia/uc-d03-ver-rivales-compatibles.md)

```mermaid
classDiagram
direction TB
class PantallaBuscarRival {
  <<boundary>>
  +mostrarRivalesCompatibles(rivales)
  +mostrarEstadoPropuestaPorFranja(estado)
}
class BusquedaService {
  <<control>>
  +consultarRivalesCompatibles(equipoId) RivalCompatible[]
}
class BusquedaRepository {
  <<repositorio>>
  +obtenerRivalesCompatibles(equipoId) RivalCompatible[]
}
class PropuestaRepository {
  <<repositorio>>
  +listarPropuestasPendientesDelEquipo(equipoId) Propuesta[]
}
class RivalCompatible {
  <<entidad>>
  +equipoId: uuid
  +nombre: texto
  +escudoUrl: texto [0..1]
  +zonaNombre: texto
  +corredor: texto
  +mismaZona: booleano
  +mismoCorredor: booleano
  +modalidadesEnComun: Modalidad[]
  +franjasCoincidentes: Franja[]
  +promedioRespeto: decimal [0..1]
  +faltas90Dias: entero
  +notaBusqueda: texto [0..1]
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +fecha: fecha
  +turno: Turno
  +estado() EstadoPropuesta
}
PantallaBuscarRival ..> BusquedaService : solicita rivales compatibles
BusquedaService ..> BusquedaRepository : ejecuta compatible_rivals
BusquedaService ..> PropuestaRepository : consulta propuestas pendientes por franja
BusquedaRepository ..> RivalCompatible : cruza modalidad y franja futura y ordena por cercanía
PropuestaRepository ..> Propuesta : recupera pendientes
```

---

### UC-D04 · Proponer un partido

**Requerimientos:** `RF-D02`, `RF-D05`, `RNF-D01` · **Pantalla:** [P-D01 · Buscar rival](../partidos/03-pantallas.md) (`/buscar-rival`) · **Secuencia:** [`uc-d04-proponer-partido.md`](../partidos/04-diagramas-secuencia/uc-d04-proponer-partido.md)

```mermaid
classDiagram
direction TB
class PantallaBuscarRival {
  <<boundary>>
  +elegirFranjaYModalidad(rivalId, fecha, turno, modalidad)
  +enviarPropuesta()
  +mostrarPropuestaEnviada()
}
class BusquedaService {
  <<control>>
  +proponerPartido(usuarioId, equipoEmisorId, equipoReceptorId, fecha, turno, modalidad) uuid
}
class ValidadorPartido {
  <<validador>>
  +validarDatosPropuesta(fecha, turno, modalidad) booleano
}
class PropuestaRepository {
  <<repositorio>>
  +enviarPropuesta(equipoEmisorId, equipoReceptorId, fecha, turno, modalidad) uuid
}
class AvisoRepository {
  <<repositorio>>
  +notificarPropuestaRecibida(capitanReceptorId, parametros)
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +equipoEmisorId: uuid
  +equipoReceptorId: uuid
  +fecha: fecha
  +turno: Turno
  +modalidad: Modalidad
  +estado() EstadoPropuesta
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaBuscarRival ..> BusquedaService : envía propuesta de partido
BusquedaService ..> ValidadorPartido : valida fecha, turno y modalidad
BusquedaService ..> PropuestaRepository : ejecuta send_proposal
PropuestaRepository ..> Propuesta : verifica coincidencia vigente y unicidad en la franja
PropuestaRepository ..> AvisoRepository : avisa al Capitán receptor
AvisoRepository ..> Aviso : persiste aviso
```

---

### UC-D05 · Cancelar una propuesta enviada

**Requerimientos:** `RF-D05`, `RNF-D01` · **Pantallas:** [P-D01 · Buscar rival](../partidos/03-pantallas.md) y [P-D02 · Partidos](../partidos/03-pantallas.md) · **Secuencia:** [`uc-d05-cancelar-propuesta.md`](../partidos/04-diagramas-secuencia/uc-d05-cancelar-propuesta.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +pulsarCancelarPropuesta(propuestaId)
  +actualizarListaPropuestas()
}
class BusquedaService {
  <<control>>
  +cancelarPropuestaEnviada(usuarioId, propuestaId)
}
class PropuestaRepository {
  <<repositorio>>
  +cancelarPropuesta(propuestaId, capitanEmisorId)
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +equipoEmisorId: uuid
  +estado() EstadoPropuesta
}
PantallaPartidos ..> BusquedaService : solicita cancelar propuesta enviada
BusquedaService ..> PropuestaRepository : ejecuta respond_proposal con cancelación
PropuestaRepository ..> Propuesta : verifica estado Pendiente y pasa a Cancelada
```

---

### UC-D06 · Aceptar o rechazar una propuesta

**Requerimientos:** `RF-D06`, `RNF-D01`, `RNF-D02` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d06-responder-propuesta.md`](../partidos/04-diagramas-secuencia/uc-d06-responder-propuesta.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +pulsarAceptarPropuesta(propuestaId)
  +pulsarRechazarPropuesta(propuestaId)
  +mostrarPartidoCreado(partidoId)
}
class BusquedaService {
  <<control>>
  +responderPropuesta(usuarioId, propuestaId, decision)
}
class ValidadorPartido {
  <<validador>>
  +validarDecisionPropuesta(decision) booleano
}
class PropuestaRepository {
  <<repositorio>>
  +aceptarPropuestaYCrearPartido(propuestaId, capitanReceptorId) uuid
  +rechazarPropuesta(propuestaId, capitanReceptorId)
}
class AvisoRepository {
  <<repositorio>>
  +notificarResolucionPropuesta(partidoId, tercerosAfectados)
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +estado() EstadoPropuesta
}
class Partido {
  <<entidad>>
  +id: uuid
  +propuestaId: uuid
  +equipoAId: uuid
  +equipoBId: uuid
  +fecha: fecha
  +turno: Turno
  +modalidad: Modalidad
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
}
class Franja {
  <<entidad>>
  +id: uuid
  +ocupadaPorPartidoId: uuid [0..1]
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> BusquedaService : envía aceptación o rechazo
BusquedaService ..> ValidadorPartido : valida decisión
BusquedaService ..> PropuestaRepository : ejecuta respond_proposal en transacción
PropuestaRepository ..> Propuesta : actualiza propuesta y anula superpuestas en esa franja
PropuestaRepository ..> Partido : crea partido en PendienteDeCoordinacion si acepta
Partido "1" *-- "2" LadoPartido : inicializa lados
PropuestaRepository ..> Franja : ocupa franja en ambos equipos
PropuestaRepository ..> AvisoRepository : avisa a planteles y terceros afectados
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D07 · Coordinar cancha y hora

**Requerimientos:** `RF-D07`, `RF-D08`, `RF-D09`, `RNF-D01`, `RNF-D02` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d07-coordinar-cancha-hora.md`](../partidos/04-diagramas-secuencia/uc-d07-coordinar-cancha-hora.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +abrirWhatsAppCapitanRival(enlaceWaMe)
  +cargarCanchaYHora(partidoId, cancha, horaExacta)
  +confirmarValoresCargadosPorRival(partidoId)
}
class WhatsApp {
  <<boundary>>
  +abrirChatConMensaje(enlaceWaMe)
}
class OpcionesPartido {
  <<proveedor de opciones>>
  +rangoHorarioPorTurno(turno) RangoHorario
}
class PartidoService {
  <<control>>
  +coordinarPartido(usuarioId, partidoId, cancha, horaExacta) FasePartido
}
class ValidadorPartido {
  <<validador>>
  +validarCoordinacion(cancha, horaExacta, turno) booleano
}
class PartidoRepository {
  <<repositorio>>
  +registrarPropuestaCoordinacion(partidoId, capitanId, cancha, horaExacta) FasePartido
}
class AvisoRepository {
  <<repositorio>>
  +notificarCoordinacion(partidoId, coincidenciaAlcanzada)
}
class Partido {
  <<entidad>>
  +id: uuid
  +turno: Turno
  +canchaElegida: texto [0..1]
  +horaExacta: hora [0..1]
  +coordinadoEn: fechaHora [0..1]
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +canchaPropuesta: texto [0..1]
  +horaPropuesta: hora [0..1]
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> WhatsApp : abre conversación con Capitán rival
PantallaPartidos ..> OpcionesPartido : consulta rango horario del turno
PantallaPartidos ..> PartidoService : envía cancha y hora exacta
PartidoService ..> ValidadorPartido : valida cancha y hora dentro del turno
PartidoService ..> PartidoRepository : ejecuta coordinate_match
PartidoRepository ..> LadoPartido : guarda propuesta del lado
PartidoRepository ..> Partido : fija canchaElegida, horaExacta y coordinadoEn si coinciden
PartidoRepository ..> AvisoRepository : avisa al Capitán rival o a ambos planteles
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D08 · Confirmar asistencia

**Requerimientos:** `RF-D10`, `RNF-D01`, `RNF-D02` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d08-confirmar-asistencia.md`](../partidos/04-diagramas-secuencia/uc-d08-confirmar-asistencia.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +pulsarConfirmarAsistencia(partidoId)
  +mostrarEstadoConfirmacion(ambosConfirmaron)
}
class PartidoService {
  <<control>>
  +confirmarAsistencia(usuarioId, partidoId) FasePartido
}
class PartidoRepository {
  <<repositorio>>
  +confirmarAsistenciaLado(partidoId, capitanId) FasePartido
}
class AvisoRepository {
  <<repositorio>>
  +notificarConfirmacionAsistencia(partidoId)
}
class Partido {
  <<entidad>>
  +id: uuid
  +coordinadoEn: fechaHora [0..1]
  +fase() FasePartido
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +asistenciaConfirmadaEn: fechaHora [0..1]
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> PartidoService : confirma asistencia del equipo
PartidoService ..> PartidoRepository : ejecuta confirm_going
PartidoRepository ..> LadoPartido : registra asistenciaConfirmadaEn
PartidoRepository ..> Partido : pasa a Confirmado si ambos lados confirmaron
PartidoRepository ..> AvisoRepository : avisa a contraparte o planteles
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D09 · Tirar el partido

**Requerimientos:** `RF-D11`, `RF-D16`, `RNF-D01`, `RNF-D02` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d09-tirar-partido.md`](../partidos/04-diagramas-secuencia/uc-d09-tirar-partido.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +pulsarNosBajamos(partidoId)
  +mostrarAdvertenciaFaltaSiMenosDe24h(faltanMenosDe24h) booleano
}
class PartidoService {
  <<control>>
  +tirarPartido(usuarioId, partidoId, motivoOpcional)
}
class ValidadorPartido {
  <<validador>>
  +validarMotivoOpcional(motivo) booleano
}
class PartidoRepository {
  <<repositorio>>
  +tirarPartidoUnilateral(partidoId, capitanId, motivo) booleano
}
class AvisoRepository {
  <<repositorio>>
  +notificarPartidoCaido(partidoId)
}
class Partido {
  <<entidad>>
  +id: uuid
  +fecha: fecha
  +turno: Turno
  +horaExacta: hora [0..1]
  +motivoCaida: texto [0..1]
  +faltanMenosDe24Horas() booleano
}
class Falta {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +partidoId: uuid
  +tipo: TipoFalta
  +registradaEn: fechaHora
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> PartidoService : confirma baja unilateral del partido
PartidoService ..> ValidadorPartido : valida motivo opcional
PartidoService ..> PartidoRepository : ejecuta drop_match
PartidoRepository ..> Partido : marca PartidoCaido y libera franja futura del rival
PartidoRepository ..> Falta : registra CaidaSobreLaHora si faltaban menos de 24 h
PartidoRepository ..> AvisoRepository : avisa a ambos planteles
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D10 · Caída de común acuerdo

**Requerimientos:** `RF-D12`, `RNF-D01`, `RNF-D02` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d10-caida-comun-acuerdo.md`](../partidos/04-diagramas-secuencia/uc-d10-caida-comun-acuerdo.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +solicitarCaidaComunAcuerdo(partidoId, motivoOpcional)
  +responderCaidaComunAcuerdo(partidoId, acepta)
}
class PartidoService {
  <<control>>
  +solicitarCaidaMutua(usuarioId, partidoId, motivo)
  +responderCaidaMutua(usuarioId, partidoId, acepta)
}
class ValidadorPartido {
  <<validador>>
  +validarMotivoOpcional(motivo) booleano
}
class PartidoRepository {
  <<repositorio>>
  +solicitarCaidaMutua(partidoId, capitanId, motivo)
  +responderCaidaMutua(partidoId, capitanId, acepta)
}
class AvisoRepository {
  <<repositorio>>
  +notificarSolicitudORespuestaCaidaMutua(partidoId, acepta)
}
class Partido {
  <<entidad>>
  +id: uuid
  +solicitudCaidaMutuaDeId: uuid [0..1]
  +motivoCaida: texto [0..1]
  +fase() FasePartido
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> PartidoService : solicita o responde caída de común acuerdo
PartidoService ..> ValidadorPartido : valida motivo opcional
PartidoService ..> PartidoRepository : ejecuta request_mutual_drop o answer_mutual_drop
PartidoRepository ..> Partido : registra solicitud o pasa a PartidoCaido sin falta
PartidoRepository ..> AvisoRepository : avisa a contraparte y planteles
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D11 · Cargar el resultado

**Requerimientos:** `RF-D13`, `RF-D14`, `RNF-D01`, `RNF-D02` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d11-cargar-resultado.md`](../partidos/04-diagramas-secuencia/uc-d11-cargar-resultado.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +ingresarMarcador(partidoId, golesPropios, golesRival)
  +confirmarMarcadorDelRival(partidoId)
  +corregirMarcadorPropio(partidoId, golesPropios, golesRival)
}
class PartidoService {
  <<control>>
  +cargarResultado(usuarioId, partidoId, golesPropios, golesRival) FasePartido
}
class ValidadorPartido {
  <<validador>>
  +validarGoles(golesPropios, golesRival) booleano
}
class PartidoRepository {
  <<repositorio>>
  +registrarResultadoLado(partidoId, capitanId, golesPropios, golesRival) FasePartido
}
class AvisoRepository {
  <<repositorio>>
  +notificarResultadoCargadoOJugado(partidoId)
}
class Partido {
  <<entidad>>
  +id: uuid
  +fase() FasePartido
  +plazo() fechaHora [0..1]
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +golesPropiosCargados: entero [0..1]
  +golesRivalCargados: entero [0..1]
  +resultadoCargadoEn: fechaHora [0..1]
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> PartidoService : envía o confirma marcador
PartidoService ..> ValidadorPartido : valida goles enteros no negativos
PartidoService ..> PartidoRepository : ejecuta report_result
PartidoRepository ..> LadoPartido : guarda goles cargados por el lado
PartidoRepository ..> Partido : evalúa coincidencia cruzada, plazo de 72 h o SinAcuerdo
PartidoRepository ..> AvisoRepository : avisa al Capitán rival o a ambos planteles
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D12 · Reportar que el rival no se presentó

**Requerimientos:** `RF-D15`, `RF-D16`, `RNF-D01`, `RNF-D02` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d12-reportar-no-se-presento.md`](../partidos/04-diagramas-secuencia/uc-d12-reportar-no-se-presento.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +pulsarRivalNoSePresento(partidoId)
  +pulsarNosotrosSiFuimos(partidoId)
}
class PartidoService {
  <<control>>
  +reportarNoPresentacion(usuarioId, partidoId)
  +contradecirNoPresentacion(usuarioId, partidoId)
}
class PartidoRepository {
  <<repositorio>>
  +registrarReporteNoShow(partidoId, capitanReportanteId)
  +registrarDescargoSiFuimos(partidoId, capitanAcusadoId)
  +consolidarNoShowVencido48h(partidoId)
}
class AvisoRepository {
  <<repositorio>>
  +notificarReporteNoPresentacionOConflicto(partidoId)
}
class Partido {
  <<entidad>>
  +id: uuid
  +reporteNoShowDeId: uuid [0..1]
  +reporteNoShowEn: fechaHora [0..1]
  +fase() FasePartido
  +plazo() fechaHora [0..1]
}
class Falta {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +partidoId: uuid
  +tipo: TipoFalta
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> PartidoService : reporta ausencia o responde descargo
PartidoService ..> PartidoRepository : ejecuta report_no_show o reply_went
PartidoRepository ..> Partido : abre ventana de 48 h o marca PartidoEnConflicto sin árbitro
PartidoRepository ..> Falta : registra NoPresentacion si vence plazo de 48 h sin respuesta
PartidoRepository ..> AvisoRepository : avisa al plantel acusado o a ambos planteles
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D13 · Calificar al rival

**Requerimientos:** `RF-D17`, `RF-D18`, `RNF-D01` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d13-calificar-rival.md`](../partidos/04-diagramas-secuencia/uc-d13-calificar-rival.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +mostrarFormularioCalificacion(partidoId)
  +enviarCalificacion(partidoId, respeto, comentarioPrivado)
}
class PartidoService {
  <<control>>
  +calificarRival(usuarioId, partidoId, respeto, comentarioPrivado)
}
class ValidadorPartido {
  <<validador>>
  +validarCalificacion(respeto, comentarioPrivado) booleano
}
class CalificacionRepository {
  <<repositorio>>
  +guardarCalificacion(partidoId, capitanId, respeto, comentarioPrivado) uuid
}
class AvisoRepository {
  <<repositorio>>
  +notificarCalificacionRevelada(partidoId)
}
class Calificacion {
  <<entidad>>
  +id: uuid
  +partidoId: uuid
  +equipoEvaluadorId: uuid
  +equipoEvaluadoId: uuid
  +respeto: entero
  +comentarioPrivado: texto [0..1]
  +creadaEn: fechaHora
  +esVisibleEnPromedio() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PantallaPartidos ..> PartidoService : envía puntaje de respeto y comentario privado
PartidoService ..> ValidadorPartido : valida rango de estrellas y longitud de comentario
PartidoService ..> CalificacionRepository : ejecuta rate_rival
CalificacionRepository ..> Calificacion : guarda dentro de ventana de 7 días con revelación cruzada
CalificacionRepository ..> AvisoRepository : avisa cuando ambas calificaciones quedan visibles
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-D14 · Ver mis partidos

**Requerimientos:** `RF-D07`, `RF-D19` · **Pantalla:** [P-D02 · Partidos](../partidos/03-pantallas.md) (`/partidos`) · **Secuencia:** [`uc-d14-ver-mis-partidos.md`](../partidos/04-diagramas-secuencia/uc-d14-ver-mis-partidos.md)

```mermaid
classDiagram
direction TB
class PantallaPartidos {
  <<boundary>>
  +abrirMisPartidos()
  +filtrarPorEquipo(equipoId)
  +mostrarBandejas(propuestas, porCoordinar, proximos, pendientesResultado, historial)
}
class PartidoService {
  <<control>>
  +consultarBandejasPartidos(usuarioId, equipoFiltroId) BandejasPartidos
}
class EquipoRepository {
  <<repositorio>>
  +listarPorIntegrante(usuarioId) Equipo[]
}
class PropuestaRepository {
  <<repositorio>>
  +listarPropuestasPorEquipos(equiposIds) Propuesta[]
}
class PartidoRepository {
  <<repositorio>>
  +listarPartidosPorEquipos(equiposIds) Partido[]
  +obtenerWhatsappCapitanRival(partidoId, solicitanteId) texto
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +fecha: fecha
  +turno: Turno
  +estado() EstadoPropuesta
}
class Partido {
  <<entidad>>
  +id: uuid
  +fecha: fecha
  +turno: Turno
  +modalidad: Modalidad
  +canchaElegida: texto [0..1]
  +horaExacta: hora [0..1]
  +fase() FasePartido
  +plazo() fechaHora [0..1]
}
PantallaPartidos ..> PartidoService : solicita bandejas de partidos y propuestas
PartidoService ..> EquipoRepository : obtiene equipos que integra el usuario
PartidoService ..> PropuestaRepository : consulta propuestas pendientes de esos equipos
PartidoService ..> PartidoRepository : consulta partidos, fase calculada y WhatsApp rival para Capitanes
EquipoRepository ..> Equipo
PropuestaRepository ..> Propuesta
PartidoRepository ..> Partido
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `PantallaBuscarRival` / `PantallaPartidos` | `«boundary»` | `src/app/partidos/page.tsx`, `src/app/buscar-rival/page.tsx` | Implementadas |
| `WhatsApp` | `«boundary»` | `whatsappLink` (`src/utils/whatsapp.ts`) | Implementado |
| `OpcionesBusqueda` / `OpcionesPartido` | `«proveedor de opciones»` | `TIME_SLOTS`, rangos horarios por turno (`src/utils/matches.ts`) | Implementados |
| `BusquedaService` / `PartidoService` | `«control»` | Server Actions en `src/app/partidos/actions.ts` | Implementados |
| `ValidadorPartido` | `«validador»` | Validadores de franjas, propuestas, coordinación, marcadores y calificaciones (`src/utils/matches.ts`) | Implementado |
| `BusquedaRepository` / `PropuestaRepository` | `«repositorio»` | Tablas `public.rival_searches`, `proposals`; funciones `save_rival_search`, `cancel_rival_search`, `compatible_rivals`, `send_proposal`, `respond_proposal` | Implementados |
| `PartidoRepository` / `CalificacionRepository` | `«repositorio»` | Tablas `public.matches`, `match_sides`, `ratings`, `team_faults`; funciones `coordinate_match`, `confirm_going`, `drop_match`, `request_mutual_drop`, `answer_mutual_drop`, `report_result`, `report_no_show`, `reply_went`, `rate_rival`, `match_phase`, `rival_captain_whatsapp` | Implementados |
| `AvisoRepository` | `«repositorio»` | Tabla `public.notices` | Implementado |
| `BusquedaDeRival` / `Franja` / `Propuesta` / `Partido` / `LadoPartido` / `Calificacion` / `Falta` | `«entidad»` | Esquema `20261028000004_rival_search.sql` a `20261028000011_ratings.sql` | Implementadas |
