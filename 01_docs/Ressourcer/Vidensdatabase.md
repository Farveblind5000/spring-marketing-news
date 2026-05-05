---
title: "Vidensdatabase"
type: resource
status: active
claude_write_access: true
updated: 2026-05-01
links_to:
  - Claude design
---

# Vidensdatabase
_Opdateres løbende. Tilføj egne fund her._

---

## Kendte begrænsninger (April 2026)

| Problem | Workaround |
|---------|------------|
| Inline kommentarer forsvinder | Vent på canvas-opdatering inden næste kommentar |
| Compact view → save errors | Brug standard view |
| Store kodebasers → performance | Upload kun relevante filer |
| Chat upstream errors | Åbn nyt tab — chat-historik bevares ikke |
| Brand-"hukommelse" falder ud i lange sessioner | Gentag brand-prompt i starten af nye chats |

---

## Genveje og tips

### Prompt-genveje der virker

**Forankring:**
```
Behold [X] præcis som det er. Ændr kun [Y].
```

**Parallel versioner:**
```
Lav 3 varianter: A) [...] B) [...] C) [...]
Vis dem side om side på canvas.
```

**Responsivitet:**
```
Vis designet i desktop (1440px), tablet (768px), og mobil (375px).
```

**Final pass:**
```
Gennemgå designet. Identificér og ret de 5 vigtigste inkonsistenser.
Fortæl mig hvad du rettede.
```

**Komponenten er OK — resten er ikke:**
```
Sektionen "hero" er perfekt — rør den ikke.
Fokusér alle ændringer på [anden sektion].
```

---

## Hvornår bruger man hvad?

| Situation | Brug |
|-----------|------|
| Nyt projekt fra brief | Claude Design |
| Revision af eksisterende Figma | Figma direkte |
| Hurtig stakeholder-concept | Claude Design → PDF |
| Developer handoff | Claude Design → Claude Code |
| Marketing materials | Claude Design → Canva |
| Interaktiv prototype til brugertest | Claude Design → HTML |
| Produktionsklar komponent | Claude Design → Claude Code → React |

---

## Design Prompt — Skabelon

```
[KONTEKST]
Hvem er det for? Hvad er formålet? Hvem er målgruppen?

[OUTPUT]
Hvad skal leveres? (landing page, dashboard, komponent, flow)
Hvilke sektioner/elementer skal inkluderes?

[STIL]
Visuel referenceramme. Mood. Eksempler. Brand-system.
Typografi. Farver.

[CONSTRAINTS]
Hvad må IKKE ske. Hvad skal undgås.
```

---

## Mikro-rettelser — højre panel (ikke kommentar-bobler)

Claude Design bruger **ikke** kommentar-bobler. Inline-editoren er højre panel.

**Workflow:**
1. Klik elementet på canvas → blå selektions-kant vises
2. Højre panel viser elementets egenskaber direkte
3. Klik et tal/værdi i panelet og overskriv det

| Panel-felt | Styrer |
|-----------|--------|
| Size | Font-størrelse (px) |
| Weight | Font-vægt (400/500/600/700) |
| Color | Hex-farve |
| Line | Linjehøjde |
| Tracking | Letter-spacing |
| Padding / Margin | Spacing |
| Radius | Border-radius |

**Scope-tommelfingerregel:**

| Hvad du vil ændre | Hvordan |
|-------------------|---------|
| Ét element præcist | Klik element → ret i højre panel |
| Ét element med sprog | Klik element → skriv i Tweaks |
| Én sektion | Chat: `"Ændr kun [sektion]..."` |
| Hele siden | Skriv frit i chat |

---

## Egne fund

> _Tilføj dine observationer her efterhånden som du bruger værktøjet:_

---

← [[Claude design|Hub]]
