// ══════════════════════════════════════════════════════════════
// SPRING MARKETING NEWS — Ugentlig Digest Generator
// Supabase Edge Function (Deno runtime)
// Kørsel: søndag kl. 20:00 (via pg_cron)
// ══════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2'

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const { data: articles } = await supabase
    .from('articles')
    .select('title, summary, topic, relevance_score, sources(name)')
    .gte('scraped_at', sevenDaysAgo.toISOString())
    .order('relevance_score', { ascending: false })
    .limit(20)

  if (!articles?.length) {
    return json({ success: false, error: 'Ingen artikler denne uge' })
  }

  // Kompakt artikel-liste: kun titel + første bullet fra summary (max 120 tegn)
  const articleList = articles
    .map((a, i) => {
      const src = (a.sources as { name: string } | null)?.name ?? ''
      const firstBullet = (a.summary ?? '')
        .split('\n')
        .find((l: string) => l.trim().startsWith('•'))
        ?.replace('•', '')
        .trim()
        .slice(0, 120) ?? ''
      return `${i + 1}. [${a.topic?.toUpperCase()}] ${a.title} — ${src}${firstBullet ? `\n   ${firstBullet}` : ''}`
    })
    .join('\n')

  const uniqueSources = new Set(
    articles.map(a => (a.sources as { name: string } | null)?.name).filter(Boolean)
  )

  const prompt = `Du er redaktør på et dansk AI & marketing intelligence-feed. Uge ${currentWeek}, ${currentYear}.

ARTIKLER (${articles.length} stk, sorteret efter relevans):
${articleList}

Returner præcis dette JSON-objekt — ingen markdown, ingen forklaring, ingen kommentarer:
{"intro":"[2 sætninger om ugens tema]","trends":[{"title":"[tendenstitel]","body":"[2 sætninger]"},{"title":"[tendenstitel]","body":"[2 sætninger]"},{"title":"[tendenstitel]","body":"[2 sætninger]"}],"highlights":[{"title":"[artikkeltitel fra listen]","source":"[kilde]","why":"[1 sætning]"},{"title":"[artikkeltitel fra listen]","source":"[kilde]","why":"[1 sætning]"},{"title":"[artikkeltitel fra listen]","source":"[kilde]","why":"[1 sætning]"}]}`

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ success: false, error: 'Ingen Gemini API key' })

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    console.log('Gemini raw (first 500):', raw.slice(0, 500))

    if (!raw) {
      const finishReason = data.candidates?.[0]?.finishReason
      return json({ success: false, error: `Gemini returnerede intet. finishReason: ${finishReason}` })
    }

    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('JSON parse fejl. Raw output:', raw)
      return json({ success: false, error: `JSON parse fejl: ${parseErr}. Raw (200 tegn): ${raw.slice(0, 200)}` })
    }

    // Slet evt. eksisterende global digest for denne uge
    await supabase
      .from('digests')
      .delete()
      .is('user_id', null)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)

    await supabase
      .from('digests')
      .insert({
        week_number: currentWeek,
        year: currentYear,
        content: JSON.stringify(parsed),
        article_count: articles.length,
        source_count: uniqueSources.size,
        user_id: null,
      })

    return json({ success: true, week: currentWeek, year: currentYear, articleCount: articles.length })

  } catch (err) {
    console.error('Digest fejl:', err)
    return json({ success: false, error: String(err) })
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
