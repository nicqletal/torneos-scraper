-- Avisos: lo que cada usuario ve en la campanita. Ver "Avisos de Partidos" y
-- "Campanita" en docs/decisiones-casos-de-uso.md, y docs/diseno-partidos.md.
--
-- Se guarda el hecho, no el texto: `kind` dice qué pasó y `params` es la foto
-- de los nombres y datos del momento (si el rival se cambia el nombre, el
-- aviso viejo no cambia). El texto y el link los arma `src/utils/notices.ts`.

-- Los 16 disparadores de Partidos, en el orden de la tabla de las decisiones,
-- más la baja de torneo.
create type public.notice_kind as enum (
  'proposal_received',      -- "Te propusieron un partido"
  'proposal_rejected',      -- "Rechazaron tu propuesta"
  'match_agreed',           -- "Partido acordado"
  'proposal_annulled',      -- "Se anuló tu propuesta: ya no tienen ese horario"
  'proposal_cancelled',     -- "Se canceló tu propuesta"
  'venue_to_confirm',       -- "Confirmá cancha y hora"
  'match_coordinated',      -- "Partido coordinado"
  'match_dropped',          -- "Se cayó el partido"
  'mutual_drop_requested',  -- "Piden tirar el partido de común acuerdo"
  'mutual_drop_accepted',   -- "Se cayó de común acuerdo"
  'mutual_drop_rejected',   -- "Rechazaron tirarlo de común acuerdo"
  'result_to_confirm',      -- "Cargaron el resultado: confirmá o corregí"
  'match_played',           -- "Jugado"
  'no_show_reported',       -- "Dicen que no fueron: respondé"
  'match_in_conflict',      -- "Partido en conflicto"
  'rating_revealed',        -- "Ya podés ver tu calificación"
  'tournament_withdrawn'    -- "Se dio de baja el torneo"
);

create table public.notices (
  id         uuid primary key default gen_random_uuid(),
  -- cascade: un aviso no tiene sentido sin su destinatario.
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       public.notice_kind not null,
  params     jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

-- La campanita pide los últimos 30 de un usuario y cuenta sus no leídos.
create index notices_user_recent on public.notices (user_id, created_at desc);

-- RLS: cada uno lee solo los suyos (tabla de visibilidad). Sin policies de
-- escritura y sin privilegios de escritura: los avisos los escribe `notify`
-- desde las funciones de cada acción, y se marcan leídos con
-- `mark_notices_read`.
alter table public.notices enable row level security;

revoke all on public.notices from anon, authenticated;
grant select on public.notices to authenticated;

create policy "notices: cada uno lee los suyos"
  on public.notices for select
  to authenticated
  using (user_id = (select auth.uid()));

-- notify: reparte un aviso. Lo llaman las funciones de cada acción (la baja de
-- torneo y, en las etapas siguientes, las de Partidos), nunca el cliente.
--
--   p_team_ids:      uno o dos equipos (los dos de un partido).
--   p_captains_only: true para los avisos que piden una acción (solo el
--                    capitán puede hacerla); false para los informativos, que
--                    van a todo el plantel, capitán incluido.
--
-- Reglas (ver "Avisos de Partidos"):
--   - capitán y plantel del momento: se leen ahora de `team_members`, así que
--     quien entra después no recibe avisos viejos y quien se fue no recibe más;
--   - una fila por usuario distinto: quien está en los dos planteles recibe uno;
--   - nunca a quien hizo la acción (`auth.uid()`).
--
-- `security invoker` (el default): corre con los permisos de quien la llama,
-- que siempre es una función `security definer`, dueña de las tablas.
create function public.notify(
  p_kind          public.notice_kind,
  p_params        jsonb,
  p_team_ids      uuid[],
  p_captains_only boolean default false
)
returns void
language sql
set search_path = ''
as $$
  insert into public.notices (user_id, kind, params)
  select distinct m.user_id, p_kind, p_params
    from public.team_members m
   where m.team_id = any (p_team_ids)
     and (m.is_captain or not p_captains_only)
     -- `is distinct from`: si no hay sesión (auth.uid() null) no se excluye a nadie.
     and m.user_id is distinct from (select auth.uid());
$$;

-- Helper interno: sin `execute` para nadie de la API.
revoke execute on function public.notify(public.notice_kind, jsonb, uuid[], boolean)
  from public, anon, authenticated;

-- mark_notices_read: abrir la campanita marca leídos los avisos que se ven.
-- Recibe los ids que se mostraron (no "todos"), así un aviso que llega
-- mientras la campanita está abierta sigue contando como no leído. Solo toca
-- avisos propios: un id ajeno se ignora sin error, para no confirmar que existe.
create function public.mark_notices_read(p_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notices
     set read_at = now()
   where id = any (p_ids)
     and user_id = (select auth.uid())
     and read_at is null;
$$;

-- Postgres le da `execute` a todos (public) en toda función nueva, y Supabase
-- además se lo da a anon por default. Solo la llaman usuarios con sesión.
revoke execute on function public.mark_notices_read(uuid[]) from public, anon;
grant execute on function public.mark_notices_read(uuid[]) to authenticated;
