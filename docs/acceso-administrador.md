# Acceso de administrador y marco del backoffice

Etapa del 14/10/2026: acceso diferenciado, sidebar y resumen, antes de avanzar
con los módulos de gestión. No aplica migraciones ni modifica la base compartida.

## Entrada y permisos

- `/login` y registro no tienen navbar ni footer. Conservan el formulario,
  la bienvenida, la atmósfera y la opción de invitado. Se agrega el enlace
  discreto a `/admin/login`.
- `/admin/login` es un formulario público, sin registro ni invitado. Usa
  `signInWithPassword` con la misma cuenta de Supabase y después consulta
  `is_admin()` con esa sesión. La contraseña no se modifica ni se registra.
- Los campos del formulario no pueden conceder roles. Credenciales inválidas,
  rol ausente, resultado no booleano o error de verificación no habilitan el
  backoffice. Una cuenta común autenticada conserva su sesión para el sitio,
  sin adquirir permisos administrativos.
- Solo el login exacto queda fuera de la protección de `/admin`. El proxy
  conserva las cookies renovadas al redirigir y el destino interno con sus
  query params. El retorno del acceso de administrador se limita al backoffice,
  excluyendo el propio login para evitar bucles.
- El layout protegido vive en un grupo de rutas `(backoffice)` para no envolver
  el formulario público. Cada página verifica además el acceso junto a los
  datos mediante `requireAdmin()`, reutilizado por render con `React.cache`.
- `AppFrame` decide únicamente la presentación. No sustituye la autorización
  del servidor, de las futuras acciones ni las policies de RLS.

## Asignar un administrador

La cuenta debe existir primero en Supabase Auth. Una persona autorizada obtiene
su UUID desde Authentication / Users y asigna el rol desde el SQL Editor:

```sql
-- Reemplazar UUID_DEL_USUARIO por el UUID de una cuenta existente.
insert into public.admins (user_id)
values ('UUID_DEL_USUARIO')
on conflict (user_id) do nothing;
```

Esto es una instrucción manual, no una migración ni una operación realizada en
esta entrega. No se usan `user_metadata`, un campo del perfil o una selección
del cliente para decidir quién es administrador. Nunca se expone una clave
`service_role` al navegador.

## Sidebar y resumen

- Disponibles: Resumen y Seguridad y acceso (solo información de la cuenta
  actual y los controles de esta etapa).
- Pendientes, sin enlaces ni acciones: Usuarios, Torneos y equipos, Reportes,
  Registro de actividad, Soporte, Avisos y Configuración.
- El resumen consulta los contadores reales. Una consulta fallida o sin conteo
  muestra «No disponible», no un cero inventado.
- Se retira el placeholder «Sin reportes pendientes»: el módulo aún no existe.
- En móvil la navegación se despliega y se cierra al elegir una sección o con
  Escape. En escritorio es una sidebar con la cuenta y el cierre de sesión al
  pie. «Volver al sitio» queda arriba, bajo el encabezado, también visible en
  móvil sin abrir el menú.
- «Volver al sitio» lleva al catálogo y «Cerrar sesión» conserva el alcance
  local del dispositivo. No existe una segunda sesión de administrador.

MFA, gestión de sesiones y permisos granulares, controles sobre usuarios,
auditoría, soporte y parámetros de negocio requieren definir cada etapa antes
de implementar tablas, permisos o acciones. Push y bloqueos de entrada siguen
requiriendo una decisión explícita porque cambian las reglas vigentes de Avisos
y Suspensión.

## Verificación

- `pnpm test`: 92 tests, incluidos casos de credenciales, sesión recién
  autenticada, cuenta sin rol, fallo de RPC, destinos, marco visual y navbar.
  Los tests del login administrativo usan el SDK real con transporte simulado;
  no autentican cuentas de la base compartida.
- `pnpm test:entry`: prueba HTTP real del acceso sin navbar, invitado, rutas
  protegidas, login administrativo público y rechazo de formularios sin
  credenciales. No crea cuentas ni modifica datos.
- `pnpm exec next typegen` y `pnpm exec tsc --noEmit`: validación de las nuevas
  rutas. Se retiró solo el tipo generado obsoleto que apuntaba al panel antes
  de trasladarlo al grupo de rutas.
- Revisión de escritorio y móvil con la sesión de administrador existente,
  sin cambiar roles, credenciales ni datos.
- El build Webpack sigue bloqueado por el `EPERM` de Windows sobre el directorio
  generado `.next/server/app/admin`; no se da por verificado para producción.
