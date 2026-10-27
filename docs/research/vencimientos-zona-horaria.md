# Vencimientos y zona horaria en Supabase

Investigación para el issue #42 (mapa #35). Fecha: 27/10/2026. Fuentes primarias:
documentación de PostgreSQL 18 (la "current" al día de hoy), documentación y
página de precios de Supabase, documentación de PostgREST, el README de
`pg_cron` y la base de datos de zonas horarias de IANA.

Punto de partida del repo:

- `docs/decisiones-casos-de-uso.md`, Alcance: **"Sin tareas programadas por
  ahora. Todos los plazos (48 h, 24 h, vencimientos) se calculan cuando alguien
  mira la pantalla, no los ejecuta un reloj. Todos los avisos se disparan por
  una acción de un usuario."** Esta investigación confirma que esa decisión es
  técnicamente viable y dónde están sus bordes.
- `supabase/migrations/20260930000002_tournaments_computed_status.sql` ya
  resuelve el mismo problema para torneos: una función pura `immutable` que
  recibe "hoy" (testeable sin reloj) y una columna calculada `stable` que le
  pasa `(now() at time zone 'America/Argentina/Buenos_Aires')::date`.

---

## 1. ¿Se puede calcular todo al leer, sin job?

### Lo que garantiza Postgres

- `now()` (= `transaction_timestamp()`, `current_timestamp`) devuelve la hora
  **del inicio de la transacción**, no la del momento exacto de la llamada;
  `statement_timestamp()` devuelve la del inicio de la sentencia.
  <https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT>
  Consecuencia útil: dentro de una función RPC, todas las comparaciones con
  `now()` usan el mismo instante, así que una propuesta no puede "vencer a
  mitad" de un `accept_proposal`.
- La familia `current_timestamp` es **STABLE**: su valor no cambia dentro de
  una transacción. Una función `STABLE` puede usarse en condiciones de índice
  pero no se puede marcar `IMMUTABLE` algo que dependa de ella: el planificador
  podría congelarla como constante y reusar un valor viejo.
  <https://www.postgresql.org/docs/current/xfunc-volatility.html>
- Las **columnas generadas** solo admiten funciones `immutable`, así que
  `now()` **no** puede ir en una columna generada (ni "guardar" un estado que
  dependa del reloj de esa forma).
  <https://www.postgresql.org/docs/current/ddl-generated-columns.html>
- PostgREST expone funciones que reciben una fila de tabla como **columnas
  calculadas**: se piden con `select=*,status`, se filtran y se ordenan como
  una columna real, siempre que la función esté en el esquema expuesto.
  <https://docs.postgrest.org/en/stable/references/api/computed_fields.html>
  (Es el mecanismo que ya usa `public.status(tournaments)`.)

### Regla por regla

Patrón para todas: se **guardan solo hechos con su hora** (cuándo se creó la
propuesta, cuándo cargó cada capitán, cuándo se reportó) y el estado sale de
una función `estado(hechos, ahora)` pura, más un envoltorio `stable` que le pasa
`now()`. Como la función es determinística sobre las mismas filas y el mismo
`now()`, **los dos equipos ven exactamente el mismo estado**, sin que nadie
tenga que "dispararlo".

| Regla | Hechos guardados | Cálculo al leer | ¿Necesita efecto guardado? |
|---|---|---|---|
| Búsqueda vence al pasar su última franja | franjas (`during tstzrange`) | `max(upper(during)) <= now()` → vencida; se excluye de compatibles con un `where` | No |
| Propuesta vence a las 72 h o al pasar la franja | `created_at`, franja elegida, estado de acción (pendiente/aceptada/descartada/cancelada/anulada) | pendiente y `now() >= least(created_at + interval '72 hours', lower(franja))` → vencida | No (vencer no genera aviso según las reglas vigentes) |
| Anulación de propuestas superpuestas al nacer un partido | — | — | **Sí, pero la dispara una acción** (aceptar): se hace en la misma transacción de la RPC que crea el partido, con su aviso. No hace falta reloj |
| Resultado se asienta a las 48 h | resultado y hora de carga de cada capitán, hora de fin del partido | tabla de "Después del partido" evaluada con `now()` (por ejemplo, uno cargó y pasaron 48 h → Jugado con ese resultado) | No |
| Reporte de no presentado → Falta a las 48 h | `reported_at`, respuesta (si hay) | sin respuesta y `now() >= reported_at + 48 h` → Falta, con fecha `reported_at + 48 h` | No |
| Penalizaciones (faltas en 90 días) | faltas derivadas (vista) | `count(*) where fecha_falta > now() - interval '90 days'` | No |

Detalles:

- **Las faltas pueden ser una vista**, no una tabla: la unión de (a) partidos
  caídos con menos de 24 h por el equipo que lo tiró (hecho guardado por la
  acción) y (b) reportes de no presentado sin respuesta y con 48 h cumplidas
  (derivado). Cada fila con su fecha efectiva. El presentismo ("Jugó 12 ·
  Faltó 1 · …") y las penalizaciones leen la misma vista, así que no pueden
  desincronizarse.
- **"3 faltas en 90 días → 30 días sin publicar búsquedas"** también es
  calculable: el equipo está bloqueado si existe una falta `f` con
  `f.fecha > now() - 30 días` tal que haya ≥ 3 faltas en
  `(f.fecha - 90 días, f.fecha]`. Lo chequea la RPC de publicar búsqueda.
- **Una respuesta tardía** ("fuimos" después de las 48 h) tiene que rechazarse
  en la RPC comparando con `now()`; si no, la falta "desaparecería" al leer.
- **Testeo**: seguir el patrón de torneos (función pura con `ahora` como
  parámetro). pgTAP corre cada test en una transacción, y como `now()` queda
  fijo dentro de ella, no hay forma simple de "adelantar el reloj": por eso el
  parámetro explícito (el comportamiento de `now()` está en la fuente de arriba;
  la conclusión sobre pgTAP es inferencia, no verificada en su documentación).
- **Costo**: el cálculo se rehace en cada lectura. Con el volumen esperado
  (decenas de equipos) es irrelevante; no se midió.

### Lo que sí necesitaría un efecto guardado

Solo los **Avisos que nacen de que pasó el tiempo** (no de una acción), por
ejemplo "tu propuesta venció" o "se te sumó una falta". Las reglas vigentes no
piden ninguno: todos los avisos listados (anulación de propuestas, suspensión,
inscripción vinculada) nacen de una acción. Si en el futuro se piden, opciones:

1. **Avisos derivados (sin job):** la campanita lee la unión de avisos
   guardados + eventos derivados con su fecha (propuestas vencidas, faltas
   nuevas), y se guarda solo `last_seen_at` por usuario para el contador de no
   leídos. Mismo mecanismo que el resto; recomendable.
2. **Evaluación perezosa en la próxima escritura:** la RPC que toca la fila
   (o la de "abrir campanita") inserta el aviso si el vencimiento ya pasó y
   todavía no se avisó. Funciona, pero el aviso aparece recién cuando alguien
   actúa, y hay que cuidar la idempotencia.
3. **`pg_cron`** cada N minutos materializando avisos/estados (ver punto 2).
4. **Edge Function programada:** en Supabase se programa **con `pg_cron` +
   `pg_net`**, así que no es una alternativa a `pg_cron`, es `pg_cron` más una
   llamada HTTP. <https://supabase.com/docs/guides/functions/schedule-functions>

---

## 2. `pg_cron` en el plan gratis

- `pg_cron` figura en la lista de extensiones preinstaladas de Supabase, sin
  restricción de plan indicada en esa página.
  <https://supabase.com/docs/guides/database/extensions>
- "Supabase Cron" es un módulo sobre `pg_cron`; los jobs viven en `cron.job` y
  cada ejecución se registra en `cron.job_run_details`. Pueden correr SQL,
  funciones o requests HTTP, desde cada segundo hasta una vez por año.
  Recomendación oficial: **no más de 8 jobs concurrentes y cada uno de no más
  de 10 minutos.** <https://supabase.com/docs/guides/cron>
- La página de precios no tiene una fila específica de Cron. Una respuesta en
  el foro oficial de discusiones de Supabase dice que Cron "solo está limitado
  por los recursos (CPU/memoria/disco) en cualquier plan" — fuente de menor
  confianza (no se pudo confirmar si quien responde es del staff).
  <https://github.com/orgs/supabase/discussions/37405>
- **Pausa por inactividad:** "Free projects are paused after 1 week of
  inactivity." <https://supabase.com/pricing>. Con el proyecto pausado no corre
  nada, cron incluido. **No encontré documentación oficial sobre si la
  actividad de un job de `pg_cron` cuenta como actividad** para evitar la
  pausa; no conviene depender de eso.
- Zona horaria de los horarios: por defecto `cron.timezone = GMT`, es decir,
  `'0 3 * * *'` es a las 3 UTC (00 h en Argentina).
  <https://github.com/citusdata/pg_cron>
- `cron.job_run_details` **no se limpia sola**; con jobs frecuentes hay que
  programar un borrado periódico (o `cron.log_run = off`).
  <https://github.com/citusdata/pg_cron>
- Edge Functions: el plan gratis incluye 500.000 invocaciones.
  <https://supabase.com/pricing>

---

## 3. Zona horaria y franjas

### Hechos

- La base de Supabase está en **UTC por defecto** y Supabase recomienda
  dejarla así. <https://supabase.com/docs/guides/database/postgres/configuration>
- `timestamptz` **guarda el instante en UTC** y no conserva la zona con la que
  se cargó; al mostrarse se convierte a la zona de la sesión. Si el texto de
  entrada no trae zona, se asume la de la sesión (en Supabase, UTC).
  <https://www.postgresql.org/docs/current/datatype-datetime.html>
- `timestamp AT TIME ZONE zona` interpreta una hora local de esa zona y
  devuelve `timestamptz`; `timestamptz AT TIME ZONE zona` devuelve la hora de
  pared en esa zona. <https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-ZONECONVERT>
- Postgres recomienda **nombres completos de zona** (IANA, como
  `America/Argentina/Buenos_Aires`) y no abreviaturas u offsets fijos, porque el
  nombre incluye las reglas de horario de verano. No recomienda `time with time
  zone`. <https://www.postgresql.org/docs/current/datatype-datetime.html>
- En la base de IANA, `America/Argentina/Buenos_Aires` está en `-3:00` desde
  el 3/3/2000 con las reglas `Arg`, cuyo último horario de verano fue
  2008–2009 (termina en marzo de 2009). Hoy no hay cambio de hora.
  <https://github.com/eggert/tz/blob/main/southamerica>

### Opciones para la franja

| Opción | A favor | En contra |
|---|---|---|
| `fecha date` + `hora_inicio smallint` + `hora_fin smallint` (hora de Argentina) | Es literalmente lo que define el dominio; fácil de mostrar y de validar "horas enteras" | Cada comparación con `now()` necesita convertir; la superposición hay que escribirla a mano; "hasta las 24" es un caso borde |
| `starts_at` / `ends_at` `timestamptz` | Comparar con `now()` es directo; correcto en cualquier zona | Superposición escrita a mano (`a.starts_at < b.ends_at and b.starts_at < a.ends_at`) |
| `during tstzrange` | Operadores nativos: `&&` (se superponen), `*` (intersección), `upper/lower`; admite restricción de exclusión | Algo menos familiar para el equipo; para mostrar hay que convertir a hora local |

Rangos: `tstzrange` es un tipo de rango nativo. Con límites `[)` (inicio
incluido, fin excluido), "20 a 22" y "22 a 24" **no** se superponen, que es lo
que se quiere. Una restricción de exclusión impide guardar valores
superpuestos, y con **`btree_gist`** se combina con columnas escalares, por
ejemplo `EXCLUDE USING GIST (room WITH =, during WITH &&)`.
<https://www.postgresql.org/docs/current/rangetypes.html>
(El constructor de dos argumentos `tstzrange(a, b)` arma `[)` por defecto; está
en la misma página, sección 8.17.6, no lo citó textualmente la herramienta.)

`btree_gist` está en la lista de extensiones disponibles de Supabase.
<https://supabase.com/docs/guides/database/extensions>

### Cómo se aplica

- **Construir el instante en la RPC** que crea la búsqueda, a partir de lo que
  manda el formulario (fecha + horas enteras), así la validación de "horas
  enteras" y "dentro de los próximos 14 días" queda en un solo lugar:

  ```sql
  tstzrange(
    (p_fecha + p_hora_inicio * interval '1 hour') at time zone 'America/Argentina/Buenos_Aires',
    (p_fecha + p_hora_fin    * interval '1 hour') at time zone 'America/Argentina/Buenos_Aires'
  )
  ```

  (`date + interval` da un `timestamp` sin zona, que `at time zone` interpreta
  como hora de Argentina; sumar horas en vez de usar `make_time` permite que
  la franja termine "a las 24".)
- **Compatibles (≥ 1 h en común):** `a.during && b.during and
  upper(a.during * b.during) - lower(a.during * b.during) >= interval '1 hour'`.
  "El mismo día" sale solo si una franja no cruza la medianoche, que conviene
  validar en la RPC.
- **Nunca dos partidos superpuestos para un equipo:** una tabla con una fila
  por (partido, equipo) y
  `EXCLUDE USING GIST (team_id WITH =, during WITH &&) WHERE (activo)`;
  el `WHERE` deja fuera los partidos caídos. La forma
  `EXCLUDE … WHERE (predicado)` está en
  <https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-EXCLUDE>.
  Así la base rechaza el caso aunque dos aceptaciones lleguen a la vez.
- **"Hoy" en Argentina**, igual que en torneos:
  `(now() at time zone 'America/Argentina/Buenos_Aires')::date`.
- **Riesgo conocido de `timestamptz` para eventos futuros:** si Argentina
  volviera a tener horario de verano, las franjas ya guardadas conservan su
  instante UTC y se mostrarían corridas una hora. Con franjas a 14 días como
  máximo, el riesgo es mínimo (inferencia a partir del almacenamiento en UTC
  descrito arriba).

---

## No verificado

- Si los jobs de `pg_cron` cuentan como "actividad" para la pausa del plan
  gratis.
- Límites de `pg_cron` específicos del plan gratis más allá de la
  recomendación general (8 concurrentes, 10 min): solo hay una respuesta de
  foro.
- Que la extensión `pg_cron` esté disponible en `supabase start` local (no se
  levantó ninguna base).
- Rendimiento del cálculo al leer: no se midió.
- Ambigüedad de dominio (no técnica): en "uno carga y el otro no hace nada en
  48 h", ¿las 48 h corren desde la carga o desde el fin del partido? Y los 30
  días sin publicar, ¿corren desde la tercera falta? Hay que fijarlo en
  `docs/decisiones-casos-de-uso.md` antes de implementar.

## Recomendación

1. **Mantener "sin tareas programadas".** Todas las reglas de tiempo
   (vencimiento de búsqueda y propuesta, asentamiento del resultado, falta por
   reporte sin respuesta, penalizaciones a 90 días) se calculan al leer con el
   mismo patrón que el estado del torneo: función pura con `ahora` como
   parámetro + columna calculada `stable` con `now()`. Las faltas, como vista.
   Las RPC revalidan con `now()` antes de cada transición.
2. La anulación de propuestas superpuestas va en la RPC de aceptar, no en un
   job. Si algún día se piden avisos por vencimiento, hacerlos derivados
   (campanita = avisos guardados + eventos derivados, con `last_seen_at`) antes
   que sumar `pg_cron`.
3. `pg_cron` está disponible, pero en el plan gratis el proyecto se pausa tras
   una semana sin actividad y no hay garantía documentada de que el cron lo
   evite: no construir reglas de negocio que dependan de que corra.
4. **Franjas como `tstzrange` `[)`** construido en la RPC desde fecha + horas
   enteras en `America/Argentina/Buenos_Aires`, base en UTC, y
   **restricción de exclusión con `btree_gist`** por equipo para impedir
   partidos superpuestos.
