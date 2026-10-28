-- Resultado y presentismo (etapa 5 de Partidos). Ver "Después del partido" en
-- docs/decisiones-casos-de-uso.md, docs/diseno-partidos.md y
-- docs/adr/0002-conflictos-sin-arbitro.md.
--
-- Se guardan hechos, no estados: los goles que cargó cada lado, quién reportó
-- "no vinieron", quién respondió "fuimos" y cuándo fue la última carga. Que el
-- partido esté Jugado, en conflicto o con falta se calcula al leer, con los
-- plazos de 48 h: nada corre por reloj.

-- Cada lado: los goles que cargó desde su lado ("Nosotros / Ellos"; las
-- correcciones pisan), cuándo los cargó, cuándo reportó "no vinieron" y
-- cuándo respondió "fuimos".
alter table public.match_sides
  add column goals_for     smallint check (goals_for between 0 and 99),
  add column goals_against smallint check (goals_against between 0 and 99),
  add column result_at     timestamptz,
  add column no_show_at    timestamptz,
  add column went_at       timestamptz;

-- La última carga de cualquiera de los dos (resultado, corrección, "no
-- vinieron" o "fuimos"): desde ahí corren las 48 h.
alter table public.matches add column last_action_at timestamptz;

-- Cuándo vence el plazo de 48 h del resultado: desde la última carga o, si
-- nadie cargó nada, desde el fin del rango. Cada carga le da al otro 48 h
-- enteras, sin tope.
create function public.match_result_deadline(m public.matches)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select coalesce(m.last_action_at, upper(m.range)) + interval '48 hours';
$$;

-- ¿Los dos cargaron el mismo resultado, espejado?
create function public.match_results_agree(m public.matches)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.match_sides a
      join public.match_sides b on b.match_id = a.match_id and b.team_id <> a.team_id
     where a.match_id = m.id
       and a.result_at is not null and b.result_at is not null
       and a.goals_for = b.goals_against and a.goals_against = b.goals_for
  );
$$;

-- ¿El partido está en conflicto? Un lado reportó "no vinieron" y el otro lo
-- negó: respondió "fuimos", reportó "no vinieron" él también o cargó un
-- resultado (cargarlo es decir que jugaron). Acusar de vuelta cuesta lo mismo
-- que negar. Nadie arbitra (ADR 0002).
create function public.match_in_conflict(m public.matches)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.match_sides a
      join public.match_sides b on b.match_id = a.match_id and b.team_id <> a.team_id
     where a.match_id = m.id
       and a.no_show_at is not null
       and (b.no_show_at is not null or b.went_at is not null or b.result_at is not null)
  );
$$;

-- El equipo acusado de no presentarse que todavía no respondió, o null. Si
-- vence el plazo así, no se presentó.
create function public.match_no_show_team(m public.matches)
returns uuid
language sql
stable
set search_path = ''
as $$
  select b.team_id from public.match_sides a
    join public.match_sides b on b.match_id = a.match_id and b.team_id <> a.team_id
   where a.match_id = m.id
     and a.no_show_at is not null
     and b.no_show_at is null and b.went_at is null and b.result_at is null;
$$;

-- La fase de un partido en un momento, ahora con las del resultado. Desde la
-- hora de inicio, el partido espera el resultado mientras el plazo de 48 h está
-- abierto; si los dos cargaron lo mismo, queda Jugado en el acto, y si uno negó
-- el "no vinieron" del otro, en conflicto. Al vencer el plazo, el acusado que no
-- respondió no se presentó; si no hubo "no vinieron", queda Jugado, con o sin
-- resultado. El resto queda igual que en
-- 20261028000008_match_drops.sql. Deja de ser `immutable` porque lee los
-- lados del partido.
create or replace function public.match_phase(m public.matches, p_now timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when m.dropped_at <= p_now then 'caido'
    when p_now < public.match_start_at(m) then 'por_jugarse'
    when public.match_in_conflict(m) then 'en_conflicto'
    when public.match_results_agree(m) then 'jugado'
    when p_now < public.match_result_deadline(m) then 'esperando_resultado'
    when public.match_no_show_team(m) is not null then 'no_presentado'
    else 'jugado'
  end;
$$;

-- match_deadline, ahora con el plazo del resultado. Deja de ser `immutable`
-- porque `match_phase` tampoco lo es. El resto queda igual que en
-- 20261028000007_match_coordination.sql.
create or replace function public.match_deadline(m public.matches, p_now timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case
    when public.match_phase(m, p_now) = 'por_jugarse'
     and p_now >= public.match_start_at(m) - interval '24 hours'
     and p_now <  public.match_start_at(m) then public.match_start_at(m)
    when public.match_phase(m, p_now) = 'esperando_resultado' then public.match_result_deadline(m)
  end;
$$;

-- Lo que comparten cargar el resultado, "no vinieron" y "fuimos": desde la
-- hora de inicio y con el plazo abierto. Helper interno.
create function public.match_check_result_open(m public.matches)
returns void
language plpgsql
set search_path = ''
as $$
begin
  case public.match_phase(m, now())
    when 'esperando_resultado' then return;
    when 'por_jugarse' then raise exception 'El resultado se carga desde la hora de inicio';
    when 'caido' then raise exception 'El partido ya se cayó';
    else raise exception 'El resultado del partido ya está cerrado';
  end case;
end;
$$;

revoke execute on function public.match_check_result_open(public.matches) from public, anon, authenticated;

-- Aviso "Partido en conflicto" a los dos planteles. Helper interno.
create function public.match_notify_conflict(p_own uuid, p_rival uuid)
returns void
language sql
set search_path = ''
as $$
  select public.notify(
    'match_in_conflict',
    jsonb_build_object(
      'team_a', (select name from public.teams where id = p_own),
      'team_b', (select name from public.teams where id = p_rival)),
    array[p_own, p_rival]);
$$;

revoke execute on function public.match_notify_conflict(uuid, uuid) from public, anon, authenticated;

-- report_result: el capitán carga o corrige el resultado desde su lado,
-- "Nosotros / Ellos". Si coincide con el del rival, el partido queda Jugado:
-- aviso "Jugado" a los dos planteles. Si el rival había dicho "no vinieron",
-- cargar el resultado lo niega: en conflicto, con aviso a los dos planteles.
-- Si no, aviso "Cargaron el resultado: confirmá o corregí" al capitán rival,
-- con el vencimiento.
create function public.report_result(p_match_id uuid, p_goals_for int, p_goals_against int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_own   uuid;
  v_rival uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  -- Serializa con la gestión de los dos equipos y con la carga del rival.
  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  perform public.match_check_result_open(v_match);

  if p_goals_for is null or p_goals_against is null
     or p_goals_for not between 0 and 99 or p_goals_against not between 0 and 99 then
    raise exception 'Los goles van de 0 a 99';
  end if;

  if exists (select 1 from public.match_sides where match_id = p_match_id and team_id = v_own and no_show_at is not null) then
    raise exception 'Reportaste que no vinieron: no podés cargar el resultado';
  end if;

  update public.match_sides
     set goals_for = p_goals_for, goals_against = p_goals_against, result_at = now()
   where match_id = p_match_id and team_id = v_own;
  update public.matches set last_action_at = now() where id = p_match_id
  returning * into v_match;

  if public.match_in_conflict(v_match) then
    perform public.match_notify_conflict(v_own, v_rival);
    return;
  end if;

  if public.match_results_agree(v_match) then
    perform public.notify(
      'match_played',
      jsonb_build_object(
        'team_a',  (select name from public.teams where id = v_own),
        'goals_a', p_goals_for,
        'goals_b', p_goals_against,
        'team_b',  (select name from public.teams where id = v_rival)),
      array[v_own, v_rival]);
    return;
  end if;

  -- Los goles, vistos desde quien recibe el aviso.
  perform public.notify(
    'result_to_confirm',
    jsonb_build_object(
      'rival_name',    (select name from public.teams where id = v_own),
      'goals_for',     p_goals_against,
      'goals_against', p_goals_for,
      'deadline',      public.match_result_deadline(v_match)),
    array[v_rival],
    true);
end;
$$;

revoke execute on function public.report_result(uuid, int, int) from public, anon;
grant execute on function public.report_result(uuid, int, int) to authenticated;

-- report_no_show: "No vinieron". El rival tiene 48 h para responder "fuimos":
-- aviso "Dicen que no fueron: respondé" a su capitán, con el vencimiento. Si
-- el rival ya había dicho que jugaron (cargó un resultado o reportó "no
-- vinieron" él también), en conflicto, con aviso a los dos planteles.
create function public.report_no_show(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_own   uuid;
  v_rival uuid;
  v_side  public.match_sides;
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  perform public.match_check_result_open(v_match);

  select * into v_side from public.match_sides where match_id = p_match_id and team_id = v_own;
  if v_side.no_show_at is not null then
    raise exception 'Ya reportaste que no vinieron';
  end if;
  if v_side.result_at is not null then
    raise exception 'Ya cargaste el resultado: no podés reportar que no vinieron';
  end if;

  update public.match_sides set no_show_at = now() where match_id = p_match_id and team_id = v_own;
  update public.matches set last_action_at = now() where id = p_match_id
  returning * into v_match;

  if public.match_in_conflict(v_match) then
    perform public.match_notify_conflict(v_own, v_rival);
    return;
  end if;

  perform public.notify(
    'no_show_reported',
    jsonb_build_object(
      'rival_name', (select name from public.teams where id = v_own),
      'deadline',   public.match_result_deadline(v_match)),
    array[v_rival],
    true);
end;
$$;

revoke execute on function public.report_no_show(uuid) from public, anon;
grant execute on function public.report_no_show(uuid) to authenticated;

-- reply_went: el capitán acusado responde "fuimos". El partido queda en
-- conflicto: sin falta, un conflicto para cada uno y las dos versiones
-- guardadas. Aviso "Partido en conflicto" a los dos planteles.
create function public.reply_went(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_own   uuid;
  v_rival uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  perform public.match_check_result_open(v_match);

  if public.match_no_show_team(v_match) is distinct from v_own then
    raise exception 'Nadie dijo que no fueron';
  end if;

  update public.match_sides set went_at = now() where match_id = p_match_id and team_id = v_own;
  update public.matches set last_action_at = now() where id = p_match_id;

  perform public.match_notify_conflict(v_own, v_rival);
end;
$$;

revoke execute on function public.reply_went(uuid) from public, anon;
grant execute on function public.reply_went(uuid) to authenticated;

-- Las faltas de cada equipo, ahora con la de no presentarse: del acusado que
-- no respondió el "no vinieron", fechada al vencer las 48 h (recién ahí es
-- firme). El resto queda igual que en 20261028000008_match_drops.sql.
create or replace view public.team_faults as
  select m.dropped_by_team_id as team_id, m.id as match_id, m.dropped_at as occurred_at
    from public.matches m
   where public.match_drop_fault(m)
  union all
  select public.match_no_show_team(m), m.id, public.match_result_deadline(m)
    from public.matches m
   where public.match_phase(m, now()) = 'no_presentado';

-- El resultado con el que quedó Jugado, desde el lado de `p_team_id`: el de
-- los dos si coinciden, o el único cargado. Sin fila si cargaron distinto o
-- nadie cargó (Jugado sin resultado). Solo tiene sentido en un partido Jugado.
create function public.match_score(m public.matches, p_team_id uuid)
returns table (goals_for smallint, goals_against smallint)
language sql
stable
set search_path = ''
as $$
  select coalesce(o.goals_for, r.goals_against), coalesce(o.goals_against, r.goals_for)
    from public.match_sides o
    join public.match_sides r on r.match_id = o.match_id and r.team_id <> o.team_id
   where o.match_id = m.id and o.team_id = p_team_id
     and ((o.result_at is null) <> (r.result_at is null) or public.match_results_agree(m));
$$;

-- match_details, ahora con el resultado y el presentismo. Las columnas nuevas
-- van al final. El resto queda igual que en 20261028000008_match_drops.sql.
create or replace view public.match_details
with (security_invoker = true)
as
  select distinct on (m.id)
         m.id,
         m.range,
         public.match_start_at(m)     as start_at,
         public.match_phase(m, now()) as phase,
         own.team_id                  as team_id,
         ot.name                      as team_name,
         public.is_team_captain(own.team_id) as is_captain,
         rival.team_id                as rival_team_id,
         rt.name                      as rival_team_name,
         rt.crest_url                 as rival_crest_url,
         m.venue,
         m.venue_start_at,
         m.venue_team_id = own.team_id as venue_by_own,
         m.coordinated_at,
         own.going_at,
         rival.going_at               as rival_going_at,
         public.match_deadline(m, now()) as deadline,
         m.drop_reason,
         m.dropped_by_team_id = own.team_id as dropped_by_own,
         m.drop_mutual,
         public.match_drop_fault(m)   as drop_fault,
         m.mutual_drop_reason,
         m.mutual_drop_team_id = own.team_id as mutual_drop_by_own,
         m.mutual_drop_answered_at,
         m.mutual_drop_accepted,
         -- Lo que cargó cada lado, cada uno desde su lado ("Nosotros / Ellos").
         own.goals_for,
         own.goals_against,
         rival.goals_for              as rival_goals_for,
         rival.goals_against          as rival_goals_against,
         -- "No vinieron" y "fuimos" de cada lado.
         own.no_show_at,
         rival.no_show_at             as rival_no_show_at,
         own.went_at,
         rival.went_at                as rival_went_at,
         -- El resultado con el que quedó Jugado, desde el lado propio, o null.
         case when public.match_phase(m, now()) = 'jugado' then score.goals_for end     as score_for,
         case when public.match_phase(m, now()) = 'jugado' then score.goals_against end as score_against
    from public.matches m
    join public.match_sides own   on own.match_id = m.id and public.is_team_member(own.team_id)
    join public.match_sides rival on rival.match_id = m.id and rival.team_id <> own.team_id
    join public.teams ot on ot.id = own.team_id
    join public.teams rt on rt.id = rival.team_id
    left join lateral public.match_score(m, own.team_id) score on true
   order by m.id, public.is_team_captain(own.team_id) desc, own.team_id;
