# Módulo D — Partidos

> Documenta las clases de dominio y de diseño que participan en el **Módulo D — Partidos** (`UC-D01` a `UC-D14`).
> Fuentes del módulo: [01-requerimientos.md](../partidos/01-requerimientos.md) · [02-casos-de-uso.md](../partidos/02-casos-de-uso.md) · [03-pantallas.md](../partidos/03-pantallas.md) · [04-diagramas-secuencia/](../partidos/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de composición/asociación y enumeraciones involucradas en la **Búsqueda de rival**, el cruce de **Franjas**, las **Propuestas**, la máquina de estados del **Partido**, el presentismo (**Faltas** y **Bloqueo por faltas**) y la **Calificación** con revelación cruzada (`UC-D01` a `UC-D14`).

```mermaid
classDiagram
class BusquedaDeRival {
  <<entidad>>
  +id: uuid
  +teamId: uuid
  +modalidad: Modalidad
  +creadaEn: fechaHora
  +canceladaEn: fechaHora [0..1]
  +estaActiva() booleano
  +franjasVigentes() Franja[]
}
class Franja {
  <<entidad>>
  +id: uuid
  +searchId: uuid
  +rango: rangoFechaHora
  +eliminadaEn: fechaHora [0..1]
  +esFutura() booleano
  +estaVigente() booleano
  +estaOcupada() booleano
  +superponeCon(otroRango) booleano
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +franjaEmisoraId: uuid
  +franjaReceptoraId: uuid
  +rangoComun: rangoFechaHora
  +creadaEn: fechaHora
  +cerradaEn: fechaHora [0..1]
  +motivoCierre: MotivoCierrePropuesta [0..1]
  +partidoId: uuid [0..1]
  +venceEn() fechaHora
  +estado() EstadoPropuesta
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +creadoEn: fechaHora
  +cancha: texto [0..1]
  +horaExacta: fechaHora [0..1]
  +cargadoPorEquipoId: uuid [0..1]
  +coordinadoEn: fechaHora [0..1]
  +tiradoEn: fechaHora [0..1]
  +motivoCaida: texto [0..1]
  +tiradoPorEquipoId: uuid [0..1]
  +caidaMutua: booleano
  +pedidoCaidaEquipoId: uuid [0..1]
  +pedidoCaidaMotivo: texto [0..1]
  +pedidoCaidaEn: fechaHora [0..1]
  +pedidoCaidaRespondidoEn: fechaHora [0..1]
  +pedidoCaidaAceptado: booleano [0..1]
  +ultimaAccionEn: fechaHora [0..1]
  +horaDeInicio() fechaHora
  +fase() FasePartido
  +plazo() fechaHora [0..1]
  +estaCoordinado() booleano
  +estaConfirmado() booleano
  +sumaFaltaPorCaida() booleano
  +resultadosCoinciden() booleano
  +estaEnConflicto() booleano
  +plazoResultado() fechaHora
  +plazoCalificacion() fechaHora
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +vamosEn: fechaHora [0..1]
  +golesAFavor: entero [0..1]
  +golesEnContra: entero [0..1]
  +resultadoEn: fechaHora [0..1]
  +noVinieronEn: fechaHora [0..1]
  +fuimosEn: fechaHora [0..1]
  +confirmoVamos() booleano
  +cargoResultado() booleano
  +reportoAusencia() booleano
  +respondioFuimos() booleano
}
class Calificacion {
  <<entidad>>
  +id: uuid
  +partidoId: uuid
  +equipoEvaluadorId: uuid
  +equipoEvaluadoId: uuid
  +estrellas: entero
  +comentario: texto [0..1]
  +creadaEn: fechaHora
  +estaRevelada() booleano
}
class Falta {
  <<entidad>>
  +equipoId: uuid
  +partidoId: uuid
  +ocurridaEn: fechaHora
  +cuentaEn90Dias() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +faltasRecientes90Dias() entero
  +bloqueadoHasta() fechaHora [0..1]
  +tieneBloqueoPorFaltas() booleano
}
class TurnoBusqueda {
  <<enumeracion>>
  Manana9a12
  Tarde14a18
  Noche20a23
  OtroHorario
}
class Modalidad {
  <<enumeracion>>
  Futbol5
  Futbol6
  Futbol7
  Futbol8
  Futbol9
  Futbol11
  Femenino
  Mixto
  Senior
}
class EstadoPropuesta {
  <<enumeracion>>
  Pendiente
  Vencida
  Aceptada
  Rechazada
  Cancelada
  FranjaSacada
  BusquedaCancelada
  Anulada
  EquipoBloqueado
}
class FasePartido {
  <<enumeracion>>
  PorJugarse
  EsperandoResultado
  Jugado
  Caido
  EnConflicto
  NoPresentado
}
Equipo "1" *-- "0..*" BusquedaDeRival
BusquedaDeRival "1" *-- "1..*" Franja
Franja "1" --> "0..*" Propuesta
Propuesta "0..1" --> "0..1" Partido
Partido "1" *-- "2" LadoPartido
Equipo "1" --> "0..*" LadoPartido
Partido "1" *-- "0..2" Calificacion
Equipo "1" *-- "0..*" Falta
Partido "1" --> "0..1" Falta
BusquedaDeRival ..> Modalidad
Franja ..> TurnoBusqueda
Propuesta ..> EstadoPropuesta
Partido ..> FasePartido
```

---

## Clases por caso de uso

### UC-D01 · Publicar una búsqueda de rival

> Especificación: [UC-D01](../partidos/02-casos-de-uso.md#uc-d01--publicar-una-búsqueda-de-rival) · Pantalla: [P1 · Buscar rival](../partidos/03-pantallas.md#p1--buscar-rival) · Secuencia: [S01 · Publicar búsqueda](../partidos/04-diagramas-secuencia/uc-d01-publicar-busqueda.md)

```mermaid
classDiagram
class PantallaBuscarRival {
  <<boundary>>
  +abrirBuscarRival(equipoId, modalidad)
  +mostrarAvisoSoloCapitan()
  +mostrarBloqueoPorFaltas(bloqueadoHasta)
  +mostrarFormulario(equipos, modalidades, turnos)
  +elegirDiaTurnoYModalidad(equipoId, modalidad, franjas)
  +confirmarBusqueda()
  +mostrarBuscandoRivalYCompatibles()
  +mostrarErrores(errores)
}
class OpcionesBusqueda {
  <<control>>
  +listarModalidades() Modalidad[]
  +listarTurnos() TurnoBusqueda[]
}
class BusquedaService {
  <<control>>
  +prepararBuscarRival(usuarioId, equipoId, modalidad)
  +publicarBusqueda(equipoId, modalidad, franjas)
}
class ValidadorPartido {
  <<validador>>
  +validarFranjas(franjas) Franja[]
}
class EquipoRepository {
  <<repositorio>>
  +listarEquiposDelCapitan(usuarioId) Equipo[]
}
class BusquedaRepository {
  <<repositorio>>
  +consultarEstado(equipoId, modalidad)
  +guardarBusqueda(equipoId, modalidad, franjas) uuid
  +verificarCapitanWhatsappYBloqueo(equipoId) booleano
  +verificarFormato14DiasYChoques(equipoId, franjas) booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +faltasRecientes90Dias() entero
  +bloqueadoHasta() fechaHora [0..1]
  +tieneBloqueoPorFaltas() booleano
}
class BusquedaDeRival {
  <<entidad>>
  +id: uuid
  +teamId: uuid
  +modalidad: Modalidad
  +creadaEn: fechaHora
  +estaActiva() booleano
}
class Franja {
  <<entidad>>
  +id: uuid
  +searchId: uuid
  +rango: rangoFechaHora
  +esFutura() booleano
  +estaVigente() booleano
}
class Modalidad {
  <<enumeracion>>
  Futbol5
  Futbol6
  Futbol7
  Futbol8
  Futbol9
  Futbol11
  Femenino
  Mixto
  Senior
}
class TurnoBusqueda {
  <<enumeracion>>
  Manana9a12
  Tarde14a18
  Noche20a23
  OtroHorario
}
PantallaBuscarRival ..> BusquedaService
BusquedaService ..> OpcionesBusqueda
BusquedaService ..> EquipoRepository
BusquedaService ..> ValidadorPartido
BusquedaService ..> BusquedaRepository
EquipoRepository ..> Equipo
BusquedaRepository ..> BusquedaDeRival
BusquedaRepository ..> Franja
Equipo "1" *-- "0..*" BusquedaDeRival
BusquedaDeRival "1" *-- "1..*" Franja
BusquedaDeRival ..> Modalidad
Franja ..> TurnoBusqueda
```

---

### UC-D02 · Editar o cancelar la búsqueda

> Especificación: [UC-D02](../partidos/02-casos-de-uso.md#uc-d02--editar-o-cancelar-la-búsqueda) · Pantalla: [P1 · Buscar rival](../partidos/03-pantallas.md#p1--buscar-rival) · Secuencia: [S02 · Editar o cancelar búsqueda](../partidos/04-diagramas-secuencia/uc-d02-editar-cancelar-busqueda.md)

```mermaid
classDiagram
class PantallaBuscarRival {
  <<boundary>>
  +mostrarBusquedaActiva(franjas)
  +agregarOtroHorario(equipoId, modalidad, franjas)
  +sacarHorario(equipoId, modalidad, franjasRestantes)
  +cancelarBusqueda(equipoId, modalidad)
  +mostrarBusquedaActualizada()
  +mostrarError(mensaje)
}
class BusquedaService {
  <<control>>
  +editarBusqueda(equipoId, modalidad, franjas)
  +cancelarBusqueda(equipoId, modalidad)
}
class ValidadorPartido {
  <<validador>>
  +validarFranjas(franjas) Franja[]
}
class BusquedaRepository {
  <<repositorio>>
  +guardarBusqueda(equipoId, modalidad, franjas) uuid
  +cancelarPropuestasDeFranjasEliminadas(busquedaId, franjas)
}
class BusquedaDeRival {
  <<entidad>>
  +id: uuid
  +teamId: uuid
  +modalidad: Modalidad
  +canceladaEn: fechaHora [0..1]
  +estaActiva() booleano
  +franjasVigentes() Franja[]
}
class Franja {
  <<entidad>>
  +id: uuid
  +searchId: uuid
  +rango: rangoFechaHora
  +eliminadaEn: fechaHora [0..1]
  +estaVigente() booleano
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +franjaEmisoraId: uuid
  +franjaReceptoraId: uuid
  +cerradaEn: fechaHora [0..1]
  +motivoCierre: MotivoCierrePropuesta [0..1]
  +estado() EstadoPropuesta
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
PantallaBuscarRival ..> BusquedaService
BusquedaService ..> ValidadorPartido
BusquedaService ..> BusquedaRepository
BusquedaRepository ..> BusquedaDeRival
BusquedaRepository ..> Franja
BusquedaRepository ..> Propuesta
BusquedaRepository ..> Aviso
BusquedaDeRival "1" *-- "1..*" Franja
Franja "1" --> "0..*" Propuesta
```

---

### UC-D03 · Ver rivales compatibles

> Especificación: [UC-D03](../partidos/02-casos-de-uso.md#uc-d03--ver-rivales-compatibles) · Pantalla: [P1 · Buscar rival](../partidos/03-pantallas.md#p1--buscar-rival) · Secuencia: [S03 · Ver rivales compatibles](../partidos/04-diagramas-secuencia/uc-d03-ver-rivales-compatibles.md)

```mermaid
classDiagram
class PantallaBuscarRival {
  <<boundary>>
  +abrirBuscarRival(equipoId, modalidad)
  +mostrarRivalesCompatibles(rivales, propuestas)
  +mostrarSinCompatibles()
}
class BusquedaService {
  <<control>>
  +consultarCompatiblesYPropuestas(busquedaId)
}
class BusquedaRepository {
  <<repositorio>>
  +obtenerRivalesCompatibles(busquedaId) RivalCompatible[]
  +cruzarFranjasMismaModalidad(busquedaId)
  +descartarNivelesIncompatiblesMismoCapitanYOcupadas()
  +ordenarPorCercaniaNivelYPresentismo()
}
class PropuestaRepository {
  <<repositorio>>
  +listarPropuestasEnviadas(busquedaId) Propuesta[]
}
class RivalCompatible {
  <<entidad>>
  +franjaPropiaId: uuid
  +franjaRivalId: uuid
  +equipoRivalId: uuid
  +nombreRival: texto
  +escudoUrl: texto [0..1]
  +zonaRival: texto
  +nivelRival: NivelEquipo
  +rangoComun: rangoFechaHora
  +jugados: entero
  +noPresentado: entero
  +promedioEstrellas: decimal [0..1]
  +totalCalificaciones: entero
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +franjaEmisoraId: uuid
  +franjaReceptoraId: uuid
  +rangoComun: rangoFechaHora
  +estado() EstadoPropuesta
}
class BusquedaDeRival {
  <<entidad>>
  +id: uuid
  +teamId: uuid
  +modalidad: Modalidad
  +estaActiva() booleano
}
PantallaBuscarRival ..> BusquedaService
BusquedaService ..> BusquedaRepository
BusquedaService ..> PropuestaRepository
BusquedaRepository ..> BusquedaDeRival
BusquedaRepository ..> RivalCompatible
PropuestaRepository ..> Propuesta
```

---

### UC-D04 · Proponer un partido

> Especificación: [UC-D04](../partidos/02-casos-de-uso.md#uc-d04--proponer-un-partido) · Pantalla: [P1 · Buscar rival](../partidos/03-pantallas.md#p1--buscar-rival) · Secuencia: [S04 · Proponer partido](../partidos/04-diagramas-secuencia/uc-d04-proponer-partido.md)

```mermaid
classDiagram
class PantallaBuscarRival {
  <<boundary>>
  +tocarProponerPartido(franjaPropiaId, franjaRivalId)
  +mostrarPropuestaEnviada()
  +mostrarError(mensaje)
}
class BusquedaService {
  <<control>>
  +proponerPartido(franjaPropiaId, franjaRivalId)
}
class ValidadorPartido {
  <<validador>>
  +validarIdsFranjas(franjaPropiaId, franjaRivalId) booleano
}
class PropuestaRepository {
  <<repositorio>>
  +enviarPropuesta(franjaPropiaId, franjaRivalId) uuid
  +verificarCapitanCompatibilidadYUnicidad(franjaPropiaId, franjaRivalId) booleano
  +calcularHorarioEnComun(franjaPropia, franjaRival) rangoFechaHora
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +franjaEmisoraId: uuid
  +franjaReceptoraId: uuid
  +rangoComun: rangoFechaHora
  +creadaEn: fechaHora
  +venceEn() fechaHora
  +estado() EstadoPropuesta
}
class Franja {
  <<entidad>>
  +id: uuid
  +searchId: uuid
  +rango: rangoFechaHora
  +estaVigente() booleano
  +estaOcupada() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class EstadoPropuesta {
  <<enumeracion>>
  Pendiente
  Vencida
  Aceptada
  Rechazada
  Cancelada
}
PantallaBuscarRival ..> BusquedaService
BusquedaService ..> ValidadorPartido
BusquedaService ..> PropuestaRepository
PropuestaRepository ..> Franja
PropuestaRepository ..> Propuesta
PropuestaRepository ..> Aviso
Franja "1" --> "0..*" Propuesta
Propuesta ..> EstadoPropuesta
```

---

### UC-D05 · Cancelar una propuesta enviada

> Especificación: [UC-D05](../partidos/02-casos-de-uso.md#uc-d05--cancelar-una-propuesta-enviada) · Pantalla: [P1 · Buscar rival](../partidos/03-pantallas.md#p1--buscar-rival) · Secuencia: [S05 · Cancelar propuesta](../partidos/04-diagramas-secuencia/uc-d05-cancelar-propuesta.md)

```mermaid
classDiagram
class PantallaBuscarRival {
  <<boundary>>
  +mostrarPropuestaEnviada()
  +tocarCancelar(propuestaId)
  +volverAProponerPartido()
  +mostrarEstadoPropuesta(estado)
}
class BusquedaService {
  <<control>>
  +cancelarPropuesta(propuestaId)
}
class PropuestaRepository {
  <<repositorio>>
  +responder(propuestaId, aceptar)
  +verificarEmisorYPendiente(propuestaId) booleano
  +cerrarComoCancelada(propuestaId)
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +franjaEmisoraId: uuid
  +franjaReceptoraId: uuid
  +cerradaEn: fechaHora [0..1]
  +motivoCierre: MotivoCierrePropuesta [0..1]
  +venceEn() fechaHora
  +estado() EstadoPropuesta
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class EstadoPropuesta {
  <<enumeracion>>
  Pendiente
  Vencida
  Aceptada
  Rechazada
  Cancelada
}
PantallaBuscarRival ..> BusquedaService
BusquedaService ..> PropuestaRepository
PropuestaRepository ..> Propuesta
PropuestaRepository ..> Aviso
Propuesta ..> EstadoPropuesta
```

---

### UC-D06 · Aceptar o rechazar una propuesta

> Especificación: [UC-D06](../partidos/02-casos-de-uso.md#uc-d06--aceptar-o-rechazar-una-propuesta) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S06 · Responder propuesta](../partidos/04-diagramas-secuencia/uc-d06-responder-propuesta.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +mostrarTeProponenJugar(propuestas)
  +tocarRechazar(propuestaId)
  +tocarAceptar(propuestaId)
  +mostrarProximoPartido(partido, whatsappRival)
  +mostrarError(mensaje)
}
class BusquedaService {
  <<control>>
  +listarPropuestasRecibidas(usuarioId) Propuesta[]
  +rechazarPropuesta(propuestaId)
  +aceptarPropuesta(propuestaId)
}
class PropuestaRepository {
  <<repositorio>>
  +listarPropuestasRecibidas(usuarioId) Propuesta[]
  +responder(propuestaId, aceptar)
  +cerrarComoRechazada(propuestaId)
  +ocuparFranjasYAnularSuperpuestas(partidoId, equipos, rango)
}
class PartidoRepository {
  <<repositorio>>
  +existePartidoSuperpuesto(equipos, rango) booleano
  +crearPartido(propuestaId, rango) Partido
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +franjaEmisoraId: uuid
  +franjaReceptoraId: uuid
  +rangoComun: rangoFechaHora
  +cerradaEn: fechaHora [0..1]
  +partidoId: uuid [0..1]
  +venceEn() fechaHora
  +estado() EstadoPropuesta
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +creadoEn: fechaHora
  +horaDeInicio() fechaHora
  +fase() FasePartido
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
}
class Franja {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +estaOcupada() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
PantallaPartidos ..> BusquedaService
BusquedaService ..> PropuestaRepository
PropuestaRepository ..> PartidoRepository
PropuestaRepository ..> Propuesta
PropuestaRepository ..> Franja
PropuestaRepository ..> Aviso
PartidoRepository ..> Partido
PartidoRepository ..> LadoPartido
Partido "1" *-- "2" LadoPartido
```

---

### UC-D07 · Coordinar cancha y hora

> Especificación: [UC-D07](../partidos/02-casos-de-uso.md#uc-d07--coordinar-cancha-y-hora) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S07 · Coordinar cancha y hora](../partidos/04-diagramas-secuencia/uc-d07-coordinar-cancha-hora.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +abrirCargarCanchaYHora(partidoId)
  +mostrarFormularioCoordinacion(partido, horas)
  +confirmarCanchaYHora(partidoId, cancha, hora)
  +tocarConfirmarValoresRival(partidoId, cancha, hora)
  +mostrarPartidoCoordinado()
  +mostrarEsperandoConfirmacionRival()
  +mostrarError(mensaje)
}
class OpcionesPartido {
  <<control>>
  +listarHoras(rango) hora[]
}
class WhatsApp {
  <<boundary>>
  +abrirChatConCapitanRival(enlaceWaMe)
}
class PartidoService {
  <<control>>
  +obtenerDatosCoordinacion(partidoId)
  +coordinarPartido(partidoId, cancha, hora)
}
class ValidadorPartido {
  <<validador>>
  +validarCoordinacion(cancha, hora, rango) booleano
}
class PartidoRepository {
  <<repositorio>>
  +obtenerPartido(partidoId) Partido
  +coordinar(partidoId, cancha, horaDeInicio)
  +verificarCapitanYAntesDelRango(partidoId) booleano
  +compararConValoresDelRival(partidoId, cancha, horaDeInicio) booleano
  +obtenerWhatsappDelRival(partidoId) texto
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +cancha: texto [0..1]
  +horaExacta: fechaHora [0..1]
  +cargadoPorEquipoId: uuid [0..1]
  +coordinadoEn: fechaHora [0..1]
  +horaDeInicio() fechaHora
  +estaCoordinado() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
PantallaPartidos ..> WhatsApp
PantallaPartidos ..> PartidoService
PartidoService ..> OpcionesPartido
PartidoService ..> ValidadorPartido
PartidoService ..> PartidoRepository
PartidoRepository ..> Partido
PartidoRepository ..> Aviso
```

---

### UC-D08 · Confirmar asistencia

> Especificación: [UC-D08](../partidos/02-casos-de-uso.md#uc-d08--confirmar-asistencia) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S08 · Confirmar asistencia](../partidos/04-diagramas-secuencia/uc-d08-confirmar-asistencia.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +mostrarConfirmacionAsistencia(partido)
  +mostrarAvisoRivalSinConfirmar()
  +tocarVamos(partidoId)
  +tocarNoVamos(partidoId)
  +mostrarConfirmasteQueVan()
  +abrirFormularioTirarPartido(partidoId)
  +mostrarError(mensaje)
}
class PartidoService {
  <<control>>
  +obtenerPartido(partidoId) Partido
  +confirmarAsistencia(partidoId)
}
class PartidoRepository {
  <<repositorio>>
  +obtenerPartido(partidoId) Partido
  +confirmarVamos(partidoId)
  +verificarCapitanYVentana24h(partidoId) booleano
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +horaExacta: fechaHora [0..1]
  +horaDeInicio() fechaHora
  +estaConfirmado() booleano
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +vamosEn: fechaHora [0..1]
  +confirmoVamos() booleano
}
PantallaPartidos ..> PartidoService
PartidoService ..> PartidoRepository
PartidoRepository ..> Partido
PartidoRepository ..> LadoPartido
Partido "1" *-- "2" LadoPartido
```

---

### UC-D09 · Tirar el partido

> Especificación: [UC-D09](../partidos/02-casos-de-uso.md#uc-d09--tirar-el-partido) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S09 · Tirar el partido](../partidos/04-diagramas-secuencia/uc-d09-tirar-partido.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +tocarTirarPartido(partidoId)
  +mostrarFormularioMotivo(advierteFalta)
  +confirmarTirarPartido(partidoId, motivo)
  +mostrarEnHistorialComoCaido()
  +mostrarError(mensaje)
}
class PartidoService {
  <<control>>
  +obtenerPartido(partidoId) Partido
  +tirarPartido(partidoId, motivo)
}
class ValidadorPartido {
  <<validador>>
  +validarMotivo(motivo) booleano
}
class PartidoRepository {
  <<repositorio>>
  +obtenerPartido(partidoId) Partido
  +tirar(partidoId, motivo)
  +verificarCapitanYAntesDeHoraInicio(partidoId) booleano
  +marcarPartidoCaidoYLiberarFranjas(partidoId, motivo)
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +horaExacta: fechaHora [0..1]
  +tiradoEn: fechaHora [0..1]
  +motivoCaida: texto [0..1]
  +tiradoPorEquipoId: uuid [0..1]
  +horaDeInicio() fechaHora
  +sumaFaltaPorCaida() booleano
  +fase() FasePartido
}
class Falta {
  <<entidad>>
  +equipoId: uuid
  +partidoId: uuid
  +ocurridaEn: fechaHora
  +cuentaEn90Dias() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class FasePartido {
  <<enumeracion>>
  PorJugarse
  EsperandoResultado
  Jugado
  Caido
  EnConflicto
  NoPresentado
}
PantallaPartidos ..> PartidoService
PartidoService ..> ValidadorPartido
PartidoService ..> PartidoRepository
PartidoRepository ..> Partido
PartidoRepository ..> Falta
PartidoRepository ..> Aviso
Partido ..> FasePartido
```

---

### UC-D10 · Caída de común acuerdo

> Especificación: [UC-D10](../partidos/02-casos-de-uso.md#uc-d10--caída-de-común-acuerdo) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S10 · Caída de común acuerdo](../partidos/04-diagramas-secuencia/uc-d10-caida-comun-acuerdo.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +ofrecerCaidaDeComunAcuerdo()
  +pedirCaidaDeComunAcuerdo(partidoId, motivo)
  +mostrarEsperandoRespuesta()
  +verPedidoAbiertoEnFila()
  +tocarAceptarCaida(partidoId)
  +tocarRechazarCaida(partidoId)
  +mostrarResultadoCaida()
  +mostrarError(mensaje)
}
class PartidoService {
  <<control>>
  +pedirCaidaDeComunAcuerdo(partidoId, motivo)
  +responderCaida(partidoId, aceptar)
}
class ValidadorPartido {
  <<validador>>
  +validarMotivo(motivo) booleano
}
class PartidoRepository {
  <<repositorio>>
  +pedirCaida(partidoId, motivo)
  +responderCaida(partidoId, aceptar)
  +verificarVentanaMenosDe24hYPedidoUnico(partidoId) booleano
  +tirarDeComunAcuerdoSinFalta(partidoId)
  +registrarRechazoCaidaMutua(partidoId)
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +horaExacta: fechaHora [0..1]
  +tiradoEn: fechaHora [0..1]
  +motivoCaida: texto [0..1]
  +caidaMutua: booleano
  +pedidoCaidaEquipoId: uuid [0..1]
  +pedidoCaidaMotivo: texto [0..1]
  +pedidoCaidaEn: fechaHora [0..1]
  +pedidoCaidaRespondidoEn: fechaHora [0..1]
  +pedidoCaidaAceptado: booleano [0..1]
  +horaDeInicio() fechaHora
  +fase() FasePartido
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class FasePartido {
  <<enumeracion>>
  PorJugarse
  EsperandoResultado
  Jugado
  Caido
  EnConflicto
  NoPresentado
}
PantallaPartidos ..> PartidoService
PartidoService ..> ValidadorPartido
PartidoService ..> PartidoRepository
PartidoRepository ..> Partido
PartidoRepository ..> Aviso
Partido ..> FasePartido
```

---

### UC-D11 · Cargar el resultado

> Especificación: [UC-D11](../partidos/02-casos-de-uso.md#uc-d11--cargar-el-resultado) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S11 · Cargar el resultado](../partidos/04-diagramas-secuencia/uc-d11-cargar-resultado.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +mostrarContanosComoSalio(partido)
  +confirmarMarcador(partidoId, golesAFavor, golesEnContra)
  +tocarConfirmarResultadoRival(partidoId, golesEspejados)
  +mostrarEsperandoConfirmacionRival()
  +mostrarEnHistorial(desenlace)
  +mostrarError(mensaje)
}
class PartidoService {
  <<control>>
  +obtenerPartido(partidoId) Partido
  +cargarResultado(partidoId, golesAFavor, golesEnContra)
}
class ValidadorPartido {
  <<validador>>
  +validarResultado(golesAFavor, golesEnContra) booleano
}
class PartidoRepository {
  <<repositorio>>
  +obtenerPartido(partidoId) Partido
  +cargarResultado(partidoId, golesAFavor, golesEnContra)
  +verificarCapitanYPlazoAbierto(partidoId) booleano
  +compararConResultadoDelRival(partidoId, golesAFavor, golesEnContra) booleano
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +horaExacta: fechaHora [0..1]
  +horaDeInicio() fechaHora
  +plazoResultado() fechaHora
  +resultadosCoinciden() booleano
  +estaEnConflicto() booleano
  +fase() FasePartido
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +golesAFavor: entero [0..1]
  +golesEnContra: entero [0..1]
  +resultadoEn: fechaHora [0..1]
  +cargoResultado() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class FasePartido {
  <<enumeracion>>
  PorJugarse
  EsperandoResultado
  Jugado
  Caido
  EnConflicto
  NoPresentado
}
PantallaPartidos ..> PartidoService
PartidoService ..> ValidadorPartido
PartidoService ..> PartidoRepository
PartidoRepository ..> Partido
PartidoRepository ..> LadoPartido
PartidoRepository ..> Aviso
Partido "1" *-- "2" LadoPartido
Partido ..> FasePartido
```

---

### UC-D12 · Reportar que el rival no se presentó

> Especificación: [UC-D12](../partidos/02-casos-de-uso.md#uc-d12--reportar-que-el-rival-no-se-presentó) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S12 · Reportar no se presentó](../partidos/04-diagramas-secuencia/uc-d12-reportar-no-se-presento.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +tocarNoVinieron(partidoId)
  +mostrarEsperandoRespuestaRival()
  +tocarFuimos(partidoId)
  +mostrarEnHistorialEnConflicto()
  +mostrarError(mensaje)
}
class PartidoService {
  <<control>>
  +reportarAusencia(partidoId)
  +responderFuimos(partidoId)
}
class PartidoRepository {
  <<repositorio>>
  +reportarNoVinieron(partidoId)
  +responderFuimos(partidoId)
  +verificarCapitanPasadaHoraYSinResultadoPropio(partidoId) booleano
  +registrarReporteNoShowYAbrirPlazo48h(partidoId)
  +dejarPartidoEnConflictoSinFalta(partidoId)
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +horaExacta: fechaHora [0..1]
  +horaDeInicio() fechaHora
  +plazo() fechaHora [0..1]
  +fase() FasePartido
}
class LadoPartido {
  <<entidad>>
  +partidoId: uuid
  +equipoId: uuid
  +noVinieronEn: fechaHora [0..1]
  +fuimosEn: fechaHora [0..1]
  +reportoAusencia() booleano
  +respondioFuimos() booleano
}
class Falta {
  <<entidad>>
  +equipoId: uuid
  +partidoId: uuid
  +ocurridaEn: fechaHora
  +cuentaEn90Dias() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class FasePartido {
  <<enumeracion>>
  PorJugarse
  EsperandoResultado
  Jugado
  Caido
  EnConflicto
  NoPresentado
}
PantallaPartidos ..> PartidoService
PartidoService ..> PartidoRepository
PartidoRepository ..> Partido
PartidoRepository ..> LadoPartido
PartidoRepository ..> Falta
PartidoRepository ..> Aviso
Partido "1" *-- "2" LadoPartido
Partido ..> FasePartido
```

---

### UC-D13 · Calificar al rival

> Especificación: [UC-D13](../partidos/02-casos-de-uso.md#uc-d13--calificar-al-rival) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S13 · Calificar al rival](../partidos/04-diagramas-secuencia/uc-d13-calificar-rival.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +mostrarCalificarRival(partidoId)
  +elegirEstrellasYComentario(estrellas, comentario)
  +confirmarCalificacion(partidoId, estrellas, comentario)
  +mostrarYaCalificaste()
  +mostrarError(mensaje)
}
class PartidoService {
  <<control>>
  +obtenerEstadoDeCalificacion(partidoId)
  +calificarRival(partidoId, estrellas, comentario)
}
class ValidadorPartido {
  <<validador>>
  +validarCalificacion(estrellas, comentario) booleano
}
class CalificacionRepository {
  <<repositorio>>
  +obtenerEstadoDeCalificacion(partidoId)
  +calificar(partidoId, estrellas, comentario)
  +verificarCapitanPartidoJugadoYVentana7Dias(partidoId) booleano
  +guardarCalificacionUnica(partidoId, estrellas, comentario)
}
class Calificacion {
  <<entidad>>
  +id: uuid
  +partidoId: uuid
  +equipoEvaluadorId: uuid
  +equipoEvaluadoId: uuid
  +estrellas: entero
  +comentario: texto [0..1]
  +creadaEn: fechaHora
  +estaRevelada() booleano
}
class Partido {
  <<entidad>>
  +id: uuid
  +plazoCalificacion() fechaHora
  +fase() FasePartido
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
PantallaPartidos ..> PartidoService
PartidoService ..> ValidadorPartido
PartidoService ..> CalificacionRepository
CalificacionRepository ..> Calificacion
CalificacionRepository ..> Partido
CalificacionRepository ..> Aviso
Partido "1" *-- "0..2" Calificacion
```

---

### UC-D14 · Ver mis partidos

> Especificación: [UC-D14](../partidos/02-casos-de-uso.md#uc-d14--ver-mis-partidos) · Pantalla: [P2 · Partidos](../partidos/03-pantallas.md#p2--partidos) · Secuencia: [S14 · Ver mis partidos](../partidos/04-diagramas-secuencia/uc-d14-ver-mis-partidos.md)

```mermaid
classDiagram
class PantallaPartidos {
  <<boundary>>
  +abrirPartidos()
  +ordenarYArmarSecciones(propuestas, partidos)
  +mostrarSecciones(teProponenJugar, proximo, contanosComoSalio, masAdelante, historial)
  +mostrarEstadoVacio(esCapitan)
}
class PartidoService {
  <<control>>
  +consultarMisPartidos(usuarioId)
}
class EquipoRepository {
  <<repositorio>>
  +listarEquiposDelUsuario(usuarioId) Equipo[]
}
class PropuestaRepository {
  <<repositorio>>
  +listarPropuestasRecibidas(usuarioId) Propuesta[]
}
class PartidoRepository {
  <<repositorio>>
  +listarPartidos(equiposIds) Partido[]
  +obtenerWhatsappDelRival(partidoId) texto
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
}
class Propuesta {
  <<entidad>>
  +id: uuid
  +franjaEmisoraId: uuid
  +franjaReceptoraId: uuid
  +rangoComun: rangoFechaHora
  +venceEn() fechaHora
  +estado() EstadoPropuesta
}
class Partido {
  <<entidad>>
  +id: uuid
  +rango: rangoFechaHora
  +cancha: texto [0..1]
  +horaExacta: fechaHora [0..1]
  +horaDeInicio() fechaHora
  +fase() FasePartido
  +plazo() fechaHora [0..1]
}
class FasePartido {
  <<enumeracion>>
  PorJugarse
  EsperandoResultado
  Jugado
  Caido
  EnConflicto
  NoPresentado
}
PantallaPartidos ..> PartidoService
PartidoService ..> EquipoRepository
PartidoService ..> PropuestaRepository
PartidoService ..> PartidoRepository
EquipoRepository ..> Equipo
PropuestaRepository ..> Propuesta
PartidoRepository ..> Partido
Partido ..> FasePartido
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `PantallaBuscarRival` / `PantallaPartidos` | `«boundary»` | `src/app/partidos/buscar/page.tsx`, `src/app/partidos/page.tsx` y formularios de acción en `src/components/matches/` | Implementadas |
| `WhatsApp` | `«boundary»` | `whatsappLink` (`src/utils/whatsapp.ts`) | Implementado |
| `BusquedaService` / `PartidoService` / `OpcionesBusqueda` / `OpcionesPartido` | `«control»` | Server Actions en `src/app/partidos/actions.ts` y `src/app/partidos/buscar/actions.ts`, `SPORT_MODALITIES` (`src/utils/modality.ts`), `TIME_SLOTS` y horas de inicio (`src/utils/matches.ts`) | Implementados |
| `ValidadorPartido` | `«validador»` | `parseSearchSlots`, `parseProposalTarget`, `parseCoordinateForm`, `parseDropReason`, `parseResultForm`, `parseRatingForm` (`src/utils/matches.ts`) | Implementado |
| `EquipoRepository` | `«repositorio»` | Consultas de pertenencia y capitanías en `public.teams` y `public.team_members` | Implementado |
| `BusquedaRepository` / `PropuestaRepository` | `«repositorio»` | Tablas `public.rival_searches`, `search_slots`, `proposals`; funciones `save_rival_search`, `compatible_rivals`, `send_proposal`, `respond_proposal`, `proposal_status` (`20261028000003..06`) | Implementados |
| `PartidoRepository` | `«repositorio»` | Tablas `public.matches`, `match_sides`, `team_faults`; funciones `coordinate_match`, `confirm_going`, `drop_match`, `request_mutual_drop`, `answer_mutual_drop`, `report_result`, `report_no_show`, `reply_went`, `match_phase`, `match_deadline`, `rival_captain_whatsapp` (`20261028000006..09`) | Implementado |
| `CalificacionRepository` | `«repositorio»` | Tabla `public.ratings`; funciones `rate_rival`, `my_match_rating_status` (`20261028000009_match_results.sql`) | Implementado |
| `BusquedaDeRival` / `Franja` / `Propuesta` / `Partido` / `LadoPartido` / `Calificacion` / `Falta` | `«entidad»` | Esquema `20261028000003_rival_searches.sql` a `20261028000017_team_public_history.sql` | Implementadas |
