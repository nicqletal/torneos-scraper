# Módulo C — Equipos

> Documenta las clases de dominio y de diseño que participan en el **Módulo C — Equipos** (`UC-C01` a `UC-C10`).
> Fuentes del módulo: [01-requerimientos.md](../equipos/01-requerimientos.md) · [02-casos-de-uso.md](../equipos/02-casos-de-uso.md) · [03-pantallas.md](../equipos/03-pantallas.md) · [04-diagramas-secuencia/](../equipos/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de composición/asociación y enumeraciones que comparten los casos de uso `UC-C01` a `UC-C10`.

```mermaid
classDiagram
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
  +creadoEn: fechaHora
  +actualizadoEn: fechaHora
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
  +estaDisuelto() booleano
  +esCapitan(usuarioId) booleano
  +esIntegrante(usuarioId) booleano
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +rol: RolPlantel
  +incorporadoEn: fechaHora
  +esCapitan() booleano
  +antiguedadVisible() texto
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
  +creadaPor: uuid
  +creadaEn: fechaHora
  +venceEn: fechaHora
  +estaVigente() booleano
  +urlCompleta() texto
}
class ResumenHistorialPublico {
  <<entidad>>
  +equipoId: uuid
  +jugados: entero
  +noPresentado: entero
  +promedioEstrellas: decimal [0..1]
  +totalCalificaciones: entero
  +tieneCalificacionesSuficientes() booleano
}
class PartidoCerradoPublico {
  <<entidad>>
  +partidoId: uuid
  +fecha: fechaHora
  +rivalId: uuid
  +nombreRival: texto
  +modalidad: Modalidad
  +estadoVisible: EstadoPartidoCerrado
  +golesPropios: entero [0..1]
  +golesRival: entero [0..1]
}
class TorneoVinculado {
  <<entidad>>
  +torneoId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +estado: EstadoTorneo
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteEquipo
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
  +estaPendiente() booleano
}
class PerfilJugador {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +fotoUrl: texto [0..1]
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
  +corredorId: texto
  +orden: entero
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
class NivelEquipo {
  <<enumeracion>>
  Recreativo
  Amateur
  Competitivo
}
class RolPlantel {
  <<enumeracion>>
  Capitan
  Jugador
}
class EstadoPartidoCerrado {
  <<enumeracion>>
  Jugado
  EnConflicto
  NoPresentado
}
class MotivoReporteEquipo {
  <<enumeracion>>
  NombreEscudoOfensivo
  NoExisteSpam
  MalComportamiento
  Otro
}
Equipo "1" *-- "1..*" IntegrantePlantel
IntegrantePlantel "0..*" --> "1" PerfilJugador
Equipo "1" *-- "0..1" InvitacionEquipo
Equipo "0..*" --> "1" Zona
Equipo "1" *-- "1" ResumenHistorialPublico
ResumenHistorialPublico "1" *-- "0..10" PartidoCerradoPublico
Equipo "0..*" --> "0..*" TorneoVinculado
Equipo "1" *-- "0..*" ReporteEquipo
Equipo ..> Modalidad
Equipo ..> NivelEquipo
IntegrantePlantel ..> RolPlantel
PartidoCerradoPublico ..> EstadoPartidoCerrado
ReporteEquipo ..> MotivoReporteEquipo
```

---

## Clases por caso de uso

### UC-C01 · Crear un equipo

> Especificación: [UC-C01](../equipos/02-casos-de-uso.md#uc-c01--crear-un-equipo) · Pantalla: [P2 · Crear equipo](../equipos/03-pantallas.md#p2--crear-equipo) · Secuencia: [S01 · Crear equipo](../equipos/04-diagramas-secuencia/uc-c01-crear-equipo.md)

```mermaid
classDiagram
class FormularioCrearEquipo {
  <<boundary>>
  +abrirCrearEquipo()
  +mostrarAvisoSinWhatsapp()
  +mostrarAvisoLimiteCapitanias()
  +mostrarFormulario(zonas, modalidades, niveles)
  +completarDatosYSeleccionar(nombre, zonaId, modalidad, nivel, escudo)
  +confirmarCreacion()
  +mostrarErrores(errores)
  +abrirFichaEquipo(equipoId)
  +abrirEditarConAvisoEscudo(equipoId)
}
class OpcionesEquipo {
  <<control>>
  +listarModalidades() Modalidad[]
  +listarNiveles() NivelEquipo[]
}
class EquipoService {
  <<control>>
  +consultarRequisitosYOpciones(usuarioId)
  +crearEquipo(nombre, zonaId, modalidad, nivel, escudo) uuid
}
class ValidadorEquipo {
  <<validador>>
  +validarDatos(nombre, zonaId, modalidad, nivel) booleano
  +validarEscudo(escudo) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class EquipoRepository {
  <<repositorio>>
  +consultarRequisitos(usuarioId)
  +crearEquipo(datos, usuarioId) uuid
  +comprobarWhatsappYLimiteCapitanias(usuarioId) booleano
  +guardarEquipoYCapitan(datos, usuarioId) uuid
  +guardarEscudo(equipoId, escudo)
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
  +estaActivo() booleano
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +rol: RolPlantel
  +esCapitan() booleano
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
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
class NivelEquipo {
  <<enumeracion>>
  Recreativo
  Amateur
  Competitivo
}
FormularioCrearEquipo ..> EquipoService
EquipoService ..> OpcionesEquipo
EquipoService ..> ZonaRepository
EquipoService ..> ValidadorEquipo
EquipoService ..> EquipoRepository
EquipoRepository ..> Equipo
EquipoRepository ..> IntegrantePlantel
ZonaRepository ..> Zona
Equipo "1" *-- "1..*" IntegrantePlantel
Equipo "0..*" --> "1" Zona
Equipo ..> Modalidad
Equipo ..> NivelEquipo
```

---

### UC-C02 · Invitar jugadores por link

> Especificación: [UC-C02](../equipos/02-casos-de-uso.md#uc-c02--invitar-jugadores-por-link) · Pantalla: [P3 · Ficha del equipo](../equipos/03-pantallas.md#p3--ficha-del-equipo) · Secuencia: [S02 · Invitar jugadores](../equipos/04-diagramas-secuencia/uc-c02-invitar-jugadores.md)

```mermaid
classDiagram
class FichaEquipo {
  <<boundary>>
  +abrirFichaEquipo(equipoId)
  +mostrarInvitacionOBoton(invitacion)
  +pulsarGenerarORegenerarLink(equipoId)
  +mostrarLinkParaCopiar(enlace)
  +copiarLink()
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +obtenerInvitacionVigente(equipoId) InvitacionEquipo
  +generarInvitacion(equipoId) InvitacionEquipo
}
class EquipoRepository {
  <<repositorio>>
  +obtenerInvitacionVigente(equipoId) InvitacionEquipo
  +regenerarInvitacion(equipoId) InvitacionEquipo
  +verificarCapitanYEquipoActivo(equipoId) booleano
  +crearTokenYReemplazarAnterior(equipoId) InvitacionEquipo
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
  +creadaPor: uuid
  +creadaEn: fechaHora
  +venceEn: fechaHora
  +estaVigente() booleano
  +urlCompleta() texto
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
FichaEquipo ..> EquipoService
EquipoService ..> EquipoRepository
EquipoRepository ..> InvitacionEquipo
EquipoRepository ..> Equipo
Equipo "1" *-- "0..1" InvitacionEquipo
```

---

### UC-C03 · Unirse a un equipo con el link

> Especificación: [UC-C03](../equipos/02-casos-de-uso.md#uc-c03--unirse-a-un-equipo-con-el-link) · Pantalla: [P5 · Invitación al equipo](../equipos/03-pantallas.md#p5--invitación-al-equipo) · Secuencia: [S03 · Unirse al equipo](../equipos/04-diagramas-secuencia/uc-c03-unirse-al-equipo.md)

```mermaid
classDiagram
class PantallaUnirse {
  <<boundary>>
  +abrirInvitacion(token)
  +pedirIniciarSesion(destino)
  +mostrarInvitacion()
  +pulsarUnirmeAlEquipo(token)
  +abrirFichaEquipo(equipoId)
  +mostrarErrorLinkInvalido()
}
class EquipoService {
  <<control>>
  +unirseAlEquipo(token) uuid
}
class ValidadorEquipo {
  <<validador>>
  +validarToken(token) booleano
}
class EquipoRepository {
  <<repositorio>>
  +incorporarAlPlantel(token) uuid
  +validarTokenVencimientoYEquipoActivo(token) booleano
  +insertarIntegranteSiNoEsta(equipoId, usuarioId)
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
  +venceEn: fechaHora
  +estaVigente() booleano
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +rol: RolPlantel
  +incorporadoEn: fechaHora
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
PantallaUnirse ..> EquipoService
EquipoService ..> ValidadorEquipo
EquipoService ..> EquipoRepository
EquipoRepository ..> InvitacionEquipo
EquipoRepository ..> IntegrantePlantel
EquipoRepository ..> Equipo
Equipo "1" *-- "1..*" IntegrantePlantel
Equipo "1" *-- "0..1" InvitacionEquipo
```

---

### UC-C04 · Ver la página pública de un equipo

> Especificación: [UC-C04](../equipos/02-casos-de-uso.md#uc-c04--ver-la-página-pública-de-un-equipo) · Pantalla: [P3 · Ficha del equipo](../equipos/03-pantallas.md#p3--ficha-del-equipo) · Secuencia: [S04 · Ver página de equipo](../equipos/04-diagramas-secuencia/uc-c04-ver-pagina-equipo.md)

```mermaid
classDiagram
class FichaEquipo {
  <<boundary>>
  +abrirFichaEquipo(equipoId)
  +mostrarFicha(fichaPublica, plantel)
  +mostrarAccionesGestion()
  +mostrarNoEncontrado()
}
class EquipoService {
  <<control>>
  +consultarFichaPublica(equipoId)
}
class EquipoRepository {
  <<repositorio>>
  +obtenerDatosPublicos(equipoId) Equipo
  +obtenerPlantel(equipoId) IntegrantePlantel[]
}
class InscripcionRepository {
  <<repositorio>>
  +obtenerTorneosVinculados(equipoId) TorneoVinculado[]
}
class HistorialRepository {
  <<repositorio>>
  +obtenerHistorialPublico(equipoId) ResumenHistorialPublico
  +listarUltimosCerrados(equipoId) PartidoCerradoPublico[]
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +rol: RolPlantel
  +incorporadoEn: fechaHora
  +antiguedadVisible() texto
}
class TorneoVinculado {
  <<entidad>>
  +torneoId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +estado: EstadoTorneo
}
class ResumenHistorialPublico {
  <<entidad>>
  +equipoId: uuid
  +jugados: entero
  +noPresentado: entero
  +promedioEstrellas: decimal [0..1]
  +totalCalificaciones: entero
  +tieneCalificacionesSuficientes() booleano
}
class PartidoCerradoPublico {
  <<entidad>>
  +partidoId: uuid
  +fecha: fechaHora
  +rivalId: uuid
  +nombreRival: texto
  +modalidad: Modalidad
  +estadoVisible: EstadoPartidoCerrado
  +golesPropios: entero [0..1]
  +golesRival: entero [0..1]
}
FichaEquipo ..> EquipoService
EquipoService ..> EquipoRepository
EquipoService ..> InscripcionRepository
EquipoService ..> HistorialRepository
EquipoRepository ..> Equipo
EquipoRepository ..> IntegrantePlantel
InscripcionRepository ..> TorneoVinculado
HistorialRepository ..> ResumenHistorialPublico
HistorialRepository ..> PartidoCerradoPublico
Equipo "1" *-- "1..*" IntegrantePlantel
Equipo "1" *-- "1" ResumenHistorialPublico
ResumenHistorialPublico "1" *-- "0..10" PartidoCerradoPublico
```

---

### UC-C05 · Editar datos del equipo

> Especificación: [UC-C05](../equipos/02-casos-de-uso.md#uc-c05--editar-datos-del-equipo) · Pantalla: [P4 · Editar equipo](../equipos/03-pantallas.md#p4--editar-equipo) · Secuencia: [S05 · Editar equipo](../equipos/04-diagramas-secuencia/uc-c05-editar-equipo.md)

```mermaid
classDiagram
class FormularioEditarEquipo {
  <<boundary>>
  +abrirEditarEquipo(equipoId)
  +mostrarFormulario(equipo, zonas, modalidades, niveles)
  +cambiarDatos(nombre, zonaId, modalidad, nivel, escudo, quitarEscudo)
  +confirmarCambios()
  +volverAFichaConConfirmacion(equipoId)
  +mostrarErrores(errores)
}
class OpcionesEquipo {
  <<control>>
  +listarModalidades() Modalidad[]
  +listarNiveles() NivelEquipo[]
}
class EquipoService {
  <<control>>
  +cargarDatosEdicion(equipoId)
  +editarEquipo(equipoId, nombre, zonaId, modalidad, nivel, escudo, quitarEscudo)
}
class ValidadorEquipo {
  <<validador>>
  +validarDatos(nombre, zonaId, modalidad, nivel) booleano
  +validarEscudo(escudo, quitarEscudo) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class EquipoRepository {
  <<repositorio>>
  +obtenerEquipoEditable(equipoId) Equipo
  +esCapitan(equipoId) booleano
  +guardarEquipoActivo(equipoId, datos, escudo, quitarEscudo)
  +subirEscudoNuevo(escudo) texto
  +retirarSubidaEscudo(ruta)
  +retirarEscudoAnterior(ruta)
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
}
FormularioEditarEquipo ..> EquipoService
EquipoService ..> OpcionesEquipo
EquipoService ..> ZonaRepository
EquipoService ..> ValidadorEquipo
EquipoService ..> EquipoRepository
EquipoRepository ..> Equipo
ZonaRepository ..> Zona
Equipo "0..*" --> "1" Zona
```

---

### UC-C06 · Pasar la capitanía

> Especificación: [UC-C06](../equipos/02-casos-de-uso.md#uc-c06--pasar-la-capitanía) · Pantalla: [P3 · Ficha del equipo](../equipos/03-pantallas.md#p3--ficha-del-equipo) · Secuencia: [S06 · Pasar capitanía](../equipos/04-diagramas-secuencia/uc-c06-pasar-capitania.md)

```mermaid
classDiagram
class FichaEquipo {
  <<boundary>>
  +elegirIntegranteYConfirmar(equipoId, integranteId)
  +mostrarPlantelActualizado()
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +pasarCapitania(equipoId, integranteId)
}
class ValidadorEquipo {
  <<validador>>
  +validarTransferenciaCapitania(equipoId, integranteId) booleano
}
class EquipoRepository {
  <<repositorio>>
  +transferirCapitania(equipoId, integranteId)
  +serializarYVerificarCapitanYActivo(equipoId) booleano
  +verificarDestinatarioEnPlantel(equipoId, integranteId) booleano
  +comprobarWhatsappYLimiteCapitanias(integranteId) booleano
  +cambiarCapitanEnTransaccion(equipoId, integranteId)
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +rol: RolPlantel
  +esCapitan() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
class RolPlantel {
  <<enumeracion>>
  Capitan
  Jugador
}
FichaEquipo ..> EquipoService
EquipoService ..> ValidadorEquipo
EquipoService ..> EquipoRepository
EquipoRepository ..> IntegrantePlantel
EquipoRepository ..> Equipo
Equipo "1" *-- "1..*" IntegrantePlantel
IntegrantePlantel ..> RolPlantel
```

---

### UC-C07 · Sacar un jugador del equipo

> Especificación: [UC-C07](../equipos/02-casos-de-uso.md#uc-c07--sacar-un-jugador-del-equipo) · Pantalla: [P3 · Ficha del equipo](../equipos/03-pantallas.md#p3--ficha-del-equipo) · Secuencia: [S07 · Sacar jugador](../equipos/04-diagramas-secuencia/uc-c07-sacar-jugador.md)

```mermaid
classDiagram
class FichaEquipo {
  <<boundary>>
  +elegirIntegranteYConfirmar(equipoId, integranteId)
  +mostrarPlantelSinJugador()
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +sacarJugador(equipoId, integranteId)
}
class ValidadorEquipo {
  <<validador>>
  +validarExpulsion(equipoId, integranteId) booleano
}
class EquipoRepository {
  <<repositorio>>
  +quitarIntegrante(equipoId, integranteId)
  +serializarYVerificarCapitanYActivo(equipoId) booleano
  +verificarNoEsPropioCapitan(equipoId, integranteId) booleano
  +retirarDelPlantel(equipoId, integranteId)
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +rol: RolPlantel
  +esCapitan() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
FichaEquipo ..> EquipoService
EquipoService ..> ValidadorEquipo
EquipoService ..> EquipoRepository
EquipoRepository ..> IntegrantePlantel
EquipoRepository ..> Equipo
Equipo "1" *-- "1..*" IntegrantePlantel
```

---

### UC-C08 · Salir del equipo

> Especificación: [UC-C08](../equipos/02-casos-de-uso.md#uc-c08--salir-del-equipo) · Pantalla: [P3 · Ficha del equipo](../equipos/03-pantallas.md#p3--ficha-del-equipo) · Secuencia: [S08 · Salir del equipo](../equipos/04-diagramas-secuencia/uc-c08-salir-del-equipo.md)

```mermaid
classDiagram
class FichaEquipo {
  <<boundary>>
  +pulsarSalirDelEquipoYConfirmar(equipoId)
  +abrirMisEquipos()
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +salirDelEquipo(equipoId)
}
class EquipoRepository {
  <<repositorio>>
  +quitarPropiaPertenencia(equipoId)
  +serializarYVerificarEquipoActivo(equipoId) booleano
  +verificarIntegranteNoCapitan(equipoId) booleano
  +retirarPertenencia(equipoId, usuarioId)
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +rol: RolPlantel
  +esCapitan() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
FichaEquipo ..> EquipoService
EquipoService ..> EquipoRepository
EquipoRepository ..> IntegrantePlantel
EquipoRepository ..> Equipo
Equipo "1" *-- "1..*" IntegrantePlantel
```

---

### UC-C09 · Disolver el equipo

> Especificación: [UC-C09](../equipos/02-casos-de-uso.md#uc-c09--disolver-el-equipo) · Pantalla: [P3 · Ficha del equipo](../equipos/03-pantallas.md#p3--ficha-del-equipo) · Secuencia: [S09 · Disolver equipo](../equipos/04-diagramas-secuencia/uc-c09-disolver-equipo.md)

```mermaid
classDiagram
class FichaEquipo {
  <<boundary>>
  +tildarCasillaYConfirmar(equipoId, confirmacion)
  +pedirConfirmacionDefinitiva()
  +mostrarFichaDisuelta()
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +disolverEquipo(equipoId, confirmacion)
}
class ValidadorEquipo {
  <<validador>>
  +validarConfirmacionDisolucion(confirmacion) booleano
}
class EquipoRepository {
  <<repositorio>>
  +disolver(equipoId)
  +serializarYVerificarCapitanYActivo(equipoId) booleano
  +marcarDisueltoEInvalidarInvitacion(equipoId)
}
class PartidoRepository {
  <<repositorio>>
  +existenPartidosPendientes(equipoId) booleano
}
class BusquedaRepository {
  <<repositorio>>
  +cancelarBusquedasActivas(equipoId)
  +cancelarPropuestasPendientesYAvisar(equipoId)
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +disueltoEn: fechaHora [0..1]
  +estaDisuelto() booleano
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
}
FichaEquipo ..> EquipoService
EquipoService ..> ValidadorEquipo
EquipoService ..> EquipoRepository
EquipoRepository ..> PartidoRepository
EquipoRepository ..> BusquedaRepository
EquipoRepository ..> Equipo
EquipoRepository ..> InvitacionEquipo
Equipo "1" *-- "0..1" InvitacionEquipo
```

---

### UC-C10 · Reportar un equipo

> Especificación: [UC-C10](../equipos/02-casos-de-uso.md#uc-c10--reportar-un-equipo) · Pantalla: [P3 · Ficha del equipo](../equipos/03-pantallas.md#p3--ficha-del-equipo) · Secuencia: [S10 · Reportar equipo](../equipos/04-diagramas-secuencia/uc-c10-reportar-equipo.md)

```mermaid
classDiagram
class FichaEquipo {
  <<boundary>>
  +abrirFichaEquipo(equipoId)
  +mostrarFichaConOSinBotonReportar(puedeReportar)
  +tocarReportar()
  +elegirMotivoYEnviar(equipoId, motivo)
  +mostrarConfirmacionReporte()
  +mostrarError(mensaje)
}
class OpcionesReporte {
  <<control>>
  +listarMotivos() MotivoReporteEquipo[]
}
class EquipoService {
  <<control>>
  +puedeReportar(usuarioId, equipoId) booleano
  +obtenerMotivosReporte() MotivoReporteEquipo[]
  +reportarEquipo(equipoId, motivo)
}
class ValidadorEquipo {
  <<validador>>
  +validarMotivo(motivo) booleano
}
class ReporteRepository {
  <<repositorio>>
  +puedeReportar(usuarioId, equipoId) booleano
  +crearReporte(equipoId, motivo, usuarioId) ReporteEquipo
  +verificarSesionYPartidoJugadoEnComun(usuarioId, equipoId) booleano
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteEquipo
  +creadoEn: fechaHora
  +estaPendiente() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
}
class MotivoReporteEquipo {
  <<enumeracion>>
  NombreEscudoOfensivo
  NoExisteSpam
  MalComportamiento
  Otro
}
FichaEquipo ..> EquipoService
EquipoService ..> OpcionesReporte
EquipoService ..> ValidadorEquipo
EquipoService ..> ReporteRepository
ReporteRepository ..> ReporteEquipo
Equipo "1" *-- "0..*" ReporteEquipo
ReporteEquipo ..> MotivoReporteEquipo
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `FormularioCrearEquipo` | `«boundary»` | `src/app/equipos/crear/page.tsx` + `src/components/TeamForm.tsx` | Implementada |
| `FichaEquipo` | `«boundary»` | `src/app/equipos/[id]/page.tsx` + `InviteLinkBox.tsx`, `MemberActions.tsx`, `LeaveTeamForm.tsx`, `DissolveTeamForm.tsx` | Implementada (falta botón «Reportar» de UC-C10) |
| `FormularioEditarEquipo` | `«boundary»` | `src/app/equipos/[id]/editar/page.tsx` + `src/components/TeamForm.tsx` | Implementada |
| `PantallaUnirse` | `«boundary»` | `src/app/equipos/unirse/[token]/page.tsx` | Implementada |
| `EquipoService` / `OpcionesEquipo` / `OpcionesReporte` | `«control»` | Server Actions en `src/app/equipos/crear/actions.ts`, `src/app/equipos/[id]/actions.ts`, `src/app/equipos/[id]/editar/actions.ts`, `src/app/equipos/unirse/[token]/actions.ts`, `SPORT_MODALITIES` (`src/utils/modality.ts`), `TEAM_LEVELS` (`src/utils/teams.ts`) | Implementados (faltan `reportarEquipo` y `OpcionesReporte`) |
| `ValidadorEquipo` | `«validador»` | `parseTeamForm`, `parseCrest`, `parseRemoveCrest`, `parseInviteToken`, `parseMemberTarget`, `parseDissolveConfirmation` (`src/utils/teams.ts`) | Implementado |
| `ZonaRepository` | `«repositorio»` | `getZoneGroups()` en `src/components/ZoneSelect.tsx` (`public.zones`) | Implementado |
| `EquipoRepository` | `«repositorio»` | Tablas `public.teams`, `team_members`, `team_invites`; funciones `create_team`, `regenerate_team_invite`, `join_team`, `transfer_captaincy`, `remove_team_member`, `leave_team`, `dissolve_team`; bucket `crests` (`src/utils/supabase/crest.ts`) | Implementado |
| `InscripcionRepository` | `«repositorio»` | Vista `public.public_inscriptions` filtrada por `team_id` | Implementado |
| `HistorialRepository` | `«repositorio»` | Funciones `public.team_public_record` y `public.team_recent_matches` (`20261028000017_team_public_history.sql`) | Implementado |
| `PartidoRepository` / `BusquedaRepository` | `«repositorio»` | Verificación y cancelaciones invocadas dentro de `public.dissolve_team` (`20261028000015_dissolve_team_matches.sql`) | Implementados |
| `ReporteRepository` | `«repositorio»` | Tabla de reportes de equipo | **Pendiente** |
| `Equipo` / `IntegrantePlantel` / `InvitacionEquipo` | `«entidad»` | `public.teams`, `public.team_members`, `public.team_invites` (`20261028000002_teams.sql`) | Implementadas |
| `ResumenHistorialPublico` / `PartidoCerradoPublico` | `«entidad»` | Retorno de `team_public_record` y `team_recent_matches` | Implementadas |
