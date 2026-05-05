---
title: "Prompt Bibliotek"
type: resource
status: active
claude_write_access: true
updated: 2026-05-01
links_to:
  - Claude design
---

# Prompt Bibliotek
_Genbrugelige design prompts. Tilføj egne efterhånden._

---

## System Prompt — Projekt-kickoff

Indsæt dette i starten af hvert nyt projekt:

```
## Projekt-kontekst
**Projekt:** [navn]
**Klient/produkt:** [beskrivelse]
**Målgruppe:** [primær persona]

## Brand system
[Indsæt farver, fonte, komponenter]

## Output-format
Vi leverer primært [HTML / PDF / Claude Code].

## Constraints
[Specifikke no-go's]

Brug dette som fundament for alle beslutninger i dette projekt.
```

---

## Landing Pages

```
Byg en [type] landing page for [produkt/brand].

MÅLGRUPPE: [Persona, 2–3 sætninger]

SEKTIONER: Hero · [Feature 1] · [Feature 2] · [Feature 3] · CTA · Footer

STIL: [Mood + referencer + farver]

CONSTRAINTS: [No-go's]
```

---

## Dashboards

```
Byg et [type] dashboard for [produkt].

BRUGER: [Persona — hvad har de travlt med?]

LAYOUT:
- Top nav
- KPI-cards: [4 metrics med placeholder-data]
- Primær chart: [type + tidsperiode]
- Tabel: [indhold]
- Sidebar: [filters]

STIL: [Data-tæt / Luftig / etc.] Primærfarve: [hex]

CONSTRAINTS: Ingen [chart-type]. Ingen dekorationer der fjerner plads.
```

---

## Komponenter

```
Lav en komponent-oversigt side for [brand-navn].

Vis: typografi-skala (H1–body–caption), farvepalette med hex,
knapvarianter (primær, sekundær, ghost, disabled), cards (3 varianter),
form-elementer (input, select, checkbox).
```

---

## Responsivitet

```
Vis det nuværende design i 3 breakpoints på samme canvas:
Desktop (1440px) · Tablet (768px) · Mobil (375px)
Tilpas layout til hvert breakpoint. Prioritér [element] på mobil.
```

---

## Parallel versioner

```
Lav 3 distinkte retninger for [side/komponent]:
A) [Karakteristik — fx "Konservativ og enterprise"]
B) [Karakteristik — fx "Moderne og startup"]
C) [Karakteristik — fx "Bold og anderledes"]
Vis dem som adskilte sektioner på canvas.
```

---

## Iteration — Final Pass

```
Gennemgå designet som en senior designer.
Identificér og ret de 5 vigtigste inkonsistenser eller svage punkter.
Fortæl mig hvad du rettede og hvorfor.
```

---

## Claude Code Handoff

```
Konverter dette design til en React-komponent.
Stack: React 18, TypeScript, Tailwind CSS v3, shadcn/ui

Krav:
- Mobile-first responsivt
- Farver som Tailwind custom colors eller CSS variables
- Semantisk HTML
- TypeScript interfaces for al data
- Copy som props eller constants, ikke hardcoded

Lever: .tsx fil + sub-komponenter + Tailwind config-tilføjelser.
```

---

## Egne prompts

> _Tilføj dine bedste prompts her:_

---

← [[Claude design|Hub]]
