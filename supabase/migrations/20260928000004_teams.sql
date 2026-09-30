-- Equipos y plantel. Ver "Equipos" y "Visibilidad" en docs/decisiones-casos-de-uso.md.

-- Enum y no text: el orden de declaración es el orden del nivel, y la
-- búsqueda de rival lo usa para no cruzar niveles a dos escalones.
create type public.team_level as enum ('recreativo', 'intermedio', 'competitivo');

create table public.teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 2 and 50),
  zone_id      text not null references public.zones (id),
  modality     public.sport_modality not null,
  level        public.team_level not null,
  crest_url    text,
  dissolved_at timestamptz,
  created_at   timestamptz not null default now()
);

create index on public.teams (zone_id);

-- El capitán es una marca dentro del plantel, no una columna de teams:
-- así quién es el capitán queda tan privado como el resto del plantel.
create table public.team_members (
  team_id    uuid not null references public.teams (id) on delete cascade,
  -- restrict: borrar una cuenta no puede dejar un equipo sin capitán ni
  -- huecos en su historia. La baja de cuenta todavía no está definida.
  user_id    uuid not null references public.profiles (id) on delete restrict,
  is_captain boolean not null default false,
  joined_at  timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index on public.team_members (user_id);

-- Como mucho un capitán por equipo. Que haya al menos uno lo garantizan
-- las funciones, que son la única forma de modificar el plantel.
create unique index team_members_one_captain
  on public.team_members (team_id)
  where is_captain;

-- Helpers para las policies. Son security definer porque una policy de
-- team_members que consulte team_members se llamaría a sí misma sin fin.
create function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = (select auth.uid())
  );
$$;

create function public.is_team_captain(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = (select auth.uid()) and is_captain
  );
$$;

-- Crear equipo (UC-25): inserta el equipo y al creador como capitán,
-- en una sola transacción.
create function public.create_team(
  p_name     text,
  p_zone_id  text,
  p_modality public.sport_modality,
  p_level    public.team_level
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_team_id uuid;
begin
  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  -- Bloquea el perfil hasta el final de la transacción: si el mismo usuario
  -- crea dos equipos a la vez, el segundo espera y cuenta bien el límite.
  perform 1 from public.profiles where id = v_user_id for update;

  if not exists (
    select 1 from public.profile_contacts
    where user_id = v_user_id and whatsapp is not null
  ) then
    raise exception 'Cargá tu WhatsApp en el perfil para crear un equipo';
  end if;

  if (
    select count(*)
    from public.team_members m
    join public.teams t on t.id = m.team_id
    where m.user_id = v_user_id and m.is_captain and t.dissolved_at is null
  ) >= 3 then
    raise exception 'Ya sos capitán de 3 equipos, que es el máximo';
  end if;

  insert into public.teams (name, zone_id, modality, level)
  values (btrim(p_name), p_zone_id, p_modality, p_level)
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, is_captain)
  values (v_team_id, v_user_id, true);

  return v_team_id;
end;
$$;

revoke execute on function public.create_team(text, text, public.sport_modality, public.team_level) from public, anon;
grant execute on function public.create_team(text, text, public.sport_modality, public.team_level) to authenticated;

-- RLS
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;

create policy "teams: lectura pública"
  on public.teams for select to anon, authenticated using (true);

create policy "teams: el capitán edita su equipo activo"
  on public.teams for update to authenticated
  using (public.is_team_captain(id) and dissolved_at is null)
  with check (public.is_team_captain(id));

create policy "team_members: solo los integrantes ven el plantel"
  on public.team_members for select to authenticated
  using (public.is_team_member(team_id));

-- Columnas editables por el capitán. dissolved_at queda afuera:
-- disolver va a ser una función, con sus propias reglas.
revoke update on public.teams from anon, authenticated;
grant update (name, zone_id, modality, level, crest_url) on public.teams to authenticated;

-- team_members no tiene policies de escritura: el plantel solo cambia
-- a través de funciones (crear, unirse, salir, sacar, pasar capitanía).
