interface StatusRowProps {
  label: string
  status: 'ok' | 'fail'
}

export default function StatusRow({ label, status }: StatusRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: status === 'ok' ? 'var(--positive)' : 'var(--danger)',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: '0.875rem' }}>{label}</span>
      </div>
      <span style={{
        fontSize: '0.7rem',
        fontFamily: 'Space Grotesk',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 4,
        background: status === 'ok' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
        color: status === 'ok' ? 'var(--positive)' : 'var(--danger)',
      }}>
        {status === 'ok' ? 'PASS' : 'FIX'}
      </span>
    </div>
  )
}
