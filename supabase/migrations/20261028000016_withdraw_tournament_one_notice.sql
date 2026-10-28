-- La baja de un torneo avisa una sola vez a cada jugador (ver "Avisos" en
-- docs/decisiones-casos-de-uso.md: un solo aviso por hecho). Antes iba un aviso
-- por equipo inscripto, así que un jugador en dos equipos anotados recibía
-- dos. Ahora el aviso lleva el link al primero de sus equipos anotados (por
-- id). El resto queda igual que en 20261028000002_withdraw_tournament_notices.sql.

create or replace function public.withdraw_tournament(tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.tournaments;
begin
  -- `for update` bloquea la fila hasta el final de la transacción: nadie la
  -- cambia entre que se mira el estado y se borra.
  select * into t
    from public.tournaments
   where id = tournament_id
     and user_id = auth.uid()
     for update;

  if not found then
    raise exception 'El torneo no existe o no es tuyo'
      using errcode = '42501';
  end if;

  if public.status(t) = 'finalizado' then
    raise exception 'Un torneo finalizado no se da de baja'
      using errcode = '22023';
  end if;

  -- Un aviso por jugador del plantel del momento, con el link a la página de
  -- uno de sus equipos anotados (la ficha del torneo ya devuelve 404). No usa
  -- `notify` porque cada jugador lleva su propio equipo en `params`; excluye
  -- al autor igual que `notify`. `params` guarda los nombres de hoy.
  insert into public.notices (user_id, kind, params)
  select distinct on (m.user_id)
         m.user_id,
         'tournament_withdrawn',
         jsonb_build_object('tournament_name', t.name, 'team_id', tm.id, 'team_name', tm.name)
    from public.inscriptions i
    join public.teams tm on tm.id = i.team_id
    join public.team_members m on m.team_id = tm.id
   where i.tournament_id = t.id
     and m.user_id is distinct from (select auth.uid())
   order by m.user_id, tm.id;

  delete from public.tournaments where id = t.id;
end;
$$;
