'use client'

import { useState } from 'react'

interface InputFormProps {
  onSubmit: (data: { brand: string; category: string; url: string; competitors: string[]; competitorDomains: string[] }) => void
  loading?: boolean
}

export default function InputForm({ onSubmit, loading }: InputFormProps) {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [url, setUrl] = useState('')
  const [comp1Name, setComp1Name] = useState('')
  const [comp1Domain, setComp1Domain] = useState('')
  const [comp2Name, setComp2Name] = useState('')
  const [comp2Domain, setComp2Domain] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalised = url.startsWith('http') ? url : `https://${url}`
    const competitors = [comp1Name, comp2Name].filter(Boolean)
    const competitorDomains = [comp1Domain, comp2Domain].filter(Boolean).map(d =>
      d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
    )
    onSubmit({ brand, category, url: normalised, competitors, competitorDomains })
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px' }}>
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
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Oatside" required />
        </div>

        <div>
          <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Category *</label>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. oat milk Southeast Asia" required />
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
          <div className="section-label" style={{ marginBottom: 4 }}>Competitors (optional · max 2)</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Enter the brand name and their website domain for accurate SEO comparison.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: comp1Name, setName: setComp1Name, domain: comp1Domain, setDomain: setComp1Domain, n: 1 },
              { name: comp2Name, setName: setComp2Name, domain: comp2Domain, setDomain: setComp2Domain, n: 2 },
            ].map(({ name, setName, domain, setDomain, n }) => (
              <div key={n} style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Brand name</div>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={`e.g. ${n === 1 ? 'Oatly' : 'Minor Figures'}`}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Domain</div>
                  <input
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder={`e.g. ${n === 1 ? 'oatly.com' : 'minorfigures.com'}`}
                  />
                </div>
              </div>
            ))}
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
