# Módulo C — Equipos

> Documenta las clases de dominio y de diseño que participan en el **Módulo C — Equipos** (`UC-C01` a `UC-C10`).
> Fuentes del módulo: [01-requerimientos.md](../equipos/01-requerimientos.md) · [02-casos-de-uso.md](../equipos/02-casos-de-uso.md) · [03-pantallas.md](../equipos/03-pantallas.md) · [04-diagramas-secuencia/](../equipos/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades y enumeraciones que comparten los casos de uso `UC-C01` a `UC-C10`.

```mermaid
classDiagram
direction TB
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
  +disueltoEn: fechaHora [0..1]
  +creadoEn: fechaHora
  +estaDisuelto() booleano
  +cantidadJugadores() entero
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +esCapitan: booleano
  +unidoEn: fechaHora
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
  +venceEn: fechaHora
  +creadaEn: fechaHora
  +esVigente() booleano
}
class ResumenHistorialPublico {
  <<entidad>>
  +teamId: uuid
  +partidosJugados: entero
  +faltasUltimos90Dias: entero
  +conflictos: entero
  +rivalesEnConflicto: entero
  +promedioEstrellas: decimal [0..1]
  +cantidadCalificaciones: entero
}
class PartidoCerradoPublico {
  <<entidad>>
  +matchId: uuid
  +fecha: fecha
  +rivalId: uuid
  +nombreRival: texto
  +zonaRival: texto
  +desenlace: texto
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +usuarioId: uuid
  +motivo: MotivoReporteEquipo
  +estado: EstadoReporte
  +creadoEn: fechaHora
}
class Perfil {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +fotoUrl: texto [0..1]
}
class ContactoPerfil {
  <<entidad>>
  +userId: uuid
  +whatsapp: texto [0..1]
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
}
class Corredor {
  <<entidad>>
  +id: texto
  +nombre: texto
}
class Modalidad {
  <<enumeracion>>
  Futbol5
  Futbol7
  Futbol8
  Futbol11
}
class NivelEquipo {
  <<enumeracion>>
  Recreativo
  Intermedio
  Competitivo
}
class MotivoReporteEquipo {
  <<enumeracion>>
  ViolenciaOAgresiones
  CuentaFalsa
  AbusoDeCalificaciones
}
Equipo "1" *-- "1..*" IntegrantePlantel : plantel privado
IntegrantePlantel "0..*" --> "1" Perfil : jugador o capitán
Perfil "1" *-- "1" ContactoPerfil : WhatsApp privado
Equipo "1" *-- "0..1" InvitacionEquipo : único link vigente
Equipo "0..*" --> "1" Zona : se ubica en
Zona "1..*" --> "1" Corredor : pertenece a
Equipo "1" --> "1" ResumenHistorialPublico : resumen público
Equipo "1" --> "0..5" PartidoCerradoPublico : últimos cerrados
Equipo "1" --> "0..*" ReporteEquipo : recibe
Equipo ..> Modalidad
Equipo ..> NivelEquipo
ReporteEquipo ..> MotivoReporteEquipo
```

---

## Clases por caso de uso

### UC-C01 · Crear equipo

**Requerimientos:** `RF-C01` a `RF-C06`, `RF-C27` · **Pantalla:** [P1 · Crear equipo](../equipos/03-pantallas.md#p1--crear-equipo) (`/crear-equipo`) · **Secuencia:** [S01 · Crear equipo](../equipos/04-diagramas-secuencia/uc-c01-crear-equipo.md)

```mermaid
classDiagram
direction TB
class FormularioCrearEquipo {
  <<boundary>>
  +abrirCrearEquipo()
  +confirmarCreacion(nombre, zonaId, modalidad, nivel, escudo)
  +mostrarAvisoFaltaWhatsapp()
  +mostrarAvisoLimiteCapitanias()
  +mostrarErrores(errores)
}
class OpcionesEquipo {
  <<proveedor de opciones>>
  +listarModalidades() Modalidad[]
  +listarNiveles() NivelEquipo[]
}
class EquipoService {
  <<control>>
  +prepararCreacionEquipo(usuarioId) DatosFormularioEquipo
  +crearEquipo(nombre, zonaId, modalidad, nivel, escudo) uuid
}
class ValidadorEquipo {
  <<validador>>
  +validarDatosEquipo(nombre, zonaId, modalidad, nivel) booleano
  +validarEscudo(escudo) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class EquipoRepository {
  <<repositorio>>
  +consultarRequisitos(usuarioId) RequisitosCreacion
  +crearEquipo(datos, usuarioId) uuid
  +guardarEscudo(equipoId, escudo)
  -comprobarWhatsappYLimiteCapitanias(usuarioId)
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +esCapitan: booleano
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
}
class Modalidad {
  <<enumeracion>>
  Futbol5
  Futbol7
  Futbol8
  Futbol11
}
class NivelEquipo {
  <<enumeracion>>
  Recreativo
  Intermedio
  Competitivo
}
FormularioCrearEquipo ..> OpcionesEquipo : obtiene modalidades y niveles fijos
FormularioCrearEquipo ..> EquipoService : consulta requisitos/Zonas y envía creación
EquipoService ..> ZonaRepository : carga Zonas disponibles
EquipoService ..> ValidadorEquipo : valida datos y escudo
EquipoService ..> EquipoRepository : verifica requisitos, ejecuta alta y sube escudo
EquipoRepository ..> Equipo : crea en transacción
Equipo "1" *-- "1" IntegrantePlantel : creador como Capitán
Equipo "0..*" --> "1" Zona : se ubica en
OpcionesEquipo ..> Modalidad
OpcionesEquipo ..> NivelEquipo
```

---

### UC-C02 · Invitar jugadores al equipo

**Requerimientos:** `RF-C07`, `RF-C25` · **Pantalla:** [P4 · Equipo, vista del Capitán](../equipos/03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) · **Secuencia:** [S02 · Invitar jugadores](../equipos/04-diagramas-secuencia/uc-c02-invitar-jugadores.md)

```mermaid
classDiagram
direction TB
class FichaEquipo {
  <<boundary>>
  +abrirFichaEquipo(equipoId)
  +pulsarGenerarORegenerarLink(equipoId)
  +copiarLink()
  +mostrarLinkVigente(enlace, vencimiento)
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +consultarInvitacionVigente(equipoId) InvitacionEquipo
  +generarInvitacion(equipoId) InvitacionEquipo
}
class EquipoRepository {
  <<repositorio>>
  +obtenerInvitacionVigente(equipoId) InvitacionEquipo
  +regenerarInvitacion(equipoId) InvitacionEquipo
  -verificarCapitanYEquipoActivo(equipoId)
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
  +venceEn: fechaHora
  +esVigente() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaDisuelto() booleano
}
FichaEquipo ..> EquipoService : consulta o pide regenerar link
EquipoService ..> EquipoRepository : lee y regenera invitación
EquipoRepository ..> InvitacionEquipo : crea token a 7 días y reemplaza el anterior
Equipo "1" *-- "0..1" InvitacionEquipo : único link por equipo
```

---

### UC-C03 · Unirse a un equipo con el link

**Requerimientos:** `RF-C08` a `RF-C10`, `RF-C27` · **Pantalla:** [P6 · Unirse al equipo](../equipos/03-pantallas.md#p6--unirse-al-equipo) (`/unirse/{token}`) · **Secuencia:** [S03 · Unirse al equipo](../equipos/04-diagramas-secuencia/uc-c03-unirse-al-equipo.md)

```mermaid
classDiagram
direction TB
class PantallaUnirse {
  <<boundary>>
  +abrirInvitacion(token)
  +pulsarUnirmeAlEquipo(token)
  +mostrarErrorLinkInvalido()
}
class EquipoService {
  <<control>>
  +unirseAlEquipo(token) uuid
}
class ValidadorEquipo {
  <<validador>>
  +validarFormatoToken(token) booleano
}
class EquipoRepository {
  <<repositorio>>
  +incorporarAlPlantel(token) uuid
  -validarTokenVencimientoYEquipoActivo(token) booleano
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
  +venceEn: fechaHora
  +esVigente() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaDisuelto() booleano
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +esCapitan: booleano
}
PantallaUnirse ..> EquipoService : confirma unión con botón
EquipoService ..> ValidadorEquipo : valida formato del token
EquipoService ..> EquipoRepository : solicita incorporación al Plantel
EquipoRepository ..> InvitacionEquipo : verifica vigencia
EquipoRepository ..> Equipo : verifica activo
EquipoRepository ..> IntegrantePlantel : inserta como Jugador
```

---

### UC-C04 · Ver la página pública del equipo

**Requerimientos:** `RF-C11` a `RF-C14`, `RF-C25` · **Pantallas:** [P3 · Vista pública](../equipos/03-pantallas.md#p3--equipo-vista-pública) y [P4 · Vista del Jugador y del Capitán](../equipos/03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) (`/equipos/{id}`) · **Secuencia:** [S04 · Ver la página del equipo](../equipos/04-diagramas-secuencia/uc-c04-ver-pagina-equipo.md)

```mermaid
classDiagram
direction TB
class FichaEquipo {
  <<boundary>>
  +abrirFichaEquipo(equipoId)
  +mostrarFichaPublica(equipo, torneos, historial)
  +mostrarPlantelYAccionesSegunRol(plantel)
  +mostrarNoEncontrado()
}
class EquipoService {
  <<control>>
  +consultarFichaEquipo(equipoId)
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
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
  +disueltoEn: fechaHora [0..1]
  +estaDisuelto() booleano
  +cantidadJugadores() entero
}
class IntegrantePlantel {
  <<entidad>>
  +userId: uuid
  +nombreJugador: texto
  +esCapitan: booleano
}
class ResumenHistorialPublico {
  <<entidad>>
  +partidosJugados: entero
  +faltasUltimos90Dias: entero
  +conflictos: entero
  +rivalesEnConflicto: entero
  +promedioEstrellas: decimal [0..1]
}
class PartidoCerradoPublico {
  <<entidad>>
  +fecha: fecha
  +nombreRival: texto
  +zonaRival: texto
  +desenlace: texto
}
class TorneoVinculado {
  <<entidad>>
  +torneoId: uuid
  +nombreTorneo: texto
  +estado: EstadoTorneo
}
FichaEquipo ..> EquipoService : solicita ficha del equipo
EquipoService ..> EquipoRepository : lee datos públicos y Plantel
EquipoService ..> InscripcionRepository : lee torneos vinculados
EquipoService ..> HistorialRepository : lee resumen y últimos cerrados
EquipoRepository ..> Equipo
EquipoRepository ..> IntegrantePlantel
InscripcionRepository ..> TorneoVinculado
HistorialRepository ..> ResumenHistorialPublico
HistorialRepository ..> PartidoCerradoPublico
```

---

### UC-C05 · Editar equipo

**Requerimientos:** `RF-C01`, `RF-C02`, `RF-C16`, `RF-C25` · **Pantalla:** [P5 · Editar equipo](../equipos/03-pantallas.md#p5--editar-equipo) (`/equipos/{id}/editar`) · **Secuencia:** [S05 · Editar equipo](../equipos/04-diagramas-secuencia/uc-c05-editar-equipo.md)

```mermaid
classDiagram
direction TB
class FormularioEditarEquipo {
  <<boundary>>
  +abrirEditarEquipo(equipoId)
  +confirmarCambios(equipoId, nombre, zonaId, modalidad, nivel, escudo, quitarEscudo)
  +mostrarErrores(errores)
}
class OpcionesEquipo {
  <<proveedor de opciones>>
  +listarModalidades() Modalidad[]
  +listarNiveles() NivelEquipo[]
}
class EquipoService {
  <<control>>
  +cargarEquipoEditable(equipoId) DatosEdicionEquipo
  +editarEquipo(equipoId, nombre, zonaId, modalidad, nivel, escudo, quitarEscudo)
}
class ValidadorEquipo {
  <<validador>>
  +validarDatosEquipo(nombre, zonaId, modalidad, nivel) booleano
  +validarEscudo(escudo) booleano
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
  -subirEscudoNuevo(escudo) texto
  -retirarEscudoAnterior(ruta)
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +nivel: NivelEquipo
  +escudoUrl: texto [0..1]
  +disueltoEn: fechaHora [0..1]
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
}
FormularioEditarEquipo ..> OpcionesEquipo : carga modalidades y niveles fijos
FormularioEditarEquipo ..> EquipoService : solicita datos actuales y envía cambios
EquipoService ..> ZonaRepository : obtiene Zonas disponibles
EquipoService ..> ValidadorEquipo : valida datos y escudo
EquipoService ..> EquipoRepository : verifica Capitán y actualiza equipo activo
EquipoRepository ..> Equipo : persiste cambios
Equipo "0..*" --> "1" Zona : se ubica en
```

---

### UC-C06 · Pasar la capitanía

**Requerimientos:** `RF-C05`, `RF-C17`, `RF-C20`, `RF-C21`, `RF-C27` · **Pantalla:** [P4 · Equipo, vista del Capitán](../equipos/03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) · **Secuencia:** [S06 · Pasar la capitanía](../equipos/04-diagramas-secuencia/uc-c06-pasar-capitania.md)

```mermaid
classDiagram
direction TB
class FichaEquipo {
  <<boundary>>
  +elegirHacerCapitan(equipoId, integranteId)
  +confirmarTransferencia()
  +mostrarPlantelActualizado()
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +pasarCapitania(equipoId, integranteId)
}
class EquipoRepository {
  <<repositorio>>
  +transferirCapitania(equipoId, integranteId)
  -verificarDestinatarioEnPlantel(equipoId, integranteId) booleano
  -comprobarWhatsappYLimiteCapitanias(integranteId) booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +esCapitan: booleano
}
class ContactoPerfil {
  <<entidad>>
  +userId: uuid
  +whatsapp: texto [0..1]
}
FichaEquipo ..> EquipoService : solicita transferencia de capitanía
EquipoService ..> EquipoRepository : ordena transferir capitanía
EquipoRepository ..> Equipo : serializa y verifica activo
EquipoRepository ..> IntegrantePlantel : transfiere esCapitan en transacción
EquipoRepository ..> ContactoPerfil : exige WhatsApp cargado
```

---

### UC-C07 · Sacar a un jugador del plantel

**Requerimientos:** `RF-C18`, `RF-C20`, `RF-C21`, `RF-C25` · **Pantalla:** [P4 · Equipo, vista del Capitán](../equipos/03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) · **Secuencia:** [S07 · Sacar a un jugador](../equipos/04-diagramas-secuencia/uc-c07-sacar-jugador.md)

```mermaid
classDiagram
direction TB
class FichaEquipo {
  <<boundary>>
  +elegirSacarJugador(equipoId, integranteId)
  +confirmarExpulsion()
  +mostrarPlantelActualizado()
  +mostrarError(mensaje)
}
class EquipoService {
  <<control>>
  +sacarJugador(equipoId, integranteId)
}
class EquipoRepository {
  <<repositorio>>
  +quitarIntegrante(equipoId, integranteId)
  -verificarNoEsPropioCapitan(equipoId, integranteId) booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +esCapitan: booleano
}
FichaEquipo ..> EquipoService : solicita sacar integrante
EquipoService ..> EquipoRepository : ordena quitar integrante
EquipoRepository ..> Equipo : serializa y verifica activo
EquipoRepository ..> IntegrantePlantel : retira del Plantel
```

---

### UC-C08 · Salir del equipo

**Requerimientos:** `RF-C19` a `RF-C21`, `RF-C25` · **Pantalla:** [P4 · Equipo, vista del Jugador](../equipos/03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) · **Secuencia:** [S08 · Salir del equipo](../equipos/04-diagramas-secuencia/uc-c08-salir-del-equipo.md)

```mermaid
classDiagram
direction TB
class FichaEquipo {
  <<boundary>>
  +pulsarSalirDelEquipo(equipoId)
  +confirmarSalida()
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
  -verificarIntegranteNoCapitan(equipoId) booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +esCapitan: booleano
}
FichaEquipo ..> EquipoService : solicita salir del equipo
EquipoService ..> EquipoRepository : ordena retirar pertenencia propia
EquipoRepository ..> Equipo : verifica activo
EquipoRepository ..> IntegrantePlantel : retira pertenencia propia
```

---

### UC-C09 · Disolver equipo

**Requerimientos:** `RF-C22` a `RF-C25` · **Pantalla:** [P4 · Equipo, vista del Capitán](../equipos/03-pantallas.md#p4--equipo-vista-del-jugador-y-del-capitán) · **Secuencia:** [S09 · Disolver equipo](../equipos/04-diagramas-secuencia/uc-c09-disolver-equipo.md)

```mermaid
classDiagram
direction TB
class FichaEquipo {
  <<boundary>>
  +tildarConfirmacionIrreversible()
  +pulsarDisolverEquipo(equipoId, confirmacion)
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
  -marcarDisueltoEInvalidarInvitacion(equipoId)
}
class PartidoRepository {
  <<repositorio>>
  +existenPartidosPendientes(equipoId) booleano
}
class BusquedaRepository {
  <<repositorio>>
  +cancelarBusquedasYPropuestasActivas(equipoId)
}
class AvisoRepository {
  <<repositorio>>
  +registrarAvisoCancelacion(usuarioId, parametros)
}
class Equipo {
  <<entidad>>
  +id: uuid
  +disueltoEn: fechaHora [0..1]
  +estaDisuelto() booleano
}
class InvitacionEquipo {
  <<entidad>>
  +teamId: uuid
  +token: texto
}
class Aviso {
  <<entidad>>
  +id: uuid
  +tipo: TipoAviso
}
FichaEquipo ..> EquipoService : envía confirmación de disolución
EquipoService ..> ValidadorEquipo : valida confirmación expresa
EquipoService ..> EquipoRepository : ejecuta disolución transaccional
EquipoRepository ..> PartidoRepository : comprueba ausencia de partidos pendientes
EquipoRepository ..> BusquedaRepository : cancela búsquedas y propuestas pendientes
BusquedaRepository ..> AvisoRepository : notifica contrapartes afectadas
AvisoRepository ..> Aviso : persiste aviso
EquipoRepository ..> Equipo : marca disueltoEn
EquipoRepository ..> InvitacionEquipo : invalida link vigente
```

---

### UC-C10 · Reportar un equipo

**Requerimientos:** `RF-C26` · **Pantalla:** [P3 · Equipo, vista pública](../equipos/03-pantallas.md#p3--equipo-vista-pública) · **Secuencia:** [S10 · Reportar un equipo](../equipos/04-diagramas-secuencia/uc-c10-reportar-equipo.md)

```mermaid
classDiagram
direction TB
class FichaEquipo {
  <<boundary>>
  +abrirFichaEquipo(equipoId)
  +tocarReportar()
  +enviarReporte(equipoId, motivo)
  +mostrarConfirmacionReporte()
  +mostrarError(mensaje)
}
class OpcionesReporte {
  <<proveedor de opciones>>
  +listarMotivos() MotivoReporteEquipo[]
}
class EquipoService {
  <<control>>
  +verificarHabilitacionReporte(usuarioId, equipoId) booleano
  +reportarEquipo(equipoId, motivo)
}
class ValidadorEquipo {
  <<validador>>
  +validarMotivoReporte(motivo) booleano
}
class ReporteRepository {
  <<repositorio>>
  +puedeReportar(usuarioId, equipoId) booleano
  +crearReporte(equipoId, motivo, usuarioId) ReporteEquipo
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +usuarioId: uuid
  +motivo: MotivoReporteEquipo
  +estado: EstadoReporte
  +creadoEn: fechaHora
}
class MotivoReporteEquipo {
  <<enumeracion>>
  ViolenciaOAgresiones
  CuentaFalsa
  AbusoDeCalificaciones
}
FichaEquipo ..> OpcionesReporte : carga motivos antes de elegir
FichaEquipo ..> EquipoService : consulta habilitación y envía motivo elegido
EquipoService ..> ValidadorEquipo : valida motivo
EquipoService ..> ReporteRepository : comprueba partido jugado en común y crea reporte
ReporteRepository ..> ReporteEquipo : persiste reporte pendiente
OpcionesReporte ..> MotivoReporteEquipo
ReporteEquipo ..> MotivoReporteEquipo
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `FormularioCrearEquipo` / `FormularioEditarEquipo` | `«boundary»` | `src/app/crear-equipo/page.tsx`, `src/app/equipos/[id]/editar/page.tsx`, `src/components/TeamForm.tsx` | Implementadas |
| `FichaEquipo` | `«boundary»` | `src/app/equipos/[id]/page.tsx`, `CopyLinkButton.tsx`, `ConfirmButton.tsx` | Implementada |
| `PantallaUnirse` | `«boundary»` | `src/app/unirse/[token]/page.tsx` | Implementada |
| `OpcionesEquipo` | `«proveedor de opciones»` | `SPORT_MODALITIES` (`src/utils/modality.ts`) y `TEAM_LEVELS` (`src/utils/teams.ts`) | Implementado |
| `OpcionesReporte` | `«proveedor de opciones»` | — (diseño objetivo de UC-C10) | **Pendiente** |
| `EquipoService` | `«control»` | Server Actions en `src/app/crear-equipo/actions.ts`, `src/app/equipos/[id]/actions.ts`, `src/app/unirse/[token]/actions.ts` | Implementado (falta UC-C10) |
| `ValidadorEquipo` | `«validador»` | `parseTeamForm` (`src/utils/team-form.ts`), `parseCrest` (`src/utils/team-crest.ts`) | Implementado |
| `ZonaRepository` | `«repositorio»` | `getZoneGroups()` en `src/components/ZoneSelect.tsx` (`public.zones`, `corridors`, `regions`) | Implementado |
| `EquipoRepository` | `«repositorio»` | Tablas `public.teams`, `team_members`, `team_invites`; funciones `create_team`, `join_team`, `leave_team`, `remove_team_member`, `transfer_captaincy`, `regenerate_team_invite`, `get_team_invite`, `dissolve_team`, `is_team_captain`; `saveTeam` (`src/utils/supabase/team.ts`) y bucket `team-crests` | Implementado |
| `InscripcionRepository` | `«repositorio»` | Vista pública `public.tournament_inscriptions` + `public.tournaments` | Implementado |
| `HistorialRepository` | `«repositorio»` | Vistas `public.team_record` y `public.team_match_history` (`20261028000012_team_history.sql`) | Implementado |
| `PartidoRepository` / `BusquedaRepository` / `AvisoRepository` | `«repositorio»` | Consultados dentro de `dissolve_team` (`20261028000006_matches.sql`: `matches`, `match_phase`, `rival_searches`, `cancel_proposals`, `notices`) | Implementados |
| `ReporteRepository` | `«repositorio»` | — (diseño objetivo de UC-C10) | **Pendiente** |
| `Equipo` / `IntegrantePlantel` / `InvitacionEquipo` | `«entidad»` | `public.teams`, `public.team_members`, `public.team_invites` | Implementadas |
| `ResumenHistorialPublico` / `PartidoCerradoPublico` / `ReporteEquipo` | `«entidad»` | Vistas `public.team_record` y `public.team_match_history` | Implementadas (salvo `ReporteEquipo`) |
