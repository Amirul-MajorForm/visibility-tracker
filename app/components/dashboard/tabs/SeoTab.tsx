import { SEOData } from '@/types/audit'
import Kpi from '@/app/components/ui/Kpi'
import StatusRow from '@/app/components/ui/StatusRow'
import Label from '@/app/components/ui/Label'

export default function SeoTab({ seo, url }: { seo: SEOData; url: string }) {
  const passCount = seo.technical.filter(t => t.status === 'ok').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Kpi label="Domain Rating" value={seo.domainRating} />
        <Kpi
          label="Total Backlinks"
          value={seo.backlinks.toLocaleString()}
          sub={`${seo.dofollowPct} dofollow · ${seo.referringDomains.toLocaleString()} referring domains`}
        />
        <Kpi
          label="Organic Keywords"
          value={seo.organicKeywords.toLocaleString()}
          sub={`~${seo.estimatedTraffic.toLocaleString()} est. monthly visits`}
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top Pages */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <Label>Top Pages</Label>
          </div>
          <div className="scrollable-table">
            <table>
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Traffic</th>
                  <th>Keywords</th>
                </tr>
              </thead>
              <tbody>
                {seo.topPages.length === 0 ? (
                  <tr><td colSpan={3} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No data</td></tr>
                ) : seo.topPages.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>{p.path}</td>
                    <td>{p.traffic.toLocaleString()}</td>
                    <td>{p.keywords.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technical Health */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Label>Technical Health</Label>
            <span style={{
              fontFamily: 'Space Grotesk',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: passCount === seo.technical.length ? 'var(--positive)' : 'var(--warning)',
            }}>
              {passCount}/{seo.technical.length} passing
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <a
              href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener"
              style={{
                fontSize: '0.75rem',
                fontFamily: 'Space Grotesk',
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                background: 'var(--surface-raised)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              ↗ PageSpeed Insights
            </a>
            <a
              href={`https://search.google.com/search-console`}
              target="_blank"
              rel="noopener"
              style={{
                fontSize: '0.75rem',
                fontFamily: 'Space Grotesk',
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                background: 'var(--surface-raised)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              ↗ Search Console
            </a>
          </div>
          <div>
            {seo.technical.map((item, i) => (
              <StatusRow key={i} label={item.label} status={item.status} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
