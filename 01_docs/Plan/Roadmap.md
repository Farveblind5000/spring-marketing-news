---
title: "Project Roadmap"
type: plan
protection: locked
claude_write_access: true
updated: 2026-05-04
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

