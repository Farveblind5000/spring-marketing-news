import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { UnifiedReportPDF } from '@/app/components/UnifiedReportPDF'

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

interface UnifiedContent {
  theme: string
  context: string
  insights: string[]
  trends: string
  sources: string
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

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  const { data: digest } = await supabase
    .from('digests')
    .select('content, unified_content, unified_generated_at')
    .eq('user_id', user.id)
    .eq('week_number', currentWeek)
    .eq('year', currentYear)
    .maybeSingle()

  if (!digest?.unified_content) {
    return NextResponse.json({ error: 'Ingen samlet rapport — kør "Saml til rapport" først' }, { status: 400 })
  }

  let unified: UnifiedContent
  try {
    unified = JSON.parse(digest.unified_content)
    if (!unified.theme || !Array.isArray(unified.insights)) throw new Error()
  } catch {
    return NextResponse.json({ error: 'Rapport-data kunne ikke parses' }, { status: 500 })
  }

  // Hent artikel-kort fra digest.content
  let articles: DigestArticle[] = []
  try {
    const digestData: DigestContent = JSON.parse(digest.content)
    if (Array.isArray(digestData.articles)) articles = digestData.articles
  } catch {
    // Fallback: ingen artikler i PDF hvis parse fejler
    articles = []
  }

  try {
    const buffer = await renderToBuffer(
      <UnifiedReportPDF
        unified={unified}
        articles={articles}
        week={currentWeek}
        year={currentYear}
        generatedAt={digest.unified_generated_at ?? new Date().toISOString()}
      />
    )

    const filename = `emils-ai-news-uge-${currentWeek}-${currentYear}.pdf`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: `PDF-generering fejlede: ${String(err)}` }, { status: 500 })
  }
}
