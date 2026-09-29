-- Zonas: región > corredor > zona (ver CONTEXT.md, "Geografía").
-- La lista es cerrada: se carga por SQL y no hay pantalla para editarla.

create table public.regions (
  id   text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null
);

create table public.corridors (
  id        text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  region_id text not null references public.regions (id),
  name      text not null
);

create table public.zones (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  corridor_id text not null references public.corridors (id),
  name        text not null
);

create index on public.corridors (region_id);
create index on public.zones (corridor_id);

-- RLS: lectura pública y ninguna policy de escritura.
alter table public.regions   enable row level security;
alter table public.corridors enable row level security;
alter table public.zones     enable row level security;

create policy "regions: lectura pública"
  on public.regions for select to anon, authenticated using (true);

create policy "corridors: lectura pública"
  on public.corridors for select to anon, authenticated using (true);

create policy "zones: lectura pública"
  on public.zones for select to anon, authenticated using (true);

-- Datos de prueba hasta que esté la planilla real.
insert into public.regions (id, name) values
  ('caba', 'CABA'),
  ('gba',  'GBA');

insert into public.corridors (id, region_id, name) values
  ('caba-norte', 'caba', 'CABA Norte'),
  ('gba-norte',  'gba',  'GBA Norte'),
  ('gba-oeste',  'gba',  'GBA Oeste');

insert into public.zones (id, corridor_id, name) values
  ('palermo',       'caba-norte', 'Palermo'),
  ('belgrano',      'caba-norte', 'Belgrano'),
  ('vicente-lopez', 'gba-norte',  'Vicente López'),
  ('san-isidro',    'gba-norte',  'San Isidro'),
  ('moron',         'gba-oeste',  'Morón');
