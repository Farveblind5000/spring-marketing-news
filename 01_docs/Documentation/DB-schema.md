---
title: "DB Schema"
type: documentation
protection: normal
claude_write_access: true
updated: 2026-05-05
links_to:
  - "Plan/Roadmap"
---

# 🗄️ Database Schema — Supabase

> Projekt: `mdevyscqhpaogvsblfyp` · PostgreSQL via Supabase
> Opdateret når DB-schema ændres. Live-kilden er Supabase Dashboard → Table Editor.

---

## Tabeller

### `sources`
Aktive RSS-feeds der scrapes.

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `name` | TEXT | "TechCrunch AI" osv. |
| `feed_url` | TEXT | RSS XML endpoint |
| `topic` | TEXT | `ai` / `marketing` / `both` |
| `active` | BOOL | `false` deaktiverer scraping |
| `last_scraped` | TIMESTAMPTZ | Sidste succesfulde scrape |
| `created_at` | TIMESTAMPTZ | Auto |

### `articles`
Scraped artikler — ét row per unik URL.

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `source_id` | UUID FK → sources | Hvor kom den fra |
| `title` | TEXT | RSS title |
| `url` | TEXT UNIQUE | Dedup-nøgle |
| `topic` | TEXT | Arvet fra source |
| `summary` | TEXT | Gemini bullets (3 stk, dansk) |
| `relevance_score` | NUMERIC | 1-10 fra Gemini |
| `full_content` | TEXT | RSS content (max 5000 chars) |
| `read_time_min` | INT | Beregnet (~200 ord/min) |
| `published_at` | TIMESTAMPTZ | RSS pubDate |
| `scraped_at` | TIMESTAMPTZ | Auto |

### `user_saves`
Personligt bookmark-system. Ét row per (user_id, article_id).

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `user_id` | UUID FK → auth.users | |
| `article_id` | UUID FK → articles | |
| `created_at` | TIMESTAMPTZ | Auto |

### `digests`
Genererede ugentlige briefinger.

| Kolonne | Type | Note |
|---|---|---|
| `id` | UUID PK | Auto |
| `user_id` | UUID FK → auth.users | NULL = global (legacy) |
| `week_number` | INT | ISO ugenummer |
| `year` | INT | |
| `content` | TEXT | JSON (DigestContent struct) |
| `article_count` | INT | Brugt i digest |
| `source_count` | INT | Unikke kilder |
| `created_at` | TIMESTAMPTZ | Auto |

### `settings`
Konfigurations-kvartet (key/value). Bruges til prompt-template m.m.

| Kolonne | Type | Note |
|---|---|---|
| `key` | TEXT PK | fx `digest_prompt` |
| `content` | TEXT | Selve værdien |
| `updated_at` | TIMESTAMPTZ | Auto |

**RLS:** read public. Writes kræver service_role (sync-prompt.js).

---

## Relations

```
sources (1) ──< (N) articles
auth.users (1) ──< (N) user_saves >── (N) (1) articles
auth.users (1) ──< (N) digests
```

---

## Vedligehold

### pg_cron jobs
- `daglig-scraper` — `0 4 * * *` (06:00 dansk) → POST til scrape-articles Edge Function
- `ugentlig-digest` — `0 18 * * 0` _(deaktiveret — manuel trigger nu)_

### Manuel email-bekræftelse
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

---

_Schema-ændringer skal logges som MAJOR i CHANGELOG._
