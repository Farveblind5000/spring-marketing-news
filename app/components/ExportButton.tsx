'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  defaultRecipient: string
}

type Mode = 'closed' | 'menu' | 'email'

export default function ExportButton({ defaultRecipient }: Props) {
  const [mode, setMode] = useState<Mode>('closed')
  const [recipient, setRecipient] = useState(defaultRecipient)
  const [loading, setLoading] = useState<'pdf' | 'email' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Luk dropdown ved klik udenfor
  useEffect(() => {
    if (mode === 'closed') return
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMode('closed')
        setError(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [mode])

  async function downloadPdf() {
    setLoading('pdf')
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/export-pdf', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Ukendt fejl')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('Content-Disposition') ?? ''
      const filenameMatch = cd.match(/filename="([^"]+)"/)
      a.download = filenameMatch?.[1] ?? 'spring-marketing-news.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMode('closed')
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
    } finally {
      setLoading(null)
    }
  }

  async function sendEmail() {
    if (!recipient.includes('@')) {
      setError('Ugyldig email-adresse')
      return
    }
    setLoading('email')
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/export-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ukendt fejl')
      setSuccess(`Sendt til ${recipient}`)
      setTimeout(() => setMode('closed'), 2000)
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => { setMode(mode === 'closed' ? 'menu' : 'closed'); setError(null); setSuccess(null) }}
        className="btn-secondary px-6 py-3 text-[16px]"
        style={{ cursor: 'pointer' }}
      >
        Eksporter ▾
      </button>

      {mode !== 'closed' && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--white)',
            border: '1px solid rgba(72,72,72,0.18)',
            borderRadius: 12,
            padding: 8,
            minWidth: 280,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          {mode === 'menu' && (
            <>
              <button
                onClick={downloadPdf}
                disabled={loading !== null}
                style={menuItemStyle(loading === 'pdf')}
              >
                <span style={{ fontSize: 18 }}>📄</span>
                <span>{loading === 'pdf' ? 'Genererer PDF...' : 'Download som PDF'}</span>
              </button>
              <button
                onClick={() => { setMode('email'); setError(null) }}
                disabled={loading !== null}
                style={menuItemStyle(false)}
              >
                <span style={{ fontSize: 18 }}>✉️</span>
                <span>Send som email</span>
              </button>
            </>
          )}

          {mode === 'email' && (
            <div style={{ padding: 8 }}>
              <p className="eyebrow m-0" style={{ marginBottom: 10, fontSize: 11 }}>Modtager</p>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="email@example.com"
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 14,
                  border: '1px solid rgba(72,72,72,0.25)',
                  borderRadius: 8,
                  marginBottom: 10,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') sendEmail() }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setMode('menu'); setError(null) }}
                  disabled={loading !== null}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: 13 }}
                >
                  Tilbage
                </button>
                <button
                  onClick={sendEmail}
                  disabled={loading !== null}
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: 13, opacity: loading === 'email' ? 0.65 : 1 }}
                >
                  {loading === 'email' ? 'Sender...' : 'Send'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p style={{ fontSize: 12, color: '#c0392b', margin: '8px 8px 0', lineHeight: 1.4 }}>{error}</p>
          )}
          {success && (
            <p style={{ fontSize: 12, color: '#27ae60', margin: '8px 8px 0', lineHeight: 1.4 }}>✓ {success}</p>
          )}
        </div>
      )}
    </div>
  )
}

function menuItemStyle(isLoading: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 14px',
    background: isLoading ? 'rgba(255,55,0,0.08)' : 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: 'var(--offblack)',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  }
}
