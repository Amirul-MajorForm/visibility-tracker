import { CompetitorSEO, AuditResult } from '@/types/audit'
import Label from '@/app/components/ui/Label'

interface CompetitorsTabProps {
  competitors: CompetitorSEO[]
  target: AuditResult
}

function Delta({ target, comp, higher = 'bad' }: { target: number; comp: number; higher?: 'good' | 'bad' }) {
  if (comp > target) {
    return <span style={{ color: higher === 'bad' ? 'var(--danger)' : 'var(--positive)', fontWeight: 600 }}>{comp.toLocaleString()}</span>
  }
  return <span style={{ color: higher === 'bad' ? 'var(--positive)' : 'var(--danger)', fontWeight: 600 }}>{comp.toLocaleString()}</span>
}

export default function CompetitorsTab({ competitors, target }: CompetitorsTabProps) {
  const rows = [
    {
      name: target.brand,
      domain: new URL(target.url).hostname,
      domainRating: target.seo.domainRating,
      backlinks: target.seo.backlinks,
      organicKeywords: target.seo.organicKeywords,
      aiScore: target.ai.summary.ais,
      firstMentionShare: target.ai.firstMentionShare,
      isTarget: true,
    },
    ...competitors.map(c => ({ ...c, isTarget: false })),
  ]

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <Label>Competitor Comparison</Label>
        </div>
        <div className="scrollable-table">
          <table>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Domain Rating</th>
                <th>Backlinks</th>
                <th>Keywords</th>
                <th>AI Score</th>
                <th>First Mention Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderLeft: row.isTarget ? '3px solid var(--accent)' : undefined,
                    background: row.isTarget ? 'rgba(200,245,74,0.04)' : undefined,
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: row.isTarget ? 'var(--accent)' : 'var(--surface-raised)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.75rem',
                        color: row.isTarget ? '#0A0A0A' : 'var(--text-muted)',
                      }}>
                        {row.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{row.name} {row.isTarget && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(you)</span>}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.domain}</div>
                      </div>
                    </div>
                  </td>
                  {row.isTarget ? (
                    <>
                      <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{row.domainRating}</td>
                      <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{row.backlinks.toLocaleString()}</td>
                      <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{row.organicKeywords.toLocaleString()}</td>
                      <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{row.aiScore}</td>
                      <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{row.firstMentionShare}</td>
                    </>
                  ) : (
                    <>
                      <td><Delta target={target.seo.domainRating} comp={row.domainRating} higher="bad" /></td>
                      <td><Delta target={target.seo.backlinks} comp={row.backlinks} higher="bad" /></td>
                      <td><Delta target={target.seo.organicKeywords} comp={row.organicKeywords} higher="bad" /></td>
                      <td><Delta target={target.ai.summary.ais} comp={row.aiScore} higher="bad" /></td>
                      <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-muted)' }}>{row.firstMentionShare}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--positive)' }}>Green</span> = competitor lower than you &nbsp;·&nbsp; <span style={{ color: 'var(--danger)' }}>Red</span> = competitor higher than you
        </div>
      </div>
    </div>
  )
}
