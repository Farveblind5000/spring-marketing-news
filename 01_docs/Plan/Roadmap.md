---
title: "Project Roadmap"
type: plan
protection: locked
claude_write_access: true
updated: 2026-05-05
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
- ✅ Daglig RSS-scraping fra 4 kilder
- ✅ Gemini summary + relevance score 1-10
- ✅ Personlig save-funktion
- ✅ Personligt digest genereret på request
- ✅ Vercel deploy med multi-user auth
- ✅ Obsidian → Supabase prompt-sync workflow
- ⏳ Mobil-responsivt design

### Eksplicit IKKE i MVP
- Export PDF
- Del/share digest
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

### Sprint 4 — Polish & Deploy 🔧
**Periode:** Maj 2026
- ✅ GitHub repo + Vercel deploy
- ✅ TypeScript build-fejl løst
- ✅ Vercel deploy live
- ✅ End-to-end test i produktion
- ✅ Multi-user (3 brugere oprettet)
- ✅ Personligt digest via Next.js API (i stedet for Edge Function)
- ✅ Obsidian → Supabase prompt-sync
- ✅ Konsolidering af kontrol-center til `docs/`
- ⏳ Mobil-responsiv gennemgang

### Sprint 5 — TBD
_Ikke planlagt endnu. Tilføj her ved at bruge `/changelog`._

---

## 🧭 Beslutninger (architectural decisions)

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

---

## 📝 Recent Updates

> **Append-only.** Tilføj nye entries i toppen af denne sektion via `/changelog`.

### 2026-05-05 — Changelog-system med skill
**Type:** new-feature (workflow)
**Hvad ændres:** `/changelog` skill der kategoriserer ændringer i Plan/Major/Minor og opdaterer rette filer.
**Hvorfor:** Forhindre tab af kontekst på tværs af AI-sessioner. Tvinge konsistent dokumentation.
**Påvirker:** Alle fremtidige ændringer i `docs/` og kode.

### 2026-05-05 — Konsolidering af kontrol-center
**Type:** scope-shift
**Hvad ændres:** Obsidian vault `Claude_design/` flyttet ind som `docs/` i projektet.
**Hvorfor:** Tidligere to separate rødder uden fælles historik.
**Påvirker:** Sprint 4 polish — nu komplet bortset fra mobil.
