---
title: "Feed Site Plan"
type: plan
status: active
claude_write_access: true
updated: 2026-05-04T14:30
links_to:
  - Ressourcer/Spring CC Brand Kit
  - Claude design
---

# SPRING MARKETING NEWS — Plan

> Et live site der web scraper AI & marketing-indhold hver morgen.
> Gemini opsummerer og scorer artiklerne → du får et personligt intelligence-feed.

---

## STATUS NU — Du er her

```
DESIGN      ████████████████████  ✅ Færdig (7 HTML-skærme)
FUNDAMENT   ████████████████████  ✅ Færdig (Next.js + Supabase + DB)
MOTOR       ████████████████████  ✅ Færdig (scraper + Gemini + pg_cron)
BRUGERLAG   ████████████████████  ✅ Færdig (gem-funktion + /saved + /digest)
DEPLOY      ████████████████░░░░  ← Sprint 4 næsten færdig (mobil mangler)
```

Sitet kører live på `spring-marketing-news.vercel.app` med rigtige scraped artikler, Gemini 2.5 Flash summaries og digest. Gem-funktion, /saved og /digest virker i produktion.

---

## Hvad er det vi bygger — overblik

```
KILDE (RSS)  →  SCRAPER  →  GEMINI  →  DATABASE  →  DIT FEED
TechCrunch AI      ↓         (summary      articles-    localhost:3000
VentureBeat AI  Edge Fn       + score)      tabel
HubSpot Blog    kl. 06:00
Moz Blog        (pg_cron)
```

**Flowet i ét sætning:** En Supabase Edge Function henter nye artikler fra RSS-feeds hver morgen, sender dem til Gemini for opsummering og scoring, og gemmer resultatet i databasen — som dit Next.js feed så viser.

---

## Tech Stack

| Lag | Teknologi | Rolle |
|---|---|---|
| Design | Claude Design | HTML-prototyper (færdig) |
| Frontend | Next.js 14 + TypeScript | Hvad du ser i browseren |
| Styling | Tailwind CSS | Brand-tokens til CSS |
| Database | Supabase (PostgreSQL) | Gemmer artikler, saves, digests |
| Auth | Supabase Auth | Login / session |
| Scraper | Supabase Edge Functions | Koden der henter artikler |
| Scheduler | pg_cron | Kører scraperen automatisk kl. 06:00 |
| LLM | Gemini 2.0 Flash | Skriver summaries + giver score 1–10 |
| Hosting | Vercel | Sitet live på internettet (Sprint 4) |

---

## Sprints — hvad, hvorfor og hvad der mangler

---

### ✅ Sprint 1 — Fundament

**Hvorfor:** Før noget kan køre skal der være et sted at gemme data, og en frontend der kan vise det.

**Hvad vi byggede:**
- Next.js projekt + Tailwind + brand-tokens
- Supabase projekt + alle 4 tabeller + startkilder
- Feed-siden (`/`) med mock-artikler i korrekt design
- Login-siden (`/login`) koblet til Supabase Auth

**Status:** ✅ Komplet

---

### ✅ Sprint 2 — Motoren

**Hvorfor:** Mock-data er statisk — du ser det samme hver dag. Motoren er det der gør sitet levende: en automatisk scraper der finder nye artikler hver morgen, og Gemini der gør dem brugbare med summaries og scores.

**Hvad vi byggede:**

- ✅ **Edge Function: RSS-scraper** (`supabase/functions/scrape-articles/index.ts`)
  Deno-funktion der læser `sources`-tabellen, henter RSS-feeds med `npm:rss-parser`, parser nye artikler og gemmer dem i `articles`. Deduplicerer på URL.

- ✅ **Gemini: summary + score per artikel**
  Hvert kald sender `title + full_content` til `gemini-2.0-flash` → returnerer 3 danske bullet-points + relevance_score 1–10.

- ✅ **pg_cron: daglig kørsel kl. 06:00 dansk tid (04:00 UTC)**
  Job: `daglig-scraper`, schedule: `0 4 * * *`.

- ✅ **Feed-siden kobles til rigtig data**
  `page.tsx` er Server Component der henter fra `articles`-tabellen. 37+ rigtige artikler live.

**Kilder i drift:**
| Kilde | Topic |
|---|---|
| TechCrunch AI | AI |
| VentureBeat AI | AI |
| HubSpot Marketing Blog | Marketing |
| Moz Blog | Marketing |

**Kendte fejl løst undervejs:**
- DOMParser ikke tilgængelig i Deno → bruger `npm:rss-parser@3`
- Originale RSS-URL'er 404/403 → erstattet med ovenstående
- CSS `@import` orden i Tailwind v4 → Google Fonts import før `@import "tailwindcss"`
- Supabase login prerender fejl → `createClient()` kun i `handleSubmit`
- Supabase CLI på Windows → downloadet binary fra GitHub, ingen npm install

**Status:** ✅ Komplet

---

### 🔧 Sprint 3 — Brugerlaget ← DU ER HER

**Hvorfor:** Nu skal sitet huske dig. Gem-funktionen, dine gemte artikler og det ugentlige digest er det der gør det til et personligt værktøj frem for blot en nyhedsside.

**Hvad vi byggede:**

- ✅ **SaveButton komponent** (`app/components/SaveButton.tsx`)
  Client component med bogmærke-ikon. Klikker man gem → artikel gemmes i `user_saves`. Klikker man igen → fjernes. Ikke logget ind → redirect til `/login`.

- ✅ **Feed-siden viser gem-knap**
  `page.tsx` henter brugerens gemte artikel-IDs og sender `initialSaved` til SaveButton. Bogmærke er fyldt orange hvis gemt.

- ✅ **Gemte artikler-side `/saved`**
  Viser alle gemte artikler i samme layout som feed. Redirect til `/login` hvis ikke logget ind. Klik bogmærke igen → fjerner fra listen.

- ✅ **Ugentligt digest `/digest`**
  Viser ugens globale AI-briefing. Viser "ikke klar endnu" med antal ugens artikler hvis digest ikke er genereret.

- ✅ **Edge Function: generate-digest** (`supabase/functions/generate-digest/index.ts`)
  Henter ugens top-30 artikler efter relevance_score. Sender til Gemini med prompt om dansk briefing: intro + 3 tendenser + "Ikke gå glip af"-sektion. Gemmer som global digest (user_id NULL).

- ✅ **pg_cron: digest søndag kl. 20:00 dansk tid (18:00 UTC)**
  Job: `ugentlig-digest`, schedule: `0 18 * * 0`.

**Status:** ✅ Komplet og testet lokalt
- Gem-knap virker på feed
- `/saved` viser gemte artikler korrekt
- `/digest` viser "ikke klar endnu" + artikelantal (afventer Gemini billing)
- Digest genereres automatisk søndag kl. 20:00 via pg_cron

---

### 🔧 Sprint 4 — Polish & Deploy ← DU ER HER

**Hvorfor:** Sitet skal kunne ses udefra og fungere på mobil. Vercel giver dig en rigtig URL.

**Hvad der skal bygges:**

- ✅ **GitHub repo** — `github.com/Farveblind5000/spring-marketing-news` (public)
- ✅ **Vercel projekt** — koblet til repo, miljøvariabler sat via `.env.local` import
- ✅ **TypeScript build fejl løst** — `supabase/functions/` ekskluderet fra `tsconfig.json`
- ✅ **CLAUDE.md** — projektkontekst til fremtidige Claude Code sessioner
- ✅ **Vercel deploy live** — `spring-marketing-news.vercel.app` kører i produktion
- ✅ **Gemini billing + ny API key** — gemini-2.5-flash på v1 endpoint, digest genereret
- ✅ **Sluttest live** — feed, gem-knap, /saved og /digest verificeret i produktion
- [ ] **Responsivt design** — mobil-gennemgang på alle sider (≤900px breakpoint)

**Når Sprint 4 er færdig:** Sitet er live, tilgængeligt fra alle enheder. MVP er i mål.

---

## Hvad vi IKKE bygger i MVP

| Feature | Hvorfor ikke |
|---|---|
| Export PDF | Ingen bruger det. Kompleks at implementere korrekt. |
| Del / Share digest | Kun én bruger i MVP — meningsløst endnu. |
| Digest Arkiv Detalje | Kræver ugers data. Byg den når arkivet har indhold. |
| Personaliseret score | Kræver brugerprofil + læsemønstre. Start med global score. |
| Artikel-detail side `/article/[id]` | Udskudt — ekstern URL er tilstrækkeligt i MVP. |

---

## DB Schema (reference)

```sql
sources     — hvilke sider der scrapes (RSS-url, topic, aktiv/inaktiv)
articles    — scraped artikler (title, summary, score, full_content)
user_saves  — hvilke artikler du har gemt (koblet til din bruger)
digests     — ugentlige AI-briefinger (global: user_id NULL, genereret søndag)
```

---

## Fil-struktur (reference)

```
app/
  page.tsx                        — Feed (/)
  login/page.tsx                  — Login (/login)
  saved/page.tsx                  — Gemte artikler (/saved)
  digest/page.tsx                 — Ugentligt digest (/digest)
  components/SaveButton.tsx       — Gem/fjern knap (client component)
lib/supabase/
  server.ts                       — Server-side Supabase client
  client.ts                       — Browser-side Supabase client
supabase/functions/
  scrape-articles/index.ts        — RSS scraper + Gemini summary/score
  generate-digest/index.ts        — Ugentlig digest generator
```

---

← [[Claude design|Hub]]
