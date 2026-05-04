import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
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
        id, title, summary, topic,
        sources ( name )
      )
    `)
    .eq('user_id', user.id)

  if (!saves?.length) {
    return NextResponse.json({ error: 'Ingen gemte artikler' }, { status: 400 })
  }

  // Flatten og rens artikel-data
  type ArticleRow = {
    id: string
    title: string
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

  // Kompakt artikel-liste til prompt
  const articleList = articles
    .map((a, i) => {
      const src = a.sources?.name ?? ''
      const firstBullet = (a.summary ?? '')
        .split('\n')
        .find(l => l.trim().startsWith('•'))
        ?.replace('•', '')
        .trim()
        .slice(0, 120) ?? ''
      return `${i + 1}. [${a.topic?.toUpperCase() ?? 'GENEREL'}] ${a.title} — ${src}${firstBullet ? `\n   ${firstBullet}` : ''}`
    })
    .join('\n')

  const prompt = `Du er redaktør på et dansk AI & marketing intelligence-feed. Uge ${currentWeek}, ${currentYear}.

Brugeren har selv gemt og valgt disse ${articles.length} artikler (fra ${uniqueSources.size} kilder):
${articleList}

Returner præcis dette JSON-objekt — ingen markdown, ingen forklaring:
{"intro":"[2 sætninger om hvad brugeren har fokuseret på denne uge baseret på de gemte artikler]","trends":[{"title":"[tendenstitel]","body":"[2 sætninger med konkrete eksempler fra artiklerne]"},{"title":"[tendenstitel]","body":"[2 sætninger med konkrete eksempler fra artiklerne]"},{"title":"[tendenstitel]","body":"[2 sætninger med konkrete eksempler fra artiklerne]"}],"highlights":[{"title":"[eksakt artikkeltitel fra listen]","source":"[kilde]","why":"[1 sætning om hvorfor den er vigtig]"},{"title":"[eksakt artikkeltitel fra listen]","source":"[kilde]","why":"[1 sætning om hvorfor den er vigtig]"},{"title":"[eksakt artikkeltitel fra listen]","source":"[kilde]","why":"[1 sætning om hvorfor den er vigtig]"}]}`

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
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    const geminiData = await res.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!raw) {
      const reason = geminiData.candidates?.[0]?.finishReason ?? 'ukendt'
      return NextResponse.json({ error: `Gemini returnerede intet (finishReason: ${reason})` }, { status: 500 })
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

    // Gem nyt personligt digest
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
