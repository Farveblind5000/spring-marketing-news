import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { UnifiedReportPDF } from '@/app/components/UnifiedReportPDF'
import { Resend } from 'resend'

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

function buildHtmlBody(unified: UnifiedContent, week: number, year: number): string {
  const insightsHtml = unified.insights
    .map((insight, i) => `
      <tr>
        <td style="width: 32px; vertical-align: top; padding-top: 2px;">
          <div style="width: 22px; height: 22px; background: #FF3700; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 11px; font-weight: 700;">${i + 1}</div>
        </td>
        <td style="padding-bottom: 12px; font-size: 14px; line-height: 1.6; color: #1A1A1A;">${insight}</td>
      </tr>
    `)
    .join('')

  return `<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><title>Spring Marketing News — Uge ${week}</title></head>
<body style="margin: 0; padding: 0; background: #F4F4F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="600" style="max-width: 600px; margin: 24px auto; background: white; border-radius: 12px; overflow: hidden;">
    <tr><td style="padding: 32px 36px;">

      <!-- HEADER -->
      <table role="presentation" width="100%" style="border-bottom: 1px solid #E0E0E0; padding-bottom: 14px; margin-bottom: 28px;">
        <tr>
          <td>
            <div style="font-size: 16px; font-weight: 700; color: #1A1A1A;">Spring<span style="color: #FF3700;">CC</span></div>
            <div style="font-size: 9px; color: #484848; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">News Intel</div>
          </td>
          <td align="right">
            <div style="font-size: 10px; color: #484848; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Uge ${week}, ${year}</div>
          </td>
        </tr>
      </table>

      <!-- THEME -->
      <h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A; line-height: 1.25; margin: 0 0 18px;">${unified.theme}</h1>

      <!-- CONTEXT -->
      ${unified.context ? `<p style="font-size: 14px; color: #1A1A1A; line-height: 1.65; margin: 0 0 28px;">${unified.context}</p>` : ''}

      <!-- INSIGHTS -->
      ${unified.insights.length ? `
        <div style="font-size: 9px; font-weight: 700; color: #FF3700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">Hovedindsigter</div>
        <table role="presentation" width="100%" style="margin-bottom: 22px;">${insightsHtml}</table>
      ` : ''}

      <!-- TRENDS -->
      ${unified.trends ? `
        <div style="background: #FFF5F2; border-left: 3px solid #FF3700; padding: 14px 18px; margin-bottom: 18px; border-radius: 0 6px 6px 0;">
          <div style="font-size: 9px; font-weight: 700; color: #FF3700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Tendenser</div>
          <div style="font-size: 14px; color: #1A1A1A; line-height: 1.55;">${unified.trends}</div>
        </div>
      ` : ''}

      <!-- SOURCES -->
      ${unified.sources ? `<p style="font-size: 11px; color: #484848; font-style: italic; margin: 14px 0 0;">Kilder: ${unified.sources}</p>` : ''}

      <!-- FOOTER -->
      <div style="margin-top: 32px; padding-top: 14px; border-top: 1px solid #E0E0E0; font-size: 11px; color: #484848;">
        Den fulde rapport er vedhæftet som PDF.<br>
        <a href="https://spring-marketing-news.vercel.app/digest" style="color: #FF3700; text-decoration: none;">Se din digest online</a>
      </div>

    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  let recipient: string
  try {
    const body = await req.json()
    recipient = body.recipient
    if (!recipient || !recipient.includes('@')) throw new Error()
  } catch {
    return NextResponse.json({ error: 'Ugyldig modtager-email' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY ikke sat' }, { status: 500 })
  }

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  const { data: digest } = await supabase
    .from('digests')
    .select('unified_content, unified_generated_at')
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

  try {
    // Generér PDF som vedhæftning
    const pdfBuffer = await renderToBuffer(
      <UnifiedReportPDF
        unified={unified}
        week={currentWeek}
        year={currentYear}
        generatedAt={digest.unified_generated_at ?? new Date().toISOString()}
      />
    )

    const html = buildHtmlBody(unified, currentWeek, currentYear)
    const filename = `spring-marketing-news-uge-${currentWeek}-${currentYear}.pdf`

    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: 'Spring Marketing News <onboarding@resend.dev>',
      to: recipient,
      subject: `Spring Marketing News — Uge ${currentWeek}, ${currentYear}`,
      html,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer),
        },
      ],
    })

    if (result.error) {
      return NextResponse.json({ error: `Resend-fejl: ${result.error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, recipient, emailId: result.data?.id })

  } catch (err) {
    return NextResponse.json({ error: `Email fejlede: ${String(err)}` }, { status: 500 })
  }
}
