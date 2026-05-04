import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default async function DigestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const currentWeek = weekNumber(now)
  const currentYear = now.getFullYear()

  // Hent denne uges globale digest (hvis den findes)
  const { data: digest } = await supabase
    .from('digests')
    .select('*')
    .is('user_id', null)
    .eq('week_number', currentWeek)
    .eq('year', currentYear)
    .maybeSingle()

  // Antal artikler seneste 7 dage (til at vise status)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const { count: weekArticleCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('scraped_at', sevenDaysAgo.toISOString())

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
          <Link
            href="/"
            className="text-[16px] font-medium transition-colors hover:text-[var(--orange)]"
            style={{ color: 'var(--offblack)' }}
          >
            Feed
          </Link>
          <Link
            href="/saved"
            className="text-[16px] font-medium transition-colors hover:text-[var(--orange)]"
            style={{ color: 'var(--offblack)' }}
          >
            Gemte artikler
          </Link>
          <Link href="/digest" className="text-[16px] font-medium" style={{ color: 'var(--orange)' }}>
            Ugentligt digest
          </Link>
        </div>

        {user ? (
          <Link href="/saved">
            <button className="btn-secondary px-6 py-3 text-[16px]">{user.email?.split('@')[0]}</button>
          </Link>
        ) : (
          <Link href="/login">
            <button className="btn-secondary px-6 py-3 text-[16px]">Log ind</button>
          </Link>
        )}
      </nav>

      {/* ── PAGE ── */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 50px 80px' }}>

        <header style={{ marginBottom: 48 }}>
          <p className="eyebrow m-0 mb-4">Uge {currentWeek}, {currentYear}</p>
          <h1 style={{ fontWeight: 400, fontSize: 56, lineHeight: 1, color: 'var(--offblack)', margin: 0 }}>
            Ugentligt digest.
          </h1>
        </header>

        {digest ? (
          /* ── Digest findes ── */
          <div>
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid rgba(72,72,72,0.12)',
                borderRadius: 16,
                padding: '40px 48px',
                marginBottom: 32,
              }}
            >
              <div className="flex items-center gap-3 mb-8">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--orange)',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <p className="eyebrow m-0">
                  {digest.article_count ?? weekArticleCount ?? 0} artikler analyseret · {digest.source_count ?? 0} kilder
                </p>
              </div>

              <div style={{ fontSize: 16, color: 'var(--offblack)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {digest.content}
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--gunmetal)' }}>
              Genereret {new Date(digest.created_at).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}Nyt digest søndag aften
            </p>
          </div>
        ) : (
          /* ── Digest ikke klar endnu ── */
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid rgba(72,72,72,0.12)',
              borderRadius: 16,
              padding: '64px 48px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontWeight: 400, fontSize: 24, color: 'var(--offblack)', margin: '0 0 12px' }}>
              Digest er ikke klar endnu
            </h2>
            <p style={{ color: 'var(--gunmetal)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.6 }}>
              {weekArticleCount
                ? `${weekArticleCount} artikler er scrapet denne uge. Digest genereres automatisk søndag aften.`
                : 'Ingen artikler scrapet denne uge endnu.'}
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
