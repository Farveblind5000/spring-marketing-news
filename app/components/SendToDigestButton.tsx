'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface SendToDigestButtonProps {
  articleId: string
  initialQueued: boolean
}

export default function SendToDigestButton({ articleId, initialQueued }: SendToDigestButtonProps) {
  const [queued, setQueued] = useState(initialQueued)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      setLoading(false)
      return
    }

    if (queued) {
      await supabase
        .from('user_digest_queue')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', user.id)
      setQueued(false)
    } else {
      await supabase
        .from('user_digest_queue')
        .insert({ article_id: articleId, user_id: user.id })
      setQueued(true)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={queued ? 'Fjern fra digest' : 'Send til digest'}
      style={{
        background: 'none',
        border: 'none',
        cursor: loading ? 'default' : 'pointer',
        padding: 4,
        opacity: loading ? 0.4 : 1,
        transition: 'opacity 0.15s',
        display: 'flex',
        alignItems: 'center',
        color: queued ? 'var(--orange)' : 'rgba(72,72,72,0.35)',
        marginTop: 2,
      }}
    >
      {queued ? (
        // Filled star — i digest queue
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.6 8.6 L22 9.5 L16.5 14.5 L18 22 L12 18.3 L6 22 L7.5 14.5 L2 9.5 L9.4 8.6 Z" />
        </svg>
      ) : (
        // Outline star — ikke i queue
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M12 2 L14.6 8.6 L22 9.5 L16.5 14.5 L18 22 L12 18.3 L6 22 L7.5 14.5 L2 9.5 L9.4 8.6 Z" />
        </svg>
      )}
    </button>
  )
}
