---
title: "File Structure"
type: documentation
protection: normal
claude_write_access: true
updated: 2026-05-05
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
├── app/                       Next.js App Router
├── lib/                       Shared utilities
├── scripts/                   Node.js CLI scripts
├── supabase/                  Edge Functions
├── docs/                      (legacy, slettet — nu 01_docs/)
├── 01_docs/                   Obsidian vault (kontrol-center)
├── .claude/                   Claude Code config
├── public/                    Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── CLAUDE.md                  Projektkontekst for AI-sessioner
└── README.md
```

---

## `app/` — Next.js routes

| Sti | Type | Funktion |
|---|---|---|
| `app/page.tsx` | Server Component | `/` Feed |
| `app/login/page.tsx` | Client | `/login` |
| `app/saved/page.tsx` | Server | `/saved` Gemte artikler |
| `app/digest/page.tsx` | Server | `/digest` Ugentlig digest |
| `app/api/generate-digest/route.ts` | API Route | POST endpoint for digest-generering |
| `app/components/SaveButton.tsx` | Client | Bookmark toggle |
| `app/components/GenerateDigestButton.tsx` | Client | Trigger digest |
| `app/layout.tsx` | Layout | Root layout |
| `app/globals.css` | CSS | Tailwind + brand-tokens |

---

## `lib/` — Shared

| Sti | Funktion |
|---|---|
| `lib/supabase/server.ts` | Server-side Supabase klient (cookies via @supabase/ssr) |
| `lib/supabase/client.ts` | Browser-side Supabase klient |

---

## `scripts/` — Node.js CLI

| Sti | Funktion |
|---|---|
| `scripts/sync-prompt.js` | Sync `01_docs/Prompts/Digest System Prompt.md` → Supabase `settings` tabel |

Kørsel: `node scripts/sync-prompt.js`
Kræver: `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`

---

## `supabase/functions/` — Edge Functions (Deno)

| Sti | Funktion |
|---|---|
| `supabase/functions/scrape-articles/index.ts` | RSS scraper + Gemini summary/score |
| `supabase/functions/generate-digest/index.ts` | _Legacy — IKKE i brug. Erstattet af `/api/generate-digest`._ |

Deploy: `./supabase-cli/supabase.exe functions deploy <navn> --project-ref mdevyscqhpaogvsblfyp`

**Vigtigt:** Deno-runtime — brug `npm:` prefix til imports. Mappen er ekskluderet fra `tsconfig.json`.

---

## `01_docs/` — Obsidian vault (kontrol-center)

```
01_docs/
├── CHANGELOG.md               Append-only ændringslog (MAJOR + MINOR)
├── CLAUDE_RULES.md            Regler AI-sessioner skal følge (immutable)
├── Noter.md                   Personlige noter (immutable)
├── Plan/                      ACTIVE planning
│   ├── Roadmap.md             Vision/scope/milestones (single source of truth)
│   └── Tech_stack.canvas      Arkitektur-overblik
├── Prompts/                   ACTIVE prompts
│   └── Digest System Prompt.md  Synkes til Supabase via sync-prompt.js
├── Documentation/             Stabil reference (denne fil!)
│   ├── DB-schema.md
│   ├── File-structure.md
│   └── Component-Library.html
└── Archive/                   Historisk frozen
    ├── Feed Site Plan.md      Original sprint 1-4 plan
    └── Original-Mockups/      *.html design mockups
```

---

## `.claude/` — Claude Code config

| Sti | Funktion |
|---|---|
| `.claude/skills/changelog.md` | `/changelog` skill — kategoriseret ændrings-log |

---

## Generel viden (separat vault)

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

Krydsprojekt-reference. Ikke en del af dette repo.

---

_Strukturelle ændringer skal logges som MAJOR i CHANGELOG._
