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

  // Fallback: plain text KEY:-format
  return `Du er redaktør på et dansk AI & marketing intelligence-feed. Uge {{week}}, {{year}}.

Brugeren har selv gemt og valgt disse {{article_count}} artikler (fra {{source_count}} kilder):
{{article_list}}

Svar med præcis dette format. Behold KEY:-præfikserne. Erstat kun [] med dit indhold:

INTRO: [2 sætninger om hvad brugeren har fokuseret på denne uge]

TREND1_TITLE: [kort tendenstitel]
TREND1_BODY: [2 sætninger med konkrete eksempler]

TREND2_TITLE: [kort tendenstitel]
TREND2_BODY: [2 sætninger med konkrete eksempler]

TREND3_TITLE: [kort tendenstitel]
TREND3_BODY: [2 sætninger med konkrete eksempler]

HIGHLIGHT1_TITLE: [eksakt artikkeltitel fra listen]
HIGHLIGHT1_SOURCE: [kilde]
HIGHLIGHT1_WHY: [1 sætning om hvorfor den er vigtig]

HIGHLIGHT2_TITLE: [eksakt artikkeltitel fra listen]
HIGHLIGHT2_SOURCE: [kilde]
HIGHLIGHT2_WHY: [1 sætning om hvorfor den er vigtig]

HIGHLIGHT3_TITLE: [eksakt artikkeltitel fra listen]
HIGHLIGHT3_SOURCE: [kilde]
HIGHLIGHT3_WHY: [1 sætning om hvorfor den er vigtig]`
}

// Parser Geminis KEY:-format til DigestContent
function parseKeyFormat(text: string) {
  const fields: Record<string, string> = {}
  const lines = text.split('\n')
  let currentKey = ''
  const currentParts: string[] = []

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+):\s*(.*)$/)
    if (match) {
      if (currentKey) fields[currentKey] = currentParts.join(' ').trim()
      currentKey = match[1]
      currentParts.length = 0
      if (match[2].trim()) currentParts.push(match[2].trim())
    } else if (currentKey && line.trim()) {
      currentParts.push(line.trim())
    }
  }
  if (currentKey) fields[currentKey] = currentParts.join(' ').trim()

  return {
    intro: fields['INTRO'] ?? '',
    trends: [1, 2, 3]
      .map(i => ({ title: fields[`TREND${i}_TITLE`] ?? '', body: fields[`TREND${i}_BODY`] ?? '' }))
      .filter(t => t.title),
    highlights: [1, 2, 3]
      .map(i => ({
        title: fields[`HIGHLIGHT${i}_TITLE`] ?? '',
        source: fields[`HIGHLIGHT${i}_SOURCE`] ?? '',
        why: fields[`HIGHLIGHT${i}_WHY`] ?? '',
        url: null as string | null,
      }))
      .filter(h => h.title),
  }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

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
      return `${i + 1}. [${a.topic?.toUpperCase() ?? 'GENEREL'}] ${a.title} — ${src}${firstBullet ? `\n   ${firstBullet}` : ''}`
    })
    .join('\n')

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
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
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

    // Parser plain text KEY:-format → DigestContent
    const parsed = parseKeyFormat(raw)

    if (!parsed.intro) {
      return NextResponse.json({ error: 'Kunne ikke parse Gemini-svar', raw: raw.slice(0, 300) }, { status: 500 })
    }

    // Berig highlights med URL via titel-match
    parsed.highlights = parsed.highlights.map(h => {
      const match = articles.find(a =>
        a.title?.toLowerCase().includes(h.title?.toLowerCase().slice(0, 30)) ||
        h.title?.toLowerCase().includes(a.title?.toLowerCase().slice(0, 30))
      )
      return { ...h, url: match?.url ?? null }
    })

    // Slet eksisterende og gem nyt digest
    await supabase.from('digests').delete()
      .eq('user_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)

    await supabase.from('digests').insert({
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
