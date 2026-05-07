'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  savedCount: number
}

export default function GenerateDigestButton({ savedCount }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-digest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ukendt fejl')
      router.refresh()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary px-6 py-3 text-[16px]"
        style={{ opacity: loading ? 0.65 : 1, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: 'white',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Genererer...
          </span>
        ) : (
          `Generer digest af ${savedCount} ${savedCount === 1 ? 'valgt artikel' : 'valgte artikler'}`
        )}
      </button>
      {error && (
        <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>
          {error.replace('Error: ', '')}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
