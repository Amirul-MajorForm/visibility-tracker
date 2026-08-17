'use client'

const TABS = [
  { id: 'seo', label: 'SEO' },
  { id: 'ai', label: 'AI Visibility' },
  { id: 'benchmark', label: 'Category Benchmark' },
  { id: 'strategy', label: 'Query Ladder' },
]

interface TabBarProps {
  active: string
  onChange: (tab: string) => void
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      gap: 0,
      overflowX: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', width: '100%' }}>
        {TABS.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                padding: '14px 20px',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'Space Grotesk',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
