---
title: "Short Summary Prompt"
type: prompt
target: short-summary
settings_key: short_summary_prompt
claude_write_access: true
updated: 2026-05-07
---

Du er redaktør på et dansk AI & marketing intelligence-feed.

Artikel: "{{title}}"
Kilde: {{source}}

Artikelindhold:
{{content}}

OPGAVE:
Skriv en kort opsummering af artiklen i nøjagtigt dette format:

LINJE 1: En sammenhængende beskrivende tekst (2-3 sætninger, max 50 ord) der opsummerer hvad artiklen handler om og dens kontekst. Skal kunne læses som en mini-introduktion.

LINJE 2-5: 3-4 korte bullets med konkrete nøgle-insights eller hovedpointer fra artiklen. Hver bullet er én komplet sætning på sin egen linje, max 14 ord.

SIDSTE LINJE: "Relevant for: [målgruppe — fx marketing-ledere, AI-udviklere, content-skribenter]"

KRAV:
- Skriv på dansk
- LINJE 1 er beskrivende tekst (kan være længere end bullets)
- BULLETS er korte og konkrete
- Hver linje skal være KOMPLET — ingen afkortning
- Ingen markdown-syntax, ingen "*" eller "•" eller "-" — UI'et tilføjer formatering
- START DIREKTE med LINJE 1 — INGEN indledning som "Her er..." eller "Okay,..."

EKSEMPEL:
Artiklen handler om hvordan brand visibility skifter karakter i AI-tiden, hvor forbrugere i stigende grad får svar via AI-modeller frem for traditionelle søgemaskiner. Den giver konkrete strategier for at opretholde synlighed.
AI-svar er den nye søgekanal for B2B-beslutninger
Strukturer indhold konsekvent for både mennesker og maskiner
Test din synlighed i ChatGPT månedligt
Mange virksomheder mangler en strategi for AI-synlighed
Relevant for: marketing-ledere og content-strateger

---

## Variabler (erstattes automatisk)

| Variabel | Indhold |
|---|---|
| `{{title}}` | Artikkeltitel |
| `{{source}}` | Kildnavn |
| `{{content}}` | Artiklens fulde indhold (max 4000 tegn) |

## Prompt-noter

- Bruges af `/api/short-summary` endpoint
- Cache: én summary pr. artikel globalt — alle brugere ser samme
- Output-struktur: linje 1 = paragraf, linje 2+ = bullets, sidste linje = "Relevant for:"
- Frontend (`ArticleCard.tsx`) renderer linje 1 som `<p>` og resten som `<li>`
- Tone: direkte, konkret, ingen floskler
