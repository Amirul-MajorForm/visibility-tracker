'use client'

import { useState, useEffect } from 'react'
import { AuditResult, QueryLadder, QueryItem } from '@/types/audit'
import Card from '@/app/components/ui/Card'
import Label from '@/app/components/ui/Label'
import PriorityBadge from '@/app/components/ui/PriorityBadge'

interface StrategyTabProps {
  auditResult: AuditResult
}

const SECTIONS: { key: keyof Omit<QueryLadder, 'contentPriorities'>; label: string; emoji: string; color: string }[] = [
  { key: 'branded', label: 'Branded Queries', emoji: '🏷️', color: 'var(--accent)' },
  { key: 'category', label: 'Category Queries', emoji: '📂', color: 'var(--positive)' },
  { key: 'comparison', label: 'Comparison Queries', emoji: '⚖️', color: 'var(--warning)' },
  { key: 'recommendation', label: 'Recommendation Intent', emoji: '⭐', color: '#60a5fa' },
  { key: 'gaps', label: 'Gap Opportunities', emoji: '🚀', color: 'var(--danger)' },
]

function QueryCard({ item }: { item: QueryItem }) {
  return (
    <div style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4 }}>{item.query}</span>
        <PriorityBadge priority={item.priority} />
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.intent}</p>
    </div>
  )
}

function QuerySection({ section, items }: { section: typeof SECTIONS[number]; items: QueryItem[] }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span>{section.emoji}</span>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.85rem', color: section.color }}>{section.label}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => <QueryCard key={i} item={item} />)}
      </div>
    </div>
  )
}

export default function StrategyTab({ auditResult }: StrategyTabProps) {
  const [ladder, setLadder] = useState<QueryLadder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditResult),
    })
      .then(r => r.json())
      .then(data => {
        setLadder(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to generate strategy. Please try again.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 16 }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Generating query ladder with Claude…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    )
  }

  if (!ladder) return null

  const leftSections = SECTIONS.filter(s => ['branded', 'comparison', 'gaps'].includes(s.key))
  const rightSections = SECTIONS.filter(s => ['category', 'recommendation'].includes(s.key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {leftSections.map(s => (
            <QuerySection key={s.key} section={s} items={ladder[s.key] as QueryItem[]} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {rightSections.map(s => (
            <QuerySection key={s.key} section={s} items={ladder[s.key] as QueryItem[]} />
          ))}
        </div>
      </div>

      {ladder.contentPriorities && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--accent)',
          borderRadius: 8,
          padding: '20px 24px',
        }}>
          <Label>Content Priorities</Label>
          <p style={{ marginTop: 10, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {ladder.contentPriorities}
          </p>
        </div>
      )}
    </div>
  )
}
