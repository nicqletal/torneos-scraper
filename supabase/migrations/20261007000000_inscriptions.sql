-- Inscripciones. Ver "Inscripciones" y "Visibilidad" en docs/decisiones-casos-de-uso.md.
--
-- Una Inscripción es el registro de un equipo en un torneo, cargado por el
-- organizador desde su panel. Es **por nombre** (solo `team_name`, el equipo no
-- está en la app) o **vinculada** (`team_id`, un Equipo de la app; entra en #5).
-- Nunca las dos cosas ni ninguna: mismo criterio que `tournaments_organizer_xor_copied`.
-- El nombre público de una vinculada sale del `join` con `teams`, así no queda
-- viejo si el equipo se renombra.

create table public.inscriptions (
  id            uuid primary key default gen_random_uuid(),
  -- La baja del torneo (`withdraw_tournament`) se lleva sus inscripciones.
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id       uuid references public.teams (id),
  team_name     text check (char_length(btrim(team_name)) between 2 and 50),
  created_at    timestamptz not null default now(),
  constraint inscriptions_linked_xor_named
    check ((team_id is null) <> (team_name is null))
);

-- Postgres no indexa solo las FK; el estado del torneo cuenta por torneo.
create index on public.inscriptions (tournament_id);

-- "Un Equipo tiene como mucho una Inscripción vinculada por torneo". Es parcial:
-- las inscripciones por nombre no tienen `team_id`, y dos equipos de afuera
-- pueden llamarse igual, así que el nombre no se restringe.
create unique index inscriptions_one_per_team
  on public.inscriptions (tournament_id, team_id)
  where team_id is not null;

-- 1. Lectura pública: solo el nombre (tabla de visibilidad).
--
-- RLS filtra filas, no columnas, así que lo público va por una vista. La vista
-- corre con los permisos de su dueño (postgres): saltea el RLS de
-- `inscriptions` y expone solo estas columnas. `anon` no recibe ningún grant
-- sobre la tabla: su única puerta es la vista. `team_id` va para que la ficha
-- pueda enlazar a la página pública del equipo (#5) y `created_at`, para
-- listar en el orden en que se cargaron.

create view public.tournament_inscriptions as
  select i.id,
         i.tournament_id,
         i.team_id,
         coalesce(i.team_name, t.name) as team_name,
         i.created_at
    from public.inscriptions i
    left join public.teams t on t.id = i.team_id;

revoke all on public.tournament_inscriptions from anon, authenticated;
grant select on public.tournament_inscriptions to anon, authenticated;

-- 2. El conteo, como columna calculada de PostgREST (igual que `status`):
--    `select('*, status, inscriptions_count')`. Cuenta por la vista y no por la
--    tabla a propósito: `status()` lo evalúa `anon` en el catálogo, y `anon` no
--    puede leer `inscriptions`.

create function public.inscriptions_count(t public.tournaments)
returns integer
language sql
stable
as $$
  select count(*)::integer
    from public.tournament_inscriptions
   where tournament_id = t.id
$$;

-- 3. El estado deja de recibir 0 inscripciones (ver 20260930000002).

create or replace function public.status(t public.tournaments)
returns text
language sql
stable
as $$
  select public.tournament_status(
    t.inscription_deadline,
    t.start_date,
    t.end_date,
    t.capacity,
    public.inscriptions_count(t),
    (now() at time zone 'America/Argentina/Buenos_Aires')::date
  )
$$;

-- 4. RLS. La única policy es la de lectura del organizador ("Gestión de
--    inscripciones: solo el organizador del torneo"). El subselect pasa por la
--    policy de lectura pública de `tournaments`, así que no hace falta
--    `security definer`. Un jugador con sesión no ve la tabla: solo la vista.
--
--    No hay policies ni privilegios de insert, update ni delete: cargar y
--    borrar van por `add_inscription` y `remove_inscription` (abajo), por la
--    misma razón que la Baja va por `withdraw_tournament`: las reglas "no se
--    carga con el cupo completo" y "un Finalizado no cambia sus inscripciones"
--    necesitan devolver un mensaje, y una policy solo puede afectar 0 filas en
--    silencio. Además el cupo hay que contarlo con el torneo bloqueado, o dos
--    altas a la vez lo pasan.

alter table public.inscriptions enable row level security;

-- Supabase da por default todos los privilegios sobre cada tabla nueva a anon
-- y authenticated (`alter default privileges`): se sacan y se devuelve solo la
-- lectura a authenticated, para que un insert, update o delete directo falle
-- con error y no afecte 0 filas en silencio.
revoke all on public.inscriptions from anon, authenticated;
grant select on public.inscriptions to authenticated;

create policy "inscriptions: el organizador ve las de sus torneos"
  on public.inscriptions for select to authenticated
  using (
    exists (
      select 1 from public.tournaments t
       where t.id = tournament_id
         and t.user_id = (select auth.uid())
    )
  );

-- 5. Cargar una inscripción por nombre.
--
-- `security definer` y `set search_path = ''`: igual que `withdraw_tournament`.
-- La función corre como su dueño, que sí puede insertar, así que el control de
-- quién es el organizador lo hace ella en el `where`. Un torneo ajeno, uno que
-- no existe y un torneo copiado (sin organizador) dan el mismo error, para no
-- confirmar que existe un torneo con ese id; así "un torneo copiado no admite
-- inscripciones" sale solo: `user_id` es null y nunca es `auth.uid()`.
--
-- `for update` bloquea el torneo hasta el final de la transacción: el cupo se
-- cuenta con la fila bloqueada, y dos altas a la vez se serializan.
-- La vinculada (#5) va a ser otra función, con `team_id`.

create function public.add_inscription(p_tournament_id uuid, p_team_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t    public.tournaments;
  v_id uuid;
begin
  select * into t
    from public.tournaments
   where id = p_tournament_id
     and user_id = auth.uid()
     for update;

  if not found then
    raise exception 'El torneo no existe o no es tuyo'
      using errcode = '42501';
  end if;

  if public.status(t) = 'finalizado' then
    raise exception 'Un torneo finalizado no cambia sus inscripciones'
      using errcode = '22023';
  end if;

  if t.capacity is not null and public.inscriptions_count(t) >= t.capacity then
    raise exception 'El cupo está completo: subí el cupo para anotar más equipos'
      using errcode = '23514';
  end if;

  insert into public.inscriptions (tournament_id, team_name)
  values (t.id, btrim(p_team_name))
  returning id into v_id;

  return v_id;
end;
$$;

-- 6. Borrar una inscripción. Se bloquea el torneo igual que al cargar, así el
--    estado que se mira es el que vale. Borrar una antes del cierre reabre un
--    torneo cerrado por cupo: no hay nada que hacer para eso, el estado se
--    calcula al leer.

create function public.remove_inscription(p_inscription_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.tournaments;
begin
  select tournaments.* into t
    from public.tournaments
    join public.inscriptions i on i.tournament_id = tournaments.id
   where i.id = p_inscription_id
     and tournaments.user_id = auth.uid()
     for update of tournaments;

  if not found then
    raise exception 'La inscripción no existe o no es tuya'
      using errcode = '42501';
  end if;

  if public.status(t) = 'finalizado' then
    raise exception 'Un torneo finalizado no cambia sus inscripciones'
      using errcode = '22023';
  end if;

  delete from public.inscriptions where id = p_inscription_id;
end;
$$;

-- Postgres le da `execute` a todos (public) en toda función nueva, y Supabase
-- además se lo da a anon por default. Solo las llaman usuarios con sesión.
revoke execute on function public.add_inscription(uuid, text) from public, anon;
grant execute on function public.add_inscription(uuid, text) to authenticated;

revoke execute on function public.remove_inscription(uuid) from public, anon;
grant execute on function public.remove_inscription(uuid) to authenticated;
