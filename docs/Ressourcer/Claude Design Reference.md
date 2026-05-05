---
title: "Claude Design Reference"
type: reference
status: active
claude_write_access: true
updated: 2026-05-01
links_to:
  - Claude design
  - Ressourcer/Spring CC Brand Kit
---

# Claude Design — Reference
_Samlet vidensbase fra alle faser_

---

## Interface

- **Chat-panel** (venstre) = overordnede ændringer — struktur, tone, layout
- **Canvas** (højre) = visuelt output
- **Inline kommentar** = klik direkte på element → komponent-niveau ændring

Chat til **struktur og tone** — inline til **mikrojusteringer**.

---

## Prompt-struktur

```
[KONTEKST]    Hvem er det for? Formål? Målgruppe?
[OUTPUT]      Hvad leveres? Hvilke sektioner/elementer?
[STIL]        Mood, referencer, farver, typografi
[CONSTRAINTS] Hvad må ikke ske
```

Alle 4 lag i første prompt = færre korrektionsrunder.

**Sweet spot:** Stram på struktur og constraints — løs på stil-detaljer.
Constraints er designværktøjer. "Ingen runde hjørner" er præcis nok til at Claude ikke gætter.

---

## Iterations-hierarki

```
Bred   → chat      → komposition, tone, overordnet layout
Smal   → chat      → specifik sektion eller komponent
Mikro  → inline    → enkelt element, typografi, spacing
```

**3 regler der sparer runder:**

1. **Én variabel ad gangen** — skift ikke farve, layout og typografi simultant
2. **Fortæl intent, ikke fejl**
   `❌ "Hero-sektionen ser forkert ud"`
   `✓  "Hero skal føles mere energisk — prøv diagonal clip-path og højere kontrast"`
3. **Forankr det der virker**
   `"Behold farvepalette og typografi præcist. Ændr kun spacing og knap-størrelse."`

Poleret output på maks 5 runder er realistisk med en fuld 4-lags prompt.
Mere end 6 runder = første prompt manglede KONTEKST eller CONSTRAINTS.

---

## Oversættelse af vag feedback

| Vag feedback | Præcis prompt |
|-------------|---------------|
| "Ikke professionelt" | Øg kontrast, reducer font-varianter, stram spacing |
| "Mere moderne" | Reducer border-radius, mere whitespace, monospace font |
| "For meget" | Maks 2 fontvægte, fjern dekorationer, øg padding |
| "Mangler noget" | Tilføj ét stærkt visuelt anker (bold stat, stor quote, kontrast-sektion) |

---

## Context uploads

| Upload | Bruges til |
|--------|-----------|
| Screenshot af design du kan lide | Stil og mood |
| Wireframe / skitse | Layoutstruktur |
| Brandguide / tekst-fil | Farver, fonte, tone |
| Kodebase | Production-alignment |

Kombiner op til 3 context-filer. Angiv altid prioritet hvis de konflikter.

---

## Brand system

Definer alt i **første prompt** — Claude glemmer i lange sessions.
Gentag de 2–3 vigtigste constraints ved nye chats.
Brug [[Spring CC Brand Kit]] som færdig skabelon.

**Komponent-oversigt som source of truth:**
```
Lav en komponent-oversigt side: typografi-skala, farvepalette med hex,
knapvarianter (primær, sekundær, ghost, disabled), cards, form-elementer, nav.
```

**Multi-page:** Claude mister typisk border-radius, farvenancer og spacing-detaljer på tværs af sider.

---

## Versionering

Claude Design gemmer ikke versioner.
Eksporter HTML efter hver runde der virker: `v1.html` → `v2.html`

---

## Export-formater

| Format | Bevarer | Mister | Brug |
|--------|---------|--------|------|
| HTML | Layout, farver, typografi | Interaktivitet, hover states | Browser-test · Netlify Drop |
| PDF | Visuelt layout præcist | Alt dynamisk | Stakeholder review |
| PPTX | Struktur | Meget styling | Præsentation |
| Canva | Grundlayout | Kompleks CSS | Marketing materials |
| Claude Code | — | Box shadows, hover, micro-spacing | Produktion |

**HTML deling:** `drop.netlify.com` — træk zip ind, del URL. Ingen server nødvendig.

---

## Pipeline

```
Claude Design → HTML        → browser-test / Netlify Drop
             → PDF/PPTX     → stakeholder review
             → Canva         → marketing materials
             → Claude Code   → produktion (React/Next.js)
             → Figma (manuel)→ developer handoff
```

---

## Claude Code handoff

```
Konverter til React-komponent.
Stack: React 18, TypeScript, Tailwind CSS v3, shadcn/ui
Mobile-first · semantisk HTML · TypeScript interfaces · copy som constants.
```
Tilføj kodebase som context i Claude Design **inden** handoff.
Claude Code lukker gap (shadows, hover, font weights) med målrettede prompts.

---

## Figma

Ingen direkte integration. To manuelle workflows:

**A → Figma:** Export HTML → screenshot → brug som reference → rebuild med Auto Layout
**B → Claude Design:** Eksporter Figma-frame som PNG → upload som context → adapt

---

## Avancerede teknikker

**Projekt-kickoff:**
```
Projekt: [Navn] · Klient: [beskrivelse] · Målgruppe: [persona]
Brand: [kit] · Output: [HTML/Claude Code/PDF] · Constraints: [no-go's]
Brug dette som fundament for alle beslutninger i dette projekt.
```

**Parallel versioner:**
```
Lav 3 retninger — A) Konservativ  B) Moderne  C) Bold
Vis dem som adskilte sektioner på canvas.
```

**Responsivitet på én gang:**
```
Vis designet i desktop (1440px), tablet (768px), mobil (375px) på samme canvas.
```

**Final pass:**
```
Gennemgå som senior designer. Ret de 5 vigtigste inkonsistenser. Fortæl hvad du rettede.
```

---

## Claude Design vs. Figma

| Brug Claude Design | Brug Figma |
|-------------------|-----------|
| Konceptualisering fra brief | Developer-klar komponent-spec |
| Stakeholder-concept < 20 min | Auto Layout + constraints |
| Iteration med vag feedback | Design system vedligehold |
| Prototype til brugertest | Eksakt pixel-perfekt output |

---

← [[Claude design|Hub]]
