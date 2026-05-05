import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SaveButton from '@/app/components/SaveButton'
import SendToDigestButton from '@/app/components/SendToDigestButton'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export default async function SavedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Hent gemte artikel-IDs
  const { data: saves } = await supabase
    .from('user_saves')
    .select('article_id')
    .order('saved_at', { ascending: false })

  const articleIds = (saves ?? []).map(s => s.article_id).filter(Boolean)

  // Hent artiklerne — samme query-mønster som feed-siden
  const { data: articles } = articleIds.length
    ? await supabase
        .from('articles')
        .select('id, title, url, topic, published_at, summary, relevance_score, read_time_min, sources(name)')
        .in('id', articleIds)
    : { data: [] }

  // Bevar rækkefølgen fra user_saves
  const sorted = articleIds
    .map(id => articles?.find(a => a.id === id))
    .filter(Boolean)

  // Hent brugerens digest-queue så vi kan vise korrekt initial state
  const { data: queueRows } = await supabase
    .from('user_digest_queue')
    .select('article_id')
  const queuedIds = new Set((queueRows ?? []).map(q => q.article_id))

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
          <Link href="/saved" className="text-[16px] font-medium" style={{ color: 'var(--orange)' }}>
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

        <Link href="/saved">
          <button className="btn-secondary px-6 py-3 text-[16px]">{user.email?.split('@')[0]}</button>
        </Link>
      </nav>

      {/* ── PAGE ── */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 50px 80px' }}>

        <header style={{ marginBottom: 48 }}>
          <h1 style={{ fontWeight: 400, fontSize: 56, lineHeight: 1, color: 'var(--offblack)', margin: '0 0 12px' }}>
            Gemte artikler.
          </h1>
          <p className="eyebrow m-0">{sorted.length} artikel{sorted.length !== 1 ? 'er' : ''} gemt</p>
        </header>

        {sorted.length === 0 ? (
          <div style={{ paddingTop: 40 }}>
            <p style={{ color: 'var(--gunmetal)', fontSize: 16, margin: '0 0 24px' }}>
              Du har ikke gemt nogen artikler endnu.
            </p>
            <Link href="/">
              <button className="btn-primary px-6 py-3 text-[16px]">Gå til feed</button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col">
            {sorted.map((article, i) => {
              if (!article) return null
              const sourceName = (article.sources as unknown as { name: string } | null)?.name ?? ''
              const topic = article.topic as 'ai' | 'marketing' | 'both'

              return (
                <div
                  key={article.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr auto',
                    gap: 28,
                    padding: '24px 0',
                    borderTop: `1px solid rgba(72,72,72,${i === 0 ? '0.18' : '0.12'})`,
                    alignItems: 'start',
                  }}
                >
                  {/* Index */}
                  <div
                    style={{
                      fontFamily: 'ui-monospace, "SF Mono", monospace',
                      fontSize: 13,
                      color: 'var(--orange)',
                      paddingTop: 4,
                    }}
                  >
                    — {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Main */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="flex items-center gap-2 mb-2" style={{ fontSize: 12, color: 'var(--gunmetal)' }}>
                      <span
                        className={`eyebrow px-2 py-[3px] rounded-[40px] border text-[11px] badge-${topic}`}
                        style={{ borderColor: 'currentColor' }}
                      >
                        {topic === 'ai' ? 'AI' : 'Marketing'}
                      </span>
                      <span>{sourceName}</span>
                      <span
                        className="rounded-full opacity-50"
                        style={{ width: 3, height: 3, background: 'var(--gunmetal)', display: 'inline-block' }}
                      />
                      <span>
                        {formatDate(article.published_at)} · {article.read_time_min ?? 1} min
                      </span>
                    </div>
                    <h2
                      className="group-hover:text-[var(--orange)] transition-colors"
                      style={{ fontWeight: 400, fontSize: 22, lineHeight: 1, margin: '0 0 12px', color: 'var(--offblack)' }}
                    >
                      {article.title}
                    </h2>
                    {article.summary && (
                      <p style={{ fontSize: 14, color: 'var(--gunmetal)', lineHeight: 1.5, margin: 0 }}>
                        {article.summary}
                      </p>
                    )}
                  </a>

                  {/* Score + Fjern */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {article.relevance_score && (
                      <span style={{ fontWeight: 500, fontSize: 18, color: 'var(--offblack)', fontVariantNumeric: 'tabular-nums' }}>
                        {Number(article.relevance_score).toFixed(1)}
                        <small style={{ color: 'var(--gunmetal)', fontWeight: 400, fontSize: 12 }}> /10</small>
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SendToDigestButton
                        articleId={article.id}
                        initialQueued={queuedIds.has(article.id)}
                      />
                      <SaveButton articleId={article.id} initialSaved={true} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
