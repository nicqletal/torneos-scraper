## Summary

### Autenticación y seguridad

- Protección de administración en dos capas: Proxy y comprobación de sesión/rol en el servidor mediante `is_admin()` y `requireAdmin()`.
- Acceso diferenciado en `/admin/login`, con la misma cuenta de Supabase y rol asignado manualmente en `public.admins`. El formulario no concede permisos.
- Validación de destinos internos post-login y retorno restringido al backoffice para el acceso de administrador.
- Cierre de sesión limitado al dispositivo actual.
- Entrada inicial por `/login`, con registro e invitado. La preferencia de invitado no crea una cuenta ni habilita acciones privadas.

### Navegación y backoffice

- Catálogo público en `/torneos`, conservando enlaces filtrados anteriores y sesiones existentes.
- Login y registro sin navbar ni footer, con enlace al acceso de administrador.
- Navbar con Torneos, Mis equipos y Soy organizador; Administración solo con rol confirmado.
- Backoffice con sidebar responsive, Resumen y Seguridad y acceso de la cuenta actual. “Volver al sitio” queda arriba.
- Métricas reales de torneos, equipos y usuarios; errores de consulta visibles, sin datos simulados de módulos pendientes.
- Panel de organizador en `/mis-torneos`; `/panel` redirige allí.
- Usuarios, contenido, reportes, actividad, soporte, avisos y configuración quedan explícitamente pendientes de sus etapas.

### Equipos, perfil y base de datos

- Edición de equipos para el capitán actual, navegación de regreso y gestión de escudos: alta, reemplazo y retiro, con JPG/PNG/WebP de hasta 2 MB.
- Disolución mediante RPC, conservando ficha pública, plantel y escudo; invalidación de invitaciones y bloqueos para serializar operaciones del equipo.
- Validación compartida de datos de alta y edición. Corrección del archivo vacío que Next serializa como `blob` en el formulario de escudo.
- Subida y reemplazo de avatar con guardado de la nueva URL antes de limpiar la foto anterior y compensación si falla el guardado.
- Migraciones y tests pgTAP preparados para permisos de `is_admin()`, avatares, escudos y gestión de equipos, junto con ajustes de integridad de torneos/modalidades.
- Mejora de legibilidad de formularios y controles, fondo atmosphere y respeto por movimiento reducido.

## Test

- [x] `pnpm test`: 92 tests pasan. Los casos de SDK usan transporte simulado; no equivalen a validar RLS en Postgres.
- [x] `pnpm test:entry`: prueba HTTP local de entrada, invitado, destinos internos, rutas privadas, ausencia de navbar en el acceso y validación del acceso de administrador.
- [x] `pnpm exec next typegen` y `pnpm exec tsc --noEmit`: tipos de rutas generados y cero errores de TypeScript.
- [x] `pnpm build --webpack`: build de producción completado, incluidas las rutas nuevas de administración, catálogo y edición de equipos. No se verificó el comando por defecto con Turbopack en esta revisión.
- [x] `pnpm lint`: cero errores y tres advertencias existentes por imports sin uso.
- [x] Revisión visual previa en escritorio y móvil del login, catálogo, equipos y backoffice.
- [ ] Prueba adicional de avatar sin archivo: falla con el marcador `blob` vacío. El validador del perfil todavía requiere la misma corrección aplicada al escudo.
- [ ] `supabase test db`: no ejecutado en esta revisión; Supabase CLI y Docker no están disponibles en el PATH del entorno.
- [ ] Aplicación/sincronización de migraciones en la base compartida: no verificada en esta revisión. No se aplicó SQL ni se modificaron roles o datos compartidos.

### Pendientes antes de merge/aplicación

- Retirar los `DROP TABLE ... CASCADE` de la migración histórica de equipos: si se ejecuta sobre datos existentes, destruye equipos, planteles y dependencias.
- Reemplazar el borrado automático de torneos sin contactos por una validación y corrección explícita de datos; el predicado actual no distingue registros de prueba ni preserva los finalizados.
- Corregir y cubrir con una regresión el avatar vacío serializado como `blob`.
