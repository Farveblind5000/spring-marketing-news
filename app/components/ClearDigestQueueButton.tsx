'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function ClearDigestQueueButton({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Hent aktuel count fra Supabase ved mount — fanger stjerner klikket efter page load
  useEffect(() => {
    const supabase = getSupabase()
    supabase
      .from('user_digest_queue')
      .select('article_id', { count: 'exact', head: true })
      .then(({ count: c }) => { if (c !== null) setCount(c) })
  }, [])

  async function clearAll(e: React.MouseEvent) {
    e.preventDefault()
    if (loading || count === 0) return
    setLoading(true)

    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_digest_queue')
        .delete()
        .eq('user_id', user.id)
    }

    setCount(0)
    setLoading(false)
    router.refresh()
  }

  const hasItems = count > 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 14px',
        marginBottom: 24,
        borderRadius: 8,
        background: hasItems ? 'rgba(255,55,0,0.06)' : 'rgba(72,72,72,0.04)',
        border: `1px solid ${hasItems ? 'rgba(255,55,0,0.18)' : 'rgba(72,72,72,0.10)'}`,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--offblack)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: hasItems ? 'var(--orange)' : 'rgba(72,72,72,0.35)', flexShrink: 0 }}>
          <path d="M12 2 L14.6 8.6 L22 9.5 L16.5 14.5 L18 22 L12 18.3 L6 22 L7.5 14.5 L2 9.5 L9.4 8.6 Z" />
        </svg>
        <span>
          {hasItems
            ? <>{count} {count === 1 ? 'artikel valgt' : 'artikler valgt'} til digest</>
            : 'Ingen artikler valgt til digest endnu'}
        </span>
      </div>

      {hasItems && (
        <button
          onClick={clearAll}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.4 : 1,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--orange)',
            textDecoration: 'underline',
            padding: 0,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Fjerner…' : 'Fjern alle'}
        </button>
      )}
    </div>
  )
}
