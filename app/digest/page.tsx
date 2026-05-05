import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GenerateDigestButton from '@/app/components/GenerateDigestButton'

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

interface DigestContent {
  intro: string
  trends: { title: string; body: string }[]
  highlights: { title: string; source: string; url?: string; why: string }[]
}

function parseDigestContent(raw: string): DigestContent | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.intro && Array.isArray(parsed.trends) && Array.isArray(parsed.highlights)) {
      return parsed as DigestContent
    }
    return null
  } catch {
    return null
  }
}

export default async function DigestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  // Hent brugerens digest for denne uge
  const { data: digest } = await supabase
    .from('digests')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_number', currentWeek)
    .eq('year', currentYear)
    .maybeSingle()

  // Antal gemte artikler (til knap og status)
  const { count: savedCount } = await supabase
    .from('user_saves')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const structured = digest ? parseDigestContent(digest.content) : null
  const totalSaved = savedCount ?? 0

  return (
    <>
      {/* ── NAV ── */}
      <nav className="nav-glass sticky top-0 z-50 flex items-center justify-between px-[50px] py-6">
        <Link
          href="/"
          className="flex items-baseline gap-[10px] text-[22px] font-bold"
          style={{ color: 'var(--offblack)' }}
        >
          Spring<b style={{ color: 'var(--orange)' }}>CC</b>
          <span
            className="text-[12px] font-medium uppercase border-l pl-[10px]"
            style={{ color: 'var(--gunmetal)', borderColor: 'rgba(72,72,72,0.3)' }}
          >
            News Intel
          </span>
        </Link>

        <div className="flex items-center gap-9">
          <Link href="/" className="text-[16px] font-medium transition-colors hover:text-[var(--orange)]" style={{ color: 'var(--offblack)' }}>
            Feed
          </Link>
          <Link href="/saved" className="text-[16px] font-medium transition-colors hover:text-[var(--orange)]" style={{ color: 'var(--offblack)' }}>
            Gemte artikler
          </Link>
          <Link href="/digest" className="text-[16px] font-medium" style={{ color: 'var(--orange)' }}>
            Digest
          </Link>
        </div>

        <Link href="/saved">
          <button className="btn-secondary px-6 py-3 text-[16px]">{user.email?.split('@')[0]}</button>
        </Link>
      </nav>

      {/* ── PAGE ── */}
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '56px 50px 100px' }}>

        <header style={{ marginBottom: 48 }}>
          <p className="eyebrow m-0 mb-4">Uge {currentWeek}, {currentYear}</p>
          <h1 style={{ fontWeight: 400, fontSize: 56, lineHeight: 1, color: 'var(--offblack)', margin: 0 }}>
            Digest.
          </h1>
        </header>

        {digest && structured ? (
          /* ── Digest klar ── */
          <div>
            {/* Meta-chip */}
            <div className="flex items-center gap-3" style={{ marginBottom: 40 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block', flexShrink: 0 }} />
              <p className="eyebrow m-0">
                {digest.article_count ?? 0} gemte artikler · {digest.source_count ?? 0} kilder
              </p>
            </div>

            {/* Intro */}
            <p style={{ fontSize: 18, lineHeight: 1.75, color: 'var(--offblack)', margin: '0 0 56px', fontWeight: 400 }}>
              {structured.intro}
            </p>

            <div style={{ borderTop: '1px solid rgba(72,72,72,0.12)', marginBottom: 48 }} />

            {/* Top 3 tendenser */}
            <section style={{ marginBottom: 56 }}>
              <p className="eyebrow m-0" style={{ marginBottom: 28 }}>Top 3 tendenser</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {structured.trends.map((trend, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: '0 20px', alignItems: 'start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--orange)', color: 'var(--white)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2,
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--offblack)', margin: '0 0 6px' }}>
                        {trend.title}
                      </p>
                      <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--gunmetal)', margin: 0 }}>
                        {trend.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ borderTop: '1px solid rgba(72,72,72,0.12)', marginBottom: 48 }} />

            {/* Ikke gå glip af */}
            <section style={{ marginBottom: 48 }}>
              <p className="eyebrow m-0" style={{ marginBottom: 28 }}>Ikke gå glip af</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {structured.highlights.map((h, i) => (
                  <div key={i} style={{
                    background: 'var(--white)',
                    border: '1px solid rgba(72,72,72,0.12)',
                    borderRadius: 12,
                    padding: '18px 22px',
                    transition: 'border-color 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                      <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 16, lineHeight: '22px', flexShrink: 0 }}>→</span>
                      <div style={{ flex: 1 }}>
                        {h.url ? (
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="digest-highlight-link"
                            style={{
                              fontWeight: 600,
                              fontSize: 15,
                              color: 'var(--offblack)',
                              textDecoration: 'none',
                              lineHeight: '22px',
                              display: 'inline',
                            }}
                          >
                            {h.title}
                          </a>
                        ) : (
                          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--offblack)', lineHeight: '22px' }}>
                            {h.title}
                          </span>
                        )}
                        <span style={{ fontWeight: 400, color: 'var(--gunmetal)', marginLeft: 8, fontSize: 15 }}>— {h.source}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--gunmetal)', margin: '0 0 0 26px' }}>
                      {h.why}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ borderTop: '1px solid rgba(72,72,72,0.12)', marginBottom: 32 }} />

            {/* Footer + regenerer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--gunmetal)', margin: 0 }}>
                Genereret {new Date(digest.created_at).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}baseret på dine gemte artikler
              </p>
              {totalSaved > 0 && (
                <GenerateDigestButton savedCount={totalSaved} />
              )}
            </div>
          </div>

        ) : totalSaved > 0 ? (
          /* ── Har gemte artikler men ingen digest endnu ── */
          <div style={{
            background: 'var(--white)',
            border: '1px solid rgba(72,72,72,0.12)',
            borderRadius: 16,
            padding: '64px 48px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontWeight: 400, fontSize: 24, color: 'var(--offblack)', margin: '0 0 12px' }}>
              Klar til at lave dit digest
            </h2>
            <p style={{ color: 'var(--gunmetal)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.6 }}>
              Du har {totalSaved} gemte {totalSaved === 1 ? 'artikel' : 'artikler'}. Generer et personligt overblik over hvad du har læst.
            </p>
            <GenerateDigestButton savedCount={totalSaved} />
          </div>

        ) : (
          /* ── Ingen gemte artikler endnu ── */
          <div style={{
            background: 'var(--white)',
            border: '1px solid rgba(72,72,72,0.12)',
            borderRadius: 16,
            padding: '64px 48px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔖</div>
            <h2 style={{ fontWeight: 400, fontSize: 24, color: 'var(--offblack)', margin: '0 0 12px' }}>
              Ingen gemte artikler endnu
            </h2>
            <p style={{ color: 'var(--gunmetal)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.6 }}>
              Gem artikler fra feedet du finder interessante — så laver vi et personligt digest baseret på dem.
            </p>
            <Link href="/">
              <button className="btn-primary px-6 py-3 text-[16px]">Læs dagens feed</button>
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
