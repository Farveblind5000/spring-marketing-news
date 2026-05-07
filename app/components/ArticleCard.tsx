'use client'

import { useState } from 'react'
import SaveButton from './SaveButton'
import SendToDigestButton from './SendToDigestButton'

interface ArticleCardProps {
  article: {
    id: string
    title: string
    url: string
    topic: string | null
    published_at: string | null
    summary: string | null
    relevance_score: number | null
    read_time_min: number | null
    sources: { name: string } | null
    short_summary?: string | null
  }
  index: number
  isFirst: boolean
  initialSaved: boolean
  initialQueued: boolean
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export default function ArticleCard({
  article,
  index,
  isFirst,
  initialSaved,
  initialQueued,
}: ArticleCardProps) {
  const [shortSummary, setShortSummary] = useState<string | null>(article.short_summary ?? null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggleSummary() {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (shortSummary || loading) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/short-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ukendt fejl')
      setShortSummary(data.summary)
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const sourceName = article.sources?.name ?? ''
  const topic = article.topic as 'ai' | 'marketing' | 'both'
  const allLines = shortSummary?.split('\n').filter(Boolean) ?? []
  const description = allLines[0] ?? ''
  const bullets = allLines.slice(1)

  return (
    <div style={{ borderTop: `1px solid rgba(72,72,72,${isFirst ? '0.18' : '0.12'})` }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr auto',
          gap: 28,
          padding: '24px 0',
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
          — {String(index + 1).padStart(2, '0')}
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

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Kort opsummering knap */}
            <button
              onClick={toggleSummary}
              title={expanded ? 'Skjul kort opsummering' : 'Vis kort opsummering'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: expanded || shortSummary ? 'var(--orange)' : 'rgba(72,72,72,0.35)',
                marginTop: 2,
                opacity: loading ? 0.4 : 1,
              }}
              disabled={loading}
            >
              {/* Lightning bolt SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill={expanded || shortSummary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M13 2 L4 14 H11 L10 22 L20 10 H13 Z" />
              </svg>
            </button>
            <SendToDigestButton articleId={article.id} initialQueued={initialQueued} />
            <SaveButton articleId={article.id} initialSaved={initialSaved} />
          </div>
        </div>
      </div>

      {/* Expandable kort opsummering */}
      {expanded && (
        <div
          style={{
            marginLeft: 92,
            marginRight: 0,
            padding: '16px 22px',
            background: 'rgba(255,55,0,0.04)',
            borderLeft: '2px solid var(--orange)',
            borderRadius: '0 8px 8px 0',
            marginBottom: 24,
            marginTop: -8,
          }}
        >
          <p className="eyebrow m-0" style={{ marginBottom: 10, fontSize: 11 }}>
            ⚡ Kort opsummering
          </p>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--gunmetal)', margin: 0, fontStyle: 'italic' }}>
              Læser artiklen og opsummerer...
            </p>
          ) : error ? (
            <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>
          ) : description || bullets.length > 0 ? (
            <>
              {description && (
                <p style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--offblack)',
                  margin: bullets.length > 0 ? '0 0 12px' : 0,
                }}>
                  {description}
                </p>
              )}
              {bullets.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
                  {bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--offblack)', marginBottom: 4 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--gunmetal)', margin: 0 }}>Intet indhold.</p>
          )}
        </div>
      )}
    </div>
  )
}
