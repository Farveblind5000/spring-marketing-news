'use client'

// Undgår statisk prerender — Supabase kræver runtime env vars
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Oprettes kun client-side ved submit — aldrig under SSR
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Forkert email eller adgangskode.')
      setLoading(false)
      return
    }

    router.push('/digest')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', minHeight: '100vh' }}>

      {/* ── FORM ── */}
      <section
        style={{
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 56px',
        }}
      >
        {/* Logo */}
        <div className="flex items-baseline gap-[10px] text-[22px] font-bold" style={{ color: 'var(--offblack)' }}>
          <Link href="/">
            Spring<b style={{ color: 'var(--orange)' }}>CC</b>
          </Link>
          <span
            className="text-[12px] font-medium uppercase border-l pl-[10px]"
            style={{ color: 'var(--gunmetal)', borderColor: 'rgba(72,72,72,0.3)' }}
          >
            News Intel
          </span>
        </div>

        {/* Form */}
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '60px 0' }}>
          <p className="eyebrow" style={{ marginBottom: 18 }}>Log ind</p>
          <h1 style={{ fontWeight: 400, fontSize: 56, lineHeight: 1, margin: '0 0 12px' }}>
            Velkommen<br />tilbage.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--gunmetal)', lineHeight: 1.45, margin: '0 0 40px', maxWidth: 380 }}>
            Din morgenbriefing venter — sammen med ugens gemte artikler og det AI-resumé du faldt i søvn fra.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="email"
                className="eyebrow"
                style={{ display: 'block', marginBottom: 8 }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dig@firma.dk"
                required
                style={{
                  width: '100%',
                  fontFamily: 'inherit',
                  fontSize: 16,
                  padding: '16px 20px',
                  borderRadius: 40,
                  border: `1px solid var(--neutral)`,
                  background: 'var(--bg)',
                  color: 'var(--offblack)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
                <label htmlFor="password" className="eyebrow">Adgangskode</label>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    color: 'var(--gunmetal)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Glemt?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    fontFamily: 'inherit',
                    fontSize: 16,
                    padding: '16px 60px 16px 20px',
                    borderRadius: 40,
                    border: `1px solid var(--neutral)`,
                    background: 'var(--bg)',
                    color: 'var(--offblack)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 14,
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 0,
                    color: 'var(--gunmetal)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {showPwd ? 'Skjul' : 'Vis'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p style={{ color: 'var(--orange)', fontSize: 14, margin: '8px 0 0' }}>{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: 24,
                padding: '18px 28px',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Logger ind…' : 'Log ind'}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ── BRAND STATEMENT ── */}
      <aside
        style={{
          background: 'var(--sand)',
          color: 'var(--offblack)',
          padding: '40px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <p className="eyebrow" style={{ margin: '0 0 24px' }}>Spring Marketing News</p>
          <h2 style={{ fontWeight: 400, fontSize: 56, lineHeight: 1, margin: '0 0 28px' }}>
            Signalet i støjen, kurateret hver morgen — så du kan bruge eftermiddagen på at handle på det.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.45, color: 'var(--gunmetal)', margin: 0 }}>
            Vi læser AI- og marketing-verdenen så du ikke behøver. Hver artikel bærer en relevans-score baseret på hvad dit team faktisk arbejder med.
          </p>
        </div>
      </aside>

    </div>
  )
}
