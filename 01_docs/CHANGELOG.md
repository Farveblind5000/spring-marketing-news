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

### 2026-05-05 — Mappe-rename: docs/ → 01_docs/
**Filer:** `01_docs/` (renamed fra `docs/`), `scripts/sync-prompt.js`, `CLAUDE.md`, `.gitignore`, `.claude/skills/changelog.md`, `01_docs/CLAUDE_RULES.md`
**Begrundelse:** Numerisk præfiks `01_` placerer mappen øverst i Obsidian fil-view. Ren UX-præference fra bruger.
**Konsekvenser:** Alle path-referencer opdateret. `sync-prompt.js` peger nu på `01_docs/Prompts/`. Test af sync verificerer at alt virker.
**Commit:** pending

### 2026-05-05 — Changelog-system med /changelog skill
**Filer:** `.claude/skills/changelog.md`, `docs/Plan/Roadmap.md`, `docs/CHANGELOG.md`, `docs/CLAUDE_RULES.md`
**Begrundelse:** Manglende formel proces for ændringer på tværs af AI-sessioner. Risiko for utilsigtede sletninger og tab af kontekst.
**Konsekvenser:** Alle fremtidige ændringer går gennem `/changelog` flowet med kategori-baseret routing til Roadmap eller Changelog.
**Commit:** pending

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
