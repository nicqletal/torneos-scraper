# Gestión de equipos y legibilidad

Acuerdos de la sesión del 14/10/2026. Las reglas de negocio de
`decisiones-casos-de-uso.md` y el vocabulario de `../CONTEXT.md` siguen vigentes.

## Acuerdos confirmados

- Completar la edición de equipos y la disolución. Gestiona solo el capitán
  actual; haber creado el equipo no conserva permisos después de transferir
  la capitanía. La disolución es definitiva, pide confirmación y conserva la
  página pública y la historia.
- Incluir el escudo opcional al crear y permitir reemplazarlo o quitarlo al
  editar. Formatos: JPG, PNG y WebP, hasta 2 MB.
- Incorporar una atmósfera suave de luces y gradientes difuminados, usando los
  tokens lima y verde oscuro de la identidad actual. El movimiento es lento,
  queda detrás del contenido y se desactiva con `prefers-reduced-motion`.
- Reservar Bebas Neue para títulos. Usar Plus Jakarta Sans para controles,
  navegación y etiquetas. Botones con texto de 16–18 px y altura mínima de
  44 px; etiquetas de 14 px y textos de apoyo de 14–16 px.
- Aplicar la mejora de legibilidad a las páginas públicas y con sesión,
  incluyendo formularios, layouts y componentes compartidos. Revisar la
  distribución en móvil y mantener el contraste del contenido con el fondo.

## Segunda ronda confirmada

- El capitán accede a editar desde Mis equipos y desde la ficha. Disolver
  queda en una sección separada de la ficha, con explicación y confirmación.
- Mis equipos tiene un enlace a Inicio. La ficha vuelve a Mis equipos para
  integrantes y a Inicio para visitantes. La edición vuelve a la ficha.
- Se implementa la disolución del módulo actual: conserva página, plantel y
  escudo, invalida invitaciones e impide gestión. Libera el cupo de capitanía.
- La integración con partidos y propuestas queda pendiente del módulo
  correspondiente, manteniendo vigentes sus reglas de negocio.

## Hechos de la revisión inicial (antes de esta entrega)

- La base ya permite al capitán editar datos de un equipo activo, pero faltan
  el formulario y la acción de edición.
- `dissolved_at` existe, pero no hay una función de disolución.
- `crest_url` existe, pero no hay bucket ni subida de escudos.
- No existen migraciones de búsquedas de rival, propuestas ni partidos. El
  bloqueo de disolución por partidos acordados y la cancelación de propuestas
  requerirán la integración con ese módulo; las reglas no se descartan.
- Esta entrega continúa preparada en la rama, sin aplicar cambios a la base
  compartida, conforme al acuerdo previo.

## Implementación

- Formulario compartido de alta y edición, con validación en el servidor.
  El escudo se sube a un objeto nuevo; la URL se guarda antes de retirar el
  anterior. Si falla el guardado, se intenta limpiar solo la subida nueva.
- La disolución va por `dissolve_team`. Disolución, invitaciones y cambios
  de plantel toman el mismo bloqueo de equipo para serializar operaciones
  concurrentes y evitar que se gestione después de disolverlo.
- Tres migraciones preparadas: `20261014000001_team_dissolve`,
  `20261014000002_team_crests` y `20261014000003_team_management_locks`.
- Tests pgTAP en `teams_management_test.sql` y `team_crests_test.sql`.
  Su ejecución requiere la base local de Supabase y Docker.
- Revisión visual en navegador de catálogo, Mis equipos, ficha y edición.
  La edición móvil usa etiquetas de 14 px y controles de 16 px; se corrigió
  el desbordamiento del campo de archivo mediante el mínimo de `fieldset`.

## Corrección de la edición sin escudo

- Se reprodujo en el navegador el error de formato al guardar sin seleccionar
  archivo. La Server Action recibía el campo vacío como un `File` llamado
  `blob`, con tamaño cero y tipo `application/octet-stream`; el validador
  solo reconocía como ausencia de selección un archivo sin nombre.
- La validación reconoce también ese marcador vacío y conserva el escudo
  actual. Los archivos seleccionados vacíos, los formatos no admitidos y el
  exceso de tamaño siguen rechazándose. No requiere cambios en la base.
- Se agregó una regresión con serialización multipart, que falló antes de la
  corrección y pasó después. Se verificó además el guardado real sin cambios
  de datos desde la ficha de edición.
