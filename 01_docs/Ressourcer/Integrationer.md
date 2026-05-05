---
title: "Integrationer"
type: resource
status: active
claude_write_access: true
updated: 2026-05-01
links_to:
  - Claude design
  - Ressourcer/Claude Design Reference
---

# Integrationer
_Ekstern tool-integration med Claude Design._

---

## Figma

### Status
Ingen direkte import/export integration. Alt er manuelt pr. April 2026.

### Workflow A — Claude Design → Figma
Brug til: Hurtig konceptualisering, derefter rebuild i Figma for developer-klar output.

```
1. Generer concept i Claude Design
2. Export → HTML
3. Screenshot HTML i browser
4. Brug screenshot som visuel reference i Figma
5. Rebuild med Auto Layout og Figma-komponenter
```

### Workflow B — Figma → Claude Design
Brug til: Hurtigt at generere variationer af eksisterende Figma-designs.

```
1. Eksporter Figma-frame som PNG (2x)
2. Upload til Claude Design
3. Prompt som reference eller udgangspunkt
```

### Figma MCP (Claude Code integration)
Hvis du arbejder med Claude Code CLI kan du installere Figma MCP:
- Trækker design tokens direkte fra Figma-filen
- Giver adgang til farver, typografi, og komponent-navne som context
- Se: [Figma MCP dokumentation](https://help.figma.com/hc/en-us/articles/32132100433815)

---

## Canva

### Direkte export
Claude Design → Export → Canva (direkte integration)

### Bedst til
- Sociale medier-formater
- Præsentationer til ikke-tekniske stakeholders
- Marketing materials der skal redigeres videre

### Begrænsninger
- Komplekse layouts kan forenkles i Canva-importen
- Fonts importeres som billede hvis de ikke er tilgængelige i Canva

---

## Claude Code

### Direkte handoff
Knappen "Send to Claude Code" i Claude Design sender HTML/CSS til Claude Code.

### Anbefalede stacks
| Stack | Prompt-tillæg |
|-------|--------------|
| React + Tailwind | "React 18, TypeScript, Tailwind CSS v3" |
| Next.js | "Next.js 14 App Router, TypeScript, Tailwind" |
| Vanilla HTML | "Vanilla HTML/CSS — ingen frameworks" |
| Vue | "Vue 3 Composition API, TypeScript, Tailwind" |

### Workflow
Se [[Claude Design Reference]] for handoff-detaljer og prompt-skabelon.

---

## HTML Export

### Brug til
- Browser-test (ingen server nødvendig)
- Stakeholder-deling via Netlify Drop / GitHub Pages
- Brugertest-prototyper

### Deling uden server
```
1. Export → HTML (zip)
2. Gå til drop.netlify.com
3. Træk zip ind
4. Del URL med stakeholders
```

---

## PDF & PPTX

### PDF
Bedst til statisk review og sign-off. Bevarer layout præcist.

### PPTX
- Hver "sektion" i designet kan blive en slide
- Redigerbar i PowerPoint efterfølgende
- Godt til præsentationer der har liv efter leveringen

---

← [[Claude design|Hub]]
