# Módulo E — Organizador

> Documenta las clases de dominio y de diseño que participan en el **Módulo E — Organizador** (`UC-E01` a `UC-E07`).
> Fuentes del módulo: [01-requerimientos.md](../organizador/01-requerimientos.md) · [02-casos-de-uso.md](../organizador/02-casos-de-uso.md) · [03-pantallas.md](../organizador/03-pantallas.md) · [04-diagramas-secuencia/](../organizador/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades y enumeraciones que sostienen la publicación y gestión de torneos e inscripciones por parte del Organizador (`UC-E01` a `UC-E07`).

```mermaid
classDiagram
direction TB
class Torneo {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +cierreInscripcion: fecha
  +fechaInicio: fecha
  +fechaFin: fecha
  +precio: dinero [0..1]
  +cupo: entero [0..1]
  +descripcion: texto [0..1]
  +reglamento: texto [0..1]
  +direccionSede: texto
  +contactoWhatsapp: texto [0..1]
  +contactoInstagram: texto [0..1]
  +flyerUrl: texto [0..1]
  +verificadoEn: fechaHora
  +dadoDeBajaEn: fechaHora [0..1]
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +cuposRestantes() entero
  +puedeConfirmarVigencia() booleano
  +antiguedadVerificacion() NivelAntiguedad
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +contacto: texto [0..1]
  +creadaEn: fechaHora
  +esVinculada() booleano
  +esPorNombre() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +escudoUrl: texto [0..1]
  +disueltoEn: fechaHora [0..1]
  +estaDisuelto() booleano
}
class IntegrantePlantel {
  <<entidad>>
  +teamId: uuid
  +userId: uuid
  +esCapitan: booleano
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
  +parametros: json
  +enlace: texto
  +creadoEn: fechaHora
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
class Region {
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
class EstadoTorneo {
  <<enumeracion>>
  Abierto
  Cerrado
  EnCurso
  Finalizado
}
class NivelAntiguedad {
  <<enumeracion>>
  AlDia
  Ambar30Dias
  RojoSinConfirmar60Dias
}
Torneo "0..*" --> "1" Zona : se juega en
Zona "1..*" --> "1" Corredor : pertenece a
Corredor "1..*" --> "1" Region : pertenece a
Torneo "1" *-- "0..*" Inscripcion : registra
Inscripcion "0..*" --> "0..1" Equipo : vincula equipo
Equipo "1" *-- "1..*" IntegrantePlantel : conformado por
Torneo ..> Modalidad
Torneo ..> EstadoTorneo : calcula al leer
Torneo ..> NivelAntiguedad : calcula al leer
Torneo ..> Aviso : notifica baja a planteles vinculados
```

---

## Clases por caso de uso

### UC-E01 · Publicar un torneo

**Requerimientos:** `RF-E01`, `RF-E02`, `RNF-E01` · **Pantalla:** [P-E01 · Publicar torneo](../organizador/03-pantallas.md) (`/crear-torneo`) · **Secuencia:** [`uc-e01-publicar-torneo.md`](../organizador/04-diagramas-secuencia/uc-e01-publicar-torneo.md)

```mermaid
classDiagram
direction TB
class FormularioTorneo {
  <<boundary>>
  +abrirPublicarTorneo()
  +confirmarPublicacion(datos, flyer)
  +mostrarErrores(errores)
}
class OpcionesTorneo {
  <<proveedor de opciones>>
  +listarModalidades() Modalidad[]
}
class TorneoService {
  <<control>>
  +prepararFormularioTorneo() Zona[]
  +publicarTorneo(organizadorId, datos, flyer) uuid
}
class ValidadorTorneo {
  <<validador>>
  +validarDatosTorneo(datos) booleano
  +validarFechas(cierre, inicio, fin) booleano
  +validarPreciosYCupo(precio, cupo) booleano
  +validarCanalContacto(whatsapp, instagram) booleano
  +validarFlyer(flyer) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
  +existeZona(zonaId) booleano
}
class TorneoRepository {
  <<repositorio>>
  +crearTorneo(organizadorId, datos) uuid
  +guardarFlyer(torneoId, flyer)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +verificadoEn: fechaHora
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
FormularioTorneo ..> OpcionesTorneo : obtiene modalidades fijas
FormularioTorneo ..> TorneoService : solicita Zonas y envía datos del torneo
TorneoService ..> ZonaRepository : consulta y verifica Zona
TorneoService ..> ValidadorTorneo : valida datos, fechas, contactos y flyer
TorneoService ..> TorneoRepository : ejecuta alta y sube flyer
TorneoRepository ..> Torneo : instancia con verificadoEn actual
Torneo "0..*" --> "1" Zona : se juega en
OpcionesTorneo ..> Modalidad
```

---

### UC-E02 · Ver mis torneos

**Requerimientos:** `RF-E03`, `RF-E04` · **Pantallas:** [P-E02 · Mis torneos](../organizador/03-pantallas.md) (`/mis-torneos`) y [P-E04 · Gestión del torneo](../organizador/03-pantallas.md) (`/mis-torneos/[id]`) · **Secuencia:** [`uc-e02-ver-mis-torneos.md`](../organizador/04-diagramas-secuencia/uc-e02-ver-mis-torneos.md)

```mermaid
classDiagram
direction TB
class PanelTorneos {
  <<boundary>>
  +abrirMisTorneos()
  +mostrarTarjetas(torneos)
  +mostrarEstadoVacio()
  +abrirGestionTorneo(torneoId)
}
class TorneoService {
  <<control>>
  +listarTorneosPropios(organizadorId) Torneo[]
  +consultarGestionTorneo(torneoId, organizadorId) DetalleGestionTorneo
}
class TorneoRepository {
  <<repositorio>>
  +listarPorOrganizador(organizadorId) Torneo[]
  +obtenerPorIdYOrganizador(torneoId, organizadorId) Torneo
}
class InscripcionRepository {
  <<repositorio>>
  +listarPorTorneo(torneoId) Inscripcion[]
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +cupo: entero [0..1]
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +puedeConfirmarVigencia() booleano
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +contacto: texto [0..1]
}
PanelTorneos ..> TorneoService : solicita listado propio y detalle de gestión
TorneoService ..> TorneoRepository : recupera torneos activos del organizador
TorneoService ..> InscripcionRepository : recupera inscripciones del torneo
TorneoRepository ..> Torneo : hidrata estado y cupos
InscripcionRepository ..> Inscripcion : hidrata vinculadas y por nombre
Torneo "1" *-- "0..*" Inscripcion : registra
```

---

### UC-E03 · Editar un torneo

**Requerimientos:** `RF-E05`, `RF-E06`, `RNF-E01` · **Pantalla:** [P-E03 · Editar torneo](../organizador/03-pantallas.md) (`/mis-torneos/[id]/editar`) · **Secuencia:** [`uc-e03-editar-torneo.md`](../organizador/04-diagramas-secuencia/uc-e03-editar-torneo.md)

```mermaid
classDiagram
direction TB
class FormularioTorneo {
  <<boundary>>
  +abrirEditarTorneo(torneoId)
  +pedirConfirmacionPorInscriptos(cantidadInscriptos) booleano
  +confirmarCambios(torneoId, datos, nuevoFlyer)
  +mostrarErrores(errores)
}
class OpcionesTorneo {
  <<proveedor de opciones>>
  +listarModalidades() Modalidad[]
}
class TorneoService {
  <<control>>
  +cargarTorneoEditable(torneoId, organizadorId) DatosEdicionTorneo
  +editarTorneo(organizadorId, torneoId, datos, nuevoFlyer)
}
class ValidadorTorneo {
  <<validador>>
  +validarDatosTorneo(datos) booleano
  +validarCupoConInscriptos(cupo, inscriptosActuales) booleano
  +validarFlyer(nuevoFlyer) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class TorneoRepository {
  <<repositorio>>
  +obtenerPorIdYOrganizador(torneoId, organizadorId) Torneo
  +contarInscriptos(torneoId) entero
  +actualizarTorneo(torneoId, datos)
  +reemplazarFlyer(torneoId, nuevoFlyer)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +cupo: entero [0..1]
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
}
FormularioTorneo ..> OpcionesTorneo : obtiene modalidades fijas
FormularioTorneo ..> TorneoService : solicita datos actuales y envía cambios
TorneoService ..> ZonaRepository : obtiene Zonas disponibles
TorneoService ..> ValidadorTorneo : valida datos, cupo frente a inscriptos y flyer
TorneoService ..> TorneoRepository : lee y actualiza torneo conservando verificadoEn
TorneoRepository ..> Torneo : persiste cambios
Torneo "0..*" --> "1" Zona : se juega en
```

---

### UC-E04 · Verificar que el torneo sigue vigente

**Requerimientos:** `RF-E06`, `RNF-E01` · **Pantallas:** [P-E02 · Mis torneos](../organizador/03-pantallas.md) y [P-E04 · Gestión del torneo](../organizador/03-pantallas.md) · **Secuencia:** [`uc-e04-verificar-torneo.md`](../organizador/04-diagramas-secuencia/uc-e04-verificar-torneo.md)

```mermaid
classDiagram
direction TB
class PanelTorneos {
  <<boundary>>
  +pulsarSigueVigente(torneoId)
  +mostrarFechaConfirmacion(fecha)
  +deshabilitarBotonSiReciente()
}
class TorneoService {
  <<control>>
  +confirmarVigencia(organizadorId, torneoId) fechaHora
}
class TorneoRepository {
  <<repositorio>>
  +confirmarVigencia(torneoId, organizadorId) fechaHora
}
class Torneo {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
  +puedeConfirmarVigencia() booleano
}
PanelTorneos ..> TorneoService : solicita confirmar vigencia
TorneoService ..> TorneoRepository : ejecuta verify_tournament
TorneoRepository ..> Torneo : comprueba vigencia y actualiza verificadoEn
```

---

### UC-E05 · Dar de baja un torneo

**Requerimientos:** `RF-E07`, `RNF-E01` · **Pantallas:** [P-E02 · Mis torneos](../organizador/03-pantallas.md) y [P-E04 · Gestión del torneo](../organizador/03-pantallas.md) · **Secuencia:** [`uc-e05-dar-de-baja-torneo.md`](../organizador/04-diagramas-secuencia/uc-e05-dar-de-baja-torneo.md)

```mermaid
classDiagram
direction TB
class GestionTorneo {
  <<boundary>>
  +pulsarDarDeBaja(torneoId)
  +pedirConfirmacionBaja(nombre, cantidadInscriptos) booleano
  +redirigirAMisTorneos()
}
class TorneoService {
  <<control>>
  +darDeBajaTorneo(organizadorId, torneoId)
}
class TorneoRepository {
  <<repositorio>>
  +darDeBajaTorneo(torneoId, organizadorId) texto
  +borrarFlyer(flyerUrl)
}
class AvisoRepository {
  <<repositorio>>
  +notificarBajaAInscriptosVinculados(torneoId)
}
class Torneo {
  <<entidad>>
  +id: uuid
  +flyerUrl: texto [0..1]
  +dadoDeBajaEn: fechaHora [0..1]
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
GestionTorneo ..> TorneoService : confirma baja del torneo
TorneoService ..> TorneoRepository : ejecuta withdraw_tournament y retira flyer
TorneoRepository ..> AvisoRepository : solicita avisar a planteles vinculados
TorneoRepository ..> Torneo : registra baja
TorneoRepository ..> Inscripcion : consulta inscripciones vinculadas
AvisoRepository ..> Aviso : emite un único aviso por jugador distinto
```

---

### UC-E06 · Cargar una inscripción

**Requerimientos:** `RF-E08`, `RF-E09`, `RF-E10`, `RNF-E01` · **Pantalla:** [P-E04 · Gestión del torneo](../organizador/03-pantallas.md) (`/mis-torneos/[id]`) · **Secuencia:** [`uc-e06-cargar-inscripcion.md`](../organizador/04-diagramas-secuencia/uc-e06-cargar-inscripcion.md)

```mermaid
classDiagram
direction TB
class GestionTorneo {
  <<boundary>>
  +buscarEquipoRegistrado(termino)
  +seleccionarEquipoVinculado(torneoId, equipoId)
  +ingresarInscripcionPorNombre(torneoId, nombreEquipo, contacto)
  +mostrarInscripcionAgregada(inscripcion)
  +mostrarError(mensaje)
}
class InscripcionService {
  <<control>>
  +buscarEquiposActivos(termino) Equipo[]
  +inscribirEquipoVinculado(organizadorId, torneoId, equipoId) Inscripcion
  +inscribirEquipoPorNombre(organizadorId, torneoId, nombreEquipo, contacto) Inscripcion
}
class ValidadorTorneo {
  <<validador>>
  +validarInscripcionPorNombre(nombreEquipo, contacto) booleano
}
class EquipoRepository {
  <<repositorio>>
  +buscarActivosPorNombre(termino) Equipo[]
}
class InscripcionRepository {
  <<repositorio>>
  +agregarVinculada(torneoId, equipoId) Inscripcion
  +agregarPorNombre(torneoId, nombreEquipo, contacto) Inscripcion
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +disueltoEn: fechaHora [0..1]
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +contacto: texto [0..1]
}
GestionTorneo ..> InscripcionService : busca equipo y envía alta de inscripción
InscripcionService ..> EquipoRepository : consulta equipos activos por nombre
InscripcionService ..> ValidadorTorneo : valida nombre y contacto
InscripcionService ..> InscripcionRepository : ejecuta add_linked_inscription o add_inscription
EquipoRepository ..> Equipo : filtra activos
InscripcionRepository ..> Inscripcion : verifica cupo y registra inscripción
```

---

### UC-E07 · Dar de baja una inscripción

**Requerimientos:** `RF-E11`, `RNF-E01` · **Pantalla:** [P-E04 · Gestión del torneo](../organizador/03-pantallas.md) (`/mis-torneos/[id]`) · **Secuencia:** [`uc-e07-dar-de-baja-inscripcion.md`](../organizador/04-diagramas-secuencia/uc-e07-dar-de-baja-inscripcion.md)

```mermaid
classDiagram
direction TB
class GestionTorneo {
  <<boundary>>
  +pulsarQuitarInscripcion(inscripcionId)
  +confirmarBajaInscripcion(nombreEquipo) booleano
  +actualizarListaYCupos()
}
class InscripcionService {
  <<control>>
  +quitarInscripcion(organizadorId, inscripcionId)
}
class InscripcionRepository {
  <<repositorio>>
  +eliminarInscripcion(inscripcionId, organizadorId)
}
class Inscripcion {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
}
GestionTorneo ..> InscripcionService : solicita quitar inscripción
InscripcionService ..> InscripcionRepository : ejecuta remove_inscription
InscripcionRepository ..> Inscripcion : retira inscripción y libera cupo
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `FormularioTorneo` | `«boundary»` | `src/app/crear-torneo/page.tsx`, `src/app/mis-torneos/[id]/editar/page.tsx`, `src/components/TournamentForm.tsx` | Implementada |
| `PanelTorneos` / `GestionTorneo` | `«boundary»` | `src/app/mis-torneos/page.tsx`, `src/app/mis-torneos/[id]/page.tsx` | Implementadas |
| `OpcionesTorneo` | `«proveedor de opciones»` | `SPORT_MODALITIES` (`src/utils/modality.ts`) | Implementado |
| `TorneoService` / `InscripcionService` | `«control»` | Server Actions en `src/app/crear-torneo/actions.ts`, `src/app/mis-torneos/actions.ts`, `src/app/mis-torneos/[id]/actions.ts` | Implementados |
| `ValidadorTorneo` | `«validador»` | `parseTournamentForm` (`src/utils/tournament-form.ts`), `parseFlyer` (`src/utils/tournament-flyer.ts`), `parseInscription` (`src/utils/inscriptions.ts`) | Implementado |
| `ZonaRepository` | `«repositorio»` | `getZoneGroups()` en `src/components/ZoneSelect.tsx` (`public.zones`, `corridors`, `regions`) | Implementado |
| `TorneoRepository` | `«repositorio»` | Tabla `public.tournaments`, funciones `verify_tournament`, `withdraw_tournament`, `saveTournament` (`src/utils/supabase/tournament.ts`), bucket `flyers` | Implementado |
| `InscripcionRepository` / `EquipoRepository` | `«repositorio»` | Tabla `public.inscriptions`, funciones `add_inscription`, `add_linked_inscription`, `remove_inscription`, búsqueda sobre `public.teams` | Implementados |
| `AvisoRepository` | `«repositorio»` | Emisión de avisos en `withdraw_tournament` (`public.notices`, `20261028000003_tournament_withdraw_notices.sql`) | Implementado |
| `Torneo` / `Inscripcion` / `Equipo` / `Aviso` | `«entidad»` | `public.tournaments`, `public.inscriptions`, `public.teams`, `public.notices` | Implementadas |
