# SPRING MARKETING NEWS — Claude Context

Et AI & marketing intelligence feed der scraper indhold dagligt, opsummerer med Gemini og kuraterer ugentlige briefinger.

> **Til ny samarbejdspartner / human onboarding:** læs [README.md](README.md) i stedet.
> Denne fil er kontekst målrettet Claude Code-sessioner.

---

## Kanoniske kilder (læs disse FØR du ændrer noget)

| Hvad du leder efter | Hvor det står |
|---|---|
| Vision, scope, sprint-status, beslutninger | [01_docs/Plan/Roadmap.md](01_docs/Plan/Roadmap.md) |
| Visuelt arkitektur-overblik | [01_docs/Plan/Tech_stack.canvas](01_docs/Plan/Tech_stack.canvas) |
| Detaljeret fil-oversigt | [01_docs/Documentation/File-structure.md](01_docs/Documentation/File-structure.md) |
| DB-tabeller + kolonner | [01_docs/Documentation/DB-schema.md](01_docs/Documentation/DB-schema.md) |
| SQL-migrations | [01_docs/Documentation/Migrations.md](01_docs/Documentation/Migrations.md) |
| Append-only ændringslog | [01_docs/CHANGELOG.md](01_docs/CHANGELOG.md) |
| Copy-paste kommando-reference | [01_docs/Komandoer.md](01_docs/Komandoer.md) |
| Levende prompt-templates | [01_docs/Prompts/](01_docs/Prompts/) |
| Regler for AI-redigering af `01_docs/` | [01_docs/CLAUDE_RULES.md](01_docs/CLAUDE_RULES.md) |

---

## Tech stack (kort)

Next.js 16 + React 19 + TypeScript · Tailwind v4 · Supabase (PostgreSQL + Auth + Edge Functions) · Gemini 2.5 Flash · `@react-pdf/renderer` · Resend · Vercel.

Det fulde overblik med dataflow ligger i [Tech_stack.canvas](01_docs/Plan/Tech_stack.canvas).

---

## Projekt-identifikatorer

- **Supabase project ref:** `mdevyscqhpaogvsblfyp`
- **Live URL:** https://spring-marketing-news.vercel.app
- **Git remotes:** `origin` (personlig: Farveblind5000) + `spring` (fælles: Spring-Family-IT)

---

## Hårde regler — Claude SKAL følge disse

### Kode

- `supabase/functions/` er **Deno** — brug `npm:` prefix til imports, IKKE Node.js syntax
- `supabase/functions/` er **ekskluderet** fra `tsconfig.json` — Next.js checker dem ikke
- Edge Functions deployes med Windows-binary: `.\supabase-cli\supabase.exe functions deploy <navn> --project-ref mdevyscqhpaogvsblfyp`
- Brand-tokens er kanoniske i [`app/globals.css`](app/globals.css) — kopier ikke, importér

### Dokumentation (`01_docs/`)

- **Læs [01_docs/CLAUDE_RULES.md](01_docs/CLAUDE_RULES.md) FØRST** før ændringer i `01_docs/`
- **`01_docs/Noter.md`** må ALDRIG ændres (`claude_write_access: false`)
- Strukturelle ændringer (sletninger, omdøbninger, nye mapper) kræver eksplicit "JA" i chat
- Efter ændringer: brug `/changelog` skill til at logge i `01_docs/CHANGELOG.md`
- Schema-ændringer skal også dokumenteres i `01_docs/Documentation/Migrations.md`

---

## Aktuel status

Sprint 1-5 lukket. Detaljer + næste skridt: [01_docs/Plan/Roadmap.md](01_docs/Plan/Roadmap.md).

---

## Kendte workarounds

- Gemini 2.5 Flash bruger interne thinking-tokens — sæt `maxOutputTokens` højt nok til både thinking + synligt output (se eksisterende API-ruter for tunede værdier)
- Supabase CLI på Windows: brug `./supabase-cli/supabase.exe` (ikke npm)
- `.next`-mappe kan låses ved EPERM build-fejl: `rmdir /s /q .next`
- Vercel auto-deploy virker ikke altid — brug `vercel --prod` fra terminal hvis push ikke trigger build
