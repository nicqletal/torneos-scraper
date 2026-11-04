# Diseño de módulos de Partidos

Acordado el 28/10/2026 (ticket "Diseño de módulos de Partidos", mapa #35). Las reglas de producto están en [decisiones-casos-de-uso.md](decisiones-casos-de-uso.md) (sección Partidos y tabla de Visibilidad); acá está cómo se construyen. Es la forma acordada, no el SQL final.

## Principios

- **Se guardan hechos con su hora, nunca estados.** El estado sale de funciones SQL puras que reciben `p_now`, como `tournament_status`. Sin `pg_cron` ni jobs (ver la investigación de vencimientos en la rama `research/vencimientos-zona-horaria`).
- **El cálculo vive solo en Postgres.** Las RPC validan contra la misma función que lee la pantalla; TypeScript solo traduce a texto.
- **Ninguna tabla se escribe desde el cliente.** Sin policies de insert, update ni delete: todo pasa por las RPC.

## Tablas

| Tabla | Qué guarda |
|---|---|
| `rival_searches` | equipo, modalidad, `cancelled_at` |
| `search_slots` | búsqueda y `range tstzrange` `[)`, armado en la RPC desde fecha + horas enteras en `America/Argentina/Buenos_Aires`. `EXCLUDE USING gist (search_id with =, range with &&)` |
| `proposals` | `from_slot_id`, `to_slot_id`, `range` (la parte en común, fija), `created_at`, `closed_at`, `close_reason`, `match_id`. Los equipos salen de las franjas |
| `matches` | rango, cancha y hora cargadas, equipo que las cargó, confirmación de la coordinación, caída (motivo, quién, si fue de común acuerdo), pedido de caída de común acuerdo (quién, motivo, respuesta), `last_action_at` para los plazos de 48 h |
| `match_sides` | una fila por equipo y partido: `going_at` ("Vamos"), goles a favor y en contra (último valor; las correcciones pisan), reporte "no vinieron", respuesta "fuimos" |
| `ratings` | partido, equipo que califica, estrellas, comentario |
| `notices` | `user_id`, `kind` (enum de los 16 disparadores de Partidos + la baja de torneo), `params jsonb` (foto de nombres y datos del momento), `created_at`, `read_at` |

`close_reason` (enum) guarda solo lo que provoca una acción: `aceptada`, `rechazada`, `cancelada` (el emisor), `franja_sacada`, `busqueda_cancelada`, `anulada` (superposición con un partido nuevo).

## Estados calculados

| Función / vista | Devuelve |
|---|---|
| `match_phase(<hechos>, p_now)` | `por_jugarse`, `esperando_resultado`, `jugado`, `caido`, `en_conflicto`, `no_presentado`. Las cuatro últimas son los "cerrados" del historial |
| `match_deadline(<hechos>, p_now)` | cuándo vence el plazo abierto, o null |
| `proposal_status(<hechos>, p_now)` | lo guardado, o `pendiente`, `vencida` (72 h o empezó el rango) o `equipo_bloqueado` (alguno con 3 faltas en 90 días) |
| vista `team_faults(team_id, match_id, occurred_at)` | `caido` con menos de 24 h y sin común acuerdo → `dropped_at`; `no_presentado` → al vencer las 48 h |

**Coordinado** y **Confirmado** no son fases: son datos de `por_jugarse`, leídos de los hechos. También se calculan: búsqueda activa (no cancelada, con franjas futuras, equipo sin bloqueo ni disolución), franja ocupada (se superpone con un partido no caído del equipo), bloqueo por faltas y revelación de calificaciones.

## RPC

Una por intención del capitán, con parámetros tipados y la validación de la fase adentro.

| RPC | Qué hace |
|---|---|
| `save_rival_search(p_team_id, p_modality, p_slots)` | crea o edita la búsqueda activa de esa modalidad con el conjunto completo de franjas; las que desaparecen cancelan sus propuestas; vacío = cancelar |
| `send_proposal(p_slot_id, p_rival_slot_id)` | calcula la parte en común y la envía |
| `respond_proposal(p_proposal_id, p_accept)` | receptor: acepta (nace el partido y se anulan las superpuestas) o rechaza; emisor con `false`: cancela |
| `coordinate_match(p_match_id, p_venue, p_start_at)` | carga, corrige o confirma: mandar los mismos valores que cargó el otro deja el partido Coordinado |
| `confirm_going(p_match_id)` | "Vamos". "No vamos" es `drop_match` |
| `drop_match(p_match_id, p_reason)` | tira el partido; la falta la decide la fase |
| `request_mutual_drop(p_match_id, p_reason)` / `answer_mutual_drop(p_match_id, p_accept)` | caída de común acuerdo |
| `report_result(p_match_id, p_goals_for, p_goals_against)` | carga o corrige el resultado |
| `report_no_show(p_match_id)` / `reply_went(p_match_id)` | "No vinieron" y "fuimos" |
| `rate_rival(p_match_id, p_stars, p_comment)` | calificación única |
| `mark_notices_read(p_ids)` | marca leídos los avisos vistos |

Helpers internos, sin `grant`: `notify(...)` (una fila por destinatario: capitán o plantel del momento, nunca quien hizo la acción) y `cancel_proposals(...)`.

**Superposición de partidos:** `respond_proposal` y `save_rival_search` bloquean las filas de `teams` involucradas (`for update`, ordenadas por id) y después consultan si hay un partido no caído superpuesto. Es el mismo patrón que la gestión de equipos. No hay restricción de exclusión sobre partidos porque obligaría a duplicar un "activo" guardado.

## Visibilidad

| Objeto | Quién lee |
|---|---|
| `rival_searches`, `search_slots` | el capitán del equipo dueño |
| `proposals` | los capitanes de los dos equipos |
| `matches`, `match_sides` | el plantel de los dos equipos |
| `ratings` | nadie por la API (el comentario lo ve el administrador en moderación) |
| `notices` | cada uno los suyos |
| vista `team_match_history` | `anon` y `authenticated`: solo partidos cerrados, fecha sin hora, rival, fase, goles, motivo, quién lo tiró, común acuerdo, ausente, las dos versiones; ni cancha ni hora |
| vista `team_record` | `anon` y `authenticated`: jugados, faltas, conflictos, rivales distintos, promedio y cantidad de estrellas reveladas |
| `compatible_rivals(p_search_id)` | `security definer`: solo el capitán de esa búsqueda activa; devuelve equipo, franja y horario en común, ya ordenados |
| WhatsApp del capitán rival | función `security definer`: solo el capitán actual de un equipo con ese partido acordado |

## TypeScript (`src/utils/`, `pnpm test`)

| Módulo | Qué hace |
|---|---|
| `rival-search-form.ts` | `parseRivalSearchForm(formData, today)`: horas enteras, inicio < fin, dentro de 14 días, sin pisarse, atajo "repetir" |
| `match-forms.ts` | un `parse…` por formulario: cancha 1–120, hora de a 15 min dentro del rango, goles 0–99, motivo 1–140, estrellas 1–5 y comentario ≤ 500 |
| `match-display.ts` | fase → texto y color, dato del momento de la fila, fila del historial, contador y estrellas |
| `notices.ts` | `noticeText(kind, params)` y `noticeLink(kind, params)` |

Las Server Actions (`src/app/partidos/actions.ts`) parsean con estos módulos, llaman a la RPC, traducen el error de Postgres y hacen `revalidatePath('/partidos')` (y la página del equipo cuando el partido se cierra). Las validaciones se repiten en la RPC, que es la que manda.

## Tests

- **pgTAP:** cada frontera de `match_phase`, `match_deadline` y `proposal_status` (23:59 h vs 24 h, 48 h justas, 72 h); cada RPC con sus rechazos; cada policy, vista y función de visibilidad (anon no ve nada privado, un tercero no ve el partido, el plantel ve el partido pero no las propuestas).
- **`pnpm test`:** los cuatro módulos de TypeScript, con un caso por disparador en `notices.ts`.

## Etapas

Acordado el 28/10/2026 (ticket "Corte en etapas de Partidos para los tickets", mapa #35). Corte vertical: cada etapa trae su migración, sus RPC, sus tests y su parte de `/partidos`, y al terminar se prueba en el navegador. `match_phase` crece de etapa en etapa.

| # | Etapa | Entra | Se prueba en el navegador |
|---|---|---|---|
| 0 | Avisos y campanita | `notices`, `notify`, `mark_notices_read`, `notices.ts`, campanita en el header, aviso por baja de torneo | se da de baja un torneo con inscripción → el plantel ve el aviso |
| 1 | Búsqueda de rival y compatibles | `rival_searches`, `search_slots`, `save_rival_search`, `compatible_rivals`, `rival-search-form.ts`, `/partidos` con el panel Buscar rival | dos capitanes con franjas que se pisan se ven como compatibles |
| 2 | Propuesta y partido acordado | `proposals`, `send_proposal`, `respond_proposal` (anula las superpuestas), `proposal_status` sin `equipo_bloqueado`, `matches` + `match_sides`, `match_phase` con `por_jugarse`, WhatsApp del capitán rival, tarjetas de propuestas y fila del partido | proponer, aceptar, rechazar, cancelar, vencer; el partido aparece en los dos equipos |
| 3 | Coordinación y confirmación | `coordinate_match`, `confirm_going`, `match_deadline` de la confirmación previa | cargar cancha y hora, confirmarlas, "Vamos" |
| 4 | Partido caído y faltas | `drop_match`, `request_mutual_drop` / `answer_mutual_drop`, fase `caido`, `team_faults` (`dropped_at`), bloqueo por 3 faltas (`equipo_bloqueado`, búsqueda inactiva), menú ⋯ | tirar con más y con menos de 24 h; común acuerdo sin falta; equipo bloqueado |
| 5 | Resultado y presentismo | `report_result`, `report_no_show`, `reply_went`, fases `esperando_resultado`, `jugado`, `en_conflicto`, `no_presentado`, falta firme a las 48 h | cargar y corregir goles; "No vinieron" / "fuimos" → conflicto |
| 6 | Calificación | `ratings`, `rate_rival`, revelación cruzada | calificar; se revela cuando califican los dos o a los 7 días |
| 7 | Historial en la página del equipo | vistas `team_match_history` y `team_record`, contador y últimos 5 en la página del equipo | un anónimo ve el historial sin cancha ni hora |

- **Tickets:** uno por etapa, encadenados con "Bloqueado por". La 2 se puede partir en dos (propuestas / partido que nace al aceptar) si no entra en una sesión. La etapa 0 reusa el ticket "Campanita de avisos + aviso por baja de torneo" (#6), con el cuerpo actualizado a este diseño.
- **Rama y PR:** una sola rama de Partidos y un solo PR a `main` al final. Cada ticket se cierra cuando su etapa está en la rama.
- **Control de cada etapa:** lo que manda es la prueba en el navegador, caso por caso, con las cuentas QA; cada ticket lista los casos y qué tiene que ver cada cuenta. Acompañan los tests pgTAP y `/code-review` sobre el tramo.
- **Cuentas QA:** Caro (capitana A), Juli (plantel de A), Oscar (usuario ajeno con sesión), Ana (admin) y anónimo. La etapa 1 suma `rival.prueba@example.com`, capitán de "Los Rivales de Prueba", con la misma modalidad y zona que el equipo de Caro.
- **Plazos:** los casos que no se pueden esperar (72 h, 48 h, 7 días, faltas en 90 días) se arman con un script de escenarios versionado en `scripts/qa/`, que con la `service_role key` local borra los datos de Partidos de las cuentas QA y escribe los hechos con fechas hacia atrás, sin pasar por las RPC. Lo amplían las etapas 2, 4, 5 y 6. Lo que se puede armar eligiendo fechas (menos de 24 h, vencer al empezar el rango) se arma desde la app.
- **Migraciones:** se aplican a la base compartida (`supabase db push`) al terminar cada etapa, desde la rama. Una migración aplicada no se edita: las correcciones y las versiones nuevas de `match_phase` van en migraciones nuevas, y los valores nuevos de un enum van en una migración aparte.

## Integración con equipos

Acordado el 28/10/2026 (ticket "Integración de Partidos con equipos", mapa #35). Entra en la etapa 2.

- **`dissolve_team`:** después de bloquear el equipo, rechaza si hay un partido del equipo en `por_jugarse` o `esperando_resultado` ("Tenés un partido pendiente: tiralo o cerrá el resultado antes de disolver"). Si no, marca `cancelled_at` en sus búsquedas activas y llama a `cancel_proposals` con `busqueda_cancelada`, igual que `save_rival_search` con el conjunto vacío.
- **`rate_rival`:** no mira `dissolved_at`.
- **Mismo capitán:** `compatible_rivals` excluye los equipos cuyo capitán actual es el de la búsqueda, y `send_proposal` rechaza ese caso. Después de acordado no se vuelve a controlar.
- **`notify` a los dos planteles:** una fila por usuario distinto (unión de los dos planteles, sin repetir y sin quien hizo la acción).
- **`transfer_captaincy`, `leave_team`, `remove_team_member`:** sin cambios. La visibilidad sale del plantel actual, así que quien sale deja de ver los partidos.
