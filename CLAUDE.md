# SPRING MARKETING NEWS — Claude Context

Et AI & marketing intelligence feed der web scraper indhold hver morgen, opsummerer med Gemini og viser det i et personligt Next.js feed.

---

## Tech Stack

| Lag | Teknologi | Detaljer |
|---|---|---|
| Frontend | Next.js 16 + TypeScript | App Router, Server Components |
| Styling | Tailwind CSS v4 | Brand-tokens i `app/globals.css` |
| Database | Supabase (PostgreSQL) | Projekt: `mdevyscqhpaogvsblfyp` |
| Auth | Supabase Auth | Session via cookies (@supabase/ssr) |
| Scraper | Supabase Edge Functions (Deno) | `npm:rss-parser@3`, `npm:@supabase/supabase-js@2` |
| Scheduler | pg_cron + pg_net | Scraper: `0 4 * * *`, Digest: `0 18 * * 0` |
| LLM | Gemini 2.0 Flash | Dansk summary (3 bullets) + relevance score 1-10 |
| Deploy | Vercel | `spring-marketing-news.vercel.app` |

---

## Fil-struktur

```
app/
  page.tsx                    — Feed (/) — Server Component
  login/page.tsx              — Login (/login)
  saved/page.tsx              — Gemte artikler (/saved) — kræver auth
  digest/page.tsx             — Ugentligt digest (/digest)
  components/SaveButton.tsx   — Gem/fjern knap — Client Component
lib/supabase/
  server.ts                   — Server-side Supabase client (cookies)
  client.ts                   — Browser-side Supabase client
supabase/functions/
  scrape-articles/index.ts    — RSS scraper + Gemini enrichment
  generate-digest/index.ts    — Legacy digest (erstattet af /api/generate-digest)
01_docs/                         — Obsidian vault (kontrol-center, planer, prompts)
  CLAUDE_RULES.md             — Regler AI skal følge
  CHANGELOG.md                — Append-only ændringslog
  Plan/                       — Roadmap, tech canvas
  Prompts/                    — Digest System Prompt (synkes til Supabase)
  Ressourcer/                 — Brand kit, integrationer, vidensdatabase
scripts/
  sync-prompt.js              — Sync 01_docs/Prompts/* → Supabase settings
```

---

## Database tabeller

```
sources      — RSS-feeds der scrapes (feed_url, topic, active)
articles     — Scraped artikler (title, url, summary, relevance_score, read_time_min)
user_saves   — Gemte artikler per bruger (user_id, article_id)
digests      — Ugentlige briefinger (user_id NULL = global digest)
```

---

## Vigtige regler

- `supabase/functions/` er **Deno** — brug `npm:` prefix til imports, IKKE Node.js syntax
- `supabase/functions/` er **ekskluderet** fra `tsconfig.json` (Next.js checker dem ikke)
- Edge Functions deployes med: `.\supabase-cli\supabase.exe functions deploy <navn> --project-ref mdevyscqhpaogvsblfyp`
- **`01_docs/`** er kontrol-center (Obsidian vault) — læs `01_docs/CLAUDE_RULES.md` FØRST før ændringer
- **`01_docs/Noter.md`** må ALDRIG ændres (`claude_write_access: false`)
- Strukturelle ændringer i `01_docs/` (sletninger, omdøbninger, nye mapper) kræver eksplicit "JA" i chat
- Efter ændringer i `01_docs/`: append entry til `01_docs/CHANGELOG.md`
- Brand-tokens: `--orange: #FF3700`, `--offblack: #1A1A1A`, `--gunmetal: #484848`, `--bg: #F4F4F4`
- Font: DM Sans (Google Fonts)

---

## Aktuel status (Maj 2026)

- ✅ Sprint 1: Fundament (Next.js + Supabase + DB)
- ✅ Sprint 2: Motor (scraper + Gemini + pg_cron)
- ✅ Sprint 3: Brugerlag (gem-funktion + /saved + /digest)
- 🔧 Sprint 4: Deploy til Vercel (i gang)
- ⏳ Gemini kvote: Venter på billing — digest-generering afventer

---

## Kendte workarounds

- Gemini free tier løber tør hurtigt — billing skal tilføjes på aistudio.google.com
- Supabase CLI på Windows: binary i `./supabase-cli/supabase.exe` (ikke npm)
- `.next` mappe skal slettes ved EPERM build-fejl: `rmdir /s /q .next`
- Vercel auto-deploy virker ikke altid — brug `vercel --prod` fra terminal
