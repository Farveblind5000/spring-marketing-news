---
title: "Spring CC Brand Kit"
type: resource
status: active
claude_write_access: true
updated: 2026-05-01
links_to:
  - Claude design
---

# Spring CC — Brand Kit
_Source of truth. Indsæt som første prompt i Claude Design._

---

## Prompt

```
Dette projekt bruger Spring CC's brand system. Brug det konsekvent i alt du genererer.

FARVER:
- Vivid Orange:   #FF3700  — primær accent: CTA, links, eyebrow, labels
- Muted Teal:     #7FB9C2  — store CTA-sektioner
- Off Black:      #282828  — mørke sektioner, brødtekst
- Gunmetal Grey:  #484848  — footer-logo, subtile elementer
- Neutral:        #B9B9B1  — pre-footer, borders, muted baggrunde
- Baggrund:       #F4F4F4  — primær sidebaggrund
- Sand:           #E6D1B8  — feature-sektioner, nav-gradient
- Beige:          #E5D2B8  — menu items på orange overlay
- Near White:     #F8F6F0  — tekst på orange, primær knap-tekst
- White:          #F1F1F1  — glassmorphism tekst og borders

TYPOGRAFI — DM Sans, letter-spacing: 0 overalt (ingen undtagelser):
- Display:   80px / vægt 400 / line-height 1
- H1:        56px / vægt 400 / line-height 1
- H2:        40px / vægt 400 / line-height 1
- H3:        28px / vægt 400 / line-height 1
- H4:        22px / vægt 400 / line-height 1
- H5:        18px / vægt 400 / line-height 1
- Eyebrow:   11–13px / vægt 600 / UPPERCASE / #FF3700
- Body:      16px / vægt 400 / line-height 1.45
- Caption:   13px / vægt 400 / #484848
- Nav/knap:  13–16px / vægt 500

KNAPPER — border-radius: 60px (pille):
- Primær:    Solid #FF3700 baggrund · #F8F6F0 tekst
             Hover: box-shadow 0 4px 28px rgba(0,0,0,0.15) + translateY(-1px)
- Sekundær:  Glassmorphism — sand-rgba baggrund + #FF3700 border
             Hover: solid #FF3700 + border #FF6F61 + stærkere shadow
- Ghost:     Transparent + #282828 border · Hover: mørk baggrund + hvid tekst
- Disabled:  #B9B9B1 baggrund, dæmpet tekst, ingen hover

NAVIGATION:
- Closed: sand-gradient baggrund (rgba(229,210,184,0.7) → 0)
- Open overlay: solid #FF3700, menu items #F1F1F1 UPPERCASE, opacity 0.7

SEKTIONSLOGIK:
- Lys:    #F4F4F4 → tekst #282828
- Sand:   #E6D1B8 → tekst #282828, headlines #FF3700
- Neutral #B9B9B1 → tekst #282828
- Teal:   #7FB9C2 → tekst #F1F1F1
- Mørk:   #282828 → tekst #F1F1F1

FOOTER:
- Baggrund: #282828 · Bundbar: #2A2A2A
- Logo: #484848 (Gunmetal — aldrig orange i footer)
- Links: rgba(255,255,255,0.5)

CONSTRAINTS:
- Letter-spacing er altid 0 — ingen undtagelser
- Alle headings er weight 400 — ingen fed overskrift
- #FF3700 aldrig som hel sektionsbaggrund (kun nav-overlay)
- Glassmorphism kun på sekundær/nav-knap
- #7FB9C2 kun til store CTA-sektioner
- Ingen gradienter undtagen nav-toppen
```

---

## Farve-tokens

| Token | Hex |
|-------|-----|
| Vivid Orange | `#FF3700` |
| Soft Coral | `#FF6F61` |
| Muted Teal | `#7FB9C2` |
| Off Black | `#282828` |
| Gunmetal Grey | `#484848` |
| Neutral | `#B9B9B1` |
| Baggrund | `#F4F4F4` |
| Sand | `#E6D1B8` |
| Beige | `#E5D2B8` |
| Near White | `#F8F6F0` |
| White | `#F1F1F1` |

## Typografi

| Niveau | px | Vægt | Letter-spacing |
|--------|----|------|----------------|
| Display | 80 | 400 | 0 |
| H1 | 56 | 400 | 0 |
| H2 | 40 | 400 | 0 |
| H3 | 28 | 400 | 0 |
| H4 | 22 | 400 | 0 |
| H5 | 18 | 400 | 0 |
| Eyebrow | 11–13 | 600 | 0 + UPPERCASE |
| Body | 16 | 400 | 0 |
| Caption | 13 | 400 | 0 |

---

← [[Claude design|Hub]]
