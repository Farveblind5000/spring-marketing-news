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

  // Seneste 7 dages artikler
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const { data: articles } = await supabase
    .from('articles')
    .select('title, summary, topic, relevance_score, sources(name)')
    .gte('scraped_at', sevenDaysAgo.toISOString())
    .order('relevance_score', { ascending: false })
    .limit(30)

  if (!articles?.length) {
    return json({ success: false, error: 'Ingen artikler denne uge' })
  }

  // Byg prompt til Gemini
  const articleList = articles
    .map((a, i) => {
      const src = (a.sources as { name: string } | null)?.name ?? ''
      const score = a.relevance_score ? ` (score: ${a.relevance_score})` : ''
      return `${i + 1}. [${a.topic?.toUpperCase()}] ${a.title}${score} — ${src}\n${a.summary ?? ''}`
    })
    .join('\n\n')

  const uniqueSources = new Set(
    articles.map(a => (a.sources as { name: string } | null)?.name).filter(Boolean)
  )

  const prompt = `Du er redaktør på et dansk AI & marketing intelligence-feed.

Uge ${currentWeek}, ${currentYear} — ${articles.length} artikler fra ${uniqueSources.size} kilder:

${articleList}

Skriv et ugentligt digest på dansk med:
1. En kort intro (2-3 sætninger om ugens overordnede tema)
2. Top 3 vigtigste tendenser med korte forklaringer
3. En "Ikke gå glip af"-sektion med 2-3 specifikke artikler

Skriv direkte og konkret. Ingen floskler. Max 400 ord.
Returner KUN teksten — ingen JSON, ingen markdown-headers.`

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
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      }
    )

    const data = await res.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!content) return json({ success: false, error: 'Gemini returnerede intet indhold' })

    // Slet evt. eksisterende global digest for denne uge
    await supabase
      .from('digests')
      .delete()
      .is('user_id', null)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)

    // Gem nyt digest
    await supabase
      .from('digests')
      .insert({
        week_number: currentWeek,
        year: currentYear,
        content,
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
