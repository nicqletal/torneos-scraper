# Módulo F — Administración

> Documenta las clases de dominio y de diseño que participan en el **Módulo F — Administración** (`UC-F01` a `UC-F06`).
> Fuentes del módulo: [01-requerimientos.md](../administracion/01-requerimientos.md) · [02-casos-de-uso.md](../administracion/02-casos-de-uso.md) · [03-pantallas.md](../administracion/03-pantallas.md) · [04-diagramas-secuencia/](../administracion/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de herencia/composición y enumeraciones vinculadas al **Panel de administración** (`UC-F01` a `UC-F06`).

```mermaid
classDiagram
direction TB
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
  +creadoEn: fechaHora
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
  +fotoUrl: texto [0..1]
  +creadoEn: fechaHora
}
class ContactoPerfil {
  <<entidad>>
  +userId: uuid
  +whatsapp: texto [0..1]
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +usuarioId: uuid
  +motivo: MotivoReporteTorneo
  +comentario: texto [0..1]
  +estado: EstadoReporte
  +resolucion: ResolucionReporteTorneo [0..1]
  +notaInterna: texto [0..1]
  +resueltoPorId: uuid [0..1]
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +partidoId: uuid
  +usuarioId: uuid
  +motivo: MotivoReporteEquipo
  +comentario: texto [0..1]
  +estado: EstadoReporte
  +resolucion: ResolucionReporteEquipo [0..1]
  +notaInterna: texto [0..1]
  +resueltoPorId: uuid [0..1]
  +creadoEn: fechaHora
  +resueltoEn: fechaHora [0..1]
}
class Suspension {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +administradorId: uuid
  +duracion: DuracionSuspension
  +motivo: texto
  +venceEn: fechaHora [0..1]
  +creadaEn: fechaHora
  +estaActiva() booleano
}
class EntradaRegistroAccion {
  <<entidad>>
  +id: uuid
  +administradorId: uuid
  +fechaHora: fechaHora
  +tipoAccion: TipoAccionAdmin
  +recursoAfectadoId: uuid
  +tipoRecurso: texto
  +motivoNota: texto
}
class ContadoresPlataforma {
  <<entidad>>
  +torneosVigentes: entero
  +equiposActivos: entero
  +partidosCoordinadosDelMes: entero
  +reportesTorneoPendientes: entero
  +reportesEquipoPendientes: entero
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
}
class EstadoReporte {
  <<enumeracion>>
  Pendiente
  Resuelto
}
class ResolucionReporteTorneo {
  <<enumeracion>>
  Descartar
  MarcarObservado
  DarDeBaja
}
class ResolucionReporteEquipo {
  <<enumeracion>>
  Descartar
  SuspenderCapitan
}
class DuracionSuspension {
  <<enumeracion>>
  SieteDias
  TreintaDias
  Indefinida
}
class TipoAccionAdmin {
  <<enumeracion>>
  DescartarReporteTorneo
  ObservarTorneo
  DarDeBajaTorneo
  DescartarReporteEquipo
  SuspenderCuenta
}
Usuario <|-- Administrador : es un
Usuario "1" *-- "1" Perfil : datos públicos
Perfil "1" *-- "1" ContactoPerfil : datos privados
Administrador "1" --> "0..*" ReporteTorneo : resuelve
Administrador "1" --> "0..*" ReporteEquipo : resuelve
Administrador "1" --> "0..*" Suspension : aplica
Administrador "1" --> "0..*" EntradaRegistroAccion : genera
ReporteEquipo "0..*" --> "0..*" Calificacion : consulta comentarios privados
Suspension "0..*" --> "1" Usuario : sanciona a
Suspension ..> DuracionSuspension
ReporteTorneo ..> EstadoReporte
ReporteTorneo ..> ResolucionReporteTorneo
ReporteEquipo ..> EstadoReporte
ReporteEquipo ..> ResolucionReporteEquipo
EntradaRegistroAccion ..> TipoAccionAdmin
```

---

## Clases por caso de uso

### UC-F01 · Acceder al Panel de administración

**Requerimientos:** `RF-F01`, `RF-F02`, `RNF-F01`, `RNF-F03` · **Pantalla:** [P-F01 · Acceso administrador](../administracion/03-pantallas.md) (`/admin/login`) · **Secuencia:** [`uc-f01-acceder-administracion.md`](../administracion/04-diagramas-secuencia/uc-f01-acceder-administracion.md)

```mermaid
classDiagram
direction TB
class ControlDeAcceso {
  <<boundary>>
  +interceptarRutaAdmin(ruta)
}
class FormularioAdmin {
  <<boundary>>
  +abrirLoginAdmin()
  +ingresarCredenciales(email, contrasena)
  +mostrarErrorAcceso(mensaje)
  +redirigirATablero()
}
class AdminService {
  <<control>>
  +verificarAccesoAdmin(usuarioId) booleano
  +autenticarAdministrador(email, contrasena) Sesion
}
class ValidadorAdmin {
  <<validador>>
  +validarFormatoCredenciales(email, contrasena) booleano
}
class CuentaRepository {
  <<repositorio>>
  +autenticarConContrasena(email, contrasena) Sesion
  +finalizarSesionActual()
}
class RolRepository {
  <<repositorio>>
  +esAdministrador(usuarioId) booleano
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
}
class Administrador {
  <<entidad>>
  +asignadoEn: fechaHora
  +esAdminActivo() booleano
}
class Sesion {
  <<entidad>>
  +token: texto
  +dispositivo: texto
  +venceEn: fechaHora
}
ControlDeAcceso ..> AdminService : verifica sesión y rol de administrador
ControlDeAcceso ..> FormularioAdmin : redirige si no cumple
FormularioAdmin ..> AdminService : envía credenciales
AdminService ..> ValidadorAdmin : valida formato de credenciales
AdminService ..> CuentaRepository : autentica o revoca sesión local si no es admin
AdminService ..> RolRepository : verifica pertenencia con is_admin()
CuentaRepository ..> Sesion : gestiona en el dispositivo actual
RolRepository ..> Administrador : comprueba rol en base
Usuario <|-- Administrador : es un
```

---

### UC-F02 · Consultar el tablero

**Requerimientos:** `RF-F03`, `RNF-F01` · **Pantalla:** [P-F02 · Tablero de administración](../administracion/03-pantallas.md) (`/admin`) · **Secuencia:** [`uc-f02-consultar-tablero.md`](../administracion/04-diagramas-secuencia/uc-f02-consultar-tablero.md)

```mermaid
classDiagram
direction TB
class PanelAdmin {
  <<boundary>>
  +abrirTablero()
  +mostrarContadores(contadores)
  +irAColaReportes()
  +irAUsuarios()
}
class AdminService {
  <<control>>
  +consultarTablero(adminId) ContadoresPlataforma
}
class RolRepository {
  <<repositorio>>
  +esAdministrador(usuarioId) booleano
}
class EstadisticasRepository {
  <<repositorio>>
  +obtenerContadoresPlataforma() ContadoresPlataforma
}
class ContadoresPlataforma {
  <<entidad>>
  +torneosVigentes: entero
  +equiposActivos: entero
  +partidosCoordinadosDelMes: entero
  +reportesTorneoPendientes: entero
  +reportesEquipoPendientes: entero
}
PanelAdmin ..> AdminService : solicita métricas operativas
AdminService ..> RolRepository : verifica rol de administrador
AdminService ..> EstadisticasRepository : consulta contadores agregados
EstadisticasRepository ..> ContadoresPlataforma : proyecta métricas vigentes
```

---

### UC-F03 · Resolver un reporte de torneo

**Requerimientos:** `RF-F04`, `RF-F05`, `RF-F09`, `RNF-F01`, `RNF-F02` · **Pantalla:** [P-F03 · Cola de reportes](../administracion/03-pantallas.md) (`/admin/reportes`) · **Secuencia:** [`uc-f03-resolver-reporte-torneo.md`](../administracion/04-diagramas-secuencia/uc-f03-resolver-reporte-torneo.md)

```mermaid
classDiagram
direction TB
class PanelReportes {
  <<boundary>>
  +abrirColaTorneos()
  +mostrarColaTorneos(reportes, opciones)
  +resolverReporteTorneo(reporteId, resolucion, nota)
}
class OpcionesResolucion {
  <<proveedor de opciones>>
  +resolucionesTorneo() ResolucionReporteTorneo[]
}
class AdminService {
  <<control>>
  +listarReportesTorneoPendientes() ReporteTorneo[]
  +resolverReporteTorneo(adminId, reporteId, resolucion, nota)
}
class ValidadorAdmin {
  <<validador>>
  +validarResolucionTorneo(resolucion, nota) booleano
}
class ReporteRepository {
  <<repositorio>>
  +listarReportesTorneoPendientes() ReporteTorneo[]
  +resolverReporteTorneo(reporteId, resolucion, nota)
}
class TorneoRepository {
  <<repositorio>>
  +marcarObservado(torneoId, motivo)
  +darDeBajaPorModeracion(torneoId, motivo)
}
class AvisoRepository {
  <<repositorio>>
  +notificarModeracionTorneo(torneoId, resolucion, motivo)
}
class RegistroDeAcciones {
  <<repositorio>>
  +registrarAccion(adminId, tipo, recursoId, nota)
}
class ReporteTorneo {
  <<entidad>>
  +id: uuid
  +torneoId: uuid
  +estado: EstadoReporte
  +resolucion: ResolucionReporteTorneo [0..1]
}
class EntradaRegistroAccion {
  <<entidad>>
  +id: uuid
  +tipoAccion: TipoAccionAdmin
  +recursoAfectadoId: uuid
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
PanelReportes ..> OpcionesResolucion : obtiene resoluciones disponibles
PanelReportes ..> AdminService : solicita cola pendiente y envía resolución
AdminService ..> ValidadorAdmin : valida resolución y nota
AdminService ..> ReporteRepository : consulta y resuelve en transacción
ReporteRepository ..> TorneoRepository : aplica observación o baja según resolución
TorneoRepository ..> AvisoRepository : notifica al organizador e inscriptos vinculados
ReporteRepository ..> RegistroDeAcciones : asienta acción inmutable
ReporteRepository ..> ReporteTorneo : actualiza estado
RegistroDeAcciones ..> EntradaRegistroAccion : crea entrada
AvisoRepository ..> Aviso : persiste avisos
```

---

### UC-F04 · Resolver un reporte de equipo

**Requerimientos:** `RF-F04`, `RF-F06`, `RF-F09`, `RNF-F01`, `RNF-F02` · **Pantalla:** [P-F03 · Cola de reportes](../administracion/03-pantallas.md) (`/admin/reportes`) · **Secuencia:** [`uc-f04-resolver-reporte-equipo.md`](../administracion/04-diagramas-secuencia/uc-f04-resolver-reporte-equipo.md)

```mermaid
classDiagram
direction TB
class PanelReportes {
  <<boundary>>
  +abrirColaEquipos()
  +mostrarColaEquipos(reportes, opciones, duraciones)
  +inspeccionarContextoEquipo(equipoId)
  +resolverReporteEquipo(reporteId, resolucion, duracion, nota)
}
class OpcionesResolucion {
  <<proveedor de opciones>>
  +resolucionesEquipo() ResolucionReporteEquipo[]
  +duracionesSuspension() DuracionSuspension[]
}
class AdminService {
  <<control>>
  +listarReportesEquipoYContexto() ReporteEquipo[]
  +resolverReporteEquipo(adminId, reporteId, resolucion, duracion, nota)
}
class ValidadorAdmin {
  <<validador>>
  +validarResolucionEquipo(resolucion, duracion, nota) booleano
}
class ReporteRepository {
  <<repositorio>>
  +listarReportesEquipoPendientes() ReporteEquipo[]
  +obtenerComentariosPrivadosRecibidos(equipoId) Calificacion[]
  +resolverReporteEquipo(reporteId, resolucion, duracion, nota)
}
class SuspensionRepository {
  <<repositorio>>
  +suspenderCuentaYLimpiarActividad(usuarioId, duracion, motivo)
}
class RegistroDeAcciones {
  <<repositorio>>
  +registrarAccion(adminId, tipo, recursoId, nota)
}
class ReporteEquipo {
  <<entidad>>
  +id: uuid
  +equipoId: uuid
  +partidoId: uuid
  +estado: EstadoReporte
  +resolucion: ResolucionReporteEquipo [0..1]
}
class Calificacion {
  <<entidad>>
  +id: uuid
  +respeto: entero
  +comentarioPrivado: texto [0..1]
}
class EntradaRegistroAccion {
  <<entidad>>
  +id: uuid
  +tipoAccion: TipoAccionAdmin
  +recursoAfectadoId: uuid
}
PanelReportes ..> OpcionesResolucion : obtiene resoluciones y duraciones
PanelReportes ..> AdminService : solicita cola con contexto y envía resolución
AdminService ..> ValidadorAdmin : valida resolución, duración y nota
AdminService ..> ReporteRepository : lee reportes, comentarios privados y resuelve
ReporteRepository ..> SuspensionRepository : aplica suspensión al Capitán si corresponde
ReporteRepository ..> RegistroDeAcciones : asienta acción inmutable
ReporteRepository ..> ReporteEquipo : actualiza estado
ReporteRepository ..> Calificacion : consulta comentarios privados
RegistroDeAcciones ..> EntradaRegistroAccion : crea entrada
```

---

### UC-F05 · Suspender una cuenta

**Requerimientos:** `RF-F07`, `RF-F09`, `RNF-F01`, `RNF-F02` · **Pantallas:** [P-F03 · Cola de reportes](../administracion/03-pantallas.md) y [P-F04 · Usuarios](../administracion/03-pantallas.md) · **Secuencia:** [`uc-f05-suspender-cuenta.md`](../administracion/04-diagramas-secuencia/uc-f05-suspender-cuenta.md)

```mermaid
classDiagram
direction TB
class FormularioSuspension {
  <<boundary>>
  +abrirModalSuspension(usuarioId)
  +confirmarSuspension(usuarioId, duracion, motivo)
}
class OpcionesSuspension {
  <<proveedor de opciones>>
  +listarDuraciones() DuracionSuspension[]
}
class AdminService {
  <<control>>
  +suspenderCuenta(adminId, usuarioId, duracion, motivo)
}
class ValidadorAdmin {
  <<validador>>
  +validarSuspension(duracion, motivo) booleano
}
class SuspensionRepository {
  <<repositorio>>
  +aplicarSuspension(usuarioId, adminId, duracion, motivo) uuid
  +cancelarBusquedasYPropuestasCapitan(usuarioId)
  +tirarPartidosFuturosSinFalta(usuarioId)
}
class AvisoRepository {
  <<repositorio>>
  +notificarSuspensionYPartidosCaidos(usuarioId)
}
class RegistroDeAcciones {
  <<repositorio>>
  +registrarAccion(adminId, tipo, recursoId, nota)
}
class Suspension {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +duracion: DuracionSuspension
  +motivo: texto
  +venceEn: fechaHora [0..1]
}
class EntradaRegistroAccion {
  <<entidad>>
  +id: uuid
  +tipoAccion: TipoAccionAdmin
  +recursoAfectadoId: uuid
}
class Aviso {
  <<entidad>>
  +id: uuid
  +usuarioId: uuid
  +tipo: TipoAviso
}
FormularioSuspension ..> OpcionesSuspension : obtiene duraciones fijas
FormularioSuspension ..> AdminService : envía solicitud de suspensión
AdminService ..> ValidadorAdmin : valida duración y motivo obligatorio
AdminService ..> SuspensionRepository : ejecuta suspend_user en transacción
SuspensionRepository ..> AvisoRepository : solicita avisar a contrapartes afectadas
SuspensionRepository ..> RegistroDeAcciones : asienta acción inmutable
SuspensionRepository ..> Suspension : crea suspensión e invalida sesiones
RegistroDeAcciones ..> EntradaRegistroAccion : crea entrada
AvisoRepository ..> Aviso : emite avisos sin sumar falta
```

---

### UC-F06 · Buscar usuarios

**Requerimientos:** `RF-F08`, `RNF-F01` · **Pantalla:** [P-F04 · Usuarios](../administracion/03-pantallas.md) (`/admin/usuarios`) · **Secuencia:** [`uc-f06-buscar-usuarios.md`](../administracion/04-diagramas-secuencia/uc-f06-buscar-usuarios.md)

```mermaid
classDiagram
direction TB
class PanelUsuarios {
  <<boundary>>
  +ingresarBusqueda(termino)
  +mostrarResultados(usuarios)
  +abrirModalSuspension(usuarioId)
}
class AdminService {
  <<control>>
  +buscarUsuarios(adminId, termino) ResumenUsuarioAdmin[]
}
class ValidadorAdmin {
  <<validador>>
  +validarTerminoBusqueda(termino) booleano
}
class RolRepository {
  <<repositorio>>
  +esAdministrador(usuarioId) booleano
}
class UsuarioRepository {
  <<repositorio>>
  +buscarPorNombreOCorreo(termino) ResumenUsuarioAdmin[]
}
class ResumenUsuarioAdmin {
  <<entidad>>
  +usuarioId: uuid
  +nombre: texto
  +email: texto
  +fechaAlta: fechaHora
  +equiposIntegrados: texto[]
  +torneosPublicados: entero
  +estadoCuenta: texto
  +venceSuspensionEn: fechaHora [0..1]
}
PanelUsuarios ..> AdminService : envía término de búsqueda
AdminService ..> ValidadorAdmin : valida término
AdminService ..> RolRepository : verifica rol de administrador
AdminService ..> UsuarioRepository : ejecuta admin_search_users
UsuarioRepository ..> ResumenUsuarioAdmin : proyecta cuenta, equipos, torneos y estado
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `ControlDeAcceso` | `«boundary»` | `src/proxy.ts` (primera capa sobre `/admin/*`) | Implementado |
| `FormularioAdmin` | `«boundary»` | `src/app/admin/login/page.tsx` | Implementada |
| `PanelAdmin` / `PanelReportes` / `FormularioSuspension` / `PanelUsuarios` | `«boundary»` | `src/app/admin/page.tsx` y vistas de moderación | Parcial (`PanelAdmin` implementado; colas pendientes) |
| `OpcionesResolucion` / `OpcionesSuspension` | `«proveedor de opciones»` | Listas cerradas de resoluciones y duraciones (7 días, 30 días, indefinida) | **Pendiente** |
| `AdminService` | `«control»` | Server Actions en `src/app/admin/login/actions.ts` y servicios de moderación | Parcial |
| `ValidadorAdmin` | `«validador»` | Validación de credenciales, resoluciones, motivos de suspensión y búsquedas | Parcial |
| `RolRepository` / `CuentaRepository` | `«repositorio»` | Función `public.is_admin()` (`20260928000002_profiles.sql`) + Supabase Auth | Implementados |
| `EstadisticasRepository` / `ReporteRepository` / `SuspensionRepository` / `UsuarioRepository` / `RegistroDeAcciones` | `«repositorio»` | Consultas y RPCs administrativas | **Pendiente** |
| `AvisoRepository` | `«repositorio»` | Tabla `public.notices` | Implementado |
| `Usuario` / `Administrador` / `Perfil` / `ContactoPerfil` | `«entidad»` | `auth.users`, `public.admins`, `public.profiles`, `public.profile_contacts` | Implementadas |
| `ReporteTorneo` / `ReporteEquipo` / `Suspension` / `EntradaRegistroAccion` / `ContadoresPlataforma` | `«entidad»` | Modelos de moderación y auditoría | **Pendiente** |
