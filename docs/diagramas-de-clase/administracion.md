# Módulo F — Administración

> Documenta las clases de dominio y de diseño que participan en el **Módulo F — Administración** (`UC-F01` a `UC-F06`).
> Fuentes del módulo: [01-requerimientos.md](../administracion/01-requerimientos.md) · [02-casos-de-uso.md](../administracion/02-casos-de-uso.md) · [03-pantallas.md](../administracion/03-pantallas.md) · [04-diagramas-secuencia/](../administracion/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de herencia/composición y enumeraciones que comparten los casos de uso `UC-F01` a `UC-F06`.

```mermaid
classDiagram
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +creadoEn: fechaHora
  +estaSuspendido() booleano
}
class Administrador {
  <<entidad>>
  +asignadoEn: fechaHora
  +esAdminActivo() booleano
}
class Perfil {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto [0..1]
  +fotoUrl: texto [0..1]
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteTorneo
  +resolucion: ResolucionReporteTorneo [0..1]
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
  +estaPendiente() booleano
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteEquipo
  +resolucion: ResolucionReporteEquipo [0..1]
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
  +estaPendiente() booleano
}
class Suspension {
  <<entidad>>
  +id: uuid
  +usuarioAfectadoId: uuid
  +administradorId: uuid
  +duracion: DuracionSuspension
  +motivo: texto
  +creadaEn: fechaHora
  +venceEn: fechaHora [0..1]
  +estaVigente() booleano
}
class EntradaRegistroDeAcciones {
  <<entidad>>
  +id: uuid
  +administradorId: uuid
  +accion: texto
  +objetivoId: uuid
  +creadaEn: fechaHora
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +observado: booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
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
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class ResolucionReporteTorneo {
  <<enumeracion>>
  Descartar
  MarcarObservado
  DarDeBaja
  SuspenderOrganizador
}
class ResolucionReporteEquipo {
  <<enumeracion>>
  Descartar
  SuspenderCapitan
}
class DuracionSuspension {
  <<enumeracion>>
  Dias7
  Dias30
  Permanente
}
Usuario <|-- Administrador
Usuario "1" *-- "1" Perfil
Torneo "1" *-- "0..*" ReporteTorneo
Equipo "1" *-- "0..*" ReporteEquipo
Equipo "1" --> "0..*" Calificacion
Usuario "1" *-- "0..*" Suspension
Administrador "1" --> "0..*" EntradaRegistroDeAcciones
Usuario "1" --> "0..*" Aviso
ReporteTorneo ..> ResolucionReporteTorneo
ReporteEquipo ..> ResolucionReporteEquipo
Suspension ..> DuracionSuspension
```

---

## Clases por caso de uso

### UC-F01 · Acceder a la administración

> Especificación: [UC-F01](../administracion/02-casos-de-uso.md#uc-f01--acceder-a-la-administración) · Pantalla: [P1 · Acceso Administrador](../administracion/03-pantallas.md#p1--acceso-administrador) · Secuencia: [S01 · Acceder a la administración](../administracion/04-diagramas-secuencia/uc-f01-acceder-administracion.md)

```mermaid
classDiagram
class ControlDeAcceso {
  <<boundary>>
  +abrirRutaDeAdministracion(ruta)
  +abrirDestino()
}
class FormularioAdmin {
  <<boundary>>
  +abrirAccesoAdministrador(destino, error)
  +completarCredenciales(email, contrasena)
  +confirmarIngreso()
  +mostrarError(mensaje)
  +abrirDestino(destino)
}
class AdminService {
  <<control>>
  +consultarSesionYRol()
  +validarDestino(destino) texto
  +ingresarComoAdministrador(email, contrasena, destino) texto
}
class ValidadorAdmin {
  <<validador>>
  +validarDestino(destino) texto
  +validarCredenciales(email, contrasena) booleano
}
class CuentaRepository {
  <<repositorio>>
  +consultarSesion() Sesion
  +validarCredenciales(email, contrasena) Sesion
}
class RolRepository {
  <<repositorio>>
  +esAdministrador() booleano
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
}
class Administrador {
  <<entidad>>
  +asignadoEn: fechaHora
  +esAdminActivo() booleano
}
class Sesion {
  <<entidad>>
  +token: texto
  +esVigente() booleano
}
ControlDeAcceso ..> AdminService
ControlDeAcceso ..> FormularioAdmin
FormularioAdmin ..> AdminService
AdminService ..> ValidadorAdmin
AdminService ..> CuentaRepository
AdminService ..> RolRepository
CuentaRepository ..> Usuario
CuentaRepository ..> Sesion
RolRepository ..> Administrador
Usuario <|-- Administrador
```

---

### UC-F02 · Consultar el tablero

> Especificación: [UC-F02](../administracion/02-casos-de-uso.md#uc-f02--consultar-el-tablero) · Pantallas: [P2 · Resumen](../administracion/03-pantallas.md#p2--resumen-tablero) y [P3 · Seguridad y acceso](../administracion/03-pantallas.md#p3--seguridad-y-acceso) · Secuencia: [S02 · Consultar tablero](../administracion/04-diagramas-secuencia/uc-f02-consultar-tablero.md)

```mermaid
classDiagram
class PanelAdmin {
  <<boundary>>
  +abrirResumen()
  +mostrarResumen(torneos, equipos, usuarios)
  +mostrarContadorNoDisponible()
  +mostrarSidebar()
  +abrirSeguridadYAcceso()
  +mostrarSeguridadYAcceso()
  +redirigirAAccesoAdmin()
}
class AdminService {
  <<control>>
  +consultarResumen()
  +consultarSeguridadYAcceso()
}
class RolRepository {
  <<repositorio>>
  +esAdministrador() booleano
}
class EstadisticasRepository {
  <<repositorio>>
  +contarTorneos() entero
  +contarEquipos() entero
  +contarUsuarios() entero
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
}
class Administrador {
  <<entidad>>
  +asignadoEn: fechaHora
  +esAdminActivo() booleano
}
class Torneo {
  <<entidad>>
  +id: uuid
}
class Equipo {
  <<entidad>>
  +id: uuid
}
PanelAdmin ..> AdminService
AdminService ..> RolRepository
AdminService ..> EstadisticasRepository
RolRepository ..> Administrador
EstadisticasRepository ..> Torneo
EstadisticasRepository ..> Equipo
EstadisticasRepository ..> Usuario
Usuario <|-- Administrador
```

---

### UC-F03 · Resolver reporte de torneo

> Especificación: [UC-F03](../administracion/02-casos-de-uso.md#uc-f03--resolver-reporte-de-torneo) · Pantalla: [P4 · Reportes](../administracion/03-pantallas.md#p4--reportes-pendiente) · Secuencia: [S03 · Resolver reporte de torneo](../administracion/04-diagramas-secuencia/uc-f03-resolver-reporte-torneo.md)

```mermaid
classDiagram
class PanelReportes {
  <<boundary>>
  +abrirReportesPendientes()
  +mostrarLista(reportes)
  +abrirReporte(reporteId)
  +mostrarReporteYResoluciones(reporte, resoluciones)
  +elegirResolucionYConfirmar(reporteId, resolucion)
  +mostrarReporteResuelto()
  +mostrarError(mensaje)
}
class OpcionesResolucion {
  <<control>>
  +listarResolucionesDeTorneo() ResolucionReporteTorneo[]
}
class AdminService {
  <<control>>
  +listarReportesDeTorneoPendientes() ReporteTorneo[]
  +obtenerDetalleReporteDeTorneo(reporteId)
  +resolverReporteDeTorneo(reporteId, resolucion)
}
class ValidadorAdmin {
  <<validador>>
  +validarResolucionTorneo(resolucion) booleano
}
class RolRepository {
  <<repositorio>>
  +esAdministrador() booleano
}
class ReporteRepository {
  <<repositorio>>
  +listarPendientes() ReporteTorneo[]
  +obtenerReporte(reporteId) ReporteTorneo
  +marcarDescartado(reporteId)
}
class TorneoRepository {
  <<repositorio>>
  +marcarObservado(torneoId)
  +darDeBaja(torneoId)
}
class RegistroDeAcciones {
  <<repositorio>>
  +registrar(administradorId, resolucion, reporteId)
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteTorneo
  +resolucion: ResolucionReporteTorneo [0..1]
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
  +estaPendiente() booleano
}
class Torneo {
  <<entidad>>
  +id: uuid
  +organizadorId: uuid
  +nombre: texto
  +observado: booleano
}
class EntradaRegistroDeAcciones {
  <<entidad>>
  +id: uuid
  +administradorId: uuid
  +accion: texto
  +objetivoId: uuid
  +creadaEn: fechaHora
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class ResolucionReporteTorneo {
  <<enumeracion>>
  Descartar
  MarcarObservado
  DarDeBaja
  SuspenderOrganizador
}
PanelReportes ..> AdminService
AdminService ..> OpcionesResolucion
AdminService ..> ValidadorAdmin
AdminService ..> RolRepository
AdminService ..> ReporteRepository
AdminService ..> TorneoRepository
AdminService ..> RegistroDeAcciones
ReporteRepository ..> ReporteTorneo
TorneoRepository ..> Torneo
TorneoRepository ..> Aviso
RegistroDeAcciones ..> EntradaRegistroDeAcciones
Torneo "1" *-- "0..*" ReporteTorneo
ReporteTorneo ..> ResolucionReporteTorneo
```

---

### UC-F04 · Resolver reporte de equipo

> Especificación: [UC-F04](../administracion/02-casos-de-uso.md#uc-f04--resolver-reporte-de-equipo) · Pantalla: [P4 · Reportes](../administracion/03-pantallas.md#p4--reportes-pendiente) · Secuencia: [S04 · Resolver reporte de equipo](../administracion/04-diagramas-secuencia/uc-f04-resolver-reporte-equipo.md)

```mermaid
classDiagram
class PanelReportes {
  <<boundary>>
  +abrirReporteDeEquipoPendiente(reporteId)
  +mostrarReporteFichaYComentarios(reporte, ficha, comentarios, resoluciones)
  +elegirResolucionYConfirmar(reporteId, resolucion)
  +mostrarReporteResuelto()
  +mostrarError(mensaje)
}
class OpcionesResolucion {
  <<control>>
  +listarResolucionesDeEquipo() ResolucionReporteEquipo[]
}
class AdminService {
  <<control>>
  +obtenerDetalleReporteDeEquipo(reporteId)
  +resolverReporteDeEquipo(reporteId, resolucion)
}
class ValidadorAdmin {
  <<validador>>
  +validarResolucionEquipo(resolucion) booleano
}
class RolRepository {
  <<repositorio>>
  +esAdministrador() booleano
}
class ReporteRepository {
  <<repositorio>>
  +obtenerReporte(reporteId) ReporteEquipo
  +marcarDescartado(reporteId)
}
class EquipoRepository {
  <<repositorio>>
  +obtenerFichaPublica(equipoId) Equipo
  +obtenerCapitan(equipoId) Usuario
}
class CalificacionRepository {
  <<repositorio>>
  +listarComentariosPrivados(equipoId) Calificacion[]
}
class RegistroDeAcciones {
  <<repositorio>>
  +registrar(administradorId, resolucion, reporteId)
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +autorId: uuid
  +motivo: MotivoReporteEquipo
  +resolucion: ResolucionReporteEquipo [0..1]
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
  +estaPendiente() booleano
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
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
}
class EntradaRegistroDeAcciones {
  <<entidad>>
  +id: uuid
  +administradorId: uuid
  +accion: texto
  +objetivoId: uuid
  +creadaEn: fechaHora
}
class ResolucionReporteEquipo {
  <<enumeracion>>
  Descartar
  SuspenderCapitan
}
PanelReportes ..> AdminService
AdminService ..> OpcionesResolucion
AdminService ..> ValidadorAdmin
AdminService ..> RolRepository
AdminService ..> ReporteRepository
AdminService ..> EquipoRepository
AdminService ..> CalificacionRepository
AdminService ..> RegistroDeAcciones
ReporteRepository ..> ReporteEquipo
EquipoRepository ..> Equipo
CalificacionRepository ..> Calificacion
RegistroDeAcciones ..> EntradaRegistroDeAcciones
Equipo "1" *-- "0..*" ReporteEquipo
Equipo "1" --> "0..*" Calificacion
ReporteEquipo ..> ResolucionReporteEquipo
```

---

### UC-F05 · Suspender una cuenta

> Especificación: [UC-F05](../administracion/02-casos-de-uso.md#uc-f05--suspender-una-cuenta) · Pantalla: [Suspender cuenta](../administracion/03-pantallas.md#suspender-cuenta-pendiente) · Secuencia: [S05 · Suspender cuenta](../administracion/04-diagramas-secuencia/uc-f05-suspender-cuenta.md)

```mermaid
classDiagram
class FormularioSuspension {
  <<boundary>>
  +abrirSuspender(cuentaId)
  +mostrarFormulario(duraciones)
  +elegirDuracionYMotivo(duracion, motivo)
  +confirmarSuspension(cuentaId, duracion, motivo)
  +mostrarCuentaSuspendida()
  +mostrarErrores(errores)
}
class OpcionesSuspension {
  <<control>>
  +listarDuraciones() DuracionSuspension[]
}
class AdminService {
  <<control>>
  +obtenerDuraciones() DuracionSuspension[]
  +suspenderCuenta(cuentaId, duracion, motivo)
}
class ValidadorAdmin {
  <<validador>>
  +validarSuspension(duracion, motivo) booleano
}
class RolRepository {
  <<repositorio>>
  +esAdministrador() booleano
}
class SuspensionRepository {
  <<repositorio>>
  +suspender(cuentaId, duracion, motivo)
  +registrarSuspensionYVencimiento(cuentaId, duracion, motivo)
  +cancelarBusquedasYAnularPropuestas(cuentaId)
  +tirarPartidosFuturosSinFalta(cuentaId)
  +avisarSuspensionACuenta(cuentaId, motivo)
}
class RegistroDeAcciones {
  <<repositorio>>
  +registrar(administradorId, suspension, cuentaId)
}
class Suspension {
  <<entidad>>
  +id: uuid
  +usuarioAfectadoId: uuid
  +administradorId: uuid
  +duracion: DuracionSuspension
  +motivo: texto
  +creadaEn: fechaHora
  +venceEn: fechaHora [0..1]
  +estaVigente() booleano
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +estaSuspendido() booleano
}
class EntradaRegistroDeAcciones {
  <<entidad>>
  +id: uuid
  +administradorId: uuid
  +accion: texto
  +objetivoId: uuid
  +creadaEn: fechaHora
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
}
class DuracionSuspension {
  <<enumeracion>>
  Dias7
  Dias30
  Permanente
}
FormularioSuspension ..> AdminService
AdminService ..> OpcionesSuspension
AdminService ..> ValidadorAdmin
AdminService ..> RolRepository
AdminService ..> SuspensionRepository
AdminService ..> RegistroDeAcciones
SuspensionRepository ..> Suspension
SuspensionRepository ..> Usuario
SuspensionRepository ..> Aviso
RegistroDeAcciones ..> EntradaRegistroDeAcciones
Usuario "1" *-- "0..*" Suspension
Suspension ..> DuracionSuspension
```

---

### UC-F06 · Buscar usuarios

> Especificación: [UC-F06](../administracion/02-casos-de-uso.md#uc-f06--buscar-usuarios) · Pantalla: [P5 · Usuarios](../administracion/03-pantallas.md#p5--usuarios-pendiente) · Secuencia: [S06 · Buscar usuarios](../administracion/04-diagramas-secuencia/uc-f06-buscar-usuarios.md)

```mermaid
classDiagram
class PanelUsuarios {
  <<boundary>>
  +abrirUsuarios()
  +mostrarBuscador()
  +buscar(texto)
  +mostrarResultados(cuentas)
  +abrirCuenta(cuentaId)
  +mostrarCuenta(cuenta)
}
class AdminService {
  <<control>>
  +buscarUsuarios(texto)
  +obtenerCuenta(cuentaId)
}
class ValidadorAdmin {
  <<validador>>
  +validarBusqueda(texto) booleano
}
class RolRepository {
  <<repositorio>>
  +esAdministrador() booleano
}
class UsuarioRepository {
  <<repositorio>>
  +buscar(texto)
  +obtenerCuenta(cuentaId)
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +estaSuspendido() booleano
}
class Perfil {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto [0..1]
}
class Equipo {
  <<entidad>>
  +id: uuid
  +nombre: texto
}
class Torneo {
  <<entidad>>
  +id: uuid
  +nombre: texto
}
class Suspension {
  <<entidad>>
  +id: uuid
  +duracion: DuracionSuspension
  +motivo: texto
  +venceEn: fechaHora [0..1]
  +estaVigente() booleano
}
PanelUsuarios ..> AdminService
AdminService ..> ValidadorAdmin
AdminService ..> RolRepository
AdminService ..> UsuarioRepository
UsuarioRepository ..> Usuario
UsuarioRepository ..> Perfil
UsuarioRepository ..> Equipo
UsuarioRepository ..> Torneo
UsuarioRepository ..> Suspension
Usuario "1" *-- "1" Perfil
Usuario "1" *-- "0..*" Suspension
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `ControlDeAcceso` | `«boundary»` | `src/proxy.ts` + `requireAdminSession` (`src/utils/supabase/admin.ts`) | Implementado |
| `FormularioAdmin` | `«boundary»` | `src/app/admin/login/page.tsx` | Implementada |
| `PanelAdmin` | `«boundary»` | `src/app/admin/(panel)/layout.tsx`, `src/app/admin/(panel)/page.tsx`, `src/app/admin/(panel)/seguridad/page.tsx` | Implementada (parcial en métricas nuevas) |
| `PanelReportes` / `FormularioSuspension` / `PanelUsuarios` | `«boundary»` | — (previstos en `03-pantallas.md`) | **Pendiente** |
| `AdminService` / `OpcionesResolucion` / `OpcionesSuspension` | `«control»` | `adminLogin` (`src/app/admin/login/actions.ts`) + consultas en `src/app/admin/(panel)/page.tsx` + listas fijas de resoluciones y duraciones | Parcial (faltan UC-F03 a UC-F06) |
| `ValidadorAdmin` | `«validador»` | `safeAdminNextPath` (`src/utils/safe-next-path.ts`) + validadores de moderación | Parcial |
| `CuentaRepository` / `RolRepository` | `«repositorio»` | Supabase Auth + función `public.is_admin()` y tabla `public.admins` (`20260928000002_profiles.sql`) | Implementados |
| `EstadisticasRepository` | `«repositorio»` | `countTable` en `src/app/admin/(panel)/page.tsx` (`tournaments`, `teams`, `profiles`) | Implementado |
| `ReporteRepository` / `SuspensionRepository` / `UsuarioRepository` / `RegistroDeAcciones` | `«repositorio»` | — (tablas de reportes, suspensiones y auditoría) | **Pendiente** |
| `Usuario` / `Administrador` / `Perfil` / `Torneo` / `Equipo` / `Calificacion` / `Aviso` | `«entidad»` | `auth.users`, `public.admins`, `profiles`, `tournaments`, `teams`, `ratings`, `notices` | Implementadas |
| `ReporteTorneo` / `ReporteEquipo` / `Suspension` / `EntradaRegistroDeAcciones` | `«entidad»` | — (esquema de moderación y auditoría) | **Pendiente** |
