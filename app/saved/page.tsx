import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArticleCard from '@/app/components/ArticleCard'

type Category = 'ai_research' | 'ai_engineering' | 'ai_news' | 'marketing' | 'marketing_ai'

interface ArticleRow {
  id: string
  title: string
  url: string
  topic: 'ai' | 'marketing' | 'both' | null
  category: Category | null
  published_at: string | null
  summary: string | null
  short_summary: string | null
  relevance_score: number | null
  read_time_min: number | null
  sources: { name: string } | null
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

  // Hent artiklerne
  const { data: articlesRaw } = articleIds.length
    ? await supabase
        .from('articles')
        .select('id, title, url, topic, category, published_at, summary, short_summary, relevance_score, read_time_min, sources(name)')
        .in('id', articleIds)
    : { data: [] }

  const articles = (articlesRaw ?? []) as unknown as ArticleRow[]

  // Bevar rækkefølgen fra user_saves
  const sorted = articleIds
    .map(id => articles.find(a => a.id === id))
    .filter((a): a is ArticleRow => !!a)

  // Hent brugerens digest queue
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
          <p className="eyebrow m-0">{sorted.length} {sorted.length === 1 ? 'artikel' : 'artikler'} gemt</p>
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
            {sorted.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={i}
                isFirst={i === 0}
                initialSaved={true}
                initialQueued={queuedIds.has(article.id)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
