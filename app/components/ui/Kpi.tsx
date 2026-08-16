import Label from './Label'

interface KpiProps {
  label: string
  value: string | number
  sub?: string
}

export default function Kpi({ label, value, sub }: KpiProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Label>{label}</Label>
      <div className="kpi-value">{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}
