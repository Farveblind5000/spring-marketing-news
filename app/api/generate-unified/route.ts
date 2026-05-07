import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const FALLBACK_PROMPT = `Du er redaktør. Uge {{week}}, {{year}}.

Digest med {{article_count}} artikler:

INTRO:
{{digest_intro}}

ARTIKLER:
{{articles_block}}

Skriv en briefing med dette format:

THEME: [tema, max 20 ord]
CONTEXT: [3-4 sætninger]
KEY_INSIGHT_1: [2-3 sætninger]
KEY_INSIGHT_2: [2-3 sætninger]
KEY_INSIGHT_3: [2-3 sætninger]
TRENDS: [2-3 sætninger]
SOURCES: [komma-sep liste]`

async function fetchPromptTemplate(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data } = await supabase
    .from('settings')
    .select('content')
    .eq('key', 'unified_prompt')
    .maybeSingle()
  return data?.content ?? FALLBACK_PROMPT
}

interface DigestArticle {
  title: string
  source: string
  url?: string | null
  summary: string
  takeaways: string[]
}

interface DigestContent {
  intro: string
  articles: DigestArticle[]
}

function parseUnifiedFormat(text: string) {
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
    theme: fields['THEME'] ?? '',
    context: fields['CONTEXT'] ?? '',
    insights: [
      fields['KEY_INSIGHT_1'] ?? '',
      fields['KEY_INSIGHT_2'] ?? '',
      fields['KEY_INSIGHT_3'] ?? '',
      fields['KEY_INSIGHT_4'] ?? '',
    ].filter(Boolean),
    trends: fields['TRENDS'] ?? '',
    sources: fields['SOURCES'] ?? '',
  }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  // Hent eksisterende digest (skal eksistere — kør "Generer digest" først)
  const { data: digest } = await supabase
    .from('digests')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_number', currentWeek)
    .eq('year', currentYear)
    .maybeSingle()

  if (!digest) {
    return NextResponse.json({ error: 'Intet digest fundet — kør "Generer digest" først' }, { status: 400 })
  }

  let digestData: DigestContent
  try {
    const parsed = JSON.parse(digest.content)
    if (!parsed.articles || !Array.isArray(parsed.articles) || parsed.articles.length === 0) {
      throw new Error('Digest mangler artikler')
    }
    digestData = parsed as DigestContent
  } catch {
    return NextResponse.json({ error: 'Digest-indhold kunne ikke parses — regenerér digest først' }, { status: 400 })
  }

  // Byg articles_block til prompt
  const articlesBlock = digestData.articles
    .map((a, i) => {
      const takeaways = a.takeaways.map(t => `  - ${t}`).join('\n')
      return `${i + 1}. ${a.title} (${a.source})\n${a.summary}\nNøglepointer:\n${takeaways}`
    })
    .join('\n\n')

  const template = await fetchPromptTemplate(supabase)
  const prompt = template
    .replace(/\{\{week\}\}/g, String(currentWeek))
    .replace(/\{\{year\}\}/g, String(currentYear))
    .replace(/\{\{article_count\}\}/g, String(digestData.articles.length))
    .replace(/\{\{digest_intro\}\}/g, digestData.intro ?? '')
    .replace(/\{\{articles_block\}\}/g, articlesBlock)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Ingen GEMINI_API_KEY sat' }, { status: 500 })
  }

  try {
    // Output er fast struktur (THEME/CONTEXT/3-4 INSIGHTS/TRENDS/SOURCES)
    // Skalerer minimalt — formatet vokser ikke med flere artikler, kun input
    const maxOutputTokens = Math.min(6000, 3000 + digestData.articles.length * 200)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens },
        }),
      }
    )

    const geminiData = await res.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!raw) {
      const finishReason = geminiData.candidates?.[0]?.finishReason ?? 'ukendt'
      const geminiErr = geminiData.error?.message ?? ''
      const candidatesCount = geminiData.candidates?.length ?? 0
      const reasonText = geminiErr
        ? `Gemini API: ${geminiErr}`
        : `finishReason: ${finishReason}, candidates: ${candidatesCount}, tokens: ${maxOutputTokens}, artikler: ${digestData.articles.length}`
      return NextResponse.json({
        error: `Gemini returnerede intet indhold — ${reasonText}`,
        debug: { finishReason, geminiError: geminiData.error, geminiData }
      }, { status: 500 })
    }

    const parsed = parseUnifiedFormat(raw)

    if (!parsed.theme || parsed.insights.length === 0) {
      return NextResponse.json({
        error: 'Kunne ikke parse Gemini-svar',
        raw: raw.slice(0, 500),
      }, { status: 500 })
    }

    // Gem på digest-row
    const { error: updateErr } = await supabase
      .from('digests')
      .update({
        unified_content: JSON.stringify(parsed),
        unified_generated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)

    if (updateErr) {
      return NextResponse.json({ error: `DB-fejl: ${updateErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, unified: parsed })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
