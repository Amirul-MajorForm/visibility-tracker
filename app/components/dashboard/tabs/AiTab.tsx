import { AIData } from '@/types/audit'
import Card from '@/app/components/ui/Card'
import Label from '@/app/components/ui/Label'
import ScoreBar from '@/app/components/ui/ScoreBar'
import SentimentPill from '@/app/components/ui/SentimentPill'

const ENGINE_ICONS: Record<string, string> = {
  chatgpt: '💬',
  perplexity: '🔍',
  gemini: '✨',
  copilot: '🤖',
  ai_overview: '🌐',
}

export default function AiTab({ ai }: { ai: AIData }) {
  const { summary, engines } = ai

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'AI Visibility Score', value: summary.ais + '/100' },
          { label: 'Mention Rate', value: summary.mentionRate + '%' },
          { label: 'Share of Voice', value: summary.shareOfVoice + '%' },
          { label: 'First Mention Share', value: ai.firstMentionShare },
          { label: 'Top 3 Rate', value: summary.top3RatePct + '%' },
        ].map(k => (
          <div key={k.label} className="card">
            <Label>{k.label}</Label>
            <div className="kpi-value" style={{ marginTop: 8 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Sentiment */}
      <Card>
        <Label>Sentiment Breakdown</Label>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Positive', value: summary.sentimentPositivePct, color: 'var(--positive)' },
            { label: 'Neutral', value: summary.sentimentNeutralPct, color: 'var(--text-muted)' },
            { label: 'Negative', value: summary.sentimentNegativePct, color: 'var(--danger)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: s.color }}>{s.value}%</span>
              </div>
              <ScoreBar value={s.value} color={s.color} />
            </div>
          ))}
        </div>
        {summary.dominantFraming && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface-raised)', borderRadius: 6 }}>
            <span className="section-label">Dominant Framing: </span>
            <span style={{ fontSize: '0.875rem' }}>{summary.dominantFraming}</span>
          </div>
        )}
      </Card>

      {/* Strengths & Weaknesses */}
      {(summary.aggregateStrengths?.length > 0 || summary.aggregateWeaknesses?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <Label>AI-Perceived Strengths</Label>
            <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summary.aggregateStrengths.map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--positive)', flexShrink: 0 }}>+</span>
                  {s}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <Label>AI-Perceived Weaknesses</Label>
            <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summary.aggregateWeaknesses.map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--danger)', flexShrink: 0 }}>−</span>
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Engine Summary Cards */}
      <div>
        <Label style={{ marginBottom: 16 }}>By Engine</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 12 }}>
          {engines.map(eng => (
            <Card key={eng.engine}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>{ENGINE_ICONS[eng.engine] || '🤖'}</span>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'capitalize' }}>{eng.engine}</span>
                </div>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent)' }}>{eng.ais}</span>
              </div>
              <ScoreBar value={eng.ais} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Appearances: <b style={{ color: 'var(--text-primary)' }}>{eng.queries.filter(q => q.appears).length}/{eng.queries.length}</b></span>
                <span>Top 3: <b style={{ color: 'var(--text-primary)' }}>{eng.top3RatePct}%</b></span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Per-engine query tables */}
      {engines.map(eng => (
        <Card key={eng.engine + '-table'} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{ENGINE_ICONS[eng.engine] || '🤖'}</span>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'capitalize' }}>{eng.engine} — Query Detail</span>
          </div>
          <div className="scrollable-table">
            <table>
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Appears</th>
                  <th>Rank</th>
                  <th>Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {eng.queries.map((q, i) => (
                  <tr key={i}>
                    <td style={{ maxWidth: 320 }}>{q.query}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        width: 8, height: 8, borderRadius: '50%',
                        background: q.appears ? 'var(--positive)' : 'var(--border)',
                      }} />
                    </td>
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                      {q.position ? `#${q.position}` : '—'}
                    </td>
                    <td><SentimentPill value={q.sentiment} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {eng.queries.filter(q => q.position === 1).length} first mentions · {eng.queries.filter(q => q.appears).length} total appearances out of {eng.queries.length} queries
          </div>
        </Card>
      ))}
    </div>
  )
}
