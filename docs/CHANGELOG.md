---
title: "Changelog"
type: log
protection: locked
claude_write_access: true
updated: 2026-05-05
---

# 📋 Changelog — `docs/`

> **Append-only.** Alle Claude-sessioner skal tilføje entry her efter ændringer.
> Slet aldrig tidligere entries — de er recovery-pointers.

Format:
```
## YYYY-MM-DD — [emne]
- [filsti]: [handling] — [kort begrundelse]
```

---

## 2026-05-05 — Konsolidering af kontrol-center til docs/

- `docs/`: oprettet ved at flytte hele `Obsidian_claude/Claude_design/` ind i projektet
- `docs/CLAUDE_RULES.md`: ny — pragmatiske regler for AI-sessioner
- `docs/CHANGELOG.md`: ny — denne fil, append-only log
- `Obsidian_claude/Claude_design/`: slettet (efter git commit)
- `scripts/sync-prompt.js`: opdateret sti til `docs/Prompts/Digest System Prompt.md`
- `.gitignore`: tilføjet Obsidian volatile filer (`workspace.json`, `cache`)

**Begrundelse:** Tidligere lå "kontrol-center" og "app-kode" i to forskellige rødder.
Nu er alt under én git-historie → automatiske recovery-points + dobbelt backup
(GitHub + OneDrive).

---

## 2026-05-04 — Obsidian → Supabase prompt sync

- `docs/Prompts/Digest System Prompt.md`: oprettet — system prompt for digest
- Tilføjet KEY:-format efter JSON-parsing fejl (uescapede tegn fra Gemini)
- Tilføjet variabler: `{{week}}`, `{{year}}`, `{{article_count}}`, `{{source_count}}`, `{{article_list}}`

---

## 2026-05-04 — Tech stack canvas

- `docs/Plan/Tech_stack.canvas`: oprettet — visuelt overblik over arkitektur
- 46 noder, 22 edges, 5 farvekodede grupper

---

## 2026-05-04 — Feed Site Plan opdateret

- `docs/Plan/Feed Site Plan.md`: Sprint 4 markeret komplet (Vercel deploy)

---

_Tidligere historik findes i Git: `git log -- docs/`_
