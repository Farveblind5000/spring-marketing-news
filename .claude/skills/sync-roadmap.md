---
name: sync-roadmap
description: Scan recent CHANGELOG entries and propose Roadmap updates for missing Sprint markers and architectural decisions
---

# /sync-roadmap — Catch up Roadmap with CHANGELOG drift

You will scan recent CHANGELOG entries and identify ones that should be reflected in Roadmap.md but aren't. This skill is the ad-hoc safety net for when `/changelog`'s STEP 4.5 was skipped or applied incompletely.

## STEP 1 — Pre-flight

Read these files in order:
1. `01_docs/CLAUDE_RULES.md` — confirm protection rules
2. `01_docs/CHANGELOG.md` — full file
3. `01_docs/Plan/Roadmap.md` — full file

## STEP 2 — Date window

Ask the user EXACTLY:

```
Hvilken periode skal jeg gennemgå?

[1] Sidste 30 dage (default)
[2] Sidste 7 dage
[3] Siden specifik dato (du angiver)
[4] Hele CHANGELOG
```

Wait for answer. Default to [1] if user says "default" or doesn't specify.

## STEP 3 — Scan and classify

For each CHANGELOG entry in the window (both MAJOR and MINOR sections), classify it using the same rules as `/changelog` STEP 4.5:

| Type | Symptom | Roadmap action |
|---|---|---|
| **A) Sprint delivery** | Mentions "Sprint X #Y" OR matches an unticked item | Mark item ✅ med dato |
| **B) Architectural decision** | New pattern/schema/service/abstraction | Add to `## 🧭 Beslutninger` |
| **C) Out-of-plan feature** | New feature without sprint reference | Flag for user decision |
| **D) Bug fix / tweak** | MINOR med ingen strukturpåvirkning | Skip |

For each classified entry, check Roadmap.md to see if the action is already done:
- Sprint items: search for ✅ marker on the matching item
- Beslutninger: search for entry with matching date or topic

Only queue entries where the Roadmap action is **missing**.

## STEP 4 — Present report

Show the user a table BEFORE making any edits:

```
| Dato       | CHANGELOG entry                       | Type | Roadmap status | Foreslået handling                    |
|------------|---------------------------------------|------|----------------|---------------------------------------|
| 2026-05-11 | Fjern alle valgte knap                | C    | Mangler        | Spørg: nyt sprint-item eller Sprint 5?|
| 2026-05-08 | Dok-konsolidering: CLAUDE.md…         | B    | Mangler        | Tilføj til Beslutninger               |
| 2026-05-07 | Sprint 5 #10 Saml til rapport         | A    | OK (✅ markeret)| Skip                                  |
```

Below the table, summarize:
```
N entries mangler roadmap-opdatering
- M Sprint-markeringer (lav risiko, ren faktuel)
- K nye Beslutninger (kræver JA)
- L out-of-plan features (kræver brugerbeslutning)
```

## STEP 5 — Apply with user approval

Walk through in order:

### 5a — Sprint markers (low risk)
Show a list. Ask: "Skal jeg markere disse som leveret?"
On JA: edit Roadmap directly. Format:
```
1. ✅ Item text *(MAJOR — leveret YYYY-MM-DD)*
```

### 5b — New Beslutninger
For each, show the proposed entry text. Ask "JA" per entry.
Insert at TOP of `## 🧭 Beslutninger` section. Never reorder existing entries.

### 5c — Out-of-plan features
For each, ask:
> "Det her er en ny feature der ikke står på roadmap. Skal det:
> [1] Tilføjes som nyt item under en eksisterende sprint?
> [2] Eget mini-sprint?
> [3] Bare CHANGELOG, ikke roadmap-relevant?"

Apply accordingly.

## STEP 6 — Finalize

After all edits:
1. Bump `updated:` in Roadmap.md frontmatter to today (YYYY-MM-DD)
2. Show final summary:
   - N Sprint items marked ✅
   - K Beslutninger added
   - L out-of-plan items resolved
3. Recommend a `git commit` with message: `docs: sync roadmap with CHANGELOG (N entries)`

## VALIDATION RULES

1. **Append-only** for Beslutninger and Sprint items — never delete or reorder
2. **Sprint item text** must not change — only the status marker (✅) and leveret-date
3. **Protection respect** — Roadmap has `protection: locked`. Substantial changes (new Beslutninger, new sprint-items) need explicit "JA". Simple ✅-markeringer = low-risk batch.
4. **Date format** — always `YYYY-MM-DD`
5. **No silent edits** — every change must appear in the STEP 4 report first

## WHEN TO RUN THIS SKILL

- Når brugeren spørger om roadmap er up-to-date
- Før vigtige milestones (PR til hovedbranch, deploy, demo)
- Månedligt som proaktiv vedligehold
- Efter længere AI-session hvor `/changelog` blev brugt mange gange uden roadmap-tjek
