---
title: "DB Schema"
type: documentation
protection: normal
claude_write_access: true
updated: 2026-05-12
links_to:
  - "Plan/Roadmap"
  - "Documentation/Migrations"
---

# 🗄️ Database Schema — Supabase

> Projekt: `mdevyscqhpaogvsblfyp` · PostgreSQL via Supabase
> Opdateret når DB-schema ændres. Live-kilden er Supabase Dashboard → Table Editor.
> SQL-migrationer logges i [`Migrations.md`](Migrations.md).

---

## Tabeller

### `sources`
Aktive RSS-feeds der scrapes.

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `name` | TEXT | "TechCrunch AI" osv. |
| `feed_url` | TEXT | RSS XML endpoint |
| `topic` | TEXT | `ai` / `marketing` / `both` (legacy, bevaret) |
| `category` | TEXT | `ai_research` / `ai_engineering` / `ai_news` / `marketing` / `marketing_ai` — driver feed-filter |
| `active` | BOOL | `false` deaktiverer scraping |
| `last_scraped` | TIMESTAMPTZ | Sidste succesfulde scrape |
| `created_at` | TIMESTAMPTZ | Auto |

---

### `articles`
Scraped artikler — ét row per unik URL. `short_summary*` er global cache fra `/api/short-summary`.

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `source_id` | UUID FK → sources | Hvor kom den fra |
| `title` | TEXT | RSS title |
| `url` | TEXT UNIQUE | Dedup-nøgle |
| `topic` | TEXT | Arvet fra source (legacy, bevaret) |
| `category` | TEXT | Arvet fra source — driver feed-filter (5 værdier, se sources-tabel) |
| `summary` | TEXT | Gemini bullets (3 stk, dansk) — fra scraper |
| `relevance_score` | NUMERIC | 1-10 fra Gemini (legacy — ikke vist i UI) |
| `full_content` | TEXT | RSS content (max 5000 chars) |
| `read_time_min` | INT | Beregnet (~200 ord/min) |
| `published_at` | TIMESTAMPTZ | RSS pubDate |
| `scraped_at` | TIMESTAMPTZ | Auto · feed-filter er baseret på denne |
| `short_summary` | TEXT | Cached LLM-extract fra `/api/short-summary` (intro + bullets + målgruppe) |
| `short_summary_generated_at` | TIMESTAMPTZ | Cache-timestamp |

---

### `user_saves`
Personligt bookmark-system. Ét row per (user_id, article_id).

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `user_id` | UUID FK → auth.users | |
| `article_id` | UUID FK → articles | |
| `created_at` | TIMESTAMPTZ | Auto |

---

### `user_digest_queue` ⭐
Eksplicit valg til næste digest. Adskilt fra `user_saves` så "send til digest" og "gem til senere" er konceptuelt separate.

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `user_id` | UUID FK → auth.users (ON DELETE CASCADE) | |
| `article_id` | UUID FK → articles (ON DELETE CASCADE) | |
| `added_at` | TIMESTAMPTZ | Auto |

UNIQUE constraint: `(user_id, article_id)`.

**RLS:** Brugere kan SELECT/INSERT/DELETE egne rows.

---

### `digests`
Genererede personlige briefinger. `unified_*` er den konsoliderede struktur-rapport (Sprint 5 #10).

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `user_id` | UUID FK → auth.users | NULL = global (legacy, ikke længere genereret) |
| `week_number` | INT | ISO ugenummer |
| `year` | INT | |
| `content` | TEXT | JSON (DigestContent struct: ART_N_TITLE/SOURCE/SUMMARY/TAKEAWAY1-3) |
| `article_count` | INT | Brugt i digest |
| `source_count` | INT | Unikke kilder |
| `created_at` | TIMESTAMPTZ | Auto |
| `unified_content` | TEXT | Struktureret briefing (THEME/CONTEXT/KEY_INSIGHTS/TRENDS/SOURCES) |
| `unified_generated_at` | TIMESTAMPTZ | AI-timestamp · bevares ved manuel redigering |

---

### `settings`
Konfigurations-key/value. Drives af Obsidian via `scripts/sync-prompt.js`.

| Kolonne | Type | Note |
|---|---|---|
| `key` | TEXT PK | `digest_prompt`, `short_summary_prompt`, `unified_output_prompt` |
| `content` | TEXT | Selve prompt-templaten |
| `updated_at` | TIMESTAMPTZ | Auto |

**RLS:** read public. Writes kræver service_role (sync-prompt.js).

---

## Relations

```
sources (1) ──< (N) articles
auth.users (1) ──< (N) user_saves >── (N) (1) articles
auth.users (1) ──< (N) user_digest_queue >── (N) (1) articles
auth.users (1) ──< (N) digests
```

---

## Vedligehold

### pg_cron jobs
- `daglig-scraper` — `0 4 * * *` (06:00 dansk) → POST til `scrape-articles` Edge Function
- `ugentlig-digest` — `0 18 * * 0` _(deaktiveret — manuel trigger via UI nu)_

### Manuel email-bekræftelse

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

### Ryd short_summary cache (efter prompt-ændring)

```sql
UPDATE articles
SET short_summary = NULL, short_summary_generated_at = NULL
WHERE short_summary IS NOT NULL;
```

---

_Schema-ændringer skal logges som MAJOR i CHANGELOG og som ny entry i [Migrations.md](Migrations.md)._
