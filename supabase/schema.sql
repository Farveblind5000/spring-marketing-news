-- ══════════════════════════════════════════════════
-- SPRING MARKETING NEWS — Supabase Schema
-- Kør i: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════

-- ── Sources ──────────────────────────────────────
create table sources (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  url          text not null,
  feed_url     text,
  topic        text check (topic in ('ai', 'marketing', 'both')),
  active       boolean default true,
  last_scraped timestamptz,
  created_at   timestamptz default now()
);

-- Startkilder
insert into sources (name, url, feed_url, topic) values
  ('Anthropic Blog',    'https://anthropic.com/news',                'https://anthropic.com/rss.xml',          'ai'),
  ('Search Engine Land','https://searchengineland.com',              'https://searchengineland.com/feed',       'marketing'),
  ('Marketing Brew',    'https://www.marketingbrew.com',             'https://www.marketingbrew.com/feed.xml', 'marketing'),
  ('The Verge AI',      'https://www.theverge.com/ai-artificial-intelligence', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'ai'),
  ('Stratechery',       'https://stratechery.com',                   null,                                     'marketing');

-- ── Articles ─────────────────────────────────────
create table articles (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid references sources(id) on delete set null,
  title           text not null,
  url             text unique not null,
  topic           text check (topic in ('ai', 'marketing', 'both')),
  published_at    timestamptz,
  scraped_at      timestamptz default now(),
  summary         text,           -- Gemini 3-bullet summary
  relevance_score numeric(3,1),   -- Gemini 1–10 global score
  read_time_min   int,            -- estimeret læsetid (ord / 200)
  full_content    text            -- scrapet artikel-tekst
);

create index articles_topic_idx         on articles(topic);
create index articles_published_at_idx  on articles(published_at desc);
create index articles_relevance_idx     on articles(relevance_score desc);

-- ── User saves ───────────────────────────────────
create table user_saves (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  saved_at   timestamptz default now(),
  unique(user_id, article_id)
);

create index user_saves_user_idx on user_saves(user_id);

-- ── Digests ──────────────────────────────────────
create table digests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  week_number   int not null,
  year          int not null,
  content       text,             -- Gemini ugentlig briefing-tekst
  article_count int,
  source_count  int,
  created_at    timestamptz default now(),
  unique(user_id, week_number, year)
);

-- ── RLS (Row Level Security) ─────────────────────
-- Aktiver RLS på brugertabeller
alter table user_saves enable row level security;
alter table digests    enable row level security;

-- Brugere kan kun se og ændre egne saves
create policy "user_saves: own rows only" on user_saves
  for all using (auth.uid() = user_id);

-- Brugere kan kun se egne digests
create policy "digests: own rows only" on digests
  for all using (auth.uid() = user_id);

-- Articles og sources er offentlige (read-only for alle)
alter table articles enable row level security;
alter table sources  enable row level security;

create policy "articles: public read" on articles
  for select using (true);

create policy "sources: public read" on sources
  for select using (true);
