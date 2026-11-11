# Módulo B — Catálogo de torneos

> Documenta las clases de dominio y de diseño que participan en el **Módulo B — Catálogo de torneos** (`UC-B01` a `UC-B06`).
> Fuentes del módulo: [01-requerimientos.md](../catalogo-de-torneos/01-requerimientos.md) · [02-casos-de-uso.md](../catalogo-de-torneos/02-casos-de-uso.md) · [03-pantallas.md](../catalogo-de-torneos/03-pantallas.md) · [04-diagramas-secuencia/](../catalogo-de-torneos/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de composición/asociación y enumeraciones que comparten los casos de uso `UC-B01` a `UC-B06`.

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
  +quedanUltimosCupos() booleano
  +antiguedadVerificacion() NivelAntiguedad
  +precioVisible() texto
  +tieneContacto() booleano
  +mensajeSugeridoWhatsApp() texto
  +esOrganizador(usuarioId) booleano
}
class InscripcionPublica {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +creadaEn: fechaHora
  +esVinculada() booleano
  +esPorNombre() booleano
}
class PerfilOrganizador {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto [0..1]
  +fotoUrl: texto [0..1]
  +creadoEn: fechaHora
  +organizaDesde() texto
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
  +corredorId: texto
  +orden: entero
}
class Corredor {
  <<entidad>>
  +id: texto
  +nombre: texto
  +regionId: texto
  +orden: entero
}
class Region {
  <<entidad>>
  +id: texto
  +nombre: texto
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteTorneo
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
  +estaPendiente() booleano
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
class MotivoReporteTorneo {
  <<enumeracion>>
  DatosFalsos
  NoExiste
  Estafa
  Inapropiado
}
PerfilOrganizador "1" --> "0..*" Torneo
Torneo "1" *-- "0..*" InscripcionPublica
Torneo "0..*" --> "1" Zona
Zona "1..*" --> "1" Corredor
Corredor "1..*" --> "1" Region
Torneo "1" *-- "0..*" ReporteTorneo
Torneo ..> Modalidad
Torneo ..> EstadoTorneo
Torneo ..> NivelAntiguedad
ReporteTorneo ..> MotivoReporteTorneo
```

---

## Clases por caso de uso

### UC-B01 · Ver catálogo de torneos

> Especificación: [UC-B01](../catalogo-de-torneos/02-casos-de-uso.md#uc-b01--ver-catálogo-de-torneos) · Pantalla: [P1 · Catálogo de torneos](../catalogo-de-torneos/03-pantallas.md#p1--catálogo-de-torneos) · Secuencia: [S01 · Ver catálogo](../catalogo-de-torneos/04-diagramas-secuencia/uc-b01-ver-catalogo.md)

```mermaid
classDiagram
class PaginaCatalogo {
  <<boundary>>
  +abrirCatalogo()
  +mostrarEsqueletosCarga()
  +calcularAntiguedadVerificacion(torneo) NivelAntiguedad
  +mostrarTarjetas(torneos)
  +mostrarSinTorneos()
  +mostrarErrorCarga()
  +tocarTarjeta(torneoId)
}
class TorneoService {
  <<control>>
  +listarTorneos() Torneo[]
  +calcularAntiguedadVerificacion(torneo) NivelAntiguedad
}
class TorneoRepository {
  <<repositorio>>
  +listarTorneos() Torneo[]
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +fechaInicio: fecha
  +precio: decimal [0..1]
  +flyerUrl: texto [0..1]
  +verificadoEn: fechaHora
  +observado: booleano
  +estado() EstadoTorneo
  +antiguedadVerificacion() NivelAntiguedad
  +precioVisible() texto
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
PaginaCatalogo ..> TorneoService
TorneoService ..> TorneoRepository
TorneoRepository ..> Torneo
Torneo ..> Modalidad
Torneo ..> EstadoTorneo
Torneo ..> NivelAntiguedad
```

---

### UC-B02 · Filtrar torneos

> Especificación: [UC-B02](../catalogo-de-torneos/02-casos-de-uso.md#uc-b02--filtrar-torneos) · Pantalla: [P1 · Catálogo de torneos](../catalogo-de-torneos/03-pantallas.md#p1--catálogo-de-torneos) · Secuencia: [S02 · Filtrar torneos](../catalogo-de-torneos/04-diagramas-secuencia/uc-b02-filtrar-torneos.md)

```mermaid
classDiagram
class FiltrosCatalogo {
  <<boundary>>
  +abrirCatalogo(filtrosURL)
  +elegirFiltros(modalidad, estado)
  +escribirEnURL(modalidad, estado)
  +compartirURL()
}
class OpcionesTorneo {
  <<control>>
  +listarModalidades() Modalidad[]
  +listarEstados() EstadoTorneo[]
}
class PaginaCatalogo {
  <<boundary>>
  +abrirCatalogo(modalidad, estado)
  +mostrarTarjetas(torneos)
  +mostrarSinResultados()
  +mostrarErrorCarga()
}
class TorneoService {
  <<control>>
  +obtenerOpcionesFiltros()
  +filtrarTorneos(modalidad, estado) Torneo[]
}
class ValidadorTorneo {
  <<validador>>
  +validarFiltros(modalidad, estado) booleano
}
class TorneoRepository {
  <<repositorio>>
  +listarTorneos(modalidad, estado) Torneo[]
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +estado() EstadoTorneo
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
FiltrosCatalogo ..> TorneoService
FiltrosCatalogo ..> PaginaCatalogo
PaginaCatalogo ..> TorneoService
TorneoService ..> OpcionesTorneo
TorneoService ..> ValidadorTorneo
TorneoService ..> TorneoRepository
TorneoRepository ..> Torneo
Torneo ..> Modalidad
Torneo ..> EstadoTorneo
```

---

### UC-B03 · Ver ficha del torneo

> Especificación: [UC-B03](../catalogo-de-torneos/02-casos-de-uso.md#uc-b03--ver-ficha-del-torneo) · Pantalla: [P2 · Ficha del torneo](../catalogo-de-torneos/03-pantallas.md#p2--ficha-del-torneo) · Secuencia: [S03 · Ver ficha del torneo](../catalogo-de-torneos/04-diagramas-secuencia/uc-b03-ver-ficha-torneo.md)

```mermaid
classDiagram
class FichaTorneo {
  <<boundary>>
  +abrirFichaTorneo(torneoId)
  +calcularAntiguedadYUltimosCupos(torneo)
  +agregarBarraDueno()
  +mostrarFicha(torneo, organizador, inscriptos)
  +mostrarNoEncontrado()
}
class TorneoService {
  <<control>>
  +consultarFichaTorneo(torneoId, usuarioId)
}
class TorneoRepository {
  <<repositorio>>
  +obtenerTorneo(torneoId) Torneo
}
class PerfilRepository {
  <<repositorio>>
  +obtenerOrganizador(organizadorId) PerfilOrganizador
}
class InscripcionRepository {
  <<repositorio>>
  +listarInscriptos(torneoId) InscripcionPublica[]
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
  +precio: decimal [0..1]
  +cupoMaximo: entero [0..1]
  +descripcion: texto [0..1]
  +reglamento: texto [0..1]
  +flyerUrl: texto [0..1]
  +verificadoEn: fechaHora
  +observado: booleano
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +cuposRestantes() entero
  +quedanUltimosCupos() booleano
  +antiguedadVerificacion() NivelAntiguedad
  +esOrganizador(usuarioId) booleano
}
class PerfilOrganizador {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +fotoUrl: texto [0..1]
  +creadoEn: fechaHora
  +organizaDesde() texto
}
class InscripcionPublica {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +esVinculada() booleano
}
FichaTorneo ..> TorneoService
TorneoService ..> TorneoRepository
TorneoService ..> PerfilRepository
TorneoService ..> InscripcionRepository
TorneoRepository ..> Torneo
PerfilRepository ..> PerfilOrganizador
InscripcionRepository ..> InscripcionPublica
PerfilOrganizador "1" --> "0..*" Torneo
Torneo "1" *-- "0..*" InscripcionPublica
```

---

### UC-B04 · Contactar al organizador

> Especificación: [UC-B04](../catalogo-de-torneos/02-casos-de-uso.md#uc-b04--contactar-al-organizador) · Pantalla: [P2 · Ficha del torneo](../catalogo-de-torneos/03-pantallas.md#p2--ficha-del-torneo) · Secuencia: [S04 · Contactar al organizador](../catalogo-de-torneos/04-diagramas-secuencia/uc-b04-contactar-organizador.md)

```mermaid
classDiagram
class FichaTorneo {
  <<boundary>>
  +mostrarBotonesContacto(torneo)
  +pulsarContactarWhatsApp()
  +armarLinkWaMe(numero, nombreTorneo) texto
  +pulsarVerInstagram()
  +mostrarSinContacto()
}
class WhatsApp {
  <<boundary>>
  +abrirChatConOrganizador(enlaceWaMe)
  +mostrarMensajeSugerido(texto)
}
class Instagram {
  <<boundary>>
  +abrirPerfilOrganizador(usuario)
}
class TorneoService {
  <<control>>
  +obtenerDatosContacto(torneoId) Torneo
}
class TorneoRepository {
  <<repositorio>>
  +obtenerTorneo(torneoId) Torneo
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +whatsapp: texto [0..1]
  +instagram: texto [0..1]
  +tieneContacto() booleano
  +mensajeSugeridoWhatsApp() texto
}
FichaTorneo ..> TorneoService
FichaTorneo ..> WhatsApp
FichaTorneo ..> Instagram
TorneoService ..> TorneoRepository
TorneoRepository ..> Torneo
```

---

### UC-B05 · Ver página del organizador

> Especificación: [UC-B05](../catalogo-de-torneos/02-casos-de-uso.md#uc-b05--ver-página-del-organizador) · Pantalla: [P3 · Página del organizador](../catalogo-de-torneos/03-pantallas.md#p3--página-del-organizador) · Secuencia: [S05 · Ver página del organizador](../catalogo-de-torneos/04-diagramas-secuencia/uc-b05-ver-organizador.md)

```mermaid
classDiagram
class PaginaOrganizador {
  <<boundary>>
  +abrirPaginaOrganizador(organizadorId)
  +separarVigentesYFinalizados(torneos)
  +mostrarPagina(perfil, vigentes, finalizados)
  +mostrarSinTorneos()
  +mostrarErrorTorneos()
  +mostrarNoEncontrado()
}
class TorneoService {
  <<control>>
  +consultarPaginaOrganizador(organizadorId)
  +separarVigentesYFinalizados(torneos)
}
class PerfilRepository {
  <<repositorio>>
  +obtenerPerfilPublico(organizadorId) PerfilOrganizador
}
class TorneoRepository {
  <<repositorio>>
  +listarTorneosDe(organizadorId) Torneo[]
}
class PerfilOrganizador {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto [0..1]
  +fotoUrl: texto [0..1]
  +creadoEn: fechaHora
  +organizaDesde() texto
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +modalidad: Modalidad
  +zonaId: texto
  +fechaInicio: fecha
  +estado() EstadoTorneo
  +antiguedadVerificacion() NivelAntiguedad
}
class EstadoTorneo {
  <<enumeracion>>
  Abierto
  Cerrado
  EnCurso
  Finalizado
}
PaginaOrganizador ..> TorneoService
TorneoService ..> PerfilRepository
TorneoService ..> TorneoRepository
PerfilRepository ..> PerfilOrganizador
TorneoRepository ..> Torneo
PerfilOrganizador "1" --> "0..*" Torneo
Torneo ..> EstadoTorneo
```

---

### UC-B06 · Reportar un torneo

> Especificación: [UC-B06](../catalogo-de-torneos/02-casos-de-uso.md#uc-b06--reportar-un-torneo) · Pantalla: [P2 · Ficha del torneo](../catalogo-de-torneos/03-pantallas.md#p2--ficha-del-torneo) · Secuencia: [S06 · Reportar un torneo](../catalogo-de-torneos/04-diagramas-secuencia/uc-b06-reportar-torneo.md)

```mermaid
classDiagram
class FichaTorneo {
  <<boundary>>
  +tocarReportar()
  +mostrarMotivos(motivos)
  +elegirMotivoYEnviar(torneoId, motivo)
  +mostrarConfirmacionReporte()
  +mostrarError(mensaje)
}
class OpcionesReporte {
  <<control>>
  +listarMotivos() MotivoReporteTorneo[]
}
class ReporteService {
  <<control>>
  +obtenerMotivosReporte() MotivoReporteTorneo[]
  +reportarTorneo(torneoId, motivo, usuarioId)
}
class ValidadorTorneo {
  <<validador>>
  +validarMotivo(motivo) booleano
}
class ReporteRepository {
  <<repositorio>>
  +crearReporte(torneoId, motivo, usuarioId) ReporteTorneo
  +verificarSesionYReporteUnico(torneoId, usuarioId) booleano
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteTorneo
  +creadoEn: fechaHora
  +estaPendiente() booleano
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
}
class MotivoReporteTorneo {
  <<enumeracion>>
  DatosFalsos
  NoExiste
  Estafa
  Inapropiado
}
FichaTorneo ..> ReporteService
ReporteService ..> OpcionesReporte
ReporteService ..> ValidadorTorneo
ReporteService ..> ReporteRepository
ReporteRepository ..> ReporteTorneo
Torneo "1" *-- "0..*" ReporteTorneo
ReporteTorneo ..> MotivoReporteTorneo
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `PaginaCatalogo` | `«boundary»` | `src/app/page.tsx` + `src/components/TournamentList.tsx` + `src/components/TournamentCard.tsx` | Parcial (faltan Zona, precio «Gratis»/«Consultar», antigüedad y Observado en tarjeta) |
| `FiltrosCatalogo` | `«boundary»` | `src/components/Filters.tsx` | Parcial (faltan filtros de Zona, Estado y Precio; hoy tiene `city`/`maxPrice`) |
| `FichaTorneo` | `«boundary»` | `src/app/torneos/[id]/page.tsx` + `src/app/torneos/[id]/loading.tsx` | Implementada (falta botón «Reportar») |
| `PaginaOrganizador` | `«boundary»` | `src/app/organizadores/[id]/page.tsx` | Implementada |
| `WhatsApp` / `Instagram` | `«boundary»` | `whatsappLink` (`src/utils/whatsapp.ts`), `instagramUrl` (`src/utils/instagram.ts`) | Implementados |
| `TorneoService` / `ReporteService` / `OpcionesTorneo` / `OpcionesReporte` | `«control»` | Consultas RSC en `TournamentList`, `torneos/[id]/page.tsx`, `organizadores/[id]/page.tsx`, `SPORT_MODALITIES` (`src/utils/modality.ts`), `STATUS_FILTERS` (`src/utils/tournament-status.ts`) | Implementado (`ReporteService` y `OpcionesReporte` pendientes) |
| `ValidadorTorneo` | `«validador»` | Validación de parámetros de búsqueda y motivos de reporte | Parcial |
| `TorneoRepository` | `«repositorio»` | Vista `public.tournaments_with_status` (`20261028000010_tournaments_with_status.sql`) | Implementado |
| `PerfilRepository` | `«repositorio»` | Tabla `public.profiles` (lectura pública) | Implementado |
| `InscripcionRepository` | `«repositorio»` | Vista `public.public_inscriptions` (`20261001000000_inscriptions.sql`, `20261028000002_teams.sql`) | Implementado |
| `ReporteRepository` | `«repositorio»` | Tabla de reportes de torneo con unicidad `(tournament_id, reporter_id)` | **Pendiente** |
| `Torneo` / `InscripcionPublica` / `PerfilOrganizador` | `«entidad»` | `tournaments_with_status`, `public_inscriptions`, `profiles` + `tournament-status.ts` y `tournament-verification.ts` | Implementadas |
