export interface SEOData {
  domainRating: number
  urlRating: number
  backlinks: number
  referringDomains: number
  dofollowPct: string
  organicKeywords: number
  estimatedTraffic: number
  topPages: { path: string; traffic: number; keywords: number }[]
  technical: { label: string; status: 'ok' | 'fail' }[]
}

export interface EngineData {
  engine: string
  ais: number
  mentionRate: number
  shareOfVoice: number
  top3RatePct: number
  queries: {
    query: string
    appears: boolean
    position: number | null
    mentions: number
    sentiment: 'positive' | 'neutral' | 'negative' | null
  }[]
}

export interface AIData {
  summary: {
    ais: number
    mentionRate: number
    shareOfVoice: number
    avgPosition: number
    top3RatePct: number
    sentimentPositivePct: number
    sentimentNeutralPct: number
    sentimentNegativePct: number
    dominantFraming: string
    aggregateStrengths: string[]
    aggregateWeaknesses: string[]
  }
  firstMentionShare: string
  engines: EngineData[]
}

export interface BenchmarkEntry {
  rank: number
  name: string
  domain: string
  mentions: number
  visibility: number
  firstMentionShare: number
  sentiment: 'positive' | 'neutral' | 'mixed'
  isTarget: boolean
  isCompetitor: boolean
}

export interface CompetitorSEO {
  name: string
  domain: string
  domainRating: number
  backlinks: number
  organicKeywords: number
  aiScore: number
  firstMentionShare: string
}

export interface AuditResult {
  brand: string
  category: string
  url: string
  seo: SEOData
  ai: AIData
  benchmark: BenchmarkEntry[]
  competitors: CompetitorSEO[]
  auditedAt: string
}

export interface QueryLadder {
  branded: QueryItem[]
  category: QueryItem[]
  comparison: QueryItem[]
  recommendation: QueryItem[]
  gaps: QueryItem[]
  contentPriorities: string
}

export interface QueryItem {
  query: string
  intent: string
  priority: 'high' | 'medium'
}

export interface AuditStatus {
  phase: 'seo' | 'ai' | 'complete' | 'error'
  seoData?: SEOData
  aiData?: AIData
  progress: number
  error?: string
}

export interface RunState {
  seoRunId: string | null
  aiRunId: string | null
  competitorRunIds: string[]
  brand: string
  category: string
  url: string
  competitors: string[]
  status: AuditStatus
  result?: AuditResult
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debugRaw?: Record<string, any>
}
