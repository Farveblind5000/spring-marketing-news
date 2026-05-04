'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface SaveButtonProps {
  articleId: string
  initialSaved: boolean
}

export default function SaveButton({ articleId, initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
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

    if (saved) {
      await supabase
        .from('user_saves')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', user.id)
      setSaved(false)
    } else {
      await supabase
        .from('user_saves')
        .insert({ article_id: articleId, user_id: user.id })
      setSaved(true)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Fjern fra gemte' : 'Gem artikel'}
      style={{
        background: 'none',
        border: 'none',
        cursor: loading ? 'default' : 'pointer',
        padding: 4,
        opacity: loading ? 0.4 : 1,
        transition: 'opacity 0.15s',
        display: 'flex',
        alignItems: 'center',
        color: saved ? 'var(--orange)' : 'rgba(72,72,72,0.35)',
        marginTop: 2,
      }}
    >
      {saved ? (
        // Filled bookmark
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" />
        </svg>
      ) : (
        // Outline bookmark
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" />
        </svg>
      )}
    </button>
  )
}
