import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ArticleCard from '@/app/components/ArticleCard'

// Start på indeværende ISO-uge (mandag 00:00 lokal tid)
function startOfCurrentWeek(): Date {
  const now = new Date()
  const day = now.getDay() || 7  // Søndag = 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  monday.setHours(0, 0, 0, 0)
  return monday
}

interface ArticleRow {
  id: string
  title: string
  url: string
  topic: 'ai' | 'marketing' | 'both' | null
  published_at: string | null
  scraped_at: string | null
  summary: string | null
  short_summary: string | null
  relevance_score: number | null
  read_time_min: number | null
  sources: { name: string } | null
}

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 30-dages vindue baseret på scraped_at
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: articlesRaw } = await supabase
    .from('articles')
    .select('id, title, url, topic, published_at, scraped_at, summary, short_summary, relevance_score, read_time_min, sources(name)')
    .gte('scraped_at', thirtyDaysAgo.toISOString())
    .order('scraped_at', { ascending: false })
    .limit(100)

  const articles = (articlesRaw ?? []) as unknown as ArticleRow[]

  // Split i "denne uge" og "ældre uger" baseret på scraped_at
  const weekStart = startOfCurrentWeek()
  const thisWeek: ArticleRow[] = []
  const olderWeeks: ArticleRow[] = []
  for (const a of articles) {
    const scraped = a.scraped_at ? new Date(a.scraped_at) : null
    if (scraped && scraped >= weekStart) thisWeek.push(a)
    else olderWeeks.push(a)
  }

  // Brugerens gemte artikel-IDs + digest queue
  let savedIds = new Set<string>()
  let queuedIds = new Set<string>()
  if (user) {
    const [savesRes, queueRes] = await Promise.all([
      supabase.from('user_saves').select('article_id'),
      supabase.from('user_digest_queue').select('article_id'),
    ])
    if (savesRes.data) savedIds = new Set(savesRes.data.map(s => s.article_id))
    if (queueRes.data) queuedIds = new Set(queueRes.data.map(s => s.article_id))
  }

  const { count: sourceCount } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

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
          <Link href="/" className="text-[16px] font-medium" style={{ color: 'var(--orange)' }}>
            Feed
          </Link>
          <Link
            href="/saved"
            className="text-[16px] font-medium transition-colors hover:text-[var(--orange)]"
            style={{ color: 'var(--offblack)' }}
          >
            Gemte artikler
          </Link>
          <Link
            href="/digest"
            className="text-[16px] font-medium transition-colors hover:text-[var(--orange)]"
            style={{ color: 'var(--offblack)' }}
          >
            Digest
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

        {/* HEADER */}
        <header style={{ marginBottom: 48 }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="live-dot w-2 h-2 rounded-full" style={{ background: 'var(--orange)' }} />
            <p className="eyebrow m-0">{sourceCount ?? 0} kilder scannet i morges</p>
          </div>
          <h1 style={{ fontWeight: 400, fontSize: 56, lineHeight: 1, color: 'var(--offblack)', margin: 0 }}>
            Dit feed.
          </h1>
        </header>

        {/* FILTER TABS */}
        <div
          className="flex items-center gap-2 mb-8 pb-5"
          style={{ borderBottom: '1px solid rgba(72,72,72,0.18)' }}
        >
          {['Alle', 'AI', 'Marketing'].map((label) => (
            <button
              key={label}
              className="px-4 py-2 text-[13px] font-medium rounded-[60px] border transition-all"
              style={{
                background: label === 'Alle' ? 'var(--offblack)' : 'transparent',
                color: label === 'Alle' ? 'var(--white)' : 'var(--offblack)',
                borderColor: label === 'Alle' ? 'var(--offblack)' : 'rgba(72,72,72,0.18)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ARTICLE LIST */}
        {!articles.length ? (
          <p style={{ color: 'var(--gunmetal)', fontSize: 16 }}>
            Ingen artikler de seneste 30 dage.
          </p>
        ) : (
          <>
            {/* DENNE UGE */}
            <section style={{ marginBottom: thisWeek.length && olderWeeks.length ? 56 : 0 }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                <p className="eyebrow m-0">Denne uge</p>
                <span style={{ fontSize: 12, color: 'var(--gunmetal)' }}>
                  {thisWeek.length} {thisWeek.length === 1 ? 'artikel' : 'artikler'}
                </span>
              </div>
              {thisWeek.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--gunmetal)', padding: '24px 0', borderTop: '1px solid rgba(72,72,72,0.18)' }}>
                  Ingen nye artikler denne uge endnu.
                </p>
              ) : (
                <div className="flex flex-col">
                  {thisWeek.map((article, i) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      index={i}
                      isFirst={i === 0}
                      initialSaved={savedIds.has(article.id)}
                      initialQueued={queuedIds.has(article.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ÆLDRE UGER */}
            {olderWeeks.length > 0 && (
              <section>
                <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                  <p className="eyebrow m-0" style={{ color: 'var(--gunmetal)' }}>Ældre uger</p>
                  <span style={{ fontSize: 12, color: 'var(--gunmetal)' }}>
                    {olderWeeks.length} {olderWeeks.length === 1 ? 'artikel' : 'artikler'} · sidste 30 dage
                  </span>
                </div>
                <div className="flex flex-col">
                  {olderWeeks.map((article, i) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      index={thisWeek.length + i}
                      isFirst={i === 0}
                      initialSaved={savedIds.has(article.id)}
                      initialQueued={queuedIds.has(article.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <style>{`
        .live-dot { animation: livepulse 1.6s ease-out infinite; }
        @keyframes livepulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,55,0,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(255,55,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,55,0,0); }
        }
      `}</style>
    </>
  )
}
