// ══════════════════════════════════════════════════════════════
// SPRING MARKETING NEWS — RSS Scraper + Gemini
// Supabase Edge Function (Deno runtime)
// ══════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2'
import Parser from 'npm:rss-parser@3'

interface Source {
  id: string
  name: string
  feed_url: string
  topic: 'ai' | 'marketing' | 'both'
}

const rssParser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'SpringMarketingNews/1.0' },
})

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: sources } = await supabase
    .from('sources')
    .select('id, name, feed_url, topic')
    .eq('active', true)
    .not('feed_url', 'is', null)

  if (!sources?.length) {
    return json({ success: false, error: 'Ingen aktive kilder' })
  }

  let totalNew = 0
  const log: string[] = []

  for (const source of sources as Source[]) {
    try {
      const feed = await rssParser.parseURL(source.feed_url)
      let newFromSource = 0

      for (const item of feed.items.slice(0, 15)) {
        const title = item.title?.trim()
        const url = item.link?.trim()
        if (!title || !url) continue

        // Dedupliker
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('url', url)
          .maybeSingle()

        if (existing) continue

        // Indhold til summary + læsetid
        const content = (item.contentSnippet || item.content || item.summary || '').trim()
        const wordCount = content.split(/\s+/).filter(Boolean).length
        const readTimeMin = Math.max(1, Math.round(wordCount / 200))

        let publishedAt: string | null = null
        if (item.pubDate || item.isoDate) {
          try { publishedAt = new Date(item.pubDate || item.isoDate!).toISOString() } catch { /* ignorer */ }
        }

        const { data: inserted } = await supabase
          .from('articles')
          .insert({
            source_id: source.id,
            title,
            url,
            topic: source.topic,
            published_at: publishedAt,
            full_content: content.slice(0, 5000),
            read_time_min: readTimeMin,
          })
          .select('id, title, full_content')
          .single()

        if (!inserted) continue

        await callGemini(inserted, supabase)
        newFromSource++
        totalNew++
      }

      await supabase
        .from('sources')
        .update({ last_scraped: new Date().toISOString() })
        .eq('id', source.id)

      log.push(`${source.name}: ${newFromSource} nye`)

    } catch (err) {
      log.push(`${source.name}: FEJL — ${err}`)
      console.error(`Fejl ved ${source.name}:`, err)
    }
  }

  return json({ success: true, totalNew, log })
})

// ── Gemini ────────────────────────────────────────────────────

async function callGemini(
  article: { id: string; title: string; full_content: string },
  supabase: ReturnType<typeof createClient>
) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return

  const prompt = `Du er redaktør på et dansk AI & marketing intelligence-feed.

Artikel: "${article.title}"
Indhold: ${article.full_content.slice(0, 3000)}

Returner KUN dette JSON — ingen markdown:
{
  "summary": "• Første bullet på dansk\\n• Andet bullet på dansk\\n• Tredje bullet på dansk",
  "relevance_score": 8.2
}

Score 1-10: 9-10 = ny konkret viden. 5-6 = generisk. 1-4 = ikke-relevant.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
        }),
      }
    )

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const result = JSON.parse(cleaned)

    await supabase
      .from('articles')
      .update({
        summary: result.summary ?? null,
        relevance_score: result.relevance_score ?? null,
      })
      .eq('id', article.id)

  } catch (err) {
    console.error(`Gemini fejl for ${article.id}:`, err)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
