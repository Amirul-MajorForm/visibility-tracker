'use client'

import { useState } from 'react'
import Nav from './components/Nav'
import InputForm from './components/InputForm'
import LoadingScreen from './components/LoadingScreen'
import DashboardHeader from './components/dashboard/Header'
import TabBar from './components/dashboard/TabBar'
import SeoTab from './components/dashboard/tabs/SeoTab'
import AiTab from './components/dashboard/tabs/AiTab'
import BenchmarkTab from './components/dashboard/tabs/BenchmarkTab'
import CompetitorsTab from './components/dashboard/tabs/CompetitorsTab'
import StrategyTab from './components/dashboard/tabs/StrategyTab'
import { AuditResult } from '@/types/audit'

type AppState = 'input' | 'loading' | 'dashboard'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('input')
  const [loadingPhase, setLoadingPhase] = useState<'seo' | 'ai' | 'complete' | 'error'>('seo')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [activeTab, setActiveTab] = useState('seo')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: { brand: string; category: string; url: string; competitors: string[]; competitorDomains: string[] }) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),  // includes competitorDomains
      })
      const { auditId } = await res.json()
      setAppState('loading')
      setSubmitting(false)
      pollStatus(auditId)
    } catch {
      setSubmitting(false)
      alert('Failed to start audit. Please try again.')
    }
  }

  const pollStatus = (auditId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit/status?id=${auditId}`)
        const data = await res.json()

        setLoadingPhase(data.phase)
        setLoadingProgress(data.progress)

        if (data.phase === 'complete' && data.result) {
          clearInterval(interval)
          setAuditResult(data.result)
          setAppState('dashboard')
        } else if (data.phase === 'error') {
          clearInterval(interval)
          setLoadingPhase('error')
          alert(data.error || 'Audit failed. Please try again.')
          setAppState('input')
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 5000)
  }

  const handleNewAudit = () => {
    setAppState('input')
    setAuditResult(null)
    setActiveTab('seo')
    setLoadingPhase('seo')
    setLoadingProgress(0)
  }

  return (
    <>
      <Nav onNewAudit={handleNewAudit} showNewAudit={appState === 'dashboard'} />

      {appState === 'input' && (
        <InputForm onSubmit={handleSubmit} loading={submitting} />
      )}

      {appState === 'loading' && (
        <LoadingScreen phase={loadingPhase} progress={loadingProgress} />
      )}

      {appState === 'dashboard' && auditResult && (
        <div>
          <DashboardHeader result={auditResult} />
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            hasCompetitors={auditResult.competitors.length > 0}
          />
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
            {activeTab === 'seo' && <SeoTab seo={auditResult.seo} url={auditResult.url} />}
            {activeTab === 'ai' && <AiTab ai={auditResult.ai} />}
            {activeTab === 'benchmark' && <BenchmarkTab benchmark={auditResult.benchmark} brand={auditResult.brand} />}
            {activeTab === 'competitors' && auditResult.competitors.length > 0 && (
              <CompetitorsTab competitors={auditResult.competitors} target={auditResult} />
            )}
            {activeTab === 'strategy' && <StrategyTab auditResult={auditResult} />}
          </div>
        </div>
      )}
    </>
  )
}
