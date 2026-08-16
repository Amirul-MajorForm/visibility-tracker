'use client'

import { useState } from 'react'
import { BenchmarkEntry } from '@/types/audit'
import Label from '@/app/components/ui/Label'
import SentimentPill from '@/app/components/ui/SentimentPill'
import ScoreBar from '@/app/components/ui/ScoreBar'

export default function BenchmarkTab({ benchmark, brand }: { benchmark: BenchmarkEntry[]; brand: string }) {
  const [focused, setFocused] = useState<string[]>([])

  const nonTargets = benchmark.filter(b => !b.isTarget).map(b => b.name)

  const toggleFocus = (name: string) => {
    setFocused(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const anyFocused = focused.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Chip filter strip */}
      {nonTargets.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Label>Focus on:</Label>
          {nonTargets.map(name => {
            const isActive = focused.includes(name)
            return (
              <button
                key={name}
                onClick={() => toggleFocus(name)}
                style={{
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isActive ? 'rgba(200,245,74,0.12)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  borderRadius: 100,
                  padding: '5px 14px',
                  fontSize: '0.8rem',
                  fontFamily: 'Space Grotesk',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {name}
              </button>
            )
          })}
          {anyFocused && (
            <button
              onClick={() => setFocused([])}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontFamily: 'Space Grotesk',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.06em',
              }}
            >
              CLEAR
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="scrollable-table">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>Rank</th>
                <th>Brand</th>
                <th>Mentions</th>
                <th style={{ minWidth: 140 }}>Visibility</th>
                <th style={{ minWidth: 140 }}>First Mention Share</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {benchmark.map((entry, i) => {
                const isFocused = anyFocused && focused.includes(entry.name)
                const isDimmed = anyFocused && !entry.isTarget && !focused.includes(entry.name)
                return (
                  <tr
                    key={i}
                    style={{
                      opacity: isDimmed ? 0.3 : 1,
                      transition: 'opacity 0.2s',
                      borderLeft: entry.isTarget ? '3px solid var(--accent)' : undefined,
                      background: entry.isTarget ? 'rgba(200,245,74,0.04)' : undefined,
                    }}
                  >
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-muted)' }}>{entry.rank}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: entry.isTarget ? 'var(--accent)' : 'var(--surface-raised)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.75rem',
                          color: entry.isTarget ? '#0A0A0A' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}>
                          {entry.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {entry.name}
                            {entry.isTarget && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>(you)</span>}
                            {isFocused && (
                              <span style={{
                                fontSize: '0.6rem',
                                fontFamily: 'Space Grotesk',
                                fontWeight: 700,
                                background: 'rgba(200,245,74,0.15)',
                                color: 'var(--accent)',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}>FOCUSED</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{entry.mentions}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 80 }}><ScoreBar value={entry.visibility} /></div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.85rem' }}>{entry.visibility}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 60 }}><ScoreBar value={entry.firstMentionShare} color="var(--accent)" /></div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.85rem' }}>{entry.firstMentionShare}%</span>
                      </div>
                    </td>
                    <td><SentimentPill value={entry.sentiment} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span><b style={{ color: 'var(--text-primary)' }}>Mentions</b> — times brand appeared in AI responses</span>
          <span><b style={{ color: 'var(--text-primary)' }}>Visibility</b> — % of queries where brand was mentioned</span>
          <span><b style={{ color: 'var(--text-primary)' }}>First Mention Share</b> — % of appearances where brand was #1</span>
        </div>
      </div>
    </div>
  )
}
