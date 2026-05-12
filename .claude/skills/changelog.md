---
name: changelog
description: Categorize, log, and execute a project change with validation
---

# /changelog — Categorized change logger

You are about to log and (optionally) execute a project change.

## STEP 1 — Pre-flight (do this FIRST, every time)

Read these files in this order:
1. `01_docs/CLAUDE_RULES.md` — confirm you understand current rules
2. `01_docs/CHANGELOG.md` — see existing structure and entries
3. `01_docs/Plan/Roadmap.md` — see project vision and milestones

## STEP 2 — Ask user for category

Present this menu to the user EXACTLY:

```
Hvilken kategori er ændringen?

[1] PLAN     — vision, scope, milestones (→ 01_docs/Plan/Roadmap.md)
[2] MAJOR    — strukturændring, ny feature, schema, breaking change (→ CHANGELOG)
[3] MINOR    — bugfix, tweak, lille rettelse (→ CHANGELOG)
```

Wait for user to answer 1, 2, or 3.

## STEP 3 — Gather details (vary by category)

### Category 1 — PLAN
Ask the user:
- **Hvad er ændringen i planen?** (overskrift)
- **Hvorfor nu?** (begrundelse)
- **Hvilke milestones/sprints påvirkes?**
- **Er det et nyt mål, et skift i scope, eller en ny feature på roadmap?**

### Category 2 — MAJOR
Ask the user:
- **Kort overskrift** (én sætning)
- **Hvilke filer/mapper berøres?** (liste)
- **Begrundelse** — hvorfor nu, hvad løser det
- **Konsekvenser** — hvad ændrer sig for andre dele af systemet
- **Skal jeg udføre ændringen nu, eller bare logge den til senere?**

For each affected file, read frontmatter and check protection:
- `protection: immutable` → STOP. Refuse the change. Tell user it requires manual editing.
- `protection: locked` → ask explicit "JA" before proceeding
- `claude_write_access: false` → ask explicit "JA"

### Category 3 — MINOR
Ask the user:
- **Kort beskrivelse** (1-2 sætninger)
- **Hvilke filer?**
- **Skal jeg udføre nu eller bare logge?**

## STEP 4 — Log to the right file

**APPEND-ONLY.** Never overwrite or delete existing entries.

### Category 1 → `01_docs/Plan/Roadmap.md`
Append under `## Recent Updates` section. Format:
```markdown
### YYYY-MM-DD — [overskrift]
**Type:** [scope-shift | new-feature | milestone | vision-update]
**Hvad ændres:** ...
**Hvorfor:** ...
**Påvirker:** [linker til Sprint X eller andre dokumenter]
```

### Category 2 → `01_docs/CHANGELOG.md` under `## MAJOR`
Format:
```markdown
### YYYY-MM-DD — [overskrift]
**Filer:** [liste]
**Begrundelse:** ...
**Konsekvenser:** ...
**Commit:** [git SHA hvis udført, ellers "pending"]
```

### Category 3 → `01_docs/CHANGELOG.md` under `## MINOR`
Format:
```markdown
### YYYY-MM-DD — [overskrift]
**Filer:** [liste]
**Beskrivelse:** ...
**Commit:** [git SHA hvis udført, ellers "pending"]
```

## STEP 4.5 — Roadmap cross-reference (ALWAYS for Category 2 + 3)

After logging to CHANGELOG, the Roadmap may also need updating. Classify the entry:

### A) Sprint item delivery
**Symptom:** Entry references a Sprint item (e.g., "Sprint 5 #7", "Sprint 6 #2") OR text matches an unticked item under a Sprint section.

**Action:**
1. Open `01_docs/Plan/Roadmap.md`
2. Find the matching Sprint item
3. Update its status inline:
   - Before: `1. Item text *(MAJOR)*`
   - After:  `1. ✅ Item text *(MAJOR — leveret YYYY-MM-DD)*`
4. If ALL items under a Sprint are ✅ → update Sprint header status to ✅

### B) Architectural decision
**Symptom:** Entry establishes a new pattern, swaps a third-party service, changes schema philosophy, introduces a non-trivial abstraction, or changes how the system is structured. *Not* a feature delivery.

**Action:**
1. Open `01_docs/Plan/Roadmap.md`
2. Add a new entry at the TOP of `## 🧭 Beslutninger (architectural decisions)`
3. Format:
   ```markdown
   ### YYYY-MM-DD — [overskrift]
   [1-3 sætninger om hvad/hvorfor]
   Se: [CHANGELOG MAJOR YYYY-MM-DD]
   ```

### C) Out-of-plan feature
**Symptom:** A new feature shipped without a corresponding Sprint item.

**Action:**
Ask the user:
> "Det her er en ny feature der ikke står på roadmap. Skal det:
> [1] Tilføjes som nyt item under en eksisterende sprint?
> [2] Eget mini-sprint?
> [3] Bare CHANGELOG, ikke roadmap-relevant?"

Apply accordingly.

### D) Pure bug fix / copy tweak / internal refactor
**Symptom:** No architectural or scope impact.

**Action:** Skip. CHANGELOG-entry alene er nok.

### After ANY Roadmap update

- Bump `updated:` in Roadmap.md frontmatter to today (YYYY-MM-DD)
- Roadmap has `protection: locked` → ask user "JA" before saving if changes are substantial (a single item flip from ⬜ → ✅ counts as low-risk; new Beslutninger or Sprint-item creation needs JA)

---

## STEP 5 — Execute (if user said yes)

Make the changes. After git commit, return to the changelog entry and replace `pending` with the actual commit SHA.

## STEP 6 — Final confirmation

Show the user:
- Path to updated file (`01_docs/CHANGELOG.md` or `01_docs/Plan/Roadmap.md`)
- The exact entry that was added
- Commit SHA (if executed)

## VALIDATION RULES (always enforce)

1. **Append-only**: Existing CHANGELOG/Roadmap entries are NEVER edited or deleted.
2. **Frontmatter check**: Read protection flag on every file before writing to it.
3. **Date format**: Always `YYYY-MM-DD`, never relative dates.
4. **Section ordering**: Newest entries at top under each section.
5. **Cross-reference**: If a Roadmap entry causes a CHANGELOG entry (or vice versa), link them.

## EXAMPLES

### Example MAJOR entry:
```markdown
### 2026-05-05 — Konsolidering af kontrol-center til 01_docs/
**Filer:** 01_docs/, scripts/sync-prompt.js, CLAUDE.md, .gitignore
**Begrundelse:** Tidligere lå kontrol-center og app-kode i to rødder uden fælles git-historie.
**Konsekvenser:** Single git history. OneDrive + GitHub dobbelt backup. Obsidian skal pege på 01_docs/.
**Commit:** 530e209
```

### Example MINOR entry:
```markdown
### 2026-05-04 — Fjernet responseMimeType fra Gemini-kald
**Filer:** app/api/generate-digest/route.ts
**Beskrivelse:** responseMimeType: 'application/json' var ikke understøttet af gemini-2.5-flash på v1 endpoint.
**Commit:** 6b0b176
```

### Example PLAN entry:
```markdown
### 2026-05-05 — Multi-user support
**Type:** new-feature
**Hvad ændres:** Tre brugere oprettet i auth — flow er nu valideret som multi-tenant
**Hvorfor:** Forberede til reel deling af systemet efter MVP
**Påvirker:** Sprint 4 (deploy) — nu komplet. Sprint 5 (skalering) kan starte.
```
