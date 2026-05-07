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

  return `Du er redaktør på et dansk AI & marketing intelligence-feed. Uge {{week}}, {{year}}.

Brugeren har valgt {{article_count}} artikler til digest:
{{article_list}}

For hver artikel — brug dette format med N=1,2,...,{{article_count}}:

INTRO: [tema]

ART1_TITLE: [titel]
ART1_SOURCE: [kilde]
ART1_SUMMARY: [4-6 sætninger]
ART1_TAKEAWAY1: [indsigt 1]
ART1_TAKEAWAY2: [indsigt 2]
ART1_TAKEAWAY3: [indsigt 3]`
}

// Parse Geminis KEY:-format med variabelt antal artikler
function parseKeyFormat(text: string, expectedCount: number) {
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

  const articles: { title: string; source: string; summary: string; takeaways: string[]; url: string | null }[] = []
  for (let i = 1; i <= expectedCount; i++) {
    const title = fields[`ART${i}_TITLE`] ?? ''
    if (!title) continue
    articles.push({
      title,
      source: fields[`ART${i}_SOURCE`] ?? '',
      summary: fields[`ART${i}_SUMMARY`] ?? '',
      takeaways: [
        fields[`ART${i}_TAKEAWAY1`] ?? '',
        fields[`ART${i}_TAKEAWAY2`] ?? '',
        fields[`ART${i}_TAKEAWAY3`] ?? '',
      ].filter(Boolean),
      url: null,
    })
  }

  return {
    intro: fields['INTRO'] ?? '',
    articles,
  }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  // Hent brugerens VALGTE artikler fra digest queue (ikke user_saves)
  const { data: queueRows } = await supabase
    .from('user_digest_queue')
    .select(`
      articles (
        id, title, url, summary, topic,
        sources ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('added_at', { ascending: true })

  if (!queueRows?.length) {
    return NextResponse.json({ error: 'Ingen artikler valgt til digest' }, { status: 400 })
  }

  type ArticleRow = {
    id: string
    title: string
    url: string | null
    summary: string | null
    topic: string | null
    sources: { name: string } | null
  }

  const articles: ArticleRow[] = queueRows
    .map(r => r.articles as unknown as ArticleRow)
    .filter((a): a is ArticleRow => !!a?.title)

  if (!articles.length) {
    return NextResponse.json({ error: 'Ingen artikeldata fundet' }, { status: 400 })
  }

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  const uniqueSources = new Set(articles.map(a => a.sources?.name).filter(Boolean))

  // Artikellisten med fuld summary (giver Gemini nok kontekst til udvidet opsummering)
  const articleList = articles
    .map((a, i) => {
      const src = a.sources?.name ?? ''
      const summary = (a.summary ?? '').slice(0, 600)
      return `${i + 1}. [${a.topic?.toUpperCase() ?? 'GENEREL'}] ${a.title} — ${src}${summary ? `\n${summary}` : ''}`
    })
    .join('\n\n')

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
    // Skaler maxOutputTokens med antal artikler (~600 tokens per artikel-block)
    const maxOutputTokens = Math.min(8000, 1500 + articles.length * 600)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens,
            thinkingConfig: { thinkingBudget: 0 },  // Slå thinking fra — sparer tokens til faktisk output
          },
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

    const parsed = parseKeyFormat(raw, articles.length)

    if (!parsed.intro || !parsed.articles.length) {
      return NextResponse.json({
        error: 'Kunne ikke parse Gemini-svar',
        raw: raw.slice(0, 500),
        parsed_preview: { intro_len: parsed.intro.length, article_count: parsed.articles.length }
      }, { status: 500 })
    }

    // Berig artikler med URL via titel-match
    parsed.articles = parsed.articles.map(a => {
      const match = articles.find(orig =>
        orig.title?.toLowerCase().includes(a.title?.toLowerCase().slice(0, 30)) ||
        a.title?.toLowerCase().includes(orig.title?.toLowerCase().slice(0, 30))
      )
      return { ...a, url: match?.url ?? null }
    })

    // Slet eksisterende digest for denne uge for denne bruger og gem nyt
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
