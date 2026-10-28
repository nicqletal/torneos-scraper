-- Calificación (etapa 6 de Partidos). Ver "Calificación" en
-- docs/decisiones-casos-de-uso.md y docs/diseno-partidos.md.
--
-- Se guarda el hecho (quién calificó, con cuántas estrellas y qué comentó); que
-- la calificación esté revelada se calcula al leer: las dos cargadas o 7 días
-- vencidos. Nada corre por reloj.

-- Una por partido y equipo: la que el equipo `team_id` le puso al rival. El
-- comentario es privado: solo lo lee el administrador en moderación.
create table public.ratings (
  match_id   uuid not null references public.matches (id) on delete cascade,
  team_id    uuid not null references public.teams (id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  comment    text check (char_length(comment) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (match_id, team_id)
);

-- Nadie la lee ni la escribe por la API: se califica con `rate_rival` y se lee
-- la recibida con `received_rating`. RLS sin policies cierra todo.
alter table public.ratings enable row level security;
revoke all on public.ratings from anon, authenticated;

-- Cuándo quedó Jugado: si los dos cargaron lo mismo, con la segunda carga (en
-- el acto); si no, al vencer el plazo de 48 h del resultado. Solo tiene
-- sentido en un partido Jugado.
create function public.match_played_at(m public.matches)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case
    when public.match_results_agree(m) then (select max(s.result_at) from public.match_sides s where s.match_id = m.id)
    else public.match_result_deadline(m)
  end;
$$;

-- Hasta cuándo se califica: 7 días desde que quedó Jugado.
create function public.match_rating_deadline(m public.matches)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select public.match_played_at(m) + interval '7 days';
$$;

-- ¿Ya se ve lo que se pusieron? Cuando calificaron los dos o venció el plazo.
-- Revelarse al vencer pasa solo por el tiempo, así que no avisa.
create function public.match_ratings_revealed(m public.matches, p_now timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select (select count(*) from public.ratings r where r.match_id = m.id) = 2
      or p_now >= public.match_rating_deadline(m);
$$;

revoke execute on function public.match_ratings_revealed(public.matches, timestamptz) from public, anon, authenticated;

-- rate_rival: el capitán califica al rival con 1 a 5 estrellas y un
-- comentario opcional. Si el rival ya había calificado, las dos se revelan:
-- aviso "Ya podés ver tu calificación" al capitán que calificó primero.
create function public.rate_rival(p_match_id uuid, p_stars int, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match   public.matches;
  v_own     uuid;
  v_rival   uuid;
  v_comment text := nullif(btrim(p_comment), '');
begin
  if (select auth.uid()) is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  -- Serializa con la gestión de los dos equipos y con la calificación del rival.
  perform 1 from public.teams
   where id in (select team_id from public.match_sides where match_id = p_match_id)
   order by id for update;
  select * into v_match from public.matches where id = p_match_id for update;

  v_own := public.match_own_side(p_match_id);
  if v_own is null then
    raise exception 'No encontramos el partido';
  end if;
  select team_id into v_rival from public.match_sides where match_id = p_match_id and team_id <> v_own;

  -- No mira `dissolved_at`: disolver después de jugar no impide calificar.
  case public.match_phase(v_match, now())
    when 'jugado' then null;
    when 'por_jugarse', 'esperando_resultado' then raise exception 'Se califica cuando el partido queda Jugado';
    else raise exception 'Solo se califica un partido Jugado';
  end case;
  if now() >= public.match_rating_deadline(v_match) then
    raise exception 'Ya venció el plazo para calificar';
  end if;
  if exists (select 1 from public.ratings where match_id = p_match_id and team_id = v_own) then
    raise exception 'Ya calificaste este partido';
  end if;
  if p_stars is null or p_stars not between 1 and 5 then
    raise exception 'Las estrellas van de 1 a 5';
  end if;
  if char_length(v_comment) > 500 then
    raise exception 'El comentario va hasta 500 caracteres';
  end if;

  insert into public.ratings (match_id, team_id, stars, comment)
  values (p_match_id, v_own, p_stars, v_comment);

  if public.match_ratings_revealed(v_match, now()) then
    perform public.notify(
      'rating_revealed',
      jsonb_build_object('rival_name', (select name from public.teams where id = v_own)),
      array[v_rival],
      true);
  end if;
end;
$$;

revoke execute on function public.rate_rival(uuid, int, text) from public, anon;
grant execute on function public.rate_rival(uuid, int, text) to authenticated;

-- La calificación que le pusieron al equipo que capitanea el usuario en ese
-- partido, solo si ya se reveló; si no, null.
create function public.received_rating(p_match_id uuid)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select r.stars
    from public.matches m
    join public.ratings r on r.match_id = m.id and r.team_id <> public.match_own_side(m.id)
   where m.id = p_match_id
     and public.match_ratings_revealed(m, now());
$$;

revoke execute on function public.received_rating(uuid) from public, anon;
grant execute on function public.received_rating(uuid) to authenticated;

-- ¿El equipo que capitanea el usuario ya calificó ese partido? Null si no es
-- capitán de ningún lado.
create function public.rated_by_own(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.ratings r where r.match_id = p_match_id and r.team_id = own.team_id)
    from (select public.match_own_side(p_match_id) as team_id) own
   where own.team_id is not null;
$$;

revoke execute on function public.rated_by_own(uuid) from public, anon;
grant execute on function public.rated_by_own(uuid) to authenticated;

-- match_details, ahora con la calificación. Las columnas nuevas van al final.
-- El resto queda igual que en 20261028000009_match_results.sql.
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
         case when public.match_phase(m, now()) = 'jugado' then score.goals_against end as score_against,
         -- Hasta cuándo se califica (solo Jugado), si el capitán ya calificó y
         -- la que le pusieron, ya revelada. Las dos últimas son null para el plantel.
         case when public.match_phase(m, now()) = 'jugado' then public.match_rating_deadline(m) end as rating_deadline,
         public.rated_by_own(m.id)    as rated_by_own,
         public.received_rating(m.id) as received_stars
    from public.matches m
    join public.match_sides own   on own.match_id = m.id and public.is_team_member(own.team_id)
    join public.match_sides rival on rival.match_id = m.id and rival.team_id <> own.team_id
    join public.teams ot on ot.id = own.team_id
    join public.teams rt on rt.id = rival.team_id
    left join lateral public.match_score(m, own.team_id) score on true
   order by m.id, public.is_team_captain(own.team_id) desc, own.team_id;
