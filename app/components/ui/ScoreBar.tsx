interface ScoreBarProps {
  value: number
  max?: number
  color?: string
}

export default function ScoreBar({ value, max = 100, color }: ScoreBarProps) {
  const pct = Math.min(100, (value / max) * 100)
  const barColor = color || (pct >= 60 ? 'var(--positive)' : pct >= 30 ? 'var(--warning)' : 'var(--danger)')
  return (
    <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, width: '100%' }}>
      <div
        style={{
          background: barColor,
          borderRadius: 4,
          height: '100%',
          width: `${pct}%`,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}
