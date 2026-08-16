import { SEOData, AIData, BenchmarkEntry, CompetitorSEO, EngineData } from '@/types/audit'

export function extractDomain(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').split('/')[0]
}

// Handle both camelCase and snake_case field names from the Ahrefs actor
function pick(item: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }
  return undefined
}

export function findItemByDomain(items: unknown[], domain: string): unknown[] {
  const needle = domain.toLowerCase().replace(/^www\./, '')
  return items.filter(item => {
    const i = item as Record<string, unknown>
    const candidates = [
      String(i.domain || ''),
      String(i.url || ''),
      String(i.target || ''),
      String(i.name || ''),
    ]
    return candidates.some(c => c.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').startsWith(needle))
  })
}

export function parseSEOData(items: unknown[], technical: { label: string; status: 'ok' | 'fail' }[]): SEOData {
  const item = (Array.isArray(items) && items[0]) ? items[0] as Record<string, unknown> : {}

  const backlinks = Number(pick(item, 'backlinks', 'total_backlinks', 'totalBacklinks')) || 0
  const dofollowBacklinks = Number(pick(item, 'dofollowBacklinks', 'dofollow_backlinks', 'doFollowBacklinks')) || 0
  const dofollowPct = backlinks > 0 ? Math.round((dofollowBacklinks / backlinks) * 100) + '%' : '0%'

  const topPages = (pick(item, 'topPages', 'top_pages') as { path: string; traffic: number; keywords: number }[]) || []

  return {
    domainRating: Number(pick(item, 'domainRating', 'domain_rating', 'dr')) || 0,
    urlRating: Number(pick(item, 'urlRating', 'url_rating', 'ur')) || 0,
    backlinks,
    referringDomains: Number(pick(item, 'referringDomains', 'referring_domains', 'refdomains')) || 0,
    dofollowPct,
    organicKeywords: Number(pick(item, 'organicKeywords', 'organic_keywords', 'keywords')) || 0,
    estimatedTraffic: Number(pick(item, 'organicTraffic', 'organic_traffic', 'traffic')) || 0,
    topPages,
    technical,
  }
}

export function parseAIData(items: unknown[], brand: string): AIData {
  const result = (Array.isArray(items) && items[0]) ? items[0] as Record<string, unknown> : {}
  const summary = (result.summary as Record<string, unknown>) || {}
  const perPlatform = (result.per_platform_per_brand as Record<string, unknown>[]) || []
  const perQuery = (result.per_query as Record<string, unknown>[]) || []

  const brandPlatforms = perPlatform.filter(p => {
    const pBrand = String(p.brand || '').toLowerCase()
    return pBrand === brand.toLowerCase()
  })

  const engineNames = ['chatgpt', 'perplexity', 'gemini', 'copilot', 'ai_overview']
  const engines: EngineData[] = engineNames.map(engine => {
    const platformData = brandPlatforms.find(p => String(p.platform || '').toLowerCase() === engine) as Record<string, unknown> | undefined
    const engineQueries = perQuery.filter(q => String(q.platform || '').toLowerCase() === engine)

    return {
      engine,
      ais: Number(platformData?.ais) || 0,
      mentionRate: Number(platformData?.mention_rate) || 0,
      shareOfVoice: Number(platformData?.share_of_voice) || 0,
      top3RatePct: Number(platformData?.top3_rate_pct) || 0,
      queries: engineQueries.map(q => ({
        query: String(q.query || ''),
        appears: Boolean(q.appears) || Number(q.position) > 0,
        position: q.position != null ? Number(q.position) : null,
        mentions: Number(q.mentions) || 0,
        sentiment: (q.sentiment as 'positive' | 'neutral' | 'negative' | null) || null,
      })),
    }
  }).filter(e => e.queries.length > 0 || e.ais > 0)

  const allFirstMentions = perQuery.filter(q => {
    const pBrand = String(q.brand || '').toLowerCase()
    return pBrand === brand.toLowerCase() && Number(q.position) === 1
  })
  const totalAppearances = perQuery.filter(q => {
    const pBrand = String(q.brand || '').toLowerCase()
    return pBrand === brand.toLowerCase() && Boolean(q.appears)
  })
  const firstMentionShare = totalAppearances.length > 0
    ? Math.round((allFirstMentions.length / totalAppearances.length) * 100) + '%'
    : (Number(summary.top3_rate_pct) || 0) + '%'

  return {
    summary: {
      ais: Number(summary.ais) || 0,
      mentionRate: Number(summary.mention_rate) || 0,
      shareOfVoice: Number(summary.share_of_voice) || 0,
      avgPosition: Number(summary.avg_position) || 0,
      top3RatePct: Number(summary.top3_rate_pct) || 0,
      sentimentPositivePct: Number(summary.sentiment_positive_pct) || 0,
      sentimentNeutralPct: Number(summary.sentiment_neutral_pct) || 0,
      sentimentNegativePct: Number(summary.sentiment_negative_pct) || 0,
      dominantFraming: String(summary.dominant_framing || ''),
      aggregateStrengths: (summary.aggregate_strengths as string[]) || [],
      aggregateWeaknesses: (summary.aggregate_weaknesses as string[]) || [],
    },
    firstMentionShare,
    engines,
  }
}

export function parseBenchmark(aiItems: unknown[], brand: string, brandDomain: string, competitors: string[]): BenchmarkEntry[] {
  const result = (Array.isArray(aiItems) && aiItems[0]) ? aiItems[0] as Record<string, unknown> : {}
  const competitorsRaw = (result.competitors as Record<string, unknown>[]) || []
  const summary = (result.summary as Record<string, unknown>) || {}

  const entries: BenchmarkEntry[] = []

  entries.push({
    rank: 1,
    name: brand,
    domain: brandDomain,
    mentions: Number(summary.mentions) || 0,
    visibility: Number(summary.mention_rate) || 0,
    firstMentionShare: Number(summary.top3_rate_pct) || 0,
    sentiment: 'neutral',
    isTarget: true,
    isCompetitor: false,
  })

  competitorsRaw.forEach((comp, i) => {
    entries.push({
      rank: i + 2,
      name: String(comp.brand || comp.name || ''),
      domain: String(comp.brandUrl || comp.domain || ''),
      mentions: Number(comp.mentions) || 0,
      visibility: Number(comp.mention_rate) || 0,
      firstMentionShare: Number(comp.top3_rate_pct) || 0,
      sentiment: (comp.dominant_framing as 'positive' | 'neutral' | 'mixed') || 'neutral',
      isTarget: false,
      isCompetitor: competitors.some(c => String(comp.brand || '').toLowerCase().includes(c.toLowerCase())),
    })
  })

  return entries.sort((a, b) => b.visibility - a.visibility).map((e, i) => ({ ...e, rank: i + 1 }))
}

export function parseCompetitorSEO(seoItems: unknown[], name: string, domain: string, aiScore: number, firstMentionShare: string): CompetitorSEO {
  const item = (Array.isArray(seoItems) && seoItems[0]) ? seoItems[0] as Record<string, unknown> : {}
  const backlinks = Number(pick(item, 'backlinks', 'total_backlinks', 'totalBacklinks')) || 0

  return {
    name,
    domain,
    domainRating: Number(pick(item, 'domainRating', 'domain_rating', 'dr')) || 0,
    backlinks,
    organicKeywords: Number(pick(item, 'organicKeywords', 'organic_keywords', 'keywords')) || 0,
    aiScore,
    firstMentionShare,
  }
}

export async function runTechnicalChecks(url: string): Promise<{ label: string; status: 'ok' | 'fail' }[]> {
  const checks: { label: string; status: 'ok' | 'fail' }[] = []

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const html = await res.text()

    checks.push(
      { label: 'Title tag', status: /<title[^>]*>(.+?)<\/title>/i.test(html) ? 'ok' : 'fail' },
      { label: 'Meta description', status: /<meta[^>]+name=["']description["'][^>]*>/i.test(html) ? 'ok' : 'fail' },
      { label: 'Canonical tag', status: /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html) ? 'ok' : 'fail' },
      { label: 'H1 present', status: /<h1[\s>]/i.test(html) ? 'ok' : 'fail' },
      { label: 'Schema markup', status: /application\/ld\+json/i.test(html) ? 'ok' : 'fail' },
      { label: 'Open Graph tags', status: /<meta[^>]+property=["']og:title["'][^>]*>/i.test(html) ? 'ok' : 'fail' },
    )
  } catch {
    checks.push(
      { label: 'Title tag', status: 'fail' },
      { label: 'Meta description', status: 'fail' },
      { label: 'Canonical tag', status: 'fail' },
      { label: 'H1 present', status: 'fail' },
      { label: 'Schema markup', status: 'fail' },
      { label: 'Open Graph tags', status: 'fail' },
    )
  }

  const origin = new URL(url).origin
  try {
    const r = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
    checks.push({ label: 'robots.txt', status: r.ok ? 'ok' : 'fail' })
  } catch {
    checks.push({ label: 'robots.txt', status: 'fail' })
  }

  try {
    const r = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(5000) })
    checks.push({ label: 'sitemap.xml', status: r.ok ? 'ok' : 'fail' })
  } catch {
    checks.push({ label: 'sitemap.xml', status: 'fail' })
  }

  return checks
}
