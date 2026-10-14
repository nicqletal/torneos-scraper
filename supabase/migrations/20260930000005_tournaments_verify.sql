-- "Sigue vigente": el organizador confirma que su torneo sigue en pie.
--
-- `verified_at` es la fecha de la última Verificación (ver CONTEXT.md). Con el
-- grant por columnas de 20260930000004 ya nadie la puede cambiar con un
-- update; esta migración cierra las otras dos puertas y abre la única buena:
--
--   1. Al crear: un torneo recién creado cuenta como verificado al crearlo.
--      `verified_at` pasa a ser obligatoria con `default now()`, y el insert
--      queda limitado a las columnas del formulario + `user_id`, para que el
--      organizador no pueda crear un torneo "verificado" en 2099.
--   2. Después: solo la función `verify_tournament`, que pone `now()` si quien
--      llama es el dueño y no toca ninguna otra columna.

-- 1. Los torneos que ya existen y nunca se verificaron cuentan desde que se
--    crearon (los de prueba van a quedar en rojo, y está bien: nadie los confirmó).

update public.tournaments
   set verified_at = coalesce(created_at, now())
 where verified_at is null;

alter table public.tournaments
  alter column verified_at set default now(),
  alter column verified_at set not null;

-- Insert por columnas: las del formulario (las de `TournamentInput` en
-- src/utils/tournament-form.ts, igual que el grant de update) más `user_id`,
-- que la policy de insert obliga a que sea `auth.uid()`. El resto lo pone la
-- base con su default. anon no tiene policy de insert; se le saca el
-- privilegio igual, como con el update.

revoke insert on public.tournaments from anon, authenticated;

grant insert (
  name,
  sport_modality,
  inscription_deadline,
  start_date,
  end_date,
  price,
  capacity,
  description,
  rules,
  venue_address,
  contact_whatsapp,
  contact_instagram,
  user_id
) on public.tournaments to authenticated;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tournaments' and column_name = 'zone') then
    execute 'grant insert (zone) on public.tournaments to authenticated';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tournaments' and column_name = 'zone_id') then
    execute 'grant insert (zone_id) on public.tournaments to authenticated';
  end if;
end $$;

-- 2. La verificación.
--
-- `security definer` hace que la función corra con los permisos de su dueño
-- (postgres) y no con los de quien la llama: así puede escribir `verified_at`,
-- que `authenticated` no puede. Por eso el control de quién es el dueño lo
-- hace la propia función, en el `where`, y no RLS.
--
-- `set search_path = ''` obliga a escribir todo con esquema (`public.`,
-- `auth.`): una función security definer no tiene que poder engañarse con
-- una tabla o función del mismo nombre en otro esquema.
--
-- Un torneo ajeno y uno que no existe dan el mismo error, para no confirmar
-- que existe un torneo con ese id. Un Finalizado no se verifica: ya no tiene
-- que confirmar que sigue en pie (el panel ni muestra el botón). Los torneos
-- copiados (sin organizador) los va a verificar el administrador cuando
-- exista ese rol; hoy `user_id` es null y nadie los puede verificar.

create or replace function public.verify_tournament(tournament_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  verified timestamptz;
begin
  update public.tournaments
     set verified_at = now()
   where id = tournament_id
     and user_id = auth.uid()
     and public.status(tournaments) <> 'finalizado'
  returning verified_at into verified;

  if verified is null then
    if exists (select 1 from public.tournaments
                where id = tournament_id and user_id = auth.uid()) then
      raise exception 'Un torneo finalizado no se verifica'
        using errcode = '22023';
    end if;
    raise exception 'El torneo no existe o no es tuyo'
      using errcode = '42501';
  end if;

  return verified;
end;
$$;

-- Postgres le da `execute` a todos (public) en toda función nueva, y Supabase
-- además se lo da a anon por default. Solo la llaman usuarios con sesión.
revoke execute on function public.verify_tournament(uuid) from public, anon;
grant execute on function public.verify_tournament(uuid) to authenticated;
