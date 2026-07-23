-- ===================================================================
--  Generation C AI-Quiz — Supabase database setup
-- ===================================================================
--  Plak dit HELE bestand in de Supabase SQL-editor en klik "Run".
--  (Dashboard > SQL Editor > New query > plakken > Run.)
--
--  Het maakt 3 tabellen aan (games, players, answers), zet Row Level
--  Security aan met policies die passen bij een PUBLIEKE quiz zonder
--  login, zet Realtime aan en voegt een RPC toe om scores veilig
--  op te tellen. Je mag dit script gerust nog eens draaien: het is
--  idempotent (het ruimt eerst oude versies op).
-- ===================================================================

-- ---- Opschonen (voor herhaald draaien) ----------------------------
drop table if exists public.answers cascade;
drop table if exists public.players cascade;
drop table if exists public.games   cascade;
drop function if exists public.increment_score(uuid, integer);

-- ---- Tabel: games -------------------------------------------------
create table public.games (
  id                  uuid primary key default gen_random_uuid(),
  pin                 text not null unique,             -- 6-cijferige game-PIN
  seed                integer not null default 1,        -- husselt de antwoordopties per sessie
  status              text not null default 'lobby',     -- lobby | question | reveal | scoreboard | ended
  current_question    integer not null default 0,        -- index (0-based) van de huidige vraag
  question_started_at timestamptz,                       -- tijdstip waarop de huidige vraag begon
  question_duration   integer not null default 20,       -- seconden per vraag
  created_at          timestamptz not null default now()
);

-- ---- Tabel: players -----------------------------------------------
create table public.players (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games(id) on delete cascade,
  nickname   text not null,
  score      integer not null default 0,
  created_at timestamptz not null default now(),
  unique (game_id, nickname)   -- één bijnaam per spel (maakt herverbinden mogelijk)
);
create index players_game_idx on public.players(game_id);

-- ---- Tabel: answers -----------------------------------------------
create table public.answers (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references public.games(id) on delete cascade,
  player_id      uuid not null references public.players(id) on delete cascade,
  question_index integer not null,
  choice         integer not null,     -- gekozen optie 0..3 (A..D, in gehusselde volgorde)
  is_correct     boolean not null default false,
  points         integer not null default 0,
  response_ms    integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (game_id, player_id, question_index)  -- max. één antwoord per speler per vraag
);
create index answers_game_q_idx on public.answers(game_id, question_index);

-- ===================================================================
--  RPC: score veilig en atomair ophogen
-- ===================================================================
create or replace function public.increment_score(p_player uuid, p_points integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.players set score = score + p_points where id = p_player;
$$;

-- ===================================================================
--  Row Level Security (RLS)
-- -------------------------------------------------------------------
--  Dit is een publieke borrel-quiz ZONDER login: iedereen speelt met
--  de anon key. We staan daarom lezen/schrijven met de anon-rol toe.
--  Bewust simpel gehouden zodat het "gewoon werkt" op een vrijmibo.
--
--  Let op (bewuste trade-off): met deze policies kan in theorie
--  iedereen met de anon key rijen lezen/aanpassen. Voor een tijdelijke
--  borrelquiz is dat prima. Wil je het strenger? Zie de opmerking
--  onderaan dit bestand.
-- ===================================================================

alter table public.games   enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;

-- games: publiek lezen, aanmaken en bijwerken (host stuurt het spel aan)
create policy games_select on public.games for select to anon using (true);
create policy games_insert on public.games for insert to anon with check (true);
create policy games_update on public.games for update to anon using (true) with check (true);

-- players: publiek lezen, aanmaken en bijwerken (score)
create policy players_select on public.players for select to anon using (true);
create policy players_insert on public.players for insert to anon with check (true);
create policy players_update on public.players for update to anon using (true) with check (true);

-- answers: publiek lezen en aanmaken (spelers dienen hun antwoord in)
create policy answers_select on public.answers for select to anon using (true);
create policy answers_insert on public.answers for insert to anon with check (true);

-- Zorg dat de anon-rol de RPC mag aanroepen
grant execute on function public.increment_score(uuid, integer) to anon;

-- ===================================================================
--  Realtime aanzetten voor live-sync tussen telefoons en beamer
-- ===================================================================
--  Voeg de tabellen toe aan de realtime-publicatie. (Bestaat de
--  publicatie nog niet, dan maakt de eerste regel 'm aan.)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.answers;

-- Volledige rij meesturen bij updates (nodig voor de games-subscription)
alter table public.games   replica identity full;
alter table public.players replica identity full;
alter table public.answers replica identity full;

-- ===================================================================
--  Klaar! Ga terug naar de app-README, stap 3 (URL + anon key ophalen).
-- ===================================================================
--
--  STRENGER MAKEN (optioneel, later):
--  Wil je voorkomen dat willekeurige clients spellen kunnen aanpassen,
--  dan kun je bijv. de UPDATE-policy op games beperken of een aparte
--  host-sleutel invoeren. Voor een eenmalige vrijmibo is dat niet nodig.
