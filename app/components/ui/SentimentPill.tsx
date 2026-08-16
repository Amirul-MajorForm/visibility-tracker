type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed' | null

const colors: Record<string, { bg: string; color: string }> = {
  positive: { bg: 'rgba(74,222,128,0.12)', color: 'var(--positive)' },
  neutral: { bg: 'rgba(136,136,136,0.12)', color: 'var(--text-muted)' },
  negative: { bg: 'rgba(248,113,113,0.12)', color: 'var(--danger)' },
  mixed: { bg: 'rgba(251,191,36,0.12)', color: 'var(--warning)' },
}

export default function SentimentPill({ value }: { value: Sentiment }) {
  if (!value) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
  const c = colors[value] || colors.neutral
  return (
    <span style={{
      fontSize: '0.7rem',
      fontFamily: 'Space Grotesk',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 100,
      background: c.bg,
      color: c.color,
      textTransform: 'capitalize',
    }}>
      {value}
    </span>
  )
}
