import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PROMPT_TEMPLATE = `Du er redaktør på et dansk AI & marketing intelligence-feed.

Artikel: "{{title}}"
Kilde: {{source}}
Indhold:
{{content}}

Lav 3-5 korte, konkrete overskrifter på dansk der opsummerer hovedbudskaberne.
Hver overskrift på sin egen linje. Max 12 ord per linje.
Ingen bullets, ingen numre, ingen indledning.
Fokuser på det vigtigste — som en TL;DR i overskriftsform.

Returner KUN overskrifterne.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  let articleId: string
  try {
    const body = await req.json()
    articleId = body.articleId
    if (!articleId || typeof articleId !== 'string') throw new Error()
  } catch {
    return NextResponse.json({ error: 'Manglende articleId' }, { status: 400 })
  }

  // 1. Hent artikel + tjek for eksisterende cache
  const { data: article } = await supabase
    .from('articles')
    .select('id, title, full_content, short_summary, sources(name)')
    .eq('id', articleId)
    .maybeSingle()

  if (!article) {
    return NextResponse.json({ error: 'Artikel ikke fundet' }, { status: 404 })
  }

  // 2. Cache hit — return straks
  if (article.short_summary) {
    return NextResponse.json({ summary: article.short_summary, cached: true })
  }

  // 3. Cache miss — kald Gemini
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Ingen GEMINI_API_KEY sat' }, { status: 500 })
  }

  const sourceName = (article.sources as unknown as { name: string } | null)?.name ?? ''
  const prompt = PROMPT_TEMPLATE
    .replace('{{title}}', article.title ?? '')
    .replace('{{source}}', sourceName)
    .replace('{{content}}', (article.full_content ?? '').slice(0, 4000))

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
        }),
      }
    )

    const geminiData = await res.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!raw) {
      return NextResponse.json({
        error: 'Gemini returnerede intet indhold',
        debug: { finishReason: geminiData.candidates?.[0]?.finishReason, geminiError: geminiData.error }
      }, { status: 500 })
    }

    // Rens output — fjern eventuelle bullets/numre/markdown
    const cleaned = raw
      .split('\n')
      .map((l: string) => l.trim().replace(/^[-•*\d.)\s]+/, '').trim())
      .filter((l: string) => l.length > 0)
      .slice(0, 5)
      .join('\n')

    if (!cleaned) {
      return NextResponse.json({ error: 'Tomt resultat efter rensning' }, { status: 500 })
    }

    // 4. Gem cache (global — alle brugere ser samme)
    const { error: updateErr } = await supabase
      .from('articles')
      .update({
        short_summary: cleaned,
        short_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', articleId)

    if (updateErr) {
      // Cache-skrivning fejlede — returnér stadig resultatet, log fejl
      console.error('Cache write failed:', updateErr)
    }

    return NextResponse.json({ summary: cleaned, cached: false })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
