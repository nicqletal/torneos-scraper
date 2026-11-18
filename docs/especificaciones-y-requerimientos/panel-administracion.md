# Panel de administración

Acuerdos confirmados el 17/11/2026. Fuente de alcance: [decisiones-casos-de-uso.md](decisiones-casos-de-uso.md#administración). Esta entrega prepara el código y las migraciones; no aplica cambios a la base compartida ni asigna roles.

## Recorridos

| Sección | Operación |
|---|---|
| Resumen | Contadores reales y enlaces a pendientes; una consulta fallida muestra «No disponible». |
| Usuarios | Buscar por nombre/email, consultar identidad y administrar Suspensiones con historial. |
| Torneos y equipos | Consultar y filtrar contenido; retirar Observado con motivo. |
| Reportes | Pendientes/resueltos de torneos y Equipos, con resoluciones auditadas. |
| Registro de actividad | Actor, fecha, recurso, decisión, resultado y datos del cambio. |
| Soporte | Conversaciones privadas; responder y cerrar; el autor reabre respondiendo. |
| Avisos | Consultar entrega/lectura de eventos automáticos. |
| Seguridad y acceso | TOTP obligatorio, cambiar contraseña, cerrar sesión local/global propia. |
| Configuración | Contacto y contenido público de Ayuda, sin parámetros de negocio. |

Reportes de torneo: descartar resuelve solo el elegido; Observado o Baja resuelven los pendientes del torneo. La Baja exige confirmar el nombre y cantidad de inscripciones vigentes bajo el mismo bloqueo de base. Un torneo Finalizado conserva su ficha. El retiro del flyer ocurre después por Storage: un fallo se informa como limpieza pendiente, sin fingir que se deshizo la Baja.

Reportes de Equipo: el Administrador revisa la ficha y los comentarios privados, busca una cuenta y la elige explícitamente. No se preselecciona al Capitán actual. La resolución afecta solo al reporte elegido. Una Suspensión cancela búsquedas y propuestas de los Equipos que esa cuenta capitanea y hace caer sus Partidos futuros sin Falta. No cambia Partidos cerrados ni impide completar resultados pendientes. Levantar o vencer una sanción no reactiva compromisos anteriores.

## Autenticación y permisos preparados

El proxy conserva el destino al pedir acceso; cada página/Server Action verifica de nuevo. La base es la barrera final: `is_verified_admin()` exige `is_admin()` y un JWT de Auth con `aal2`. Ningún formulario puede escribir el rol. La pantalla `/admin/verificar` solo usa la identidad administrativa para configurar/verificar TOTP; no consulta datos del backoffice.

Las nuevas policies son exclusivamente de lectura, salvo la limpieza acotada de flyers. Las escrituras de negocio van por RPC con validación y auditoría dentro de la misma transacción:

| Policy | Condiciones y efecto |
|---|---|
| `tournament_reports: autor o administrador lee` | Usuario autenticado; solo filas cuyo `reporter_id` es su cuenta, o todas si tiene rol y AAL2. Sin escritura directa. |
| `admin_actions: solo administrador lee` | Solo rol y AAL2; no se permiten INSERT, UPDATE ni DELETE directos a clientes. |
| `support_threads: autor o administrador lee` | Solo su autor o Administración verificada; sin escritura directa. |
| `support_messages: participantes leen` | Debe existir la consulta correspondiente y ser su autor o Administración verificada; no alcanza conocer el UUID. |
| `notices: administrador consulta` | Agrega lectura general únicamente con rol y AAL2; conserva las reglas personales existentes y no concede edición de Avisos ajenos. |
| `site_settings: administración verificada` | Tabla interna legible solo con rol y AAL2. `public_site_settings()` devuelve exclusivamente correo, título, texto y enlace; no el editor ni su identidad. |
| `suspensions: titular o administración verificada` | Solo la cuenta afectada o Administración con AAL2. No habilita cambios directos ni consultas de sanciones ajenas. |
| `team_reports: autor o administración verificada` | Misma separación autor/Administración que los reportes de torneo; sin escritura directa. |
| `flyers: administrador ve huérfanos` | SELECT solo del bucket `flyers`, con rol y AAL2 y sin torneo cuya clave coincida con el nombre del archivo. Permite encontrar el objeto que Storage debe retirar tras una Baja. |
| `flyers: administrador retira huérfanos` | DELETE con las mismas tres condiciones; no concede subir, reemplazar ni retirar flyers de torneos vigentes. |

Las RPC administrativas repiten rol+AAL2, usan `search_path` vacío y tienen ejecución revocada para `anon`/`public`. Los helpers internos y los triggers no se exponen como RPC. `admin_team_review()` devuelve solo Capitán actual y hasta 50 comentarios recibidos; no concede lectura del detalle privado de Partidos. `admin_user_context()` devuelve hasta 50 Equipos actuales, torneos y reportes presentados de la cuenta elegida; no expone contactos, otros integrantes del Plantel ni detalles privados de Partidos. Los triggers de Suspensión se ejecutan también desde RPC existentes y escrituras directas, para que las restricciones no dependan de botones ocultos.

No se agrega una `service_role` a la aplicación. La automatización de pruebas utiliza una clave de un Supabase efímero local y rechaza dominios externos; nunca usa la base compartida.

## Límites del registro de seguridad

Las decisiones de negocio y sus auditorías se confirman o revierten juntas en Postgres. Supabase Auth es un servicio separado: cambio de contraseña y cierre de sesión no pueden ser atómicos con esa transacción. La UI distingue fallo, cambio completado y solicitud de cierre; si la contraseña cambió pero falló el registro, informa que la anterior ya no sirve.

`record_admin_security_action()` permite a una cuenta administrativa verificada registrar únicamente eventos propios de un vocabulario cerrado. Estos eventos son informados por el flujo de aplicación; no reemplazan los registros de seguridad de Supabase Auth como prueba independiente. No guardan contraseñas, secretos TOTP ni códigos. Los tokens ya emitidos en otros dispositivos pueden seguir funcionando hasta su vencimiento después de un cierre global.

## Verificación y activación

El workflow `.github/workflows/admin-validation.yml` inicia Supabase local desde cero, aplica todas las migraciones y ejecuta pgTAP. Dos conexiones reales comprueban que una creación concurrente espera la Suspensión y no la elude, y que dos Administradores no superponen sanciones. Luego verifica TypeScript y las pruebas Node, compila Next.js y recorre con Playwright el acceso por contraseña+TOTP, Configuración/Ayuda, reporte de Equipo y sanción, levantamiento, soporte, seis secciones del panel, navegación móvil, cambio de contraseña y cierre global. Las imágenes del resultado quedan como artefactos del workflow.

Antes de activar en la base compartida:

1. Revisar las policies anteriores y las cuatro migraciones `20261117000001` a `20261117000004`; cotejar las migraciones ya aplicadas y contar con un backup.
2. Habilitar TOTP en la configuración de Supabase Auth. `supabase/config.toml` lo habilita para el entorno local; ese archivo por sí solo no modifica el proyecto alojado.
3. Aplicar las migraciones revisadas en orden y publicar la misma versión de la app. La primera separa la incorporación de `admin_message` al enum para que las siguientes puedan usarlo.
4. Cada Administrador debe configurar y verificar su autenticador. Comprobar el acceso con una cuenta común y otra administrativa antes de operar.
5. Configurar el correo real de soporte desde el panel antes de aplicar sanciones. No se inventa una dirección de contacto del proyecto.

Recuperación de TOTP: una persona autorizada verifica la identidad fuera del panel y restablece el factor desde Supabase; después la cuenta configura uno nuevo al entrar. No se incluye un bypass ni se retiran roles automáticamente.
