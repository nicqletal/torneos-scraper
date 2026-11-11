# Módulo A — Cuenta y acceso

> Documenta las clases de dominio y de diseño que participan en el **Módulo A — Cuenta y acceso** (`UC-A01` a `UC-A06`).
> Fuentes del módulo: [01-requerimientos.md](../cuenta-y-acceso/01-requerimientos.md) · [02-casos-de-uso.md](../cuenta-y-acceso/02-casos-de-uso.md) · [03-pantallas.md](../cuenta-y-acceso/03-pantallas.md) · [04-diagramas-secuencia/](../cuenta-y-acceso/04-diagramas-secuencia/README.md). Convenciones en el [README](README.md).

---

## Modelo de dominio del módulo

Vista estructural de las entidades, relaciones de herencia/composición y enumeraciones que comparten los casos de uso `UC-A01` a `UC-A06`.

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
  +actualizadoEn: fechaHora
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
  +tipo: TipoAviso
  +parametros: json
  +enlace: texto
  +creadoEn: fechaHora
  +leidoEn: fechaHora [0..1]
  +textoVisible() texto
  +estaLeido() booleano
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
Usuario <|-- Administrador : es un
Usuario "1" *-- "1" Perfil : datos públicos
Perfil "1" *-- "1" ContactoPerfil : datos privados
Usuario "1" *-- "0..*" Sesion : mantiene activas
Usuario "1" --> "0..*" Aviso : recibe
Perfil "0..*" --> "0..1" Zona : se ubica en
Zona "1..*" --> "1" Corredor : pertenece a
Corredor "1..*" --> "1" Region : pertenece a
Aviso ..> TipoAviso
```

---

## Clases por caso de uso

### UC-A01 · Crear cuenta

**Requerimientos:** `RF-A01` a `RF-A03`, `RF-A06`, `RF-A08`, `RF-A25` · **Pantalla:** [P2 · Crear cuenta](../cuenta-y-acceso/03-pantallas.md#p2--crear-cuenta) (`/login?modo=registro`) · **Secuencia:** [S01 · Crear cuenta](../cuenta-y-acceso/04-diagramas-secuencia/uc-a01-crear-cuenta.md)

```mermaid
classDiagram
direction TB
class FormularioAcceso {
  <<boundary>>
  +abrirCrearCuenta(destino)
  +confirmarRegistro(nombre, email, contrasena, destino)
  +mostrarAvisoPublicarTorneo()
  +mostrarError(mensaje)
}
class CuentaService {
  <<control>>
  +registrarse(nombre, email, contrasena, destino) texto
}
class ValidadorCuenta {
  <<validador>>
  +validarNombre(nombre) booleano
  +validarCredenciales(email, contrasena) booleano
  +validarDestino(destino) texto
}
class CuentaRepository {
  <<repositorio>>
  +crearCuenta(nombre, email, contrasena) Sesion
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
}
class Perfil {
  <<entidad>>
  +id: uuid
  +nombre: texto
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
}
FormularioAcceso ..> CuentaService : envía solicitud de registro
CuentaService ..> ValidadorCuenta : valida nombre, credenciales y destino
CuentaService ..> CuentaRepository : solicita alta de cuenta
CuentaRepository ..> Usuario : instancia
CuentaRepository ..> Sesion : abre en el dispositivo actual
Usuario "1" *-- "1" Perfil : datos públicos
Perfil "1" *-- "1" ContactoPerfil : datos privados
```

---

### UC-A02 · Iniciar sesión

**Requerimientos:** `RF-A04` a `RF-A08`, `RF-A25` · **Pantalla:** [P1 · Iniciar sesión](../cuenta-y-acceso/03-pantallas.md#p1--iniciar-sesión) (`/login`) · **Secuencia:** [S02 · Iniciar sesión](../cuenta-y-acceso/04-diagramas-secuencia/uc-a02-iniciar-sesion.md)

```mermaid
classDiagram
direction TB
class ControlDeAcceso {
  <<boundary>>
  +interceptarRutaProtegida(ruta)
  +requiereSesion(ruta) booleano
}
class FormularioAcceso {
  <<boundary>>
  +abrirIniciarSesion(destino)
  +confirmarIngreso(email, contrasena, destino)
  +mostrarError(mensaje)
}
class CuentaService {
  <<control>>
  +verificarSesionActiva() Sesion
  +iniciarSesion(email, contrasena, destino) texto
}
class ValidadorCuenta {
  <<validador>>
  +validarCredenciales(email, contrasena) booleano
  +validarDestino(destino) texto
}
class CuentaRepository {
  <<repositorio>>
  +consultarSesionActual() Sesion
  +validarCredenciales(email, contrasena) Sesion
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
}
ControlDeAcceso ..> CuentaService : verifica sesión activa
ControlDeAcceso ..> FormularioAcceso : redirige con destino next
FormularioAcceso ..> CuentaService : envía credenciales y destino
CuentaService ..> ValidadorCuenta : valida credenciales y destino
CuentaService ..> CuentaRepository : consulta sesión y autentica
CuentaRepository ..> Usuario : comprueba credenciales
CuentaRepository ..> Sesion : inicia en el dispositivo actual
```

---

### UC-A03 · Cerrar sesión

**Requerimientos:** `RF-A09`, `RF-A25` · **Pantalla:** [P4 · Barra superior](../cuenta-y-acceso/03-pantallas.md#p4--barra-superior) · **Secuencia:** [S03 · Cerrar sesión](../cuenta-y-acceso/04-diagramas-secuencia/uc-a03-cerrar-sesion.md)

```mermaid
classDiagram
direction TB
class MenuDeUsuario {
  <<boundary>>
  +abrirMenu()
  +elegirCerrarSesion()
}
class CuentaService {
  <<control>>
  +cerrarSesionDispositivoActual()
}
class SesionRepository {
  <<repositorio>>
  +finalizarSesionActual(tokenDispositivo)
}
class Sesion {
  <<entidad>>
  +token: texto
  +dispositivo: texto
  +venceEn: fechaHora
  +finalizarEnDispositivo()
}
MenuDeUsuario ..> CuentaService : solicita cierre de sesión
CuentaService ..> SesionRepository : ordena finalizar sesión local
SesionRepository ..> Sesion : finaliza únicamente la del dispositivo actual
```

---

### UC-A04 · Recuperar contraseña

**Requerimientos:** `RF-A10` · **Pantalla:** Diseño objetivo · **Secuencia:** [S04 · Recuperar contraseña](../cuenta-y-acceso/04-diagramas-secuencia/uc-a04-recuperar-contrasena.md)

```mermaid
classDiagram
direction TB
class CuentaService {
  <<control>>
  +pedirRecuperacion(email)
  +definirContrasena(token, contrasenaNueva)
}
class ValidadorCuenta {
  <<validador>>
  +validarEmail(email) booleano
  +validarContrasena(contrasenaNueva) booleano
}
class CuentaRepository {
  <<repositorio>>
  +generarTokenRecuperacion(email) texto
  +cambiarContrasena(token, contrasenaNueva) booleano
}
class ServicioCorreo {
  <<boundary>>
  +enviarEnlaceRecuperacion(email, token)
}
class Usuario {
  <<entidad>>
  +id: uuid
  +email: texto
  +contrasenaHash: texto
}
CuentaService ..> ValidadorCuenta : valida email y nueva contraseña
CuentaService ..> CuentaRepository : genera token y actualiza contraseña
CuentaService ..> ServicioCorreo : despacha enlace si existe cuenta
CuentaRepository ..> Usuario : actualiza contrasenaHash
```

---

### UC-A05 · Editar perfil

**Requerimientos:** `RF-A11` a `RF-A18` · **Pantalla:** [P3 · Mi perfil](../cuenta-y-acceso/03-pantallas.md#p3--mi-perfil) (`/perfil`) · **Secuencia:** [S05 · Editar perfil](../cuenta-y-acceso/04-diagramas-secuencia/uc-a05-editar-perfil.md)

```mermaid
classDiagram
direction TB
class FormularioPerfil {
  <<boundary>>
  +abrirMiPerfil(destino)
  +confirmarGuardar(nombre, zonaId, whatsapp, foto, destino)
  +mostrarAvisoCargarWhatsapp()
  +mostrarConfirmacion()
  +mostrarError(mensaje)
}
class PerfilService {
  <<control>>
  +cargarDatosEdicion(usuarioId) DatosEdicionPerfil
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
  -subirFotoNueva(foto) texto
  -retirarFotoAnterior(ruta)
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
FormularioPerfil ..> PerfilService : solicita datos iniciales y envía cambios
PerfilService ..> ZonaRepository : obtiene Zonas disponibles
PerfilService ..> ValidadorCuenta : valida nombre, WhatsApp, foto y destino
PerfilService ..> PerfilRepository : lee y actualiza perfil y contacto
ZonaRepository ..> Zona : consulta agrupada por corredor
Zona "1..*" --> "1" Corredor : pertenece a
Perfil "0..*" --> "0..1" Zona : zona opcional
Perfil "1" *-- "1" ContactoPerfil : datos privados
```

---

### UC-A06 · Ver avisos (campanita)

**Requerimientos:** `RF-A19` a `RF-A25` · **Pantalla:** [P5 · Campanita de avisos](../cuenta-y-acceso/03-pantallas.md#p5--campanita-de-avisos) · **Secuencia:** [S06 · Ver avisos](../cuenta-y-acceso/04-diagramas-secuencia/uc-a06-ver-avisos.md)

```mermaid
classDiagram
direction TB
class AvisoService {
  <<control>>
  +consultarAvisosRecientes(limite) Aviso[]
  +obtenerTotalNoLeidos() entero
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
  +tipo: TipoAviso
  +parametros: json
  +enlace: texto
  +creadoEn: fechaHora
  +leidoEn: fechaHora [0..1]
  +textoVisible() texto
  +estaLeido() booleano
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
AvisoService ..> AvisoRepository : consulta últimos avisos, total no leídos y marca leídos
AvisoRepository ..> Aviso : recupera y actualiza propios
Aviso ..> TipoAviso
```

---

## Trazabilidad

| Clase | Estereotipo | Implementación en el repo | Estado |
|---|---|---|---|
| `ControlDeAcceso` | `«boundary»` | `src/proxy.ts` | Implementado |
| `FormularioAcceso` | `«boundary»` | `src/app/login/page.tsx` + `src/utils/login-screen.ts` | Implementado |
| `FormularioPerfil` | `«boundary»` | `src/app/perfil/page.tsx` | Implementado |
| `MenuDeUsuario` | `«boundary»` | `src/components/UserMenu.tsx` | Implementado |
| `ServicioCorreo` | `«boundary»` | — (diseño objetivo de UC-A04) | **Pendiente** |
| `CuentaService` | `«control»` | Server Actions `signup`, `login`, `logout` en `src/app/login/actions.ts` | Implementado (falta UC-A04) |
| `PerfilService` | `«control»` | Server Action `updateProfile` en `src/app/perfil/actions.ts` | Parcial (falta RF-A17) |
| `AvisoService` | `«control»` | Lectura de avisos en `src/app/layout.tsx` + Server Action `markNoticesRead` en `src/app/avisos/actions.ts` | Implementado |
| `ValidadorCuenta` | `«validador»` | `safeNextPath` (`src/utils/safe-next-path.ts`), `normalizeWhatsapp` (`src/utils/whatsapp.ts`), `parseAvatar` (`src/utils/profile-avatar.ts`) | Implementado |
| `CuentaRepository` / `SesionRepository` | `«repositorio»` | Supabase Auth (`signUp`, `signInWithPassword`, `signOut({ scope: 'local' })`, `getUser`) + trigger `handle_new_user` | Implementado |
| `ZonaRepository` | `«repositorio»` | `getZoneGroups()` en `src/components/ZoneSelect.tsx` (`public.zones`, `corridors`, `regions`) | Implementado |
| `PerfilRepository` | `«repositorio»` | `saveProfile` (`src/utils/supabase/profile.ts`), tablas `public.profiles` y `public.profile_contacts`, bucket `avatars` | Parcial (falta RF-A17) |
| `AvisoRepository` | `«repositorio»` | Tabla `public.notices` con RLS + función `public.mark_notices_read` (`20261028000001_notices.sql`) | Implementado |
| `Usuario` / `Administrador` / `Sesion` | `«entidad»` | `auth.users`, `public.admins` y sesiones de Supabase Auth | Implementadas |
| `Perfil` / `ContactoPerfil` | `«entidad»` | `public.profiles`, `public.profile_contacts` (`20260928000002_profiles.sql`) | Implementadas |
| `Aviso` | `«entidad»` | `public.notices` + `noticeText`, `noticeLink`, `noticeDate` (`src/utils/notices.ts`) | Implementada |
| `Zona` / `Corredor` / `Region` | `«entidad»` | `public.zones`, `public.corridors`, `public.regions` (`20260928000001_geography.sql`) | Implementadas |
