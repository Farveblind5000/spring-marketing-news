---
title: "DB Migrations"
type: documentation
protection: normal
claude_write_access: true
updated: 2026-05-12
links_to:
  - "Documentation/DB-schema"
  - "../CHANGELOG"
---

# 🗃️ Database Migrations

> Append-only log over schema-ændringer. Hver migration har en SQL-blok der kan køres i Supabase SQL Editor.
> **Newest first.**

---

## 2026-05-12 — Sprint 6: Feed Expansion (20 nye kilder)

**Formål:** Udvid fra 4 til 24 aktive feed-kilder. Deaktiverer gammel Anthropic Blog (duplikat) og tilføjer 20 nye.

```sql
-- Deaktiver gammel Anthropic Blog (erstattes af Anthropic News)
UPDATE sources SET active = false WHERE name = 'Anthropic Blog';

-- Indsæt 20 nye sources
INSERT INTO sources (name, url, feed_url, topic) VALUES
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
```

**Verificering:**
```sql
SELECT name, topic, active FROM sources ORDER BY active DESC, name;
-- Skal vise 24 rækker (Anthropic Blog = active false, alle andre = active true)
```

---

## 2026-05-07 — Sprint 5 #10: Unified report storage på digests

**Formål:** Gem konsolideret briefing-rapport på samme row som digest. 1:1-relation, så ingen ny tabel.

```sql
ALTER TABLE digests
ADD COLUMN IF NOT EXISTS unified_content TEXT,
ADD COLUMN IF NOT EXISTS unified_generated_at TIMESTAMPTZ;
```

**Verificering:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'digests' AND column_name LIKE 'unified%';
-- skal returnere 2 rows
```

---

## 2026-05-07 — Sprint 5 #7: Cache for korte LLM-opsummeringer

**Formål:** Global cache så LLM kun kaldes én gang per artikel, uanset hvor mange brugere klikker.

```sql
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS short_summary TEXT,
ADD COLUMN IF NOT EXISTS short_summary_generated_at TIMESTAMPTZ;

-- Tillad authenticated users at update (nødvendigt for cache-skrivning)
DROP POLICY IF EXISTS "authenticated_can_update_short_summary" ON articles;
CREATE POLICY "authenticated_can_update_short_summary" ON articles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Verificering:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'articles' AND column_name LIKE 'short%';
-- skal returnere 2 rows
```

---

## 2026-05-05 — Sprint 5 #4: Tabel `user_digest_queue`

**Formål:** Adskilt fra `user_saves`. "Send til digest" er en separat handling fra "gem til senere".

```sql
-- Opret tabel
CREATE TABLE user_digest_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Aktivér Row Level Security
ALTER TABLE user_digest_queue ENABLE ROW LEVEL SECURITY;

-- Brugere kan læse deres egen queue
CREATE POLICY "users_read_own_queue" ON user_digest_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Brugere kan tilføje til deres egen queue
CREATE POLICY "users_insert_own_queue" ON user_digest_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Brugere kan fjerne fra deres egen queue
CREATE POLICY "users_delete_own_queue" ON user_digest_queue
  FOR DELETE USING (auth.uid() = user_id);
```

**Verificering efter kørsel:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- skal indeholde 'user_digest_queue'
```

---

## 2026-05-04 — Sprint 4: Tabel `settings`

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_settings" ON settings FOR SELECT USING (true);
```

**Formål:** Holder prompt-template for digest-generering. Drives af Obsidian-noten via `sync-prompt.js`.

---

_Migrationer skal logges som MAJOR i CHANGELOG._
