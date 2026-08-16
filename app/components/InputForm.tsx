'use client'

import { useState } from 'react'

interface InputFormProps {
  onSubmit: (data: { brand: string; category: string; url: string; competitors: string[] }) => void
  loading?: boolean
}

export default function InputForm({ onSubmit, loading }: InputFormProps) {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [url, setUrl] = useState('')
  const [comp1, setComp1] = useState('')
  const [comp2, setComp2] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const competitors = [comp1, comp2].filter(Boolean)
    const normalised = url.startsWith('http') ? url : `https://${url}`
    onSubmit({ brand, category, url: normalised, competitors })
  }

  return (
    <div style={{
      maxWidth: 560,
      margin: '0 auto',
      padding: '60px 24px',
    }}>
      <div style={{ marginBottom: 40 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>SEO + AI Visibility Audit</div>
        <h1 style={{
          fontFamily: 'Space Grotesk',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          marginBottom: 12,
        }}>
          Audit a brand's visibility
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Enter the brand details below. We'll analyse domain authority, backlinks, and how AI engines perceive the brand across ChatGPT, Perplexity, Gemini, and Copilot.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Brand Name *</label>
          <input
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder="e.g. Oatside"
            required
          />
        </div>

        <div>
          <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Category *</label>
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. oat milk Southeast Asia"
            required
          />
        </div>

        <div>
          <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Homepage URL *</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="e.g. oatside.com or https://oatside.com"
            required
          />
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '20px 24px',
        }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Competitors (optional · max 2)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={comp1}
              onChange={e => setComp1(e.target.value)}
              placeholder="Competitor 1 (e.g. Oat ly)"
            />
            <input
              value={comp2}
              onChange={e => setComp2(e.target.value)}
              placeholder="Competitor 2 (e.g. Minor Figures)"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--accent)',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: 6,
            padding: '14px 24px',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginTop: 8,
          }}
        >
          {loading ? 'Starting audit…' : 'Run Audit →'}
        </button>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          AI visibility checks take 8–12 minutes. SEO data is usually ready in under 2 minutes.
        </p>
      </form>
    </div>
  )
}
