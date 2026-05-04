import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Hent prompt-template fra Supabase settings — fallback til hardkodet
async function fetchPromptTemplate(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data } = await supabase
    .from('settings')
    .select('content')
    .eq('key', 'digest_prompt')
    .maybeSingle()

  if (data?.content) return data.content

  // Fallback hvis settings-tabellen ikke findes endnu
  return `Du er redaktør på et dansk AI & marketing intelligence-feed. Uge {{week}}, {{year}}.

Brugeren har selv gemt og valgt disse {{article_count}} artikler (fra {{source_count}} kilder):
{{article_list}}

Returner præcis dette JSON-objekt — ingen markdown, ingen forklaring:
{"intro":"[2 sætninger om hvad brugeren har fokuseret på denne uge]","trends":[{"title":"[tendenstitel]","body":"[2 sætninger]"},{"title":"[tendenstitel]","body":"[2 sætninger]"},{"title":"[tendenstitel]","body":"[2 sætninger]"}],"highlights":[{"title":"[artikkeltitel]","source":"[kilde]","why":"[1 sætning]"},{"title":"[artikkeltitel]","source":"[kilde]","why":"[1 sætning]"},{"title":"[artikkeltitel]","source":"[kilde]","why":"[1 sætning]"}]}`
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  // Hent brugerens gemte artikler med artikeldetaljer
  const { data: saves } = await supabase
    .from('user_saves')
    .select(`
      articles (
        id, title, url, summary, topic,
        sources ( name )
      )
    `)
    .eq('user_id', user.id)

  if (!saves?.length) {
    return NextResponse.json({ error: 'Ingen gemte artikler' }, { status: 400 })
  }

  type ArticleRow = {
    id: string
    title: string
    url: string | null
    summary: string | null
    topic: string | null
    sources: { name: string } | null
  }

  const articles: ArticleRow[] = saves
    .map(s => s.articles as unknown as ArticleRow)
    .filter((a): a is ArticleRow => !!a?.title)

  if (!articles.length) {
    return NextResponse.json({ error: 'Ingen artikeldata fundet' }, { status: 400 })
  }

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  const uniqueSources = new Set(articles.map(a => a.sources?.name).filter(Boolean))

  const articleList = articles
    .map((a, i) => {
      const src = a.sources?.name ?? ''
      const firstBullet = (a.summary ?? '')
        .split('\n')
        .find(l => l.trim().startsWith('•'))
        ?.replace('•', '')
        .trim()
        .slice(0, 120) ?? ''
      return `${i + 1}. [${a.topic?.toUpperCase() ?? 'GENEREL'}] ${a.title} — ${src}\n   URL: ${a.url ?? ''}${firstBullet ? `\n   ${firstBullet}` : ''}`
    })
    .join('\n')

  // Hent prompt-template fra Supabase og erstat variabler
  const template = await fetchPromptTemplate(supabase)
  const prompt = template
    .replace(/\{\{week\}\}/g, String(currentWeek))
    .replace(/\{\{year\}\}/g, String(currentYear))
    .replace(/\{\{article_count\}\}/g, String(articles.length))
    .replace(/\{\{source_count\}\}/g, String(uniqueSources.size))
    .replace(/\{\{article_list\}\}/g, articleList)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Ingen GEMINI_API_KEY sat' }, { status: 500 })
  }

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
          },
        }),
      }
    )

    const geminiData = await res.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!raw) {
      return NextResponse.json({
        error: 'Gemini returnerede intet indhold',
        debug: {
          httpStatus: res.status,
          finishReason: geminiData.candidates?.[0]?.finishReason,
          promptFeedback: geminiData.promptFeedback,
          geminiError: geminiData.error,
        }
      }, { status: 500 })
    }

    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Slet eksisterende digest for denne uge for denne bruger
    await supabase
      .from('digests')
      .delete()
      .eq('user_id', user.id)
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
        user_id: user.id,
      })

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
