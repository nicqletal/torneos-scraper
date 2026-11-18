# QA: Solicitudes de inscripción (18/11/2026)

QA en el navegador de la feature de 140c75e ("feat(torneos): solicitudes de
inscripción desde la app"), contra la spec "Solicitudes de inscripción" de
`docs/especificaciones-y-requerimientos/decisiones-casos-de-uso.md`.

- **Entorno:** base local (`supabase db reset`), build de producción
  (`next build --webpack` + `next start -p 3001`), browser de Orca.
  Desktop 1029 px y mobile 390×844.
- **Cuentas** (`@example.com`, contraseña `Matchmaking2026`, solo en la base
  local):
  - `org`: organizadora de los 8 torneos de prueba.
  - `cap1`: capitán de Los Halcones (un equipo).
  - `cap2`: capitana de Rayo FC, Tormenta FC y Viejos FC (disuelto). Después
    se le sumó "Deportivo Los Muchachos de la Esquina del Barrio" para probar
    nombres largos.
  - `susp`: capitán de Suspendidos FC, con una suspensión vigente.
  - `jug`: juega en Los Halcones y en Club Norte, sin ser capitán. Después
    recibe la capitanía de Los Halcones.
  - `cap3`: capitán de Club Norte.
- **Torneos:** Abierta (cupo 4), Cierre Vencido, Cupo Lleno (1/1, por
  nombre), En Curso, Finalizada, Sin App (interruptor apagado), Cupo Uno y
  Para Baja.

## Correcciones pedidas (punto 1)

| Corrección | Resultado |
|---|---|
| "Tu equipo ya está **inscripto** en este torneo" (antes "anotado") | Corregido, con test pgTAP |
| "Aceptarla **inscribe** al equipo" (antes "anota") | Corregido |
| Baja del torneo: el capitán que ya recibe `tournament_withdrawn` por un equipo inscripto también recibe `inscription_request_withdrawn` por la solicitud de otro equipo suyo | Corregido; test pgTAP ajustado. Verificado en el navegador: `jug` recibe los dos avisos |

## Matriz

| # | Caso | Cuenta | Resultado |
|---|---|---|---|
| 1 | Solicitar → "Solicitud enviada · Retirar" → retirar → volver a solicitar | cap1 | OK. Cada solicitud nueva generó un aviso al organizador; retirarla no generó ninguno |
| 2 | Varios equipos: un botón por equipo ("Solicitar con X"); el disuelto aparece deshabilitado con "Está disuelto" | cap2 | OK ([captura](img/ficha-varios-equipos.png)) |
| 3 | Suspendido: equipo deshabilitado con "Tu cuenta está suspendida" | susp | OK |
| 4 | Suspendido con una solicitud de antes: sigue pendiente y la puede retirar | susp | OK |
| 5 | Jugador que no es capitán: solo el contacto | jug | OK |
| 6 | Sin sesión: solo el contacto | — | OK |
| 7 | Organizador del torneo (sin equipos): no ve el bloque | org | OK |
| 8 | Sin historia en Cerrado por cierre, Cerrado por cupo, En curso, Finalizado y con el interruptor apagado: no ve el bloque | cap1 | OK (los 5) |
| 9 | Con historia: rechazada en Cerrado → "El organizador no aceptó la solicitud"; pendiente en Cupo Lleno → sigue con Retirar; inscripto en En curso → "Tu equipo está inscripto"; pendiente en Finalizado → "El torneo ya no recibe inscripciones"; pendiente con el interruptor apagado → sigue con Retirar | cap1 | OK |
| 10 | Contador "N solicitudes" en Mis torneos (no aparece en el Finalizado) y en la pestaña | org | OK |
| 11 | Sección Solicitudes: escudo, link al equipo, zona, nivel, jugadores, faltas, conflictos, "llegó hace…", de la más vieja a la más nueva | org | OK ([captura](img/gestion-solicitudes.png)) |
| 12 | WhatsApp al capitán: número del capitán y texto "Hola, te escribo por la inscripción de X en "Y" (Matchmaking)." | org | OK |
| 13 | Aceptar sin confirmación → pasa a inscriptos con su WhatsApp, el cupo pasa a 1/4 y el capitán ve "Tu equipo está inscripto" | org, cap2 | OK |
| 14 | Aceptar con el cupo completo → error en la sección Solicitudes | org | OK ([captura](img/aceptar-cupo-completo.png)) |
| 15 | Rechazar → pide confirmación, desaparece y el capitán ve "no aceptó". No puede volver a solicitar (tampoco por RPC directo) | org, cap1 | OK |
| 16 | Rechazar y cancelar el confirm → sigue pendiente | org | OK |
| 17 | Cargar a mano un equipo con una solicitud pendiente → la solicitud desaparece | org | OK |
| 18 | Interruptor Apagar/Encender en Datos: la ficha refleja el cambio y las solicitudes que ya llegaron siguen (en la gestión y en la ficha del capitán) | org, cap1, cap3 | OK ([captura](img/datos-interruptor-apagado.png)) |
| 19 | Cambio de capitán con una solicitud pendiente: el ex capitán no ve el bloque; el nuevo la ve y la retira; el WhatsApp del organizador apunta al nuevo | cap1 → jug | OK. La capitanía se pasó por psql |
| 20 | Disolver con una solicitud pendiente y una inscripción aceptada: la solicitud desaparece (y su contador), y la inscripción queda | cap2, org | OK. Se disolvió desde la página del equipo |
| 21 | Baja del torneo con 1 inscripto y 3 solicitudes: la confirmación cuenta solo el inscripto; avisos `tournament_withdrawn` para el plantel de Club Norte (cap3, jug) e `inscription_request_withdrawn` para cada capitán con una solicitud (cap2, susp, jug) | org | OK, incluido el caso de la corrección 1.2 |
| 22 | Avisos: texto y link en /avisos y en la campanita. Recibida → pestaña Inscripciones; aceptada y rechazada → ficha; las dos bajas → página del equipo | org, cap3, jug | OK ([captura](img/campanita-jug.png)) |
| 23 | Concurrencia: dos aceptaciones simultáneas con lugar para una (dos sesiones de psql; la primera retiene la transacción 3 s) | org | OK: entra una y la otra da "El cupo está completo" |
| 24 | Aceptar o rechazar una solicitud que el capitán retiró con la pestaña ya abierta | org | **Bug encontrado y corregido** (ver abajo) |
| 25 | Mobile: gestión con solicitudes e inscriptos | org | **Bug encontrado y corregido** (ver abajo) |
| 26 | Mobile: ficha con el bloque del capitán y un nombre largo | cap2 | Retoque visual corregido (ver abajo) |

## Bugs encontrados y corregidos

### Aceptar una solicitud ya retirada culpaba al torneo

Si el capitán retiraba la solicitud mientras el organizador tenía la lista
abierta, "Aceptar" o "Rechazar" mostraban **"Este torneo ya no existe o no es
tuyo."** El error `42501` de la base se traducía con el mensaje de la carga a
mano. Además, si era la única solicitud, la sección no se mostraba y el error
se perdía. Pasaba lo mismo si el torneo finalizaba con la pestaña abierta.

- **Arreglo:** `resolveRequestErrorMessage` en
  `src/utils/inscription-requests.ts`, con su test, dice "Esa solicitud ya no
  está pendiente: el capitán la retiró o ya se resolvió." El resto de los
  códigos se traduce igual que en la carga a mano. La sección se muestra
  siempre que haya un error.
- **Capturas:** [antes](img/solicitud-ya-retirada-antes.png) ·
  [después](img/solicitud-ya-retirada.png).

### Scroll horizontal en la gestión en mobile

A 390 px la página medía 442 px. El botón de WhatsApp nuevo en la fila de
inscriptos (sin wrap) y el `truncate` de una solicitud con nombre largo
ensanchaban el contenedor, porque este es un ítem de `<main>` (flex) sin
`min-w-0`.

- **Arreglo:** los botones de cada inscripto bajan juntos a otra línea, y el
  contenedor de la gestión lleva `w-full min-w-0`.
- **Capturas:** [antes](img/mobile-gestion-inscriptos-antes.png) ·
  [después](img/mobile-gestion-inscriptos.png) ·
  [solicitudes](img/mobile-gestion-solicitudes.png).

### Retoque: nombre largo en la ficha del capitán

No desbordaba, pero con un nombre largo "· Solicitud enviada" quedaba en una
columna angosta aparte. Ahora el nombre y el estado van en un solo texto que
se parte en varias líneas
([captura](img/mobile-ficha-capitan.png)).

## Observaciones (sin cambio, para decidir)

- **El organizador puede solicitar en su propio torneo** si es capitán de un
  equipo: la spec no lo prohíbe, y `request_inscription` solo evita el aviso
  a sí mismo. No se probó en el navegador. Si no tiene sentido, conviene
  agregar la regla a la spec.
- **Nombre del equipo con un solo equipo:** la fila pendiente muestra el
  nombre ("Los Halcones · Solicitud enviada"), pero las de inscripto,
  rechazada y finalizado no. Es una inconsistencia menor.
- Siguen diciendo "anotado/anotar" textos que ya existían antes de 140c75e y
  quedaron fuera de alcance: "Equipos anotados", "Anotar un equipo", el aviso
  `tournament_withdrawn`, la confirmación de la baja y los mensajes de
  `inscriptionErrorMessage`.

## Verificación final

`supabase test db` (632 tests), `node --test` sobre `src/**/*.test.ts` (241),
`tsc --noEmit` y `eslint src`: todo verde. ESLint deja un warning
preexistente en `TournamentList.tsx`, que no es de esta feature. La base local
quedó reseteada y el servidor del 3001, parado.
