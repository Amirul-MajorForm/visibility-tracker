'use client'

interface LoadingScreenProps {
  phase: 'seo' | 'ai' | 'complete' | 'error'
  progress: number
}

const phases = [
  { key: 'seo-fetch', label: 'Fetching domain authority…', phase: 'seo' },
  { key: 'seo-backlinks', label: 'Scraping backlink profile…', phase: 'seo' },
  { key: 'seo-tech', label: 'Running technical checks…', phase: 'seo' },
  { key: 'ai', label: 'Probing AI engines (this takes 8–12 min)…', phase: 'ai' },
  { key: 'processing', label: 'Processing results…', phase: 'complete' },
]

function getPhaseIndex(phase: string, progress: number): number {
  if (phase === 'seo') return Math.min(2, Math.floor(progress / 33))
  if (phase === 'ai') return 3
  if (phase === 'complete') return 4
  return 0
}

export default function LoadingScreen({ phase, progress }: LoadingScreenProps) {
  const currentIndex = getPhaseIndex(phase, progress)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 56px)',
      padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            margin: '0 auto 24px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.3rem', marginBottom: 8 }}>
            Running audit…
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {phase === 'ai' ? 'Querying ChatGPT, Perplexity, Gemini & Copilot' : 'Analysing domain signals'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {phases.map((p, i) => {
            const done = i < currentIndex
            const active = i === currentIndex
            const future = i > currentIndex
            return (
              <div key={p.key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: future ? 0.35 : 1,
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done ? 'var(--accent)' : active ? 'transparent' : 'var(--border)',
                  border: active ? '2px solid var(--accent)' : 'none',
                  animation: active ? 'pulse 1.4s ease-in-out infinite' : 'none',
                }}>
                  {done && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5L4.5 8L9 3" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: done ? 'var(--text-primary)' : active ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {p.label}
                </span>
              </div>
            )
          })}
        </div>

        {phase === 'ai' && (
          <div style={{
            marginTop: 32,
            padding: '16px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            AI visibility checks run across ChatGPT, Perplexity, Gemini, and Copilot. This step takes 8–12 minutes — grab a coffee.
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  )
}
