# Entrada y navegación

Etapa del 14/10/2026, posterior a la corrección de edición de equipos.

- `/` decide entre `/login` y el catálogo según la sesión autenticada o la
  elección de invitado. `/torneos` es el catálogo público; esta separación
  permite compartirlo sin obligar al visitante a elegir un acceso.
- Los links anteriores de `/` con query params redirigen a `/torneos`
  conservando los filtros, incluidos parámetros repetidos.
- Entrar como invitado guarda solo `torneos-guest=1`, con `HttpOnly`,
  `SameSite=Lax`, `Secure` en producción y sin expiración persistente. El
  navegador puede conservar cookies de sesión si usa restauración de sesión;
  la preferencia nunca representa identidad ni concede permisos.
- Login y registro mantienen los destinos internos validados. Un destino de
  vuelta al propio `/login` se reemplaza por el catálogo para evitar bucles.
  Una sesión existente no vuelve a pedir credenciales.
- No se modifican RLS, roles, contraseñas, tablas ni credenciales. Las rutas
  y acciones privadas conservan sus comprobaciones de Supabase.
- Navbar con Torneos, Mis equipos y Soy organizador. Administración solo se
  muestra con sesión y `is_admin()` confirmado en el servidor; sus controles
  propios siguen siendo obligatorios. No se agregan links a módulos futuros.
- El catálogo nuevo se invalida junto con la portada después de las escrituras.

## Verificación

- `pnpm test`: decisiones de entrada, navegación, cookie y destino de retorno,
  además de los tests existentes.
- `pnpm test:entry`: con `pnpm dev` corriendo, verifica las rutas y la acción
  de invitado por HTTP real sin credenciales, sin registrar cuentas ni escribir
  en la base. Admite un origen local alternativo como argumento.
- Revisar en el navegador login/registro, invitado, enlaces de retorno,
  sesión existente, filtros compartibles y distribución móvil.

El acceso diferenciado de administrador y la sidebar se completan en la etapa
posterior documentada en [acceso-administrador.md](acceso-administrador.md).
Por pedido del usuario, el acceso general y el registro ahora se muestran sin
navbar ni footer; el catálogo y las demás páginas del sitio los conservan.

## Resultado de esta verificación

- En esta etapa inicial pasaron 81 tests; la prueba HTTP de entrada e invitado
  pasa sin credenciales. La etapa siguiente amplía esa prueba al acceso de
  administrador y a la ausencia de navbar en las pantallas de acceso.
- TypeScript pasa y lint no tiene errores (cuatro advertencias previas).
- Se comprobó en el navegador el recorrido de invitado y el diseño móvil.
  En móvil se prioriza el formulario de acceso y luego la opción de invitado;
  en escritorio se conserva la bienvenida junto al formulario.
- El build Webpack no pudo completarse: Windows rechaza `unlink` sobre el
  directorio generado `.next/server/app/admin`, con atributos `ReadOnly` y
  `ReparsePoint`. El reintento fuera del sandbox falla en el mismo punto,
  antes de compilar. No se borraron archivos generados ni se detuvo el servidor
  de desarrollo del usuario.
