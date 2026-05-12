---
title: "Project Roadmap"
type: plan
protection: locked
claude_write_access: true
updated: 2026-05-12
links_to:
  - "../CHANGELOG"
  - "../Documentation/DB-schema"
  - "../Documentation/File-structure"
  - "../Archive/Feed Site Plan"
---

# 🗺️ Spring Marketing News — Roadmap

> **Kategori 1** i changelog-systemet — vision, scope, milestones.
> Brug `/changelog` skillen for at tilføje opdateringer her.

---

## 🎯 Vision

Et personligt AI & marketing intelligence-feed der:
1. **Scraper** relevant indhold dagligt fra valgte kilder
2. **Opsummerer** med Gemini (3 bullets + relevance score)
3. **Lader brugeren gemme** artikler de finder vigtige
4. **Genererer ugentligt digest** baseret på de gemte artikler

Målgruppe: én eller flere brugere der vil holde sig opdateret på AI + marketing uden at drukne i feeds.

---

## 📐 Scope

### MVP (i mål)
- ✅ Daglig RSS-scraping fra 24 kilder
- ✅ Gemini summary + relevance score 1-10
- ✅ Personlig save-funktion
- ✅ Personligt digest genereret på request
- ✅ Vercel deploy med multi-user auth
- ✅ Obsidian → Supabase prompt-sync workflow

### Udskudt (ikke relevant nu)
- Mobil-responsivt design — udskudt 2026-05-12, ikke prioriteret før kerne-flow er stabilt

### Eksplicit IKKE i MVP
- Digest arkiv detalje
- Personaliseret score per bruger
- Artikel-detail side

---

## 🏁 Milestones

### Sprint 1 — Fundament ✅
**Periode:** April 2026
- Next.js 16 + Supabase + DB schema
- Login, feed-side med mock data

### Sprint 2 — Motor ✅
**Periode:** April-Maj 2026
- RSS scraper Edge Function
- Gemini enrichment (summary + score)
- pg_cron daglig kørsel kl. 06:00
- Feed kobles til rigtig data

### Sprint 3 — Brugerlag ✅
**Periode:** Maj 2026
- SaveButton komponent
- /saved side (gemte artikler)
- /digest side (personligt digest)
- Edge Function generate-digest (legacy, erstattet)

### Sprint 4 — Polish & Deploy ✅
**Periode:** Maj 2026
- ✅ GitHub repo + Vercel deploy
- ✅ TypeScript build-fejl løst
- ✅ Vercel deploy live
- ✅ End-to-end test i produktion
- ✅ Multi-user (3 brugere oprettet)
- ✅ Personligt digest via Next.js API (i stedet for Edge Function)
- ✅ Obsidian → Supabase prompt-sync
- ✅ Konsolidering af kontrol-center til `docs/`
- 🅿️ Mobil-responsiv gennemgang — udskudt (se Udskudt-sektion)

### Sprint 5 — Curated Digest & Feed Cleanup ✅
**Periode:** Maj 2026

**Tema:** Brugeren får finkornet kontrol over hvad der ender i digest. Feedet bliver mere relevant via tidsfiltrering og uge-segmentering. Det udvidede digest får sit eget format og export-mulighed.

**Arkitektoniske beslutninger:**
- Datamodel: ny tabel `user_digest_queue` (separeret fra `user_saves`)
- Filter-grundlag: `scraped_at` for "1 måned gammel"
- Cache for korte opsummeringer: global kolonne på `articles`-tabellen
- Export-formater: PDF + email

**Items (i 4 faser):**

**Fase 1 — Quick wins**
1. Rename "Ugentligt digest" → "Digest" *(MINOR)*
2. Feed: kun artikler ≤30 dage gamle (`scraped_at`) *(MAJOR)*
3. Feed: split i "Denne uge" + "Ældre uger" *(MAJOR)*

**Fase 2 — Send-til-digest flow**
4. Datamodel: ny tabel `user_digest_queue` *(MAJOR)*
5. Feed: "Send til digest"-ikon ved siden af gem-knap *(MAJOR)*
6. Digest: vis valgte artikler + udvidet summary (egen sektion i prompt) *(MAJOR)*

**Fase 3 — Kort opsummering**
7. Feed: "Kort opsummering"-knap → cached LLM-extract *(MAJOR)*

**Fase 4 — Filter + Konsolidering + Export**
8. Digest: Export til PDF + email *(MAJOR — leveret)*
9. Feed: filter for "kun opsummerede artikler" *(MAJOR — leveret)*
10. Digest: "Saml til rapport"-knap → struktureret briefing *(MAJOR — leveret)*
11. Digest: Manuel redigering af rapport før export *(MAJOR — leveret)*

### Sprint 6 — Feed Expansion ✅
**Periode:** Maj 2026

**Tema:** Udvid feed-kildelisten fra 4 til 24 med fokus på AI research, AI tooling, marketing AI og enterprise AI. Erstatter eksisterende Anthropic Blog med den mere specifikke Anthropic News endpoint.

**Nye kilder (20 stk, grupperet):**

| Gruppe | Kilder |
|---|---|
| AI research & frontier | Import AI, The Batch, BAIR Blog, DeepMind Blog, MIT Technology Review AI |
| AI engineering & tooling | Latent Space, TLDR AI, Hugging Face Blog, LangChain Blog |
| AI news & discovery | Ben's Bites, Every AI, There's An AI For That, Superhuman AI, The Rundown AI |
| Officielle model-nyheder | Anthropic News (erstatter Anthropic Blog), OpenAI News |
| Marketing + AI crossover | a16z AI, Marketing AI Institute, Ahrefs Blog, Search Engine Journal AI |

**Items:**
1. ✅ Indsæt 20 nye sources i `sources`-tabellen *(MAJOR — leveret 2026-05-12)*
2. ✅ Deaktiver gammel Anthropic Blog (`/rss.xml`) i live DB *(MINOR — leveret 2026-05-12)*
3. ✅ Opdater `schema.sql` + `Migrations.md` *(MAJOR — leveret 2026-05-12)*

### Sprint 7 — Category System 🗓️
**Periode:** Maj 2026 (igangværende)

**Tema:** Med 24 kilder bliver det nuværende 3-værdi topic-system (`ai`/`marketing`/`both`) for groft. Brugeren skal kunne filtrere på meningsfulde grupperinger så research, engineering, daglige nyheder og marketing kan adskilles i feedet.

**Arkitektoniske beslutninger (foreløbig):**
- Ny `category`-kolonne på `sources` (kanonisk) + på `articles` (arvet ved scrape)
- 5 kategorier: AI Forskning, AI Engineering, AI Nyheder, Marketing, Marketing + AI
- Eksisterende `topic`-felt bevares for bagudkompatibilitet (måske fjernes senere)

**Items (planlagt):**
1. DB-migration: ny `category`-kolonne på `sources` + `articles` *(MAJOR — planlagt)*
2. SQL-update: tildel kategori til alle 24 kilder *(MAJOR — planlagt)*
3. Scraper opdatering: artikler arver `category` fra source *(MAJOR — planlagt)*
4. UI: Erstat 4 filter-knapper med 6 kategori-knapper + "Kun opsummerede" *(MAJOR — planlagt)*
5. ArticleCard badge: vis kategori frem for topic *(MINOR — planlagt)*

---

## 🧭 Beslutninger (architectural decisions)

### 2026-05-12 — Auto-push standing authorization + Stop hook
Push til `origin/main` efter /changelog-flow er forhåndsgodkendt i CLAUDE.md — ingen manuel "JA" hver gang. Stop hook i `.claude/settings.json` fanger forglemte pushes ved session-slut og genengagerer Claude. Force-push og andre risk-handlinger kræver stadig eksplicit bekræftelse.
Se: [CHANGELOG MAJOR 2026-05-12]

### 2026-05-12 — Roadmap-sync indbygget i changelog-flow
`/changelog`-skillen havde et hul: MAJOR/MINOR-entries gik kun til CHANGELOG, ikke til Roadmap, så Sprint-markeringer og Beslutninger drev fra hinanden. Tilføjet STEP 4.5 (klassificering A/B/C/D + automatisk roadmap-action) + ny `/sync-roadmap`-skill som ad-hoc safety net.
Se: [CHANGELOG MAJOR 2026-05-12]

### 2026-05-12 — Feed expansion: 4 → 24 kilder
Skalering af kildelisten med fokus på fem akser (research, engineering, nyheder, officielle releases, marketing+AI).
Anthropic Blog deaktiveret til fordel for `news/rss.xml`-endpoint.
Se: [CHANGELOG MAJOR 2026-05-12] + Sprint 6.

### 2026-05-08 — Dok-konsolidering: kanoniske kilder
`CLAUDE.md` reduceret til navigations-dokument. Tech stack, fil-struktur og DB-schema findes nu hver kun ét sted (henholdsvis `Tech_stack.canvas`, `File-structure.md`, `DB-schema.md`).
README skrevet som onboarding-overblik der peger ind i `01_docs/`.
Se: [CHANGELOG MAJOR 2026-05-08] (to entries).

### 2026-05-05 — Konsolidering: én git-historie
Kontrol-center (Obsidian vault) flyttet ind i projektet som `docs/`.
Single source of truth, dobbelt backup (GitHub + OneDrive).
Se: [CHANGELOG MAJOR 2026-05-05]

### 2026-05-04 — Personligt digest erstatter globalt
Tidligere genererede pg_cron én global digest søndag aften.
Nu genererer hver bruger sit eget personlige digest baseret på `user_saves`.
Trigger: manuel knap, ikke cron. Se: [CHANGELOG MAJOR 2026-05-04]

### 2026-05-04 — Plain KEY: format i stedet for JSON
Gemini's JSON-output gav konsekvent parse-fejl pga. uescapede tegn.
Skiftet til plain text `KEY: value`-format som server parser selv.
Se: [CHANGELOG MAJOR 2026-05-04]

### 2026-05-04 — Prompt i Supabase, ikke i kode
Digest-prompten lever i `settings`-tabellen, drives af Obsidian-noten.
Sync via `node scripts/sync-prompt.js`. Ingen redeploy ved prompt-ændring.

