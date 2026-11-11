# Módulo E — Organizador

> Documenta las clases de dominio y de diseño que participan en el **Módulo E — Organizador** (`UC-E01` a `UC-E07`).
> Fuentes del módulo: [01-requerimientos.md](../organizador/01-requerimientos.md) · [02-casos-de-uso.md](../organizador/02-casos-de-uso.md) · [03-pantallas.md](../organizador/03-pantallas.md) · [04-diagramas-secuencia/](../organizador/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de composición/asociación y enumeraciones que comparten los casos de uso `UC-E01` a `UC-E07`.

```mermaid
classDiagram
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +fechaCierreInscripcion: fecha
  +fechaInicio: fecha
  +fechaFin: fecha
  +direccion: texto
  +whatsapp: texto [0..1]
  +instagram: texto [0..1]
  +precio: decimal [0..1]
  +cupoMaximo: entero [0..1]
  +descripcion: texto [0..1]
  +reglamento: texto [0..1]
  +flyerUrl: texto [0..1]
  +verificadoEn: fechaHora
  +observado: booleano
  +creadoEn: fechaHora
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +cuposRestantes() entero
  +antiguedadVerificacion() NivelAntiguedad
  +puedeVerificarHoy() booleano
  +admiteCambios() booleano
  +esOrganizador(usuarioId) booleano
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +creadaEn: fechaHora
  +esVinculada() booleano
  +esPorNombre() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +estaSuspendido() booleano
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
  +corredorId: texto
  +orden: entero
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
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
class EstadoTorneo {
  <<enumeracion>>
  Abierto
  Cerrado
  EnCurso
  Finalizado
}
class NivelAntiguedad {
  <<enumeracion>>
  Vigente
  Ambar30Dias
  Rojo60DiasSinConfirmar
}
Usuario "1" --> "0..*" Torneo
Torneo "1" *-- "0..*" Inscripcion
Inscripcion "0..*" --> "0..1" Equipo
Torneo "0..*" --> "1" Zona
Torneo ..> Modalidad
Torneo ..> EstadoTorneo
Torneo ..> NivelAntiguedad
Torneo ..> Aviso
```

---

## Clases por caso de uso

### UC-E01 · Publicar un torneo

> Especificación: [UC-E01](../organizador/02-casos-de-uso.md#uc-e01--publicar-un-torneo) · Pantalla: [P2 · Publicar torneo](../organizador/03-pantallas.md#p2--publicar-torneo) · Secuencia: [S01 · Publicar torneo](../organizador/04-diagramas-secuencia/uc-e01-publicar-torneo.md)

```mermaid
classDiagram
class FormularioTorneo {
  <<boundary>>
  +abrirPublicarTorneo()
  +mostrarFormulario(zonas, modalidades)
  +completarDatosYSeleccionar(nombre, modalidad, zonaId, fechas, direccion, contactos, precio, cupo, descripcion, reglamento, flyer)
  +confirmarPublicar()
  +mostrarErrores(errores)
  +abrirFichaConAvisoPublicado(torneoId)
}
class OpcionesTorneo {
  <<control>>
  +listarModalidades() Modalidad[]
}
class TorneoService {
  <<control>>
  +obtenerOpcionesFormulario()
  +publicarTorneo(nombre, modalidad, zonaId, fechas, direccion, contactos, precio, cupo, descripcion, reglamento, flyer) uuid
}
class ValidadorTorneo {
  <<validador>>
  +validarDatos(nombre, modalidad, zonaId, fechas, direccion, contactos, precio, cupo) booleano
  +validarFlyer(flyer) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class TorneoRepository {
  <<repositorio>>
  +crearTorneo(datos, usuario) uuid
  +guardarFlyer(id, flyer)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +fechaCierreInscripcion: fecha
  +fechaInicio: fecha
  +fechaFin: fecha
  +direccion: texto
  +whatsapp: texto [0..1]
  +instagram: texto [0..1]
  +precio: decimal [0..1]
  +cupoMaximo: entero [0..1]
  +descripcion: texto [0..1]
  +reglamento: texto [0..1]
  +flyerUrl: texto [0..1]
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
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
FormularioTorneo ..> TorneoService
TorneoService ..> OpcionesTorneo
TorneoService ..> ZonaRepository
TorneoService ..> ValidadorTorneo
TorneoService ..> TorneoRepository
ZonaRepository ..> Zona
TorneoRepository ..> Torneo
Torneo "0..*" --> "1" Zona
Torneo ..> Modalidad
```

---

### UC-E02 · Ver mis torneos (Panel de organizador)

> Especificación: [UC-E02](../organizador/02-casos-de-uso.md#uc-e02--ver-mis-torneos-panel-de-organizador) · Pantallas: [P1 · Mis torneos](../organizador/03-pantallas.md#p1--mis-torneos) y [P3 · Gestión del torneo](../organizador/03-pantallas.md#p3--gestión-del-torneo) · Secuencia: [S02 · Ver mis torneos](../organizador/04-diagramas-secuencia/uc-e02-ver-mis-torneos.md)

```mermaid
classDiagram
class PanelTorneos {
  <<boundary>>
  +abrirMisTorneos()
  +calcularAntiguedadYOrdenar(torneos)
  +mostrarFilas(torneos)
  +mostrarSinTorneos()
  +tocarGestionar(torneoId)
}
class GestionTorneo {
  <<boundary>>
  +abrirGestion(torneoId, pestana)
  +mostrarCabeceraYPestanas(torneo)
  +mostrarNoEncontrado()
}
class TorneoService {
  <<control>>
  +listarMisTorneos(usuarioId) Torneo[]
  +obtenerTorneoParaGestion(torneoId, usuarioId) Torneo
}
class TorneoRepository {
  <<repositorio>>
  +listarTorneosPropios(usuarioId) Torneo[]
  +obtenerTorneoPropio(torneoId, usuarioId) Torneo
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +cupoMaximo: entero [0..1]
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +cuposRestantes() entero
  +antiguedadVerificacion() NivelAntiguedad
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +esVinculada() booleano
}
class EstadoTorneo {
  <<enumeracion>>
  Abierto
  Cerrado
  EnCurso
  Finalizado
}
class NivelAntiguedad {
  <<enumeracion>>
  Vigente
  Ambar30Dias
  Rojo60DiasSinConfirmar
}
PanelTorneos ..> TorneoService
PanelTorneos ..> GestionTorneo
GestionTorneo ..> TorneoService
TorneoService ..> TorneoRepository
TorneoRepository ..> Torneo
Torneo "1" *-- "0..*" Inscripcion
Torneo ..> EstadoTorneo
Torneo ..> NivelAntiguedad
```

---

### UC-E03 · Editar un torneo

> Especificación: [UC-E03](../organizador/02-casos-de-uso.md#uc-e03--editar-un-torneo) · Pantalla: [P3 · Gestión del torneo](../organizador/03-pantallas.md#p3--gestión-del-torneo) · Secuencia: [S03 · Editar torneo](../organizador/04-diagramas-secuencia/uc-e03-editar-torneo.md)

```mermaid
classDiagram
class FormularioTorneo {
  <<boundary>>
  +abrirDatosDelTorneo(torneoId)
  +mostrarFormularioActual(torneo, zonas, modalidades)
  +cambiarDatos(nombre, modalidad, zonaId, fechas, direccion, contactos, precio, cupo, descripcion, reglamento, flyer)
  +pedirConfirmacionConAnotados(cantidadInscriptos)
  +guardar()
  +mostrarError(mensaje)
  +volverAGestion(torneoId)
}
class OpcionesTorneo {
  <<control>>
  +listarModalidades() Modalidad[]
}
class TorneoService {
  <<control>>
  +cargarDatosEdicion(torneoId, usuarioId)
  +editarTorneo(torneoId, nombre, modalidad, zonaId, fechas, direccion, contactos, precio, cupo, descripcion, reglamento, flyer)
}
class ValidadorTorneo {
  <<validador>>
  +validarDatos(nombre, modalidad, zonaId, fechas, direccion, contactos, precio, cupo) booleano
  +validarFlyer(flyer) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class TorneoRepository {
  <<repositorio>>
  +obtenerTorneoPropio(torneoId, usuarioId) Torneo
  +guardarCambios(torneoId, datos, usuarioId)
  +guardarFlyer(torneoId, flyer)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +fechaCierreInscripcion: fecha
  +fechaInicio: fecha
  +fechaFin: fecha
  +direccion: texto
  +whatsapp: texto [0..1]
  +instagram: texto [0..1]
  +precio: decimal [0..1]
  +cupoMaximo: entero [0..1]
  +descripcion: texto [0..1]
  +reglamento: texto [0..1]
  +flyerUrl: texto [0..1]
  +cantidadInscriptos() entero
  +esOrganizador(usuarioId) booleano
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
FormularioTorneo ..> TorneoService
TorneoService ..> OpcionesTorneo
TorneoService ..> ZonaRepository
TorneoService ..> ValidadorTorneo
TorneoService ..> TorneoRepository
ZonaRepository ..> Zona
TorneoRepository ..> Torneo
Torneo "0..*" --> "1" Zona
Torneo ..> Modalidad
```

---

### UC-E04 · Verificar que el torneo sigue vigente

> Especificación: [UC-E04](../organizador/02-casos-de-uso.md#uc-e04--verificar-que-el-torneo-sigue-vigente) · Pantallas: [P1 · Mis torneos](../organizador/03-pantallas.md#p1--mis-torneos) y [P3 · Gestión del torneo](../organizador/03-pantallas.md#p3--gestión-del-torneo) · Secuencia: [S04 · Verificar torneo](../organizador/04-diagramas-secuencia/uc-e04-verificar-torneo.md)

```mermaid
classDiagram
class PanelTorneos {
  <<boundary>>
  +decidirVisibilidadSigueVigente(torneo)
  +mostrarSigueVigente()
  +pulsarSigueVigente(torneoId)
}
class TorneoService {
  <<control>>
  +verificarTorneo(torneoId)
}
class TorneoRepository {
  <<repositorio>>
  +verificar(torneoId)
  +comprobarDuenoYNoFinalizado(torneoId) booleano
  +reiniciarAntiguedadVerificacion(torneoId)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
  +antiguedadVerificacion() NivelAntiguedad
  +puedeVerificarHoy() booleano
}
class NivelAntiguedad {
  <<enumeracion>>
  Vigente
  Ambar30Dias
  Rojo60DiasSinConfirmar
}
PanelTorneos ..> TorneoService
TorneoService ..> TorneoRepository
TorneoRepository ..> Torneo
Torneo ..> NivelAntiguedad
```

---

### UC-E05 · Dar de baja un torneo

> Especificación: [UC-E05](../organizador/02-casos-de-uso.md#uc-e05--dar-de-baja-un-torneo) · Pantalla: [P3 · Gestión del torneo](../organizador/03-pantallas.md#p3--gestión-del-torneo) · Secuencia: [S05 · Dar de baja torneo](../organizador/04-diagramas-secuencia/uc-e05-dar-de-baja-torneo.md)

```mermaid
classDiagram
class GestionTorneo {
  <<boundary>>
  +pulsarDarDeBaja(torneoId)
  +pedirConfirmacion(nombre, cantidadInscriptos)
  +confirmarBaja(torneoId)
  +mostrarError(mensaje)
  +volverAMisTorneos()
}
class TorneoService {
  <<control>>
  +darDeBajaTorneo(torneoId)
}
class TorneoRepository {
  <<repositorio>>
  +darDeBaja(torneoId)
  +comprobarDuenoYNoFinalizado(torneoId) booleano
  +borrarTorneoEInscripciones(torneoId)
  +avisarAPlantelesVinculados(torneoId)
  +borrarFlyer(torneoId)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +flyerUrl: texto [0..1]
  +estado() EstadoTorneo
  +admiteCambios() booleano
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +esVinculada() booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
GestionTorneo ..> TorneoService
TorneoService ..> TorneoRepository
TorneoRepository ..> Torneo
TorneoRepository ..> Inscripcion
TorneoRepository ..> Aviso
Torneo "1" *-- "0..*" Inscripcion
```

---

### UC-E06 · Cargar una inscripción

> Especificación: [UC-E06](../organizador/02-casos-de-uso.md#uc-e06--cargar-una-inscripción) · Pantalla: [P3 · Gestión del torneo](../organizador/03-pantallas.md#p3--gestión-del-torneo) · Secuencia: [S06 · Cargar inscripción](../organizador/04-diagramas-secuencia/uc-e06-cargar-inscripcion.md)

```mermaid
classDiagram
class GestionTorneo {
  <<boundary>>
  +abrirPestanaInscripciones(torneoId)
  +mostrarInscripciones(inscriptos)
  +escribirBusquedaEquipo(texto)
  +mostrarResultadosBusqueda(equipos)
  +elegirEquipoConAnotar(torneoId, equipoId)
  +escribirNombreYConfirmar(torneoId, nombre)
  +mostrarError(mensaje)
}
class InscripcionService {
  <<control>>
  +buscarEquiposActivos(texto) Equipo[]
  +anotarEquipoVinculado(torneoId, equipoId)
  +anotarEquipoPorNombre(torneoId, nombre)
}
class ValidadorTorneo {
  <<validador>>
  +validarBusqueda(texto) booleano
  +validarNombreDeEquipo(nombre) texto
}
class EquipoRepository {
  <<repositorio>>
  +buscarEquiposActivos(texto) Equipo[]
}
class InscripcionRepository {
  <<repositorio>>
  +agregarVinculada(torneoId, equipoId)
  +agregarPorNombre(torneoId, nombre)
  +verificarDuenoNoFinalizadoYCupo(torneoId) booleano
  +verificarEquipoActivoYNoAnotado(torneoId, equipoId) booleano
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +cupoMaximo: entero [0..1]
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +cuposRestantes() entero
  +admiteCambios() booleano
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +creadaEn: fechaHora
  +esVinculada() booleano
  +esPorNombre() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto
  +disueltoEn: fechaHora [0..1]
  +estaActivo() booleano
}
GestionTorneo ..> InscripcionService
InscripcionService ..> ValidadorTorneo
InscripcionService ..> EquipoRepository
InscripcionService ..> InscripcionRepository
EquipoRepository ..> Equipo
InscripcionRepository ..> Torneo
InscripcionRepository ..> Inscripcion
InscripcionRepository ..> Equipo
Torneo "1" *-- "0..*" Inscripcion
Inscripcion "0..*" --> "0..1" Equipo
```

---

### UC-E07 · Dar de baja una inscripción

> Especificación: [UC-E07](../organizador/02-casos-de-uso.md#uc-e07--dar-de-baja-una-inscripción) · Pantalla: [P3 · Gestión del torneo](../organizador/03-pantallas.md#p3--gestión-del-torneo) · Secuencia: [S07 · Dar de baja inscripción](../organizador/04-diagramas-secuencia/uc-e07-dar-de-baja-inscripcion.md)

```mermaid
classDiagram
class GestionTorneo {
  <<boundary>>
  +mostrarEquiposAnotados(inscriptos)
  +pulsarDarDeBajaYConfirmar(torneoId, inscripcionId)
  +mostrarListaActualizada()
  +mostrarError(mensaje)
}
class InscripcionService {
  <<control>>
  +darDeBajaInscripcion(torneoId, inscripcionId)
}
class InscripcionRepository {
  <<repositorio>>
  +quitar(inscripcionId)
  +comprobarTorneoPropioYNoFinalizado(inscripcionId) booleano
  +borrarInscripcionYLiberarCupo(inscripcionId)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +cupoMaximo: entero [0..1]
  +estado() EstadoTorneo
  +admiteCambios() booleano
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
}
GestionTorneo ..> InscripcionService
InscripcionService ..> InscripcionRepository
InscripcionRepository ..> Torneo
InscripcionRepository ..> Inscripcion
Torneo "1" *-- "0..*" Inscripcion
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `FormularioTorneo` | `«boundary»` | `src/components/TournamentForm.tsx` en `src/app/crear-torneo/page.tsx` y `src/app/mis-torneos/[id]/DatosTab.tsx` | Implementada |
| `PanelTorneos` | `«boundary»` | `src/app/mis-torneos/page.tsx` + `src/components/VerifyButton.tsx` | Implementada |
| `GestionTorneo` | `«boundary»` | `src/app/mis-torneos/[id]/page.tsx`, `DatosTab.tsx`, `InscripcionesTab.tsx`, `TeamSearch.tsx`, `WithdrawButton.tsx` | Implementada |
| `TorneoService` / `InscripcionService` / `OpcionesTorneo` | `«control»` | Server Actions en `src/app/crear-torneo/actions.ts`, `src/app/mis-torneos/actions.ts`, `src/app/mis-torneos/[id]/editar/actions.ts`, `inscripciones/actions.ts` y `SPORT_MODALITIES` (`src/utils/modality.ts`) | Implementados |
| `ValidadorTorneo` | `«validador»` | `parseTournamentForm`, `parseFlyer` (`src/utils/tournament-form.ts`), `parseTeamName`, `parseTeamQuery` (`src/utils/inscriptions.ts`) | Implementado |
| `ZonaRepository` | `«repositorio»` | `getZoneGroups()` en `src/components/ZoneSelect.tsx` (`public.zones`, `corridors`, `regions`) | Implementado |
| `TorneoRepository` | `«repositorio»` | Tabla `public.tournaments` con RLS, funciones `verify_tournament` y `withdraw_tournament` (`20261028000016`), bucket `flyers` (`src/utils/supabase/flyer.ts`) | Implementado |
| `InscripcionRepository` | `«repositorio»` | Tabla `public.inscriptions`, funciones `add_inscription`, `add_linked_inscription`, `remove_inscription` (`20261001000000_inscriptions.sql`, `20261028000002_teams.sql`) | Implementado |
| `EquipoRepository` | `«repositorio»` | Tabla `public.teams` (búsqueda de equipos activos por nombre) | Implementado |
| `Torneo` / `Inscripcion` / `Equipo` / `Zona` / `Aviso` | `«entidad»` | `tournaments`, `inscriptions`, `teams`, `zones`, `notices` | Implementadas |
