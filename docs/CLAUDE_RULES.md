---
title: "Claude Rules"
type: rules
protection: immutable
claude_write_access: false
updated: 2026-05-05
---

# 📜 Claude Rules — pragmatisk beskyttelse

> **Læs denne fil FØRST i hver Claude-session der rører `docs/`-mappen.**

---

## 1. Hvornår SKAL Claude spørge før handling?

Claude **skal stoppe og bede om eksplicit "JA" i chat** før følgende:

| Handling | Eksempel |
|---|---|
| **Sletning af fil** | `rm docs/Plan/Old.md` |
| **Omdøbning af fil** | `Old.md` → `New.md` |
| **Flytning mellem mapper** | `Plan/X.md` → `Ressourcer/X.md` |
| **Ny mappe på top-niveau** | `docs/Newfolder/` |
| **Ændring i fil med `claude_write_access: false`** | Se nedenfor |
| **Ændring i `protection: immutable` eller `locked`** | Stop. Spørg. |

---

## 2. Hvornår MÅ Claude redigere uden at spørge?

- Filer med `claude_write_access: true` (eller intet flag = default true)
- Tilføjelse af nyt indhold til eksisterende filer
- Mindre tekstrettelser, formatering, frontmatter-opdatering af `updated`-feltet

---

## 3. Frontmatter-vokabular

Brug disse felter i alle `.md`-filer:

```yaml
---
title: "Filnavn"
type: plan | prompt | rules | resource | note | log
protection: immutable | locked | normal      # default = normal
claude_write_access: true | false             # default = true
updated: YYYY-MM-DD
links_to:
  - "RelativePath/Other File"
---
```

**Protection-niveauer:**
- `immutable` — må ALDRIG ændres af Claude. Manuel redigering kun.
- `locked` — kræver eksplicit "JA" i chat før hver ændring.
- `normal` — Claude må redigere. Skal logge i CHANGELOG.

---

## 4. Changelog-pligt

Efter HVER session hvor Claude ændrede noget i `docs/`:
- Tilføj en entry i `docs/CHANGELOG.md` (append-only)
- Format: `## YYYY-MM-DD — [session-emne]` + bullet-liste over filer + handlinger

---

## 5. Recovery

| Scenarie | Løsning |
|---|---|
| Slettet fil | `git log -- <sti>` → `git checkout <commit> -- <sti>` |
| Forkert ændring | `git diff` → `git checkout -- <fil>` |
| Hele mappe væk | `git restore docs/` |
| Begivenhed uden git | OneDrive versionshistorik (30 dage) |

---

## 6. Pre-flight checklist for Claude

Før Claude rører `docs/`:

1. ✅ Læs `CLAUDE_RULES.md` (denne fil)
2. ✅ Læs frontmatter på fil(er) der skal ændres
3. ✅ Hvis `protection: locked` eller `claude_write_access: false` → spørg først
4. ✅ Hvis det er en strukturel ændring (sletning/flytning/ny mappe) → spørg først
5. ✅ Efter ændring: opdater `CHANGELOG.md`

---

## 7. Hvad er `docs/` IKKE?

- **Ikke** et sted for kode-eksekvering
- **Ikke** en database — det er et videns-katalog
- **Ikke** auto-genereret — alt er manuelt skrevet eller bevidst tilføjet

---

_Sidst opdateret: 2026-05-05 — pragmatisk niveau, jf. brugeraftale._
