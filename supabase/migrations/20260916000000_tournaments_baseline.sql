-- Baseline: `tournaments` tal como estaba en la base compartida (backup del 16/09),
-- antes de versionar el esquema. Se reproduce a propósito sin cambios, incluidas
-- las policies abiertas, que se corrigen en la migración siguiente.
--
-- En la base compartida esta migración ya está aplicada "a mano": se marca con
--   supabase migration repair --status applied 20260916000000
-- en vez de correrla.

create type public.sport_modality as enum ('futbol_5', 'futbol_7', 'futbol_8', 'futbol_11');

create type public.tournament_status as enum ('abierto', 'cerrado', 'en_curso', 'finalizado');

create table public.tournaments (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  description          text,
  sport_modality       public.sport_modality not null,
  zone                 text not null,
  location_lat         double precision,
  location_lng         double precision,
  price                numeric,
  price_currency       text default 'ARS',
  start_date           date not null,
  end_date             date,
  inscription_deadline date,
  status               public.tournament_status not null default 'abierto',
  contact_whatsapp     text,
  contact_instagram    text,
  source_url           text,
  image_url            text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  verified_at          timestamptz,
  created_by           uuid references auth.users (id),
  user_id              uuid references auth.users (id)
);

grant all on table public.tournaments to anon, authenticated, service_role;

alter table public.tournaments enable row level security;

create policy "Lectura publica de torneos"
  on public.tournaments for select using (true);

create policy "Permitir lectura pública"
  on public.tournaments for select using (true);

create policy "Solo usuarios logueados pueden crear torneos"
  on public.tournaments for insert to authenticated with check (true);

create policy "Solo usuarios logueados pueden editar torneos"
  on public.tournaments for update to authenticated using (true);

create policy "Solo usuarios logueados pueden borrar torneos"
  on public.tournaments for delete to authenticated using (true);

create policy "Usuarios autenticados insertan sus torneos"
  on public.tournaments for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propios torneos"
  on public.tournaments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuarios pueden borrar sus propios torneos"
  on public.tournaments for delete to authenticated
  using (auth.uid() = user_id);
