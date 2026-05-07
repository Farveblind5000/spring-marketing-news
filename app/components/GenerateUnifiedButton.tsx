'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  hasUnified: boolean
}

export default function GenerateUnifiedButton({ hasUnified }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-unified', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ukendt fejl')
      router.refresh()
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-secondary px-6 py-3 text-[16px]"
        style={{ opacity: loading ? 0.65 : 1, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid rgba(72,72,72,0.4)',
              borderTopColor: 'var(--offblack)',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Samler...
          </span>
        ) : (
          hasUnified ? 'Gen-saml rapport' : 'Saml til rapport'
        )}
      </button>
      {error && (
        <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
