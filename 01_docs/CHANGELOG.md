---
title: "Changelog"
type: log
protection: locked
claude_write_access: true
updated: 2026-05-05
links_to:
  - "Plan/Roadmap"
  - "CLAUDE_RULES"
---

# 📋 Changelog — Major + Minor changes

> **Append-only.** Newest entries first under each section.
> Brug `/changelog` skillen for at tilføje nye entries.
> For overordnet plan/scope — se `01_docs/Plan/Roadmap.md` (Kategori 1).

---

## MAJOR

> Strukturændringer, nye features, schema, breaking changes.

### 2026-05-07 — Sprint 5 #10: Saml til rapport (struktureret briefing)
**Filer:** `app/api/generate-unified/route.ts` (ny), `app/components/GenerateUnifiedButton.tsx` (ny), `app/digest/page.tsx`, `01_docs/Prompts/Unified Output Prompt.md` (ny), `scripts/sync-prompt.js`, `01_docs/Documentation/Migrations.md`, Supabase `digests` (nye kolonner)
**Begrundelse:** Digest-siden viser artikel-kort, men export til PDF/email kræver ét sammenhængende narrativ-dokument. Ny knap "Saml til rapport" tager eksisterende digest-indhold som input og laver en struktureret briefing der efterfølgende kan eksporteres (#8).
**Konsekvenser:** Schema-tilføjelse: `digests.unified_content` + `unified_generated_at`. Ny knap vises kun når digest eksisterer. Rapport rendres ØVERST på `/digest` over artikel-kortene. Format: THEME / CONTEXT / KEY_INSIGHTS (3-4) / TRENDS / SOURCES — uden action items.
**Commit:** d6e0d91 (kode) · SQL kørt manuelt 2026-05-07

### 2026-05-07 — Sprint 5 #9: Feed-filter inkl. "kun opsummerede"
**Filer:** `app/page.tsx`
**Begrundelse:** Eksisterende filter-tabs (Alle/AI/Marketing) var statiske visuelle elementer uden funktion. Bruger ønsker at kunne filtrere til artikler der er blevet opsummeret af LLM (har short_summary cached).
**Konsekvenser:** Filter-tabs bliver funktionelle Links med URL searchParams (`?filter=ai|marketing|summarized`). Server-side filtering på query. "Denne uge"/"Ældre uger" split anvendes på filtrerede resultater.
**Commit:** 4961e90

### 2026-05-07 — Sprint 5 #11: Manuel redigering af samlet rapport
**Filer:** `app/api/update-unified/route.ts` (ny), `app/components/EditableUnifiedReport.tsx` (ny), `app/digest/page.tsx`
**Begrundelse:** LLM-output bør altid kunne finjusteres af mennesker før export. Bruger kan nu rette tekst, fjerne/tilføje insights, justere sprog inden PDF/email sendes.
**Konsekvenser:** Refaktor af inline unified-section til Client Component med view/edit modes. "✏️ Rediger"-knap i top af rapport-kortet → form med textareas/inputs → Gem opdaterer DB. Ingen schema-ændring. unified_generated_at bevares som AI-timestamp; manuel rettelse resetter den ikke.
**Commit:** 5c9ee55

### 2026-05-07 — Sprint 5 #8: Export til PDF + email
**Filer:** `app/components/UnifiedReportPDF.tsx` (ny), `app/api/export-pdf/route.tsx` (ny), `app/api/export-email/route.tsx` (ny), `app/components/ExportButton.tsx` (ny), `app/digest/page.tsx`, `package.json` (+@react-pdf/renderer +resend)
**Begrundelse:** Lukker Sprint 5 — eksporterer den samlede rapport (#10) til PDF og email.
**Konsekvenser:** Ny dropdown-knap "Eksporter ▾" ved siden af Saml/Generer. PDF: 1-side A4 med Spring CC brand, 1:1 mapping af unified-data. Email: HTML body + PDF attached, default recipient = login-email, kan overskrives. Resend API (gratis 100/dag, FROM: onboarding@resend.dev for nu). RESEND_API_KEY tilføjet til .env.local + Vercel.
**Commit:** 529b836

### 2026-05-07 — Sprint 5 #7: Cache for korte LLM-opsummeringer
**Filer:** `app/api/short-summary/route.ts` (ny), `app/components/ArticleCard.tsx` (ny), `app/page.tsx`, `app/saved/page.tsx`, Supabase `articles` (nye kolonner), `01_docs/Documentation/Migrations.md`
**Begrundelse:** "Kort opsummering"-knap kalder LLM. Global cache (én pr. artikel) sparer omkostning og giver instant UX for 2+ brugere.
**Konsekvenser:** Schema-tilføjelse: `articles.short_summary` + `short_summary_generated_at` + RLS-policy. Refaktor til `<ArticleCard>` Client Component der samler alle aktionsknapper og expandable summary. Nyt POST endpoint `/api/short-summary` med DB-cache check først.
**Commit:** 6835466 (kode) · SQL kørt manuelt 2026-05-07

### 2026-05-05 — Sprint 5 #6: Digest viser valgte artikler + udvidet summary
**Filer:** `app/digest/page.tsx`, `app/api/generate-digest/route.ts`, `app/components/GenerateDigestButton.tsx`, `01_docs/Prompts/Digest System Prompt.md`
**Begrundelse:** Når bruger har valgt specifikke artikler til digest, skal digest vise dem + en mere fyldestgørende opsummering end ugens generelle digest.
**Konsekvenser:** Digest-side viser én kort pr. valgt artikel med 4-6 sætning summary + 3 takeaways. Prompt-format ændret til ART_N_TITLE/SOURCE/SUMMARY/TAKEAWAY1-3 (variabelt antal). Genereringen bruger `user_digest_queue` som input. Gamle digest-format (intro+trends+highlights) detekteres som "legacy" og bruger bedes regenerere.
**Commit:** 5798ce2

### 2026-05-05 — Sprint 5 #5: Send til digest-knap på feed
**Filer:** `app/components/SendToDigestButton.tsx` (ny), `app/page.tsx`, `app/saved/page.tsx`
**Begrundelse:** Bruger skal kunne markere artikler eksplicit til digest, separat fra "gem til senere".
**Konsekvenser:** Ny UI-knap ved siden af bookmark. Skriver til `user_digest_queue`-tabellen.
**Commit:** d3a84fc

### 2026-05-05 — Sprint 5 #4: Datamodel — user_digest_queue tabel
**Filer:** Supabase SQL (manuel via SQL Editor), `01_docs/Documentation/Migrations.md`
**Begrundelse:** "Send til digest" og "gem til senere" er konceptuelt forskellige handlinger. Separat tabel undgår sammenblanding.
**Konsekvenser:** Schema-tilføjelse: `user_digest_queue (id, user_id, article_id, added_at)`. RLS-policy. Eksisterende `user_saves` uberørt.
**Commit:** d3a84fc (kode + migration-doc) · SQL kørt manuelt 2026-05-05

### 2026-05-05 — Sprint 5 #3: Feed split i "Denne uge" + "Ældre uger"
**Filer:** `app/page.tsx`
**Begrundelse:** Brugeren skal nemt skelne mellem nyt og tidligere indhold. Aktuelle uge øverst, ældre nedenfor.
**Konsekvenser:** Feed-render-logik ændres. Artikler grupperes efter `scraped_at`-uge. To sektioner med headers.
**Commit:** 6523b48

### 2026-05-05 — Sprint 5 #2: Feed begrænset til ≤30 dage gamle artikler
**Filer:** `app/page.tsx`
**Begrundelse:** Feedet skal vise relevant nyt indhold, ikke historisk arkiv. 30 dages vindue baseret på `scraped_at`.
**Konsekvenser:** Query-filter på artikel-fetch. Artikler ældre end 30 dage er ikke længere synlige i feed (men findes stadig i DB).
**Commit:** 6523b48

### 2026-05-05 — Reorganisering af 01_docs/ struktur
**Filer:** `01_docs/Documentation/` (ny), `01_docs/Archive/` (ny), `01_docs/Plan/`, `01_docs/Ressourcer/` (flyttet ud), `01_docs/Export_import/` (slettet)
**Begrundelse:** Fire forskellige typer indhold (planlægning, dokumentation, historisk, generel viden) lå blandet sammen. Risiko for forvirring og dårlig opdaging. Feed Site Plan og Roadmap overlappede.
**Konsekvenser:**
- `Plan/` indeholder kun forward-looking docs (Roadmap + Tech_stack)
- `Documentation/` (NEW) — stabil reference (DB-schema, File-structure, Component-Library)
- `Archive/` (NEW) — frozen historik (Feed Site Plan, Original-Mockups)
- `Ressourcer/` flyttet til separat vault `Obsidian_claude/Claude_design_ref/` (krydsprojekt-viden)
- `Claude design.md` flyttet samme sted (er hub for general Claude Design knowledge)
- `Export_import/` slettet (Component Library flyttet til Documentation/)
**Commit:** 5173da3

### 2026-05-05 — Mappe-rename: docs/ → 01_docs/
**Filer:** `01_docs/` (renamed fra `docs/`), `scripts/sync-prompt.js`, `CLAUDE.md`, `.gitignore`, `.claude/skills/changelog.md`, `01_docs/CLAUDE_RULES.md`
**Begrundelse:** Numerisk præfiks `01_` placerer mappen øverst i Obsidian fil-view. Ren UX-præference fra bruger.
**Konsekvenser:** Alle path-referencer opdateret. `sync-prompt.js` peger nu på `01_docs/Prompts/`. Test af sync verificerer at alt virker.
**Commit:** 3e269c8

### 2026-05-05 — Changelog-system med /changelog skill
**Filer:** `.claude/skills/changelog.md`, `docs/Plan/Roadmap.md`, `docs/CHANGELOG.md`, `docs/CLAUDE_RULES.md`
**Begrundelse:** Manglende formel proces for ændringer på tværs af AI-sessioner. Risiko for utilsigtede sletninger og tab af kontekst.
**Konsekvenser:** Alle fremtidige ændringer går gennem `/changelog` flowet med kategori-baseret routing til Roadmap eller Changelog.
**Commit:** 3e269c8

### 2026-05-05 — Konsolidering af kontrol-center til docs/
**Filer:** `docs/`, `scripts/sync-prompt.js`, `CLAUDE.md`, `.gitignore`
**Begrundelse:** Tidligere lå kontrol-center og app-kode i to rødder uden fælles git-historie. Risiko for inkonsistens og tab.
**Konsekvenser:** Single git history. OneDrive + GitHub dobbelt backup. Obsidian peger nu på `docs/`.
**Commit:** 530e209

### 2026-05-04 — Personligt digest erstatter globalt
**Filer:** `app/api/generate-digest/route.ts` (ny), `app/components/GenerateDigestButton.tsx` (ny), `app/digest/page.tsx`
**Begrundelse:** Globalt digest baseret på top-relevance gav ikke værdi. Brugeren vil have digest af artikler de selv valgte.
**Konsekvenser:** pg_cron `ugentlig-digest` deaktiveret. Edge Function generate-digest blev legacy. Manuel trigger via knap.
**Commit:** d2970ec

### 2026-05-04 — Plain KEY: format i stedet for JSON fra Gemini
**Filer:** `app/api/generate-digest/route.ts`, `docs/Prompts/Digest System Prompt.md`
**Begrundelse:** Gemini's JSON-output gav konsistente parse-fejl pga. uescapede tegn (quotes, newlines).
**Konsekvenser:** Server parser plain text format. Mere robust. Prompt-strukturen ændret.
**Commit:** 36b85f5

### 2026-05-04 — Prompt drevet af Obsidian via settings-tabel
**Filer:** `docs/Prompts/Digest System Prompt.md`, `scripts/sync-prompt.js`, Supabase `settings` tabel
**Begrundelse:** Hardkodede prompts kræver redeploy ved ændring. Obsidian giver bedre redigeringsoplevelse.
**Konsekvenser:** Workflow: Obsidian → sync-script → Supabase → API. Ingen redeploy nødvendig.
**Commit:** b72e231

### 2026-05-04 — Konfigureret Vercel deploy
**Filer:** GitHub repo, Vercel env vars, `tsconfig.json`
**Begrundelse:** Sitet skal være tilgængeligt udefra (multi-user, mobil).
**Konsekvenser:** Live på `spring-marketing-news.vercel.app`. Edge Functions deployes separat.
**Commit:** 21db8ba

---

## MINOR

> Bugfixes, tweaks, små rettelser uden strukturpåvirkning.

### 2026-05-07 — Unified rapport: token-tuning + bedre fejl
**Filer:** `app/api/generate-unified/route.ts`
**Beskrivelse:** Initial token-cap (4800 for 2 artikler) gav tom respons fra Gemini — samme issue som digest tidligere. Sænket til 3000+200*N capped 6000 (output-format er fast størrelse). Tilføjet verbose error med geminiData.error.message + candidates count.
**Commit:** f87f4f2

### 2026-05-07 — Export-fixes: artikel-kort i PDF + brand-rename + tal-bug
**Filer:** `app/components/UnifiedReportPDF.tsx`, `app/api/export-pdf/route.tsx`, `app/api/export-email/route.tsx`
**Beskrivelse:** Tre samlede fixes:
1. PDF-eksport ændret fra option A (kun rapport) til B (rapport + artikel-kort) — page 2+ viser hver valgt artikel med titel/source/summary/takeaways
2. Tal i orange cirkler manglede i PDF — fix: erstattet `<Text style={circle+text}>` med `<View style={circle}><Text>{n}</Text></View>` (View+Text pattern)
3. Rebranding "Spring CC News Intel" → "EMILS AI NEWS" overalt: PDF header, email FROM, email subject, email HTML body, filename (emils-ai-news-uge-X-YYYY.pdf)
**Commit:** c71fe19

### 2026-05-07 — Auto-expand summary ved filter=summarized
**Filer:** `app/components/ArticleCard.tsx`, `app/page.tsx`
**Beskrivelse:** UX-forbedring: når brugeren filtrerer til "⚡ Opsummerede"-tab er det ulogisk at skulle klikke på lyn-ikonet på hver artikel for at se opsummeringen. Tilføjet `defaultExpanded`-prop på ArticleCard som passes når filter==='summarized'. Ingen ekstra LLM-kald da summaries allerede er cached.
**Commit:** 4202c6e

### 2026-05-07 — Fjernet relevance_score fra UI
**Filer:** `app/components/ArticleCard.tsx`
**Beskrivelse:** Legacy score (1-10 fra Gemini) er ikke længere relevant efter Sprint 5's manuelle curation-flow. Inkonsistent visning (nogle artikler havde, andre ikke) lignede en bug. Fjernet rendering. DB-kolonne `relevance_score` bevaret.
**Commit:** f9b6b66

### 2026-05-07 — Digest button stuck i loading state
**Filer:** `app/components/GenerateDigestButton.tsx`
**Beskrivelse:** `setLoading(false)` lå kun i catch-blok — efter succesful generation forblev knappen i loading state. Flyttet til finally-blok.
**Commit:** 5d4c89f

### 2026-05-07 — Gemini 2.5 Flash thinking-tokens workaround
**Filer:** `app/api/short-summary/route.ts`, `app/api/generate-digest/route.ts`
**Beskrivelse:** Gemini 2.5 Flash bruger interne thinking-tokens før synlig output. `thinkingConfig: {thinkingBudget: 0}` blev afvist på v1-endpoint → tom respons. Fix: bumpede maxOutputTokens til 4000 (short summary) og 3000+500*N capped 8000 (digest), så thinking + visible output begge har plads. Tilføjet verbose error med finishReason.
**Commit:** 5496f73, 1d5bc19

### 2026-05-07 — Short summary: prompt til Obsidian + højere tokens
**Filer:** `01_docs/Prompts/Short Summary Prompt.md` (ny), `scripts/sync-prompt.js`, `app/api/short-summary/route.ts`
**Beskrivelse:** Gemini-output blev afkortet midt i sætning pga. `maxOutputTokens: 400`. Bumped til 800. Samtidig flyttet hardkodet prompt til Obsidian → Supabase pattern (samme som digest), så den kan justeres uden redeploy. Sync-script udvidet til at håndtere flere prompts.
**Commit:** ed8a842

### 2026-05-05 — Sprint 5 #1: Rename "Ugentligt digest" → "Digest"
**Filer:** `app/page.tsx`, `app/saved/page.tsx`, `app/digest/page.tsx`
**Beskrivelse:** Forenklet navngivning. "Ugentligt" var overflødigt — det forventes at være ugentligt.
**Commit:** f96cdee

### 2026-05-04 — Removed event handlers from Server Component
**Filer:** `app/digest/page.tsx`, `app/globals.css`
**Beskrivelse:** `onMouseOver/onMouseOut` på Server Component crashede siden. Erstattet med CSS hover-class `.digest-highlight-link:hover`.
**Commit:** a83ff88

### 2026-05-04 — URL lookup via title match instead of Gemini
**Filer:** `app/api/generate-digest/route.ts`
**Beskrivelse:** URLs i Gemini's JSON-output forårsagede unterminated string-fejl. Server matcher nu titler mod articles-array post-hoc.
**Commit:** 2e210aa

### 2026-05-04 — responseMimeType fjernet
**Filer:** `app/api/generate-digest/route.ts`, `supabase/functions/generate-digest/index.ts`
**Beskrivelse:** Parameter ikke understøttet af gemini-2.5-flash på v1 endpoint. Returnerede tomme candidates.
**Commit:** 6b0b176

### 2026-05-04 — Gemini-model opdateret til 2.5 Flash
**Filer:** `supabase/functions/scrape-articles/index.ts`, `supabase/functions/generate-digest/index.ts`, `CLAUDE.md`
**Beskrivelse:** gemini-2.0-flash deprecated for nye API-keys. Skiftet til gemini-2.5-flash på v1 endpoint.
**Commit:** 775172b

---

_Tidligere historik findes i `git log -- docs/` og git history generelt._
