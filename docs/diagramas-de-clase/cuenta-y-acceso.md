# Módulo A — Cuenta y acceso

> Documenta las clases de dominio y de diseño que participan en el **Módulo A — Cuenta y acceso** (`UC-A01` a `UC-A06`).
> Fuentes del módulo: [01-requerimientos.md](../cuenta-y-acceso/01-requerimientos.md) · [02-casos-de-uso.md](../cuenta-y-acceso/02-casos-de-uso.md) · [03-pantallas.md](../cuenta-y-acceso/03-pantallas.md) · [04-diagramas-secuencia/](../cuenta-y-acceso/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de herencia/composición y enumeraciones que comparten los casos de uso `UC-A01` a `UC-A06`.

```mermaid
classDiagram
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
  +creadoEn: fechaHora
  +tieneSesionActiva() booleano
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
  +creadoEn: fechaHora
  +actualizadoEn: fechaHora
  +actualizarDatos(nombre, zonaId, fotoUrl)
  +tieneFoto() booleano
}
class ContactoPerfil {
  <<entidad>>
  +userId: uuid
  +whatsapp: texto [0..1]
  +actualizadoEn: fechaHora
  +tieneWhatsapp() booleano
  +actualizarWhatsapp(whatsapp)
}
class Sesion {
  <<entidad>>
  +token: texto
  +dispositivo: texto
  +venceEn: fechaHora
  +esVigente() booleano
  +finalizarEnDispositivo()
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
  +leidoEn: fechaHora [0..1]
  +creadoEn: fechaHora
  +textoVisible() texto
  +enlaceDestino() texto
  +fechaVisible() texto
  +estaLeido() booleano
  +marcarLeido()
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
class TipoAviso {
  <<enumeracion>>
  PropuestaRecibida
  PropuestaRechazada
  PropuestaCancelada
  PropuestaAnulada
  PartidoAcordado
  ConfirmarCanchaHora
  PartidoCoordinado
  PedidoCaidaComunAcuerdo
  CaidaComunAcuerdoAceptada
  CaidaComunAcuerdoRechazada
  PartidoCaido
  ResultadoCargado
  PartidoJugado
  ReporteNoPresentado
  PartidoEnConflicto
  CalificacionRevelada
  TorneoDadoDeBaja
  CuentaSuspendida
}
Usuario <|-- Administrador
Usuario "1" *-- "1" Perfil
Perfil "1" *-- "1" ContactoPerfil
Usuario "1" *-- "0..*" Sesion
Usuario "1" --> "0..*" Aviso
Perfil "0..*" --> "0..1" Zona
Zona "1..*" --> "1" Corredor
Corredor "1..*" --> "1" Region
Aviso ..> TipoAviso
```

---

## Clases por caso de uso

### UC-A01 · Crear cuenta

> Especificación: [UC-A01](../cuenta-y-acceso/02-casos-de-uso.md#uc-a01--crear-cuenta) · Pantalla: [P2 · Crear cuenta](../cuenta-y-acceso/03-pantallas.md#p2--crear-cuenta) · Secuencia: [S01 · Crear cuenta](../cuenta-y-acceso/04-diagramas-secuencia/uc-a01-crear-cuenta.md)

```mermaid
classDiagram
class FormularioAcceso {
  <<boundary>>
  +abrirCrearCuenta(destino)
  +completarDatos(nombre, email, contrasena)
  +confirmarRegistro(nombre, email, contrasena, destino)
  +mostrarError(mensaje)
  +abrirDestino(destino)
}
class CuentaService {
  <<control>>
  +validarDestino(destino) texto
  +registrarse(nombre, email, contrasena, destino) texto
}
class ValidadorCuenta {
  <<validador>>
  +validarDestino(destino) texto
  +validarNombre(nombre) booleano
  +validarCredenciales(email, contrasena) booleano
}
class CuentaRepository {
  <<repositorio>>
  +crearCuenta(nombre, email, contrasena) Sesion
  +abrirSesion() Sesion
  +crearPerfilInicial(usuarioId, nombre)
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
  +creadoEn: fechaHora
  +tieneSesionActiva() booleano
}
class Perfil {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto [0..1]
  +fotoUrl: texto [0..1]
  +creadoEn: fechaHora
}
class ContactoPerfil {
  <<entidad>>
  +userId: uuid
  +whatsapp: texto [0..1]
}
class Sesion {
  <<entidad>>
  +token: texto
  +dispositivo: texto
  +venceEn: fechaHora
  +esVigente() booleano
}
FormularioAcceso ..> CuentaService
CuentaService ..> ValidadorCuenta
CuentaService ..> CuentaRepository
CuentaRepository ..> Usuario
CuentaRepository ..> Sesion
Usuario "1" *-- "1" Perfil
Perfil "1" *-- "1" ContactoPerfil
```

---

### UC-A02 · Iniciar sesión

> Especificación: [UC-A02](../cuenta-y-acceso/02-casos-de-uso.md#uc-a02--iniciar-sesión) · Pantalla: [P1 · Iniciar sesión](../cuenta-y-acceso/03-pantallas.md#p1--iniciar-sesión) · Secuencia: [S02 · Iniciar sesión](../cuenta-y-acceso/04-diagramas-secuencia/uc-a02-iniciar-sesion.md)

```mermaid
classDiagram
class ControlDeAcceso {
  <<boundary>>
  +abrirRutaProtegida(ruta)
  +redirigirALogin(destino)
}
class FormularioAcceso {
  <<boundary>>
  +abrirIniciarSesion(destino)
  +completarCredenciales(email, contrasena)
  +confirmarIngreso(email, contrasena, destino)
  +mostrarError(mensaje)
  +abrirDestino(destino)
}
class CuentaService {
  <<control>>
  +consultarSesion() Sesion
  +validarDestino(destino) texto
  +iniciarSesion(email, contrasena, destino) texto
}
class ValidadorCuenta {
  <<validador>>
  +validarDestino(destino) texto
  +validarCredenciales(email, contrasena) booleano
}
class CuentaRepository {
  <<repositorio>>
  +consultarSesion() Sesion
  +validarCredenciales(email, contrasena) Sesion
  +abrirSesion() Sesion
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
}
class Sesion {
  <<entidad>>
  +token: texto
  +dispositivo: texto
  +venceEn: fechaHora
  +esVigente() booleano
}
ControlDeAcceso ..> CuentaService
ControlDeAcceso ..> FormularioAcceso
FormularioAcceso ..> CuentaService
CuentaService ..> ValidadorCuenta
CuentaService ..> CuentaRepository
CuentaRepository ..> Usuario
CuentaRepository ..> Sesion
```

---

### UC-A03 · Cerrar sesión

> Especificación: [UC-A03](../cuenta-y-acceso/02-casos-de-uso.md#uc-a03--cerrar-sesión) · Pantalla: [Menú de usuario](../cuenta-y-acceso/03-pantallas.md#menú-de-usuario-y-campanita-de-avisos) · Secuencia: [S03 · Cerrar sesión](../cuenta-y-acceso/04-diagramas-secuencia/uc-a03-cerrar-sesion.md)

```mermaid
classDiagram
class MenuDeUsuario {
  <<boundary>>
  +abrirMenu()
  +elegirCerrarSesion()
  +abrirCatalogo()
}
class CuentaService {
  <<control>>
  +cerrarSesion()
}
class CuentaRepository {
  <<repositorio>>
  +finalizarSesionLocal()
}
class Sesion {
  <<entidad>>
  +token: texto
  +dispositivo: texto
  +venceEn: fechaHora
  +esVigente() booleano
  +finalizarEnDispositivo()
}
MenuDeUsuario ..> CuentaService
CuentaService ..> CuentaRepository
CuentaRepository ..> Sesion
```

---

### UC-A04 · Recuperar contraseña

> Especificación: [UC-A04](../cuenta-y-acceso/02-casos-de-uso.md#uc-a04--recuperar-contraseña) · Pantalla: [P3 · Recuperar contraseña](../cuenta-y-acceso/03-pantallas.md#p3--recuperar-contraseña) · Secuencia: [S04 · Recuperar contraseña](../cuenta-y-acceso/04-diagramas-secuencia/uc-a04-recuperar-contrasena.md)

```mermaid
classDiagram
class FormularioRecuperar {
  <<boundary>>
  +abrirRecuperarContrasena()
  +solicitarEnlace(email)
  +mostrarConfirmacion()
  +mostrarError(mensaje)
}
class FormularioNuevaContrasena {
  <<boundary>>
  +abrirEnlace(enlace)
  +confirmarNuevaContrasena(enlace, contrasenaNueva)
  +mostrarConfirmacionCambio()
  +mostrarErrorEnlace()
}
class CuentaService {
  <<control>>
  +solicitarRecuperacion(email)
  +restablecerContrasena(enlace, contrasenaNueva)
}
class ValidadorCuenta {
  <<validador>>
  +validarEmail(email) booleano
  +validarContrasena(contrasenaNueva) booleano
}
class CuentaRepository {
  <<repositorio>>
  +generarEnlaceDeRecuperacion(email) texto
  +cambiarContrasena(enlace, contrasenaNueva) booleano
}
class ServicioCorreo {
  <<boundary>>
  +enviarEnlace(email, enlace)
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
}
FormularioRecuperar ..> CuentaService
FormularioNuevaContrasena ..> CuentaService
CuentaService ..> ValidadorCuenta
CuentaService ..> CuentaRepository
CuentaRepository ..> ServicioCorreo
CuentaRepository ..> Usuario
```

---

### UC-A05 · Editar mi perfil

> Especificación: [UC-A05](../cuenta-y-acceso/02-casos-de-uso.md#uc-a05--editar-mi-perfil) · Pantalla: [P4 · Mi perfil](../cuenta-y-acceso/03-pantallas.md#p4--mi-perfil) · Secuencia: [S05 · Editar mi perfil](../cuenta-y-acceso/04-diagramas-secuencia/uc-a05-editar-perfil.md)

```mermaid
classDiagram
class FormularioPerfil {
  <<boundary>>
  +abrirMiPerfil(destino)
  +mostrarFormulario(perfil, zonas)
  +cambiarDatos(nombre, zonaId, whatsapp, foto)
  +confirmarGuardar(nombre, zonaId, whatsapp, foto, destino)
  +mostrarAvisoWhatsapp()
  +mostrarConfirmacion()
  +mostrarErrores(errores)
  +abrirDestino(destino)
}
class PerfilService {
  <<control>>
  +obtenerDatosEdicion(usuarioId)
  +editarPerfil(nombre, zonaId, whatsapp, foto, destino)
}
class ValidadorCuenta {
  <<validador>>
  +validarNombre(nombre) booleano
  +normalizarWhatsapp(whatsapp) texto
  +validarFoto(foto) booleano
  +validarDestino(destino) texto
}
class ZonaRepository {
  <<repositorio>>
  +listarZonas() Zona[]
}
class PerfilRepository {
  <<repositorio>>
  +obtenerPerfil(usuarioId) Perfil
  +guardarPerfil(nombre, zonaId, foto)
  +guardarWhatsapp(whatsapp)
  +subirFotoNueva(foto) texto
  +retirarFotoNueva(ruta)
  +retirarFotoAnterior(ruta)
}
class Perfil {
  <<entidad>>
  +id: uuid
  +nombre: texto
  +zonaId: texto [0..1]
  +fotoUrl: texto [0..1]
  +actualizadoEn: fechaHora
  +actualizarDatos(nombre, zonaId, fotoUrl)
}
class ContactoPerfil {
  <<entidad>>
  +userId: uuid
  +whatsapp: texto [0..1]
  +actualizadoEn: fechaHora
  +actualizarWhatsapp(whatsapp)
}
class Zona {
  <<entidad>>
  +id: texto
  +nombre: texto
  +corredorId: texto
  +orden: entero
}
FormularioPerfil ..> PerfilService
PerfilService ..> ZonaRepository
PerfilService ..> ValidadorCuenta
PerfilService ..> PerfilRepository
PerfilRepository ..> Perfil
PerfilRepository ..> ContactoPerfil
ZonaRepository ..> Zona
Perfil "1" *-- "1" ContactoPerfil
Perfil "0..*" --> "0..1" Zona
```

---

### UC-A06 · Ver avisos (campanita)

> Especificación: [UC-A06](../cuenta-y-acceso/02-casos-de-uso.md#uc-a06--ver-avisos-campanita) · Pantalla: [Campanita de avisos](../cuenta-y-acceso/03-pantallas.md#menú-de-usuario-y-campanita-de-avisos) · Secuencia: [S06 · Ver avisos](../cuenta-y-acceso/04-diagramas-secuencia/uc-a06-ver-avisos.md)

```mermaid
classDiagram
class AvisoService {
  <<control>>
  +listarUltimos(limite) Aviso[]
  +contarNoLeidos() entero
  +marcarLeidos(idsVisiblesSinLeer)
}
class AvisoRepository {
  <<repositorio>>
  +listarUltimos(limite) Aviso[]
  +contarNoLeidos() entero
  +marcarLeidos(ids)
}
class Aviso {
  <<entidad>>
  +id: uuid
  +userId: uuid
  +tipo: TipoAviso
  +parametros: jsonb
  +leidoEn: fechaHora [0..1]
  +creadoEn: fechaHora
  +textoVisible() texto
  +enlaceDestino() texto
  +fechaVisible() texto
  +estaLeido() booleano
  +marcarLeido()
}
class TipoAviso {
  <<enumeracion>>
  PropuestaRecibida
  PropuestaRechazada
  PropuestaCancelada
  PropuestaAnulada
  PartidoAcordado
  ConfirmarCanchaHora
  PartidoCoordinado
  PedidoCaidaComunAcuerdo
  CaidaComunAcuerdoAceptada
  CaidaComunAcuerdoRechazada
  PartidoCaido
  ResultadoCargado
  PartidoJugado
  ReporteNoPresentado
  PartidoEnConflicto
  CalificacionRevelada
  TorneoDadoDeBaja
  CuentaSuspendida
}
AvisoService ..> AvisoRepository
AvisoRepository ..> Aviso
Aviso ..> TipoAviso
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `ControlDeAcceso` | `«boundary»` | `src/proxy.ts` | Implementado |
| `FormularioAcceso` | `«boundary»` | `src/app/login/page.tsx` + `src/utils/login-screen.ts` | Implementado |
| `FormularioRecuperar` / `FormularioNuevaContrasena` | `«boundary»` | — (diseño objetivo de UC-A04) | **Pendiente** |
| `FormularioPerfil` | `«boundary»` | `src/app/perfil/page.tsx` | Implementado |
| `MenuDeUsuario` | `«boundary»` | `src/components/UserMenu.tsx` | Implementado |
| `ServicioCorreo` | `«boundary»` | — (diseño objetivo de UC-A04) | **Pendiente** |
| `CuentaService` | `«control»` | Server Actions `signup`, `login`, `logout` en `src/app/login/actions.ts` | Implementado (falta UC-A04) |
| `PerfilService` | `«control»` | Server Action `updateProfile` en `src/app/perfil/actions.ts` | Parcial (falta RF-A17) |
| `AvisoService` | `«control»` | Lectura de avisos en `src/app/layout.tsx` + Server Action `markNoticesRead` en `src/app/avisos/actions.ts` | Implementado |
| `ValidadorCuenta` | `«validador»` | `safeNextPath` (`src/utils/safe-next-path.ts`), `normalizeWhatsapp` (`src/utils/whatsapp.ts`), `parseAvatar` (`src/utils/profile-avatar.ts`) | Implementado |
| `CuentaRepository` | `«repositorio»` | Supabase Auth (`signUp`, `signInWithPassword`, `signOut({ scope: 'local' })`, `getUser`) + trigger `handle_new_user` | Implementado |
| `ZonaRepository` | `«repositorio»` | `getZoneGroups()` en `src/components/ZoneSelect.tsx` (`public.zones`, `corridors`, `regions`) | Implementado |
| `PerfilRepository` | `«repositorio»` | `saveProfile` (`src/utils/supabase/profile.ts`), tablas `public.profiles` y `public.profile_contacts`, bucket `avatars` | Parcial (falta RF-A17) |
| `AvisoRepository` | `«repositorio»` | Tabla `public.notices` con RLS + función `public.mark_notices_read` (`20261028000001_notices.sql`) | Implementado |
| `Usuario` / `Administrador` / `Sesion` | `«entidad»` | `auth.users`, `public.admins` y sesiones de Supabase Auth | Implementadas |
| `Perfil` / `ContactoPerfil` | `«entidad»` | `public.profiles`, `public.profile_contacts` (`20260928000002_profiles.sql`) | Implementadas |
| `Aviso` | `«entidad»` | `public.notices` + `noticeText`, `noticeLink`, `noticeDate` (`src/utils/notices.ts`) | Implementada |
| `Zona` / `Corredor` / `Region` | `«entidad»` | `public.zones`, `public.corridors`, `public.regions` (`20260928000001_geography.sql`) | Implementadas |
