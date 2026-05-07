import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

function isValidUnified(x: unknown): x is UnifiedContent {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.theme === 'string' &&
    typeof o.context === 'string' &&
    Array.isArray(o.insights) &&
    o.insights.every(i => typeof i === 'string') &&
    typeof o.trends === 'string' &&
    typeof o.sources === 'string'
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ugyldigt body-format' }, { status: 400 })
  }

  if (!isValidUnified(body)) {
    return NextResponse.json({ error: 'Manglende eller forkerte felter' }, { status: 400 })
  }

  // Sanitize: trim alle felter, fjern tomme insights
  const sanitized: UnifiedContent = {
    theme: body.theme.trim(),
    context: body.context.trim(),
    insights: body.insights.map(i => i.trim()).filter(Boolean),
    trends: body.trends.trim(),
    sources: body.sources.trim(),
  }

  if (!sanitized.theme) {
    return NextResponse.json({ error: 'Theme må ikke være tomt' }, { status: 400 })
  }

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  // Verificér at digest eksisterer for denne bruger/uge
  const { data: existing } = await supabase
    .from('digests')
    .select('id, unified_content')
    .eq('user_id', user.id)
    .eq('week_number', currentWeek)
    .eq('year', currentYear)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Intet digest fundet for denne uge' }, { status: 404 })
  }

  if (!existing.unified_content) {
    return NextResponse.json({ error: 'Ingen samlet rapport at redigere — kør "Saml til rapport" først' }, { status: 400 })
  }

  // Opdater unified_content (behold unified_generated_at som den var — det er AI-gen-timestamp)
  const { error: updateErr } = await supabase
    .from('digests')
    .update({ unified_content: JSON.stringify(sanitized) })
    .eq('id', existing.id)

  if (updateErr) {
    return NextResponse.json({ error: `DB-fejl: ${updateErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
