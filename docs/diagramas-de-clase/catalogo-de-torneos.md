# Módulo B — Catálogo de torneos

> Documenta las clases de dominio y de diseño que participan en el **Módulo B — Catálogo de torneos** (`UC-B01` a `UC-B06`).
> Fuentes del módulo: [01-requerimientos.md](../catalogo-de-torneos/01-requerimientos.md) · [02-casos-de-uso.md](../catalogo-de-torneos/02-casos-de-uso.md) · [03-pantallas.md](../catalogo-de-torneos/03-pantallas.md) · [04-diagramas-secuencia/](../catalogo-de-torneos/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades y enumeraciones que comparten los casos de uso `UC-B01` a `UC-B06`.

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
  +observado: booleano [0..1]
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +quedanUltimosCupos() booleano
  +antiguedadVerificacion() NivelAntiguedad
  +precioVisible() texto
}
class InscripcionPublica {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +esVinculada() booleano
}
class PerfilOrganizador {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +fotoUrl: texto [0..1]
  +creadoEn: fechaHora
  +organizaDesde() texto
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +usuarioId: uuid
  +motivo: MotivoReporteTorneo
  +estado: EstadoReporte
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
class MotivoReporteTorneo {
  <<enumeracion>>
  YaNoExiste
  DatosIncorrectos
  NoEsUnTorneo
}
class EstadoReporte {
  <<enumeracion>>
  Pendiente
  Descartado
  Resuelto
}
Torneo "0..*" --> "1" PerfilOrganizador : organizador
Torneo "0..*" --> "1" Zona : se juega en
Torneo "1" *-- "0..*" InscripcionPublica : equipos anotados
Torneo "1" --> "0..*" ReporteTorneo : recibe
PerfilOrganizador "0..*" --> "0..1" Zona : zona opcional
Zona "1..*" --> "1" Corredor : pertenece a
Corredor "1..*" --> "1" Region : pertenece a
Torneo ..> Modalidad
Torneo ..> EstadoTorneo : calcula al leer
Torneo ..> NivelAntiguedad : calcula al leer
ReporteTorneo ..> MotivoReporteTorneo
ReporteTorneo ..> EstadoReporte
```

---

## Clases por caso de uso

### UC-B01 · Ver el catálogo de torneos

**Requerimientos:** `RF-B01` a `RF-B07`, `RF-B25` · **Pantalla:** [P1 · Catálogo](../catalogo-de-torneos/03-pantallas.md#p1--catálogo) (`/`) · **Secuencia:** [S01 · Ver el catálogo](../catalogo-de-torneos/04-diagramas-secuencia/uc-b01-ver-catalogo.md)

```mermaid
classDiagram
direction TB
class PaginaCatalogo {
  <<boundary>>
  +abrirCatalogo()
  +mostrarTarjetas(torneos)
  +mostrarSinTorneos()
  +mostrarErrorCarga()
  +tocarTarjeta(torneoId)
}
class TorneoService {
  <<control>>
  +consultarCatalogoVigente() Torneo[]
  +calcularAntiguedadDeVerificacion(torneo) NivelAntiguedad
}
class TorneoRepository {
  <<repositorio>>
  +listarTorneosVigentes() Torneo[]
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +fechaInicio: fecha
  +precio: dinero [0..1]
  +cupo: entero [0..1]
  +flyerUrl: texto [0..1]
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +quedanUltimosCupos() booleano
  +antiguedadVerificacion() NivelAntiguedad
  +precioVisible() texto
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
PaginaCatalogo ..> TorneoService : solicita catálogo vigente
TorneoService ..> TorneoRepository : consulta torneos activos
TorneoRepository ..> Torneo : excluye Finalizados y ordena por fechaInicio
Torneo "0..*" --> "1" Zona : se juega en
Zona "1..*" --> "1" Corredor : pertenece a
Torneo ..> EstadoTorneo : calcula al leer
Torneo ..> NivelAntiguedad : calcula antigüedad
```

---

### UC-B02 · Filtrar torneos y compartir la búsqueda

**Requerimientos:** `RF-B08` a `RF-B13` · **Pantalla:** [P1 · Catálogo](../catalogo-de-torneos/03-pantallas.md#p1--catálogo) · **Secuencia:** [S02 · Filtrar torneos](../catalogo-de-torneos/04-diagramas-secuencia/uc-b02-filtrar-torneos.md)

```mermaid
classDiagram
direction TB
class FiltrosCatalogo {
  <<boundary>>
  +abrirCatalogo(filtrosURL)
  +elegirFiltro(modalidad, estado, zonaId)
  +escribirEnURL(modalidad, estado, zonaId)
}
class OpcionesTorneo {
  <<proveedor de opciones>>
  +listarModalidades() Modalidad[]
  +listarEstados() EstadoTorneo[]
}
class TorneoService {
  <<control>>
  +filtrarCatalogo(modalidad, estado, zonaId) Torneo[]
}
class ValidadorTorneo {
  <<validador>>
  +validarFiltrosCatalogo(modalidad, estado, zonaId) booleano
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class TorneoRepository {
  <<repositorio>>
  +listarTorneos(modalidad, estado, zonaId) Torneo[]
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +fechaInicio: fecha
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
  Futbol7
  Futbol8
  Futbol11
}
class EstadoTorneo {
  <<enumeracion>>
  Abierto
  Cerrado
  EnCurso
}
FiltrosCatalogo ..> OpcionesTorneo : obtiene modalidades y estados fijos
FiltrosCatalogo ..> TorneoService : solicita filtrado con parámetros URL
TorneoService ..> ValidadorTorneo : valida filtros recibidos
TorneoService ..> ZonaRepository : consulta Zonas disponibles
TorneoService ..> TorneoRepository : filtra torneos con criterios combinados
TorneoRepository ..> Torneo : recupera coincidencias
ZonaRepository ..> Zona : recupera Zonas
OpcionesTorneo ..> Modalidad
OpcionesTorneo ..> EstadoTorneo
```

---

### UC-B03 · Ver la ficha pública de un torneo

**Requerimientos:** `RF-B14` a `RF-B20` · **Pantalla:** [P2 · Ficha del torneo](../catalogo-de-torneos/03-pantallas.md#p2--ficha-del-torneo) (`/torneos/{id}`) · **Secuencia:** [S03 · Ver la ficha](../catalogo-de-torneos/04-diagramas-secuencia/uc-b03-ver-ficha-torneo.md)

```mermaid
classDiagram
direction TB
class FichaTorneo {
  <<boundary>>
  +abrirFichaTorneo(torneoId)
  +mostrarFicha(torneo, organizador, inscriptos)
  +mostrarBarraDueno()
  +mostrarNoEncontrado()
}
class TorneoService {
  <<control>>
  +consultarFichaPublica(torneoId) DetallePublicoTorneo
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
  +flyerUrl: texto [0..1]
  +verificadoEn: fechaHora
  +estado() EstadoTorneo
  +cantidadInscriptos() entero
  +quedanUltimosCupos() booleano
  +antiguedadVerificacion() NivelAntiguedad
}
class PerfilOrganizador {
  <<entidad>>
  +id: uuid
  +nombre: texto
}
class InscripcionPublica {
  <<entidad>>
  +id: uuid
  +equipoId: uuid [0..1]
  +nombreEquipo: texto
  +esVinculada() booleano
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
}
FichaTorneo ..> TorneoService : solicita ficha pública del torneo
TorneoService ..> TorneoRepository : obtiene torneo con Estado y cupos
TorneoService ..> PerfilRepository : obtiene datos públicos del organizador
TorneoService ..> InscripcionRepository : consulta inscriptos públicos
TorneoRepository ..> Torneo : consulta por id
PerfilRepository ..> PerfilOrganizador : consulta pública
InscripcionRepository ..> InscripcionPublica : proyecta nombres y vínculo
Torneo "0..*" --> "1" PerfilOrganizador : organizador
Torneo "1" *-- "0..*" InscripcionPublica : anotados
Torneo "0..*" --> "1" Zona : se juega en
```

---

### UC-B04 · Contactar al organizador

**Requerimientos:** `RF-B21`, `RF-B22` · **Pantalla:** [P2 · Ficha del torneo](../catalogo-de-torneos/03-pantallas.md#p2--ficha-del-torneo) · **Secuencia:** [S04 · Contactar al organizador](../catalogo-de-torneos/04-diagramas-secuencia/uc-b04-contactar-organizador.md)

```mermaid
classDiagram
direction TB
class FichaTorneo {
  <<boundary>>
  +mostrarBotonesContacto(torneo)
  +contactarPorWhatsApp(numero, nombreTorneo)
  +verInstagram(usuario)
  +mostrarSinContacto()
  -armarLinkWaMe(numero, nombreTorneo) texto
}
class Torneo {
  <<entidad>>
  +nombre: texto
  +contactoWhatsapp: texto [0..1]
  +contactoInstagram: texto [0..1]
}
class WhatsApp {
  <<boundary>>
  +abrirChatConMensaje(enlaceWaMe)
}
class Instagram {
  <<boundary>>
  +abrirPerfil(usuario)
}
FichaTorneo ..> Torneo : lee canales de contacto
FichaTorneo ..> WhatsApp : redirige por deep link wa.me
FichaTorneo ..> Instagram : abre perfil público
```

---

### UC-B05 · Ver la página pública del organizador

**Requerimientos:** `RF-B23` · **Pantalla:** [P3 · Página del organizador](../catalogo-de-torneos/03-pantallas.md#p3--página-del-organizador) (`/organizadores/{id}`) · **Secuencia:** [S05 · Ver al organizador](../catalogo-de-torneos/04-diagramas-secuencia/uc-b05-ver-organizador.md)

```mermaid
classDiagram
direction TB
class PaginaOrganizador {
  <<boundary>>
  +abrirPaginaOrganizador(organizadorId)
  +mostrarPagina(perfil, vigentes, finalizados)
  +mostrarSinTorneos()
  +mostrarErrorTorneos()
  +mostrarNoEncontrado()
}
class TorneoService {
  <<control>>
  +consultarPaginaOrganizador(organizadorId) DatosPaginaOrganizador
  +separarVigentesYTrayectoria(torneos)
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
  +fotoUrl: texto [0..1]
  +creadoEn: fechaHora
  +organizaDesde() texto
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +modalidad: Modalidad
  +fechaInicio: fecha
  +fechaFin: fecha
  +estado() EstadoTorneo
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
}
PaginaOrganizador ..> TorneoService : solicita perfil y torneos del organizador
TorneoService ..> PerfilRepository : lee columnas públicas del perfil
TorneoService ..> TorneoRepository : lista torneos del organizador
PerfilRepository ..> PerfilOrganizador : obtiene por id
TorneoRepository ..> Torneo : incluye vigentes y Finalizados
PerfilOrganizador "0..*" --> "0..1" Zona : zona opcional
Torneo "0..*" --> "1" Zona : se juega en
```

---

### UC-B06 · Reportar un torneo

**Requerimientos:** `RF-B24` · **Pantalla:** [P2 · Ficha del torneo](../catalogo-de-torneos/03-pantallas.md#p2--ficha-del-torneo) · **Secuencia:** [S06 · Reportar un torneo](../catalogo-de-torneos/04-diagramas-secuencia/uc-b06-reportar-torneo.md)

```mermaid
classDiagram
direction TB
class FichaTorneo {
  <<boundary>>
  +tocarReportar()
  +enviarReporte(torneoId, motivo)
  +mostrarConfirmacionReporte()
  +mostrarErrorReporte(mensaje)
}
class OpcionesReporte {
  <<proveedor de opciones>>
  +listarMotivos() MotivoReporteTorneo[]
}
class ReporteService {
  <<control>>
  +reportarTorneo(torneoId, motivo)
}
class ValidadorTorneo {
  <<validador>>
  +validarMotivoReporte(motivo) booleano
}
class ReporteRepository {
  <<repositorio>>
  +crearReporte(torneoId, motivo, usuarioId) ReporteTorneo
  -verificarUnicoPorUsuarioYTorneo(torneoId, usuarioId) booleano
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +usuarioId: uuid
  +motivo: MotivoReporteTorneo
  +estado: EstadoReporte
  +creadoEn: fechaHora
}
class MotivoReporteTorneo {
  <<enumeracion>>
  YaNoExiste
  DatosIncorrectos
  NoEsUnTorneo
}
FichaTorneo ..> OpcionesReporte : carga motivos antes de elegir
FichaTorneo ..> ReporteService : envía motivo elegido
ReporteService ..> ValidadorTorneo : valida motivo
ReporteService ..> ReporteRepository : solicita alta de reporte
ReporteRepository ..> ReporteTorneo : crea único por usuario y torneo
OpcionesReporte ..> MotivoReporteTorneo
ReporteTorneo ..> MotivoReporteTorneo
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `PaginaCatalogo` | `«boundary»` | `src/app/page.tsx`, `src/components/TournamentList.tsx`, `TournamentCard.tsx`, `VerificationBadge.tsx`, `TournamentFlyer.tsx` | Parcial (sin paginar) |
| `FiltrosCatalogo` | `«boundary»` | `src/components/Filters.tsx` | Parcial (modalidad y estado) |
| `FichaTorneo` | `«boundary»` | `src/app/torneos/[id]/page.tsx` | Parcial |
| `PaginaOrganizador` | `«boundary»` | `src/app/organizadores/[id]/page.tsx` | Implementada |
| `WhatsApp` / `Instagram` | `«boundary»` | `whatsappLink` (`src/utils/whatsapp.ts`) y `https://instagram.com/` | Implementados |
| `OpcionesTorneo` | `«proveedor de opciones»` | `SPORT_MODALITIES` (`src/utils/modality.ts`) y lista de estados en `src/components/Filters.tsx` | Implementado |
| `OpcionesReporte` | `«proveedor de opciones»` | — (diseño objetivo de UC-B06) | **Pendiente** |
| `TorneoService` | `«control»` | Coordinación de consultas en `src/app/page.tsx`, `src/app/torneos/[id]/page.tsx`, `src/app/organizadores/[id]/page.tsx` | Implementado |
| `ReporteService` | `«control»` | — (diseño objetivo de UC-B06) | **Pendiente** |
| `ValidadorTorneo` | `«validador»` | Validación de filtros, modalidades y motivos de reporte | Parcial |
| `TorneoRepository` | `«repositorio»` | Consultas sobre `public.tournaments` con RLS y funciones `status` e `inscriptions_count` (`20260930000002_tournaments_computed_status.sql`) | Implementado |
| `InscripcionRepository` | `«repositorio»` | Vista pública `public.tournament_inscriptions` (`20261007000000_inscriptions.sql`, `20261014000004_linked_inscriptions.sql`) | Implementado |
| `PerfilRepository` | `«repositorio»` | Lectura pública de `public.profiles` (`20260928000002_profiles.sql`) | Implementado |
| `ReporteRepository` | `«repositorio»` | — (previsto para UC-B06 y UC-F03) | **Pendiente** |
| `Torneo` / `InscripcionPublica` / `PerfilOrganizador` / `ReporteTorneo` | `«entidad»` | `public.tournaments`, `public.tournament_inscriptions`, `public.profiles` | Implementadas (salvo `ReporteTorneo`) |
| `Zona` / `Corredor` / `Region` | `«entidad»` | `public.zones`, `public.corridors`, `public.regions` | Implementadas |
