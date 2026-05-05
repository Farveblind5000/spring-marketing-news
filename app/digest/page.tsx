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

function parseDigestContent(raw: string): DigestContent | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.intro && Array.isArray(parsed.articles) && parsed.articles.length > 0) {
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

  // Antal valgte artikler i digest queue (driver knappen)
  const { count: queuedCount } = await supabase
    .from('user_digest_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const structured = digest ? parseDigestContent(digest.content) : null
  const totalQueued = queuedCount ?? 0
  const isLegacyDigest = digest && !structured  // gammelt format i DB

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
          /* ── Digest klar (nyt format) ── */
          <div>
            {/* Meta-chip */}
            <div className="flex items-center gap-3" style={{ marginBottom: 40 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block', flexShrink: 0 }} />
              <p className="eyebrow m-0">
                {structured.articles.length} valgte {structured.articles.length === 1 ? 'artikel' : 'artikler'} · {digest.source_count ?? 0} kilder
              </p>
            </div>

            {/* Intro */}
            <p style={{ fontSize: 18, lineHeight: 1.75, color: 'var(--offblack)', margin: '0 0 48px', fontWeight: 400 }}>
              {structured.intro}
            </p>

            <div style={{ borderTop: '1px solid rgba(72,72,72,0.12)', marginBottom: 40 }} />

            {/* Artikler — én kort pr. valgt artikel */}
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {structured.articles.map((art, i) => (
                  <article key={i} style={{
                    background: 'var(--white)',
                    border: '1px solid rgba(72,72,72,0.12)',
                    borderRadius: 16,
                    padding: '28px 32px',
                  }}>
                    {/* Titel + kilde */}
                    <div style={{ marginBottom: 16 }}>
                      <p className="eyebrow m-0" style={{ marginBottom: 6, fontSize: 11 }}>
                        — {String(i + 1).padStart(2, '0')} · {art.source}
                      </p>
                      {art.url ? (
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="digest-highlight-link"
                          style={{
                            fontWeight: 500,
                            fontSize: 22,
                            color: 'var(--offblack)',
                            textDecoration: 'none',
                            lineHeight: 1.25,
                            display: 'inline-block',
                          }}
                        >
                          {art.title}
                        </a>
                      ) : (
                        <h2 style={{ fontWeight: 500, fontSize: 22, color: 'var(--offblack)', lineHeight: 1.25, margin: 0 }}>
                          {art.title}
                        </h2>
                      )}
                    </div>

                    {/* Udvidet summary */}
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--offblack)', margin: '0 0 20px' }}>
                      {art.summary}
                    </p>

                    {/* Takeaways */}
                    {art.takeaways.length > 0 && (
                      <div style={{
                        background: 'rgba(255,55,0,0.04)',
                        borderLeft: '2px solid var(--orange)',
                        padding: '14px 18px',
                        borderRadius: '0 8px 8px 0',
                      }}>
                        <p className="eyebrow m-0" style={{ marginBottom: 8, fontSize: 11 }}>Hovedpointer</p>
                        <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
                          {art.takeaways.map((t, j) => (
                            <li key={j} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gunmetal)', marginBottom: 4 }}>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <div style={{ borderTop: '1px solid rgba(72,72,72,0.12)', marginBottom: 32 }} />

            {/* Footer + regenerer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--gunmetal)', margin: 0 }}>
                Genereret {new Date(digest.created_at).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}baseret på dine valgte artikler
              </p>
              {totalQueued > 0 && (
                <GenerateDigestButton savedCount={totalQueued} />
              )}
            </div>
          </div>

        ) : isLegacyDigest && totalQueued > 0 ? (
          /* ── Gammelt format ligger i DB — bed om regenerering ── */
          <div style={{
            background: 'var(--white)',
            border: '1px solid rgba(72,72,72,0.12)',
            borderRadius: 16,
            padding: '64px 48px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔄</div>
            <h2 style={{ fontWeight: 400, fontSize: 24, color: 'var(--offblack)', margin: '0 0 12px' }}>
              Nyt digest-format tilgængeligt
            </h2>
            <p style={{ color: 'var(--gunmetal)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.6 }}>
              Klik genererer et opdateret digest baseret på dine {totalQueued} valgte {totalQueued === 1 ? 'artikel' : 'artikler'} med udvidet opsummering.
            </p>
            <GenerateDigestButton savedCount={totalQueued} />
          </div>

        ) : totalQueued > 0 ? (
          /* ── Har valgte artikler men intet digest ── */
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
              Du har valgt {totalQueued} {totalQueued === 1 ? 'artikel' : 'artikler'}. Generer en udvidet opsummering med hovedpointer.
            </p>
            <GenerateDigestButton savedCount={totalQueued} />
          </div>

        ) : (
          /* ── Ingen valgte artikler ── */
          <div style={{
            background: 'var(--white)',
            border: '1px solid rgba(72,72,72,0.12)',
            borderRadius: 16,
            padding: '64px 48px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
            <h2 style={{ fontWeight: 400, fontSize: 24, color: 'var(--offblack)', margin: '0 0 12px' }}>
              Ingen artikler valgt endnu
            </h2>
            <p style={{ color: 'var(--gunmetal)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.6 }}>
              Gå til feedet og klik stjernen ⭐ ved siden af bogmærket på artikler du vil have med i dit digest.
            </p>
            <Link href="/">
              <button className="btn-primary px-6 py-3 text-[16px]">Gå til feed</button>
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
