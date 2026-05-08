# 🌱 Spring Marketing News

Et personligt AI & marketing intelligence-feed der scraper, opsummerer og kuraterer relevant indhold til en ugentlig briefing.

**Live:** [spring-marketing-news.vercel.app](https://spring-marketing-news.vercel.app)

---
## Core formål
- End to end test med fokus på at skabe Claude design/Claude code learnings
- Best practice overleverings learnings
- Local mvp 

## Project perspektiv 
- Kort og præcis opdatering på relevant AI viden customatiseret den enkeltes behov
- Ugentligt kuriteret nyheds opsamling der kan deles bredt 
- Andre former for videns kategorising kan tilføjes
	- En specifik kunde og nyheder om denne så sælger er op to date
	- Ikke AI relateret nyheder der holder salg skarpe på markeds tendenser  

## Hvad er det?

En multi-user web-app der:

1. **Scraper** RSS-feeds dagligt kl. 06:00 (TechCrunch AI, VentureBeat AI, HubSpot Marketing, Moz Blog)
2. **Opsummerer** hver artikel med Gemini 
3. **Lader brugeren vælge** artikler til næste digest via dedikeret "send til digest"-knap
4. **Genererer struktureret briefing** når brugeren beder om det — kan redigeres manuelt og eksporteres til PDF eller email

Målgruppe: Spring CC-medarbejdere (3 brugere live) der vil holde sig opdateret på AI + marketing uden at drukne i feeds.

## Status

- ✅ Sprint 1-4: MVP (scraper, feed, gem, digest, deploy)
- ✅ Sprint 5: Curated digest, unified report, PDF/email export, kort opsummering
- ⏳ Mobil-responsiv gennemgang
- 🔮 Næste: se Roadmap

Detaljeret historik: [01_docs/CHANGELOG.md](01_docs/CHANGELOG.md).

---

## Tech stack

| Lag | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind v4 + DM Sans |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (`@supabase/ssr` cookies) |
| Scraper | Supabase Edge Functions (Deno) |
| Scheduler | pg_cron + pg_net |
| LLM | Gemini 2.5 Flash |
| PDF-export | `@react-pdf/renderer` |
| Email-export | Resend |
| Hosting | Vercel |

Se det fulde arkitektur-overblik i [01_docs/Plan/Tech_stack.canvas](01_docs/Plan/Tech_stack.canvas) (åbnes i Obsidian eller VSCode med canvas-extension).

---

## Kom i gang lokalt

### 1. Klon og install

```bash
git clone https://github.com/Spring-Family-IT/Spring-Marketing-News.git
cd Spring-Marketing-News
npm install
```

### 2. Opret `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
RESEND_API_KEY=...
```

(Få nøglerne fra projekt-ejer — Supabase project: `mdevyscqhpaogvsblfyp`.)

### 3. Start dev-server

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000).

### 4. (Valgfrit) Hent Supabase CLI

Kun nødvendigt hvis du skal deploye Edge Functions. Binaren er gitignored — hver udvikler henter den selv:
- **Windows:** Download fra [github.com/supabase/cli/releases](https://github.com/supabase/cli/releases) → udpak `supabase.exe` til `./supabase-cli/`
- **macOS / Linux:** `brew install supabase/tap/supabase` (eller `npm i -g supabase`)

### 5. Login

Brugere oprettes manuelt i Supabase Dashboard → Authentication. Email skal bekræftes med:

```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'din@spring-cc.com';
```

---

## Projekt-struktur

```
spring-marketing-news/
├── app/                  Next.js App Router (routes + components + API)
│   ├── page.tsx          /      — Feed
│   ├── saved/            /saved — Gemte artikler
│   ├── digest/           /digest — Personligt digest + unified-rapport
│   ├── login/            /login
│   ├── api/              6 server-ruter (digest, unified, short-summary, export-pdf/email, update)
│   └── components/       8 client-komponenter
├── lib/supabase/         Server- og browser-klienter
├── scripts/              CLI: sync-prompt.js (Obsidian → Supabase)
├── supabase/functions/   Edge Functions (scrape-articles)
├── 01_docs/              Obsidian vault (kontrol-center) — se nedenfor
├── CLAUDE.md             Kontekst til AI-sessioner
└── README.md             (denne fil)
```

Detaljeret fil-oversigt: [01_docs/Documentation/File-structure.md](01_docs/Documentation/File-structure.md).

---

## Arbejdsflow

### Daglig udvikling

```bash
npm run dev          # lokal dev-server
npm run build        # verify TypeScript + build
npm run lint
```

### Deploy

```bash
git push origin main          # personligt repo
git push spring main          # Spring Family IT fælles repo
vercel --prod                 # frontend deploy
```

Edge Functions deployes separat:
```bash
./supabase-cli/supabase.exe functions deploy <navn> --project-ref mdevyscqhpaogvsblfyp
```

### Opdater LLM-prompts

Prompts ligger som markdown-filer i [01_docs/Prompts/](01_docs/Prompts/) og synkroniseres til Supabase `settings`-tabellen:

```bash
node scripts/sync-prompt.js
```

Næste API-kald bruger den nye prompt — ingen redeploy.

Den fulde kommando-reference findes i [01_docs/Komandoer.md](01_docs/Komandoer.md).

---

## Dokumentation

`01_docs/` er projektets **kontrol-center** (Obsidian vault). Vigtigste filer:

| Fil | Indhold |
|---|---|
| [`Plan/Roadmap.md`](01_docs/Plan/Roadmap.md) | Vision, scope, sprint-status, arkitektur-beslutninger |
| [`Plan/Tech_stack.canvas`](01_docs/Plan/Tech_stack.canvas) | Visuelt arkitektur-overblik (åbn i Obsidian) |
| [`Documentation/DB-schema.md`](01_docs/Documentation/DB-schema.md) | Tabeller + kolonner + RLS |
| [`Documentation/File-structure.md`](01_docs/Documentation/File-structure.md) | Detaljeret fil-oversigt |
| [`Documentation/Migrations.md`](01_docs/Documentation/Migrations.md) | Append-only SQL-migrationer |
| [`CHANGELOG.md`](01_docs/CHANGELOG.md) | Append-only log over alle ændringer (MAJOR + MINOR) |
| [`Komandoer.md`](01_docs/Komandoer.md) | Copy-paste reference til alle workflows |
| [`Prompts/`](01_docs/Prompts/) | Levende prompt-templates (synces til Supabase) |
| [`CLAUDE_RULES.md`](01_docs/CLAUDE_RULES.md) | Regler for AI-redigering af `01_docs/` |


---

## Bidrag

1. Læs [01_docs/CLAUDE_RULES.md](01_docs/CLAUDE_RULES.md) hvis du lader AI røre `01_docs/`
2. Append entry til [01_docs/CHANGELOG.md](01_docs/CHANGELOG.md) ved alle strukturelle ændringer (`/changelog` skill hjælper)
3. Schema-ændringer dokumenteres i [01_docs/Documentation/Migrations.md](01_docs/Documentation/Migrations.md)
4. To git-remotes — `origin` (personlig) og `spring` (Spring Family IT). Push til `spring` når kode skal deles.

---

_Sidst opdateret: 2026-05-08_
