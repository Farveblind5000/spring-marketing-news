---
title: "File Structure"
type: documentation
protection: normal
claude_write_access: true
updated: 2026-05-08
links_to:
  - "Plan/Roadmap"
  - "Plan/Tech_stack"
---

# 📁 File Structure — Spring Marketing News

> Reference for hvor ting ligger i kodebasen.
> Skal opdateres ved strukturelle ændringer.

---

## Top-niveau

```
spring-marketing-news/
├── app/                       Next.js App Router (routes + components + API)
├── lib/                       Shared utilities
├── scripts/                   Node.js CLI scripts
├── supabase/                  Edge Functions (Deno)
├── 01_docs/                   Obsidian vault (kontrol-center)
├── .claude/                   Claude Code config
├── public/                    Static assets
├── types/                     Shared TypeScript types
├── package.json
├── tsconfig.json
├── next.config.ts
├── CLAUDE.md                  Projektkontekst for AI-sessioner
├── AGENTS.md                  Next.js-disclaimer for AI agents
└── README.md                  Onboarding-overblik
```

---

## `app/` — Next.js routes + components + API

### Pages (Server Components, medmindre andet er noteret)

| Sti | Funktion |
|---|---|
| `app/page.tsx` | `/` Feed — 30-dages vindue, filter (alle/AI/marketing/⚡ opsummerede), split i "Denne uge" / "Ældre uger" |
| `app/login/page.tsx` | `/login` — email + password (Client) |
| `app/saved/page.tsx` | `/saved` Gemte artikler — kræver auth |
| `app/digest/page.tsx` | `/digest` Personligt digest — viser unified-rapport ØVERST + valgte artikler |
| `app/layout.tsx` | Root layout |
| `app/globals.css` | Tailwind + brand-tokens (kanonisk) |

### API-ruter (`app/api/*`)

| Sti | Funktion |
|---|---|
| `app/api/generate-digest/route.ts` | Genererer personligt digest fra `user_digest_queue` |
| `app/api/generate-unified/route.ts` | Konsoliderer digest til struktureret briefing (THEME/CONTEXT/KEY_INSIGHTS/TRENDS/SOURCES) |
| `app/api/update-unified/route.ts` | Gemmer manuel redigering af unified-rapport |
| `app/api/short-summary/route.ts` | LLM-extract pr. artikel + global cache check |
| `app/api/export-pdf/route.tsx` | Renderer `UnifiedReportPDF` til PDF stream |
| `app/api/export-email/route.tsx` | Resend API · HTML body + PDF attached |

### Client Components (`app/components/`)

| Sti | Funktion |
|---|---|
| `ArticleCard.tsx` | Samler alle artikel-aktioner + ekspanderbar short_summary |
| `SaveButton.tsx` | Bookmark toggle (`user_saves`) |
| `SendToDigestButton.tsx` | Send til næste digest (`user_digest_queue`) |
| `GenerateDigestButton.tsx` | Trigger `/api/generate-digest` |
| `GenerateUnifiedButton.tsx` | Trigger `/api/generate-unified` |
| `EditableUnifiedReport.tsx` | View/edit-modes for AI-rapporten → `/api/update-unified` |
| `ExportButton.tsx` | Dropdown PDF/email |
| `UnifiedReportPDF.tsx` | `@react-pdf/renderer` PDF-template (1-side A4 + artikel-kort på side 2+) |

---

## `lib/` — Shared

| Sti | Funktion |
|---|---|
| `lib/supabase/server.ts` | Server-side Supabase klient (cookies via @supabase/ssr) |
| `lib/supabase/client.ts` | Browser-side Supabase klient |

---

## `types/` — Shared types

| Sti | Funktion |
|---|---|
| `types/index.ts` | Delte TypeScript-typer på tværs af komponenter og API-ruter |

---

## `scripts/` — Node.js CLI

| Sti | Funktion |
|---|---|
| `scripts/sync-prompt.js` | Sync ALLE filer i `01_docs/Prompts/` → Supabase `settings`-tabel |

Kørsel: `node scripts/sync-prompt.js`
Kræver: `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`

---

## `supabase/functions/` — Edge Functions (Deno)

| Sti | Funktion |
|---|---|
| `supabase/functions/scrape-articles/index.ts` | RSS scraper + Gemini summary/score (kører dagligt 06:00 via pg_cron) |
| `supabase/functions/generate-digest/index.ts` | _Legacy — IKKE i brug. Erstattet af `/api/generate-digest`._ |

Deploy: `./supabase-cli/supabase.exe functions deploy <navn> --project-ref mdevyscqhpaogvsblfyp`

**Vigtigt:** Deno-runtime — brug `npm:` prefix til imports. Mappen er ekskluderet fra `tsconfig.json`.

---

## `01_docs/` — Obsidian vault (kontrol-center)

```
01_docs/
├── CHANGELOG.md               Append-only ændringslog (MAJOR + MINOR)
├── CLAUDE_RULES.md            Regler AI-sessioner skal følge (immutable)
├── Komandoer.md               Copy-paste kommando-reference
├── Noter.md                   Personlige noter (immutable)
├── Plan/                      ACTIVE planning
│   ├── Roadmap.md             Vision/scope/milestones (single source of truth)
│   └── Tech_stack.canvas      Visuelt arkitektur-overblik
├── Prompts/                   ACTIVE prompts (synces til Supabase via sync-prompt.js)
│   ├── Digest System Prompt.md
│   ├── Short Summary Prompt.md
│   └── Unified Output Prompt.md
├── Documentation/             Stabil reference
│   ├── DB-schema.md           Tabeller + kolonner + RLS
│   ├── File-structure.md      Denne fil
│   ├── Migrations.md          Append-only SQL-migrations
│   └── Component-Library.html Eksporteret UI library
└── Archive/                   Historisk frozen
    └── Original-Mockups/      Design mockups
```

---

## `.claude/` — Claude Code config

| Sti | Funktion |
|---|---|
| `.claude/skills/changelog.md` | `/changelog` skill — kategoriseret ændrings-log |
| `.claude/worktrees/` | Worktree-isoleret arbejde |

---

## Generel viden (separat vault — ikke en del af dette repo)

```
C:\Users\mieo\OneDrive - Spring Family ApS\Desktop\Obsidian_claude\Claude_design_ref\
├── Claude design.md           Hub for Claude Design knowledge
└── Ressourcer/
    ├── Spring CC Brand Kit.md
    ├── Claude Design Reference.md
    ├── Prompt Bibliotek.md
    ├── Integrationer.md
    └── Vidensdatabase.md
```

Krydsprojekt-reference.

---

_Strukturelle ændringer skal logges som MAJOR i CHANGELOG._
