-- La baja de un torneo avisa al plantel de cada equipo con Inscripción
-- vinculada (ver "Baja" en docs/decisiones-casos-de-uso.md). Resuelve el
-- TODO(avisos) de 20260930000006: misma función, con el aviso antes del
-- delete (después ya no quedan las inscripciones para saber a quién).

create or replace function public.withdraw_tournament(tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t    public.tournaments;
  team public.teams;
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

  -- Un aviso por equipo, porque cada uno lleva el link a la página de su
  -- equipo (la ficha del torneo ya devuelve 404). `params` guarda los nombres
  -- de hoy: si el equipo se cambia el nombre, el aviso no cambia.
  for team in
    select tm.*
      from public.inscriptions i
      join public.teams tm on tm.id = i.team_id
     where i.tournament_id = t.id
  loop
    perform public.notify(
      'tournament_withdrawn',
      jsonb_build_object(
        'tournament_name', t.name,
        'team_id', team.id,
        'team_name', team.name
      ),
      array[team.id]
    );
  end loop;

  delete from public.tournaments where id = t.id;
end;
$$;
