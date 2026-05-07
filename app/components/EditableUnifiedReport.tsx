'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'

// Auto-resize textarea — vokser til at passe indholdet, ingen scroll
function AutoTextarea({
  value,
  onChange,
  disabled,
  style,
  minHeight = 60,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  style?: React.CSSProperties
  minHeight?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`
  }, [value, minHeight])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ ...style, overflow: 'hidden', resize: 'none' }}
    />
  )
}

interface UnifiedContent {
  theme: string
  context: string
  insights: string[]
  trends: string
  sources: string
}

interface Props {
  unified: UnifiedContent
}

const COLOR_ORANGE = 'var(--orange)'
const COLOR_OFFBLACK = 'var(--offblack)'
const COLOR_GUNMETAL = 'var(--gunmetal)'

export default function EditableUnifiedReport({ unified }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [edited, setEdited] = useState<UnifiedContent>(unified)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function startEdit() {
    setEdited({ ...unified, insights: [...unified.insights] })
    setError(null)
    setMode('edit')
  }

  function cancel() {
    setEdited(unified)
    setError(null)
    setMode('view')
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const cleaned = {
        ...edited,
        insights: edited.insights.map(i => i.trim()).filter(Boolean),
      }
      const res = await fetch('/api/update-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ukendt fejl')
      setMode('view')
      router.refresh()
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
    } finally {
      setSaving(false)
    }
  }

  function updateInsight(idx: number, value: string) {
    setEdited(prev => {
      const next = [...prev.insights]
      next[idx] = value
      return { ...prev, insights: next }
    })
  }

  function addInsight() {
    setEdited(prev => ({ ...prev, insights: [...prev.insights, ''] }))
  }

  function removeInsight(idx: number) {
    setEdited(prev => ({
      ...prev,
      insights: prev.insights.filter((_, i) => i !== idx),
    }))
  }

  // ── EDIT MODE ────────────────────────────────────────────────
  if (mode === 'edit') {
    return (
      <section style={{
        background: 'var(--white)',
        border: '1px solid rgba(255,55,0,0.5)',
        borderRadius: 16,
        padding: '32px 36px',
        marginBottom: 56,
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <p className="eyebrow m-0" style={{ fontSize: 11 }}>📝 Redigerer rapport</p>
        </div>

        {/* Theme */}
        <FieldLabel>Theme</FieldLabel>
        <input
          type="text"
          value={edited.theme}
          onChange={e => setEdited(prev => ({ ...prev, theme: e.target.value }))}
          style={inputStyle({ fontSize: 22, fontWeight: 500 })}
          disabled={saving}
        />

        {/* Context */}
        <FieldLabel>Context</FieldLabel>
        <AutoTextarea
          value={edited.context}
          onChange={e => setEdited(prev => ({ ...prev, context: e.target.value }))}
          style={inputStyle({ fontSize: 14 })}
          disabled={saving}
          minHeight={80}
        />

        {/* Insights */}
        <FieldLabel>Hovedindsigter</FieldLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {edited.insights.map((insight, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 28px', gap: 10, alignItems: 'start' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: COLOR_ORANGE, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 6,
              }}>
                {i + 1}
              </div>
              <AutoTextarea
                value={insight}
                onChange={e => updateInsight(i, e.target.value)}
                style={inputStyle({ fontSize: 14, marginBottom: 0 })}
                disabled={saving}
                minHeight={48}
              />
              <button
                onClick={() => removeInsight(i)}
                disabled={saving}
                title="Fjern"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: COLOR_GUNMETAL, fontSize: 18, padding: 0,
                  marginTop: 6, opacity: 0.5,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addInsight}
          disabled={saving}
          style={{
            background: 'transparent',
            border: '1px dashed rgba(72,72,72,0.3)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            color: COLOR_GUNMETAL,
            cursor: 'pointer',
            marginBottom: 24,
            fontFamily: 'inherit',
          }}
        >
          + Tilføj indsigt
        </button>

        {/* Trends */}
        <FieldLabel>Tendenser</FieldLabel>
        <AutoTextarea
          value={edited.trends}
          onChange={e => setEdited(prev => ({ ...prev, trends: e.target.value }))}
          style={inputStyle({ fontSize: 14 })}
          disabled={saving}
          minHeight={70}
        />

        {/* Sources */}
        <FieldLabel>Kilder</FieldLabel>
        <input
          type="text"
          value={edited.sources}
          onChange={e => setEdited(prev => ({ ...prev, sources: e.target.value }))}
          placeholder="TechCrunch AI, HubSpot Marketing, ..."
          style={inputStyle({ fontSize: 13 })}
          disabled={saving}
        />

        {/* Error */}
        {error && (
          <p style={{ fontSize: 13, color: '#c0392b', margin: '8px 0 16px' }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button
            onClick={cancel}
            disabled={saving}
            className="btn-secondary px-6 py-3 text-[15px]"
          >
            Annuller
          </button>
          <button
            onClick={save}
            disabled={saving || !edited.theme.trim()}
            className="btn-primary px-6 py-3 text-[15px]"
            style={{ opacity: saving || !edited.theme.trim() ? 0.65 : 1 }}
          >
            {saving ? 'Gemmer...' : 'Gem ændringer'}
          </button>
        </div>
      </section>
    )
  }

  // ── VIEW MODE ────────────────────────────────────────────────
  return (
    <section style={{
      background: 'var(--white)',
      border: '1px solid rgba(255,55,0,0.3)',
      borderRadius: 16,
      padding: '32px 36px',
      marginBottom: 56,
      position: 'relative',
    }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <p className="eyebrow m-0" style={{ fontSize: 11 }}>📋 Samlet rapport</p>
        <button
          onClick={startEdit}
          title="Rediger rapport"
          style={{
            background: 'transparent',
            border: '1px solid rgba(72,72,72,0.18)',
            borderRadius: 60,
            padding: '6px 14px',
            fontSize: 12,
            color: COLOR_OFFBLACK,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✏️ Rediger
        </button>
      </div>

      <h2 style={{ fontWeight: 500, fontSize: 24, lineHeight: 1.3, color: COLOR_OFFBLACK, margin: '0 0 24px' }}>
        {unified.theme}
      </h2>

      {unified.context && (
        <p style={{ fontSize: 15, lineHeight: 1.7, color: COLOR_OFFBLACK, margin: '0 0 28px' }}>
          {unified.context}
        </p>
      )}

      {unified.insights.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p className="eyebrow m-0" style={{ marginBottom: 14, fontSize: 11 }}>Hovedindsigter</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {unified.insights.map((insight, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 12, alignItems: 'start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: COLOR_ORANGE, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: COLOR_OFFBLACK, margin: 0 }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {unified.trends && (
        <div style={{
          background: 'rgba(255,55,0,0.04)',
          borderLeft: '2px solid var(--orange)',
          padding: '14px 18px',
          borderRadius: '0 8px 8px 0',
          marginBottom: 18,
        }}>
          <p className="eyebrow m-0" style={{ marginBottom: 6, fontSize: 11 }}>Tendenser</p>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: COLOR_OFFBLACK, margin: 0 }}>
            {unified.trends}
          </p>
        </div>
      )}

      {unified.sources && (
        <p style={{ fontSize: 12, color: COLOR_GUNMETAL, margin: '14px 0 0', fontStyle: 'italic' }}>
          Kilder: {unified.sources}
        </p>
      )}
    </section>
  )
}

// ── helpers ───────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow m-0" style={{ marginBottom: 8, fontSize: 10 }}>
      {children}
    </p>
  )
}

function inputStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--offblack)',
    background: 'var(--bg)',
    border: '1px solid rgba(72,72,72,0.18)',
    borderRadius: 8,
    outline: 'none',
    marginBottom: 20,
    lineHeight: 1.5,
    ...extra,
  }
}
