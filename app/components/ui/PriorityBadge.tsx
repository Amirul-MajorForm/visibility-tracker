export default function PriorityBadge({ priority }: { priority: 'high' | 'medium' }) {
  return (
    <span style={{
      fontSize: '0.65rem',
      fontFamily: 'Space Grotesk',
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: 4,
      background: priority === 'high' ? 'rgba(200,245,74,0.15)' : 'rgba(136,136,136,0.12)',
      color: priority === 'high' ? 'var(--accent)' : 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {priority}
    </span>
  )
}
