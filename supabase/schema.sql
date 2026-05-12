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

-- Startkilder (Sprint 1-4)
insert into sources (name, url, feed_url, topic) values
  ('Anthropic Blog',    'https://anthropic.com/news',                'https://anthropic.com/rss.xml',          'ai'),
  ('Search Engine Land','https://searchengineland.com',              'https://searchengineland.com/feed',       'marketing'),
  ('Marketing Brew',    'https://www.marketingbrew.com',             'https://www.marketingbrew.com/feed.xml', 'marketing'),
  ('The Verge AI',      'https://www.theverge.com/ai-artificial-intelligence', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'ai'),
  ('Stratechery',       'https://stratechery.com',                   null,                                     'marketing');

-- Sprint 6 — Feed Expansion (2026-05-12)
-- OBS: Kør migration 2026-05-12 i Supabase SQL Editor for live DB
-- (deaktiverer gammel Anthropic Blog + indsætter nye kilder)
insert into sources (name, url, feed_url, topic) values
  ('Import AI',               'https://importai.substack.com',                              'https://importai.substack.com/feed',                                                      'ai'),
  ('The Batch',               'https://www.deeplearning.ai/the-batch',                      'https://www.deeplearning.ai/the-batch/feed/',                                             'ai'),
  ('Latent Space',            'https://www.latent.space',                                   'https://www.latent.space/feed',                                                           'ai'),
  ('TLDR AI',                 'https://tldr.tech/ai',                                       'https://tldr.tech/ai/rss',                                                                'ai'),
  ('Hugging Face Blog',       'https://huggingface.co/blog',                                'https://huggingface.co/blog/feed.xml',                                                   'ai'),
  ('LangChain Blog',          'https://blog.langchain.dev',                                 'https://blog.langchain.dev/rss/',                                                         'ai'),
  ('BAIR Blog',               'https://bair.berkeley.edu/blog',                             'https://bair.berkeley.edu/blog/feed.xml',                                                'ai'),
  ('MIT Technology Review AI','https://www.technologyreview.com/topic/artificial-intelligence','https://www.technologyreview.com/topic/artificial-intelligence/feed',                 'both'),
  ('a16z AI',                 'https://a16z.com/tag/artificial-intelligence',               'https://a16z.com/tag/artificial-intelligence/feed/',                                     'both'),
  ('Ahrefs Blog',             'https://ahrefs.com/blog',                                    'https://ahrefs.com/blog/feed/',                                                           'marketing'),
  ('Marketing AI Institute',  'https://www.marketingaiinstitute.com/blog',                  'https://www.marketingaiinstitute.com/blog/rss.xml',                                      'both'),
  ('Ben''s Bites',            'https://www.bensbites.com',                                  'https://www.bensbites.com/feed',                                                          'ai'),
  ('Every AI',                'https://every.to',                                           'https://every.to/feed',                                                                   'ai'),
  ('DeepMind Blog',           'https://deepmind.google/discover/blog',                      'https://deepmind.google/discover/blog/rss.xml',                                          'ai'),
  ('Anthropic News',          'https://www.anthropic.com/news',                             'https://www.anthropic.com/news/rss.xml',                                                 'ai'),
  ('OpenAI News',             'https://openai.com/news',                                    'https://openai.com/news/rss.xml',                                                         'ai'),
  ('Search Engine Journal AI','https://www.searchenginejournal.com/category/artificial-intelligence','https://www.searchenginejournal.com/category/artificial-intelligence/feed/',  'both'),
  ('There''s An AI For That', 'https://theresanaiforthat.com',                              'https://theresanaiforthat.com/rss.xml',                                                   'ai'),
  ('Superhuman AI',           'https://www.superhuman.ai',                                  'https://www.superhuman.ai/feed',                                                          'ai'),
  ('The Rundown AI',          'https://www.therundown.ai',                                  'https://www.therundown.ai/rss.xml',                                                       'ai');

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
