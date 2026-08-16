import { AuditResult } from '@/types/audit'

interface HeaderProps {
  result: AuditResult
}

export default function DashboardHeader({ result }: HeaderProps) {
  const chips = [
    { label: 'DR', value: String(result.seo.domainRating) },
    { label: 'AI Score', value: String(result.ai.summary.ais) },
    { label: 'Mention Rate', value: result.ai.summary.mentionRate + '%' },
    { label: 'SOV', value: result.ai.summary.shareOfVoice + '%' },
  ]

  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '20px 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Audit Complete · {new Date(result.auditedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.5rem', marginBottom: 4 }}>{result.brand}</h1>
            <div style={{ display: 'flex', gap: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span>{result.category}</span>
              <span>·</span>
              <a href={result.url} target="_blank" rel="noopener" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{result.url}</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {chips.map(chip => (
              <div key={chip.label} style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 14px',
                textAlign: 'center',
              }}>
                <div className="section-label" style={{ marginBottom: 4 }}>{chip.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{chip.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
