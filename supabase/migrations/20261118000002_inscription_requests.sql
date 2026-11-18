-- Solicitudes de inscripción. Ver "Solicitudes de inscripción" en
-- docs/especificaciones-y-requerimientos/decisiones-casos-de-uso.md.
--
-- Un capitán pide desde la app que su equipo entre a un torneo. No es una
-- Inscripción ni ocupa cupo: recién cuando el organizador la acepta se crea la
-- Inscripción vinculada. El pago se arregla siempre por fuera.

-- 1. Interruptor por torneo: "Recibir solicitudes desde la app". Encendido por
--    defecto, también en los torneos que ya existían. Lo cambia el organizador
--    con un update directo: la policy "el organizador edita los suyos" limita
--    las filas y este grant suma solo esta columna (ver 20260930000004).
alter table public.tournaments
  add column accepts_requests boolean not null default true;

grant update (accepts_requests) on public.tournaments to authenticated;

-- 2. La tabla. Una fila por (torneo, equipo):
--    - `pendiente`: esperando al organizador;
--    - `rechazada`: queda para que el equipo no pueda volver a solicitar.
--    Retirarla (el capitán) y aceptarla (el organizador) borran la fila: la
--    aceptada pasa a ser la Inscripción vinculada, y la retirada no deja rastro
--    para que se pueda volver a solicitar.
create table public.inscription_requests (
  id            uuid primary key default gen_random_uuid(),
  -- La baja del torneo se lleva sus solicitudes, después de avisar.
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id       uuid not null references public.teams (id),
  status        text not null default 'pendiente'
                check (status in ('pendiente', 'rechazada')),
  created_at    timestamptz not null default now(),
  constraint inscription_requests_one_per_team unique (tournament_id, team_id)
);

create index on public.inscription_requests (team_id);

-- 3. RLS (tabla de visibilidad: "Solicitudes de inscripción: el organizador
--    del torneo y el capitán del equipo que la mandó"). Sin escritura directa:
--    todo pasa por las funciones de abajo, que devuelven un mensaje por cada
--    regla que no se cumple.
alter table public.inscription_requests enable row level security;

revoke all on public.inscription_requests from anon, authenticated;
grant select on public.inscription_requests to authenticated;

create policy "inscription_requests: el organizador ve las de sus torneos"
  on public.inscription_requests for select to authenticated
  using (
    exists (
      select 1 from public.tournaments t
       where t.id = tournament_id
         and t.user_id = (select auth.uid())
    )
  );

create policy "inscription_requests: el capitán ve las de su equipo"
  on public.inscription_requests for select to authenticated
  using (public.is_team_captain(team_id));

-- 4. Solicitar. Solo el capitán, en nombre de su equipo.
create function public.request_inscription(p_tournament_id uuid, p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t    public.tournaments;
  team public.teams;
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión' using errcode = '42501';
  end if;

  select * into team from public.teams where id = p_team_id;
  if not found or not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede solicitar la inscripción de su equipo'
      using errcode = '42501';
  end if;

  -- Una Suspensión frena toda acción nueva de la cuenta (como publicar o
  -- buscar rival). Un equipo bloqueado por faltas sí puede: el bloqueo es de
  -- buscar partido, y el organizador ve las faltas para decidir.
  if public.account_is_suspended((select auth.uid())) then
    raise exception 'Tu cuenta está suspendida: no podés solicitar inscripciones'
      using errcode = '42501';
  end if;

  if team.dissolved_at is not null then
    raise exception 'Un equipo disuelto no recibe inscripciones'
      using errcode = '55000';
  end if;

  -- `for update`: se serializa con aceptar, rechazar y la baja del torneo.
  select * into t from public.tournaments where id = p_tournament_id for update;
  if not found then
    raise exception 'El torneo no existe' using errcode = 'P0002';
  end if;

  -- Lo que ya pasó con este equipo en este torneo va antes que el estado del
  -- torneo: "ya está inscripto" le sirve más al capitán que "no está abierto".
  if exists (select 1 from public.inscriptions where tournament_id = t.id and team_id = team.id) then
    raise exception 'Tu equipo ya está inscripto en este torneo' using errcode = '23505';
  end if;

  case (select status from public.inscription_requests where tournament_id = t.id and team_id = team.id)
    when 'pendiente' then
      raise exception 'Tu equipo ya tiene una solicitud pendiente en este torneo' using errcode = '23505';
    when 'rechazada' then
      raise exception 'El organizador no aceptó la solicitud de tu equipo en este torneo' using errcode = '55000';
    else null;
  end case;

  if not t.accepts_requests then
    raise exception 'El organizador no recibe solicitudes desde la app: escribile por WhatsApp o Instagram'
      using errcode = '55000';
  end if;

  if public.status(t) <> 'abierto' then
    raise exception 'Este torneo ya no recibe solicitudes: no está abierto' using errcode = '55000';
  end if;

  insert into public.inscription_requests (tournament_id, team_id)
  values (t.id, team.id)
  returning id into v_id;

  -- Aviso al organizador, salvo que sea él mismo el que solicita.
  if t.user_id is distinct from (select auth.uid()) then
    insert into public.notices (user_id, kind, params)
    values (t.user_id, 'inscription_request_received',
            jsonb_build_object('tournament_id', t.id, 'tournament_name', t.name,
                               'team_id', team.id, 'team_name', team.name));
  end if;

  return v_id;
end;
$$;

revoke execute on function public.request_inscription(uuid, uuid) from public, anon;
grant execute on function public.request_inscription(uuid, uuid) to authenticated;

-- 5. Retirar. El capitán, mientras está pendiente. Borra la fila: no avisa al
--    organizador y el equipo puede volver a solicitar. Una solicitud ajena o
--    que no existe dan el mismo error, para no confirmar que existe.
create function public.withdraw_inscription_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.inscription_requests
   where id = p_request_id
     and status = 'pendiente'
     and public.is_team_captain(team_id);

  if not found then
    raise exception 'La solicitud no existe o no es de tu equipo' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.withdraw_inscription_request(uuid) from public, anon;
grant execute on function public.withdraw_inscription_request(uuid) to authenticated;

-- 6. Aceptar. El organizador del torneo. Crea la Inscripción vinculada con
--    `add_linked_inscription`, así valen exactamente las mismas reglas que la
--    carga a mano: no Finalizado (aunque sí Cerrado o En curso), equipo no
--    disuelto, no anotado dos veces y cupo con lugar, con el torneo bloqueado.
--    `add_linked_inscription` también resuelve la solicitud (ver el punto 12).
--    Después avisa solo al capitán.
create function public.accept_inscription_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r    public.inscription_requests;
  t    public.tournaments;
  v_id uuid;
begin
  select ir.* into r
    from public.inscription_requests ir
    join public.tournaments on tournaments.id = ir.tournament_id
   where ir.id = p_request_id
     and ir.status = 'pendiente'
     and tournaments.user_id = (select auth.uid())
     for update of ir;

  if not found then
    raise exception 'La solicitud no existe o no es de tu torneo' using errcode = '42501';
  end if;

  v_id := public.add_linked_inscription(r.tournament_id, r.team_id);

  select * into t from public.tournaments where id = r.tournament_id;
  perform public.notify(
    'inscription_request_accepted',
    jsonb_build_object('tournament_id', t.id, 'tournament_name', t.name,
                       'team_id', r.team_id,
                       'team_name', (select name from public.teams where id = r.team_id)),
    array[r.team_id],
    true);

  return v_id;
end;
$$;

revoke execute on function public.accept_inscription_request(uuid) from public, anon;
grant execute on function public.accept_inscription_request(uuid) to authenticated;

-- 7. Rechazar. El organizador del torneo, sin motivo. La fila queda como
--    `rechazada` para que el equipo no pueda volver a solicitar en ese torneo
--    (el organizador igual lo puede cargar a mano). Avisa solo al capitán.
create function public.reject_inscription_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.inscription_requests;
  t public.tournaments;
begin
  update public.inscription_requests ir
     set status = 'rechazada'
    from public.tournaments
   where ir.id = p_request_id
     and ir.status = 'pendiente'
     and tournaments.id = ir.tournament_id
     and tournaments.user_id = (select auth.uid())
  returning ir.* into r;

  if not found then
    raise exception 'La solicitud no existe o no es de tu torneo' using errcode = '42501';
  end if;

  select * into t from public.tournaments where id = r.tournament_id;
  perform public.notify(
    'inscription_request_rejected',
    jsonb_build_object('tournament_id', t.id, 'tournament_name', t.name,
                       'team_id', r.team_id,
                       'team_name', (select name from public.teams where id = r.team_id)),
    array[r.team_id],
    true);
end;
$$;

revoke execute on function public.reject_inscription_request(uuid) from public, anon;
grant execute on function public.reject_inscription_request(uuid) to authenticated;

-- 8. WhatsApp de los capitanes para el organizador (tabla de visibilidad:
--    "WhatsApp de un capitán"). Lo ve el organizador del torneo mientras el
--    equipo tiene una solicitud pendiente o una Inscripción vinculada ahí, y el
--    torneo no está Finalizado. Siempre el del capitán actual. A cualquier otro
--    no le devuelve filas, sin confirmar que el torneo existe. `security
--    definer` porque los contactos ajenos no se ven por RLS (igual que
--    `rival_captain_whatsapp`).
create function public.tournament_captain_whatsapps(p_tournament_id uuid)
returns table (team_id uuid, whatsapp text)
language sql
stable
security definer
set search_path = ''
as $$
  select teams.team_id, c.whatsapp
    from public.tournaments t
    cross join lateral (
      select i.team_id from public.inscriptions i
       where i.tournament_id = t.id and i.team_id is not null
      union
      select ir.team_id from public.inscription_requests ir
       where ir.tournament_id = t.id and ir.status = 'pendiente'
    ) teams
    join public.team_members cap on cap.team_id = teams.team_id and cap.is_captain
    join public.profile_contacts c on c.user_id = cap.user_id
   where t.id = p_tournament_id
     and t.user_id = (select auth.uid())
     and public.status(t) <> 'finalizado'
     and c.whatsapp is not null;
$$;

revoke execute on function public.tournament_captain_whatsapps(uuid) from public, anon;
grant execute on function public.tournament_captain_whatsapps(uuid) to authenticated;

-- 9. Disolver el equipo retira sus solicitudes pendientes, sin aviso. Las
--    Inscripciones vinculadas ya aceptadas se quedan: un equipo disuelto
--    conserva su historia. Las rechazadas también quedan (no molestan: un
--    equipo disuelto ya no solicita). El resto queda igual que en
--    20261028000006_matches.sql.
create or replace function public.dissolve_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dissolved_at timestamptz;
  v_search_ids   uuid[];
begin
  if (select auth.uid()) is null then raise exception 'Tenés que iniciar sesión'; end if;

  select dissolved_at into v_dissolved_at
    from public.teams where id = p_team_id for update;
  if not found then raise exception 'No se encontró el equipo'; end if;
  if not public.is_team_captain(p_team_id) then
    raise exception 'Solo el capitán puede disolver el equipo';
  end if;
  if v_dissolved_at is not null then raise exception 'El equipo ya está disuelto'; end if;

  if exists (
    select 1 from public.match_sides s join public.matches m on m.id = s.match_id
     where s.team_id = p_team_id
       and public.match_phase(m, now()) in ('por_jugarse', 'esperando_resultado')
  ) then
    raise exception 'Tenés un partido pendiente: tiralo o cerrá el resultado antes de disolver';
  end if;

  update public.teams set dissolved_at = now() where id = p_team_id;
  delete from public.team_invites where team_id = p_team_id;
  delete from public.inscription_requests where team_id = p_team_id and status = 'pendiente';

  with cancelled as (
    update public.rival_searches
       set cancelled_at = now()
     where team_id = p_team_id and cancelled_at is null
    returning id
  )
  select array_agg(id) into v_search_ids from cancelled;

  if v_search_ids is not null then
    perform public.cancel_proposals(
      array(select id from public.search_slots where search_id = any (v_search_ids)),
      'busqueda_cancelada');
  end if;
end;
$$;

-- 10. Avisos de la Baja del torneo (la del organizador y la del
--     administrador usan esta función). Además del plantel de cada equipo
--     inscripto, avisa al capitán de cada equipo con una solicitud pendiente,
--     porque puede haber pagado antes de que lo aceptaran. Un aviso por
--     jugador dentro de cada tipo, pero son hechos distintos: un capitán con
--     un equipo inscripto y otro con una solicitud pendiente recibe los dos.
--     El resto queda igual que en 20261117000002_admin_reports_support.sql.
create or replace function public.create_withdrawal_notices(p_tournament_id uuid, p_name text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notices (user_id, kind, params)
  select distinct on (m.user_id)
         m.user_id,
         'tournament_withdrawn',
         jsonb_build_object('tournament_name', p_name, 'team_id', tm.id, 'team_name', tm.name)
    from public.inscriptions i
    join public.teams tm on tm.id = i.team_id
    join public.team_members m on m.team_id = tm.id
   where i.tournament_id = p_tournament_id
     and m.user_id is distinct from (select auth.uid())
   order by m.user_id, tm.id;

  insert into public.notices (user_id, kind, params)
  select distinct on (m.user_id)
         m.user_id,
         'inscription_request_withdrawn',
         jsonb_build_object('tournament_name', p_name, 'team_id', tm.id, 'team_name', tm.name)
    from public.inscription_requests ir
    join public.teams tm on tm.id = ir.team_id
    join public.team_members m on m.team_id = tm.id and m.is_captain
   where ir.tournament_id = p_tournament_id
     and ir.status = 'pendiente'
     and m.user_id is distinct from (select auth.uid())
   order by m.user_id, tm.id;
$$;

revoke execute on function public.create_withdrawal_notices(uuid, text) from public, anon, authenticated;

-- 11. Contador de solicitudes pendientes, como columna calculada de PostgREST
--     (igual que `inscriptions_count`): `select('*, pending_requests_count')`.
--     Corre con los permisos de quien llama, así que el RLS de la tabla hace
--     que solo el organizador (o el capitán, por las suyas) cuente algo.
create function public.pending_requests_count(t public.tournaments)
returns integer
language sql
stable
as $$
  select count(*)::integer
    from public.inscription_requests
   where tournament_id = t.id and status = 'pendiente'
$$;

-- 12. Cargar a mano un equipo que tenía una solicitud pendiente la resuelve:
--     ya está inscripto, así que la solicitud deja de estar pendiente (si no,
--     quedaría en la lista y "Aceptar" fallaría con "ya está anotado"). Sin
--     aviso: es la carga a mano de siempre. El resto queda igual que en
--     20261014000004_linked_inscriptions.sql.
create or replace function public.add_linked_inscription(p_tournament_id uuid, p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t    public.tournaments;
  team public.teams;
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

  select * into team from public.teams where id = p_team_id;

  if not found then
    raise exception 'El equipo no existe'
      using errcode = 'P0002';
  end if;

  if team.dissolved_at is not null then
    raise exception 'Un equipo disuelto no recibe inscripciones'
      using errcode = '55000';
  end if;

  if exists (
    select 1 from public.inscriptions
     where tournament_id = t.id and team_id = p_team_id
  ) then
    raise exception 'Ese equipo ya está anotado en este torneo'
      using errcode = '23505';
  end if;

  if t.capacity is not null and public.inscriptions_count(t) >= t.capacity then
    raise exception 'El cupo está completo: subí el cupo para anotar más equipos'
      using errcode = '23514';
  end if;

  insert into public.inscriptions (tournament_id, team_id)
  values (t.id, p_team_id)
  returning id into v_id;

  delete from public.inscription_requests
   where tournament_id = t.id and team_id = p_team_id and status = 'pendiente';

  return v_id;
end;
$$;
