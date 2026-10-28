-- `slot_team_id` es `security definer` y tenía `execute` para authenticated:
-- cualquiera con sesión averiguaba de qué equipo es cualquier franja. Pasa a
-- ser interna (la usan funciones `security definer`), y la policy y la vista
-- de propuestas leen los equipos con `proposal_teams`, que solo contesta a los
-- capitanes de los dos lados de una propuesta que existe.

revoke execute on function public.slot_team_id(uuid) from public, anon, authenticated;

-- Los dos equipos de una propuesta, o ninguna fila si quien pregunta no es
-- capitán de alguno.
create function public.proposal_teams(p_proposal_id uuid)
returns table (from_team_id uuid, to_team_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select t.from_team_id, t.to_team_id
    from public.proposals p
   cross join lateral (
     select public.slot_team_id(p.from_slot_id) as from_team_id,
            public.slot_team_id(p.to_slot_id)   as to_team_id
   ) t
   where p.id = p_proposal_id
     and (public.is_team_captain(t.from_team_id) or public.is_team_captain(t.to_team_id));
$$;

revoke execute on function public.proposal_teams(uuid) from public, anon;
grant execute on function public.proposal_teams(uuid) to authenticated;

drop policy "proposals: los capitanes de los dos equipos" on public.proposals;
create policy "proposals: los capitanes de los dos equipos"
  on public.proposals for select
  to authenticated
  using (exists (select 1 from public.proposal_teams(id)));

-- Igual que en 20261028000004_proposals.sql, con los equipos de `proposal_teams`.
create or replace view public.proposal_details
with (security_invoker = true)
as
  select p.id,
         p.from_slot_id,
         p.to_slot_id,
         p.range,
         p.created_at,
         ft.id        as from_team_id,
         ft.name      as from_team_name,
         ft.crest_url as from_crest_url,
         tt.id        as to_team_id,
         tt.name      as to_team_name,
         tt.crest_url as to_crest_url,
         public.proposal_status(p, now())  as status,
         public.proposal_expires_at(p)     as expires_at
    from public.proposals p
   cross join lateral public.proposal_teams(p.id) pt
    join public.teams ft on ft.id = pt.from_team_id
    join public.teams tt on tt.id = pt.to_team_id;

-- `proposal_status` lee el equipo de cada franja, y la vista la llama con los
-- permisos de quien lee: pasa a `security definer`. Solo dice el estado (si
-- un equipo está bloqueado ya se sabe por `team_blocked_until`). El resto
-- queda igual que en 20261028000008_match_drops.sql.
create or replace function public.proposal_status(p public.proposals, p_now timestamptz)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.close_reason is not null then p.close_reason::text
    when p_now >= public.proposal_expires_at(p) then 'vencida'
    when public.team_blocked_until(public.slot_team_id(p.from_slot_id), p_now) is not null
      or public.team_blocked_until(public.slot_team_id(p.to_slot_id), p_now) is not null then 'equipo_bloqueado'
    else 'pendiente'
  end;
$$;

revoke execute on function public.proposal_status(public.proposals, timestamptz) from public, anon;
grant execute on function public.proposal_status(public.proposals, timestamptz) to authenticated;
