<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Contexto del proyecto

**Torneos Amateur BA** — webapp con dos partes:

1. **Torneos:** centraliza torneos de fútbol amateur en Buenos Aires (CABA + GBA), hoy dispersos en Instagram. El usuario filtra por zona, modalidad, precio y estado, y el flujo **termina en un deep link a WhatsApp o Instagram del organizador**.
2. **Equipos y buscar partido:** los equipos publican búsquedas de rival, se proponen partidos, los coordinan y cargan resultados, con historial de presentismo.

La app **nunca inscribe ni cobra**: la inscripción se arregla por fuera y el organizador la carga en su panel. Es un límite de producto, no una feature faltante.

Proyecto de la asignatura **Metodología de Sistemas** (fines educacionales), hecho por un equipo de 4 personas que comparte este repo, sobre un problema real. Objetivo doble: que sirva de verdad y que sea vehículo de aprendizaje del stack. Eso no es excusa para bajar la vara de calidad.

## Documentos de referencia

Leer en este orden antes de tocar código:

1. **`CONTEXT.md`** — glosario del dominio. Usar **exactamente** esos términos en código, issues, PRs y UI (por ejemplo, un partido "se cae", nunca "se suspende"; se dice "baja", no "eliminar").
2. **`docs/decisiones-casos-de-uso.md`** — reglas de negocio vigentes, por módulo, incluida la tabla de visibilidad que define las reglas de acceso (RLS). **Es la fuente de verdad del alcance.** Si contradice al PDF, manda este archivo.
3. **`docs/adr/`** — decisiones grandes con su porqué. No "arreglar" algo que un ADR decidió a propósito.
4. `docs/casos-de-uso.pdf` — casos de uso originales de la materia (módulos A–F y T). Sirve como detalle de los flujos, pero está corregido por el punto 2.

Históricos (desactualizados, no usar para decidir alcance):

- `Explicacion_Proyecto.txt` / `Torneo.txt` — documento inicial. Excluía cuentas, equipos y matching, que ahora sí entran.
- `walktrogh torneos scaper - 26-8` — walkthrough del stack y de las decisiones de UI/UX del prototipo.
- Site map del prototipo (anterior a las decisiones): https://claude.ai/code/artifact/5c0961ca-a8b6-4d5c-aa48-cbb1bc13ba53

## Stack

Next.js 16 (App Router, RSC + Server Actions) · TypeScript · Tailwind v4 (tokens en `@theme` dentro de `src/app/globals.css`, sin `tailwind.config`) · Supabase (Postgres + Auth + Storage) · Vercel · framer-motion + lucide-react.

Gestor de paquetes: **pnpm** (hay `pnpm-lock.yaml` y `pnpm-workspace.yaml`). Ignorar `package-lock.json`.

## Mapa del código

Es el **prototipo** de agosto: sirve de base visual, pero no sigue varias reglas de `docs/decisiones-casos-de-uso.md` (ver "Pendientes técnicos" al final de ese archivo).

```
src/app/layout.tsx            header sticky + footer; lee la sesión y arma el link de "Cargar torneo"
src/app/page.tsx              Home: <Filters> lateral + <TournamentList>, ambos en Suspense
src/app/torneos/[id]/         ficha pública del torneo (+ loading.tsx)
src/app/login/                page.tsx + actions.ts (login / signup / logout)
src/app/crear-torneo/         alta de torneo, Server Action inline
src/app/mis-torneos/          listado propio + baja
src/proxy.ts                  middleware: protege /admin, /crear-torneo, /mis-torneos
src/utils/supabase/           client.ts (browser) y server.ts (cookies)
src/components/               Filters, TournamentList, TournamentCard, UserMenu, Footer
```

## Convenciones

- **Rutas y UI en español** (`/crear-torneo`, `/mis-torneos`), **código en inglés** (`tournaments`, `sport_modality`, `start_date`).
- Los filtros se guardan en **query params**, no en estado local: una vista filtrada tiene que ser un link compartible.
- Server Components por defecto; `'use client'` solo donde hay interacción real (`Filters`, `UserMenu`).
- Después de escribir en la base, `revalidatePath('/')` y la ruta afectada.
- Los colores se usan por token (`bg-brand-lime`, `border-brand-border`), nunca hex sueltos ni utilidades de Tailwind por defecto tipo `emerald-500`. **Hay deuda de diseño**: `/login`, `/crear-torneo` y `/mis-torneos` todavía usan el estilo viejo (esmeralda, `rounded-2xl`) en vez del sistema lima/negro del resto.

## Base de datos local y tests

El esquema vive en `supabase/migrations/` y los tests de base (pgTAP) en `supabase/tests/`. Hace falta Docker corriendo y el Supabase CLI actualizado (`brew upgrade supabase`; el `config.toml` no lo lee una versión vieja).

```bash
supabase start      # levanta la base local y aplica las migraciones
supabase db reset   # la recrea desde cero con las migraciones del repo
supabase test db    # corre los tests pgTAP de supabase/tests/
```

Toda policy de RLS nueva viene con su test en `supabase/tests/`.

La lógica pura de TypeScript (validación y normalización de formularios, en `src/utils/`) se testea con el runner de Node, sin dependencias extra: los tests son `*.test.ts` al lado del archivo y se corren con `pnpm test`.

### Aplicar a la base compartida

`sport_modality` y `tournaments` ya existían en la base compartida antes de versionar el esquema (backup del 16/09). La primera vez, esas dos migraciones se marcan como aplicadas en vez de correrlas:

```bash
supabase migration repair --status applied 20260928000003 20260930000000
supabase db push --include-all
```

`--include-all` hace falta porque hay migraciones con fecha anterior a la última aplicada (por ejemplo las de equipos, si entran después).

## Seguridad — leer antes de tocar

RLS y auth son el punto crítico del proyecto:

- Qué es público y qué no lo define la **tabla de visibilidad** de `docs/decisiones-casos-de-uso.md`. Cada fila de esa tabla tiene que existir como policy de RLS, no solo como un filtro en la UI.
- El rol de administrador nunca se puede escribir desde el cliente.
- Las transiciones de estado de partidos y propuestas van por funciones de Postgres, no por `update` directos.
- Al cliente solo llega la `anon key`. La `service_role key` nunca sale de contexto server controlado.
- **Toda policy de RLS se revisa línea por línea y se explica antes de aplicarla.** No delegar ciegamente.

## Quién publica torneos (resuelto)

Publican los **organizadores** (cualquier usuario con sesión). Todo torneo tiene exactamente un organizador. No existe el "torneo copiado" sin organizador: se descartó el 07/10/2026 y `tournaments.user_id` es obligatorio en la base. Organizador y administrador son roles distintos: el organizador no tiene ningún poder de administración.

## Forma de trabajo

- Avanzar según los issues del repo, sin adelantar etapas. Si una regla no está en `docs/decisiones-casos-de-uso.md`, preguntar en vez de inventarla, y después agregarla a ese archivo.
- Si aparece un término nuevo del dominio, agregarlo a `CONTEXT.md` en el mismo PR.
- Explicar decisiones de arquitectura no pedidas **antes** de aplicarlas.
- Frenar y esperar confirmación en todo lo que toque RLS o autenticación.
- Preferir código simple y legible a abstracciones tempranas: el objetivo incluye aprender el stack.
- Actuar como tutor: explicar el código, no solo producirlo.

## Agent skills

### Issue tracker

Los issues y specs viven en GitHub Issues del repo, en español y con los términos de `CONTEXT.md`. Ver `docs/agents/issue-tracker.md`.

### Triage labels

Los cinco labels canónicos con su nombre por defecto (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Ver `docs/agents/triage-labels.md`.

### Domain docs

Contexto único: `CONTEXT.md` y `docs/adr/` en la raíz. Ver `docs/agents/domain.md`.
