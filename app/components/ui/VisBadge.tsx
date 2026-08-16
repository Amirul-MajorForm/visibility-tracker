export default function VisBadge({ score }: { score: number }) {
  const color = score >= 60 ? 'var(--positive)' : score >= 30 ? 'var(--warning)' : 'var(--danger)'
  return (
    <span style={{
      fontFamily: 'Space Grotesk',
      fontWeight: 700,
      fontSize: '0.9rem',
      color,
    }}>
      {score}
    </span>
  )
}
