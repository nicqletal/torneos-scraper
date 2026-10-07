-- Perfiles, contactos privados y administradores.
-- Ver "Cuenta y acceso" y "Visibilidad" en docs/decisiones-casos-de-uso.md.

-- Datos públicos del usuario (página del organizador).
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 50),
  avatar_url   text,
  zone_id      text references public.zones (id),
  created_at   timestamptz not null default now()
);

-- El WhatsApp va aparte porque RLS filtra filas, no columnas:
-- si estuviera en profiles, leer el perfil público expondría el número.
create table public.profile_contacts (
  user_id  uuid primary key references public.profiles (id) on delete cascade,
  whatsapp text check (whatsapp ~ '^549[0-9]{10}$')
);

-- Administradores: se cargan a mano en la base. Sin policies,
-- así que nadie la puede leer ni escribir desde la API.
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Al registrarse, se crean el perfil y la fila de contacto.
-- El nombre llega en options.data.display_name del signUp.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.profile_contacts (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuarios que ya existían antes de esta tabla (cuentas de prueba del prototipo).
-- El nombre sale del email (solo para estas cuentas) y se ajusta a 2..50 caracteres.
insert into public.profiles (id, display_name)
select id,
       case when char_length(prefix) < 2 then rpad(prefix, 2, '_')
            else left(prefix, 50)
       end
from (select id, split_part(email, '@', 1) as prefix from auth.users) as u
on conflict (id) do nothing;

insert into public.profile_contacts (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- RLS
alter table public.profiles         enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.admins           enable row level security;

create policy "profiles: lectura pública"
  on public.profiles for select to anon, authenticated using (true);

create policy "profiles: cada uno edita el suyo"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profile_contacts: cada uno ve el suyo"
  on public.profile_contacts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "profile_contacts: cada uno edita el suyo"
  on public.profile_contacts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Columnas editables: el usuario no puede tocar id ni created_at.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, zone_id) on public.profiles to authenticated;

revoke update on public.profile_contacts from anon, authenticated;
grant update (whatsapp) on public.profile_contacts to authenticated;
