import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { RunState } from '@/types/audit'
import { extractDomain } from '@/lib/parsers'
import { startApifyRun } from '@/lib/apify'
import { getMockAuditResult } from '@/lib/mockData'

// In-memory store for audit runs
const runs = new Map<string, RunState>()

export function getRunsStore() {
  return runs
}

export async function POST(req: NextRequest) {
  const { brand, category, url, competitors, competitorDomains } = await req.json()

  if (!brand || !category || !url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const auditId = uuidv4()
  const domain = extractDomain(url)
  const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.APIFY_TOKEN

  // Resolve competitor domains: use explicit domain if provided, fall back to guessing from name
  const resolvedCompetitorDomains: string[] = (competitors as string[]).map((comp: string, i: number) => {
    if (competitorDomains?.[i]) return competitorDomains[i]
    return comp.toLowerCase().replace(/\s+/g, '') + '.com'
  })

  const initialState: RunState = {
    seoRunId: null,
    aiRunId: null,
    competitorRunIds: [],
    brand,
    category,
    url,
    competitors,
    status: { phase: 'seo', progress: 0 },
  }

  runs.set(auditId, initialState)

  if (USE_MOCK) {
    setTimeout(async () => {
      const state = runs.get(auditId)
      if (!state) return
      state.status = { phase: 'seo', progress: 50 }
      runs.set(auditId, state)
      await new Promise(r => setTimeout(r, 2000))
      state.status = { phase: 'ai', progress: 60 }
      runs.set(auditId, state)
      await new Promise(r => setTimeout(r, 3000))
      const result = getMockAuditResult(brand, category, url, competitors)
      state.status = { phase: 'complete', progress: 100 }
      state.result = result
      runs.set(auditId, state)
    }, 0)
    return NextResponse.json({ auditId })
  }

  // Fire real Apify runs in background
  ;(async () => {
    const state = runs.get(auditId)
    if (!state) return

    try {
      // Batch ALL domains (target + competitors) into a single SEO run so each domain's data
      // is fetched once and can be matched by domain field in the response array.
      const allDomains = [domain, ...resolvedCompetitorDomains]

      const [seoRunId, aiRunId] = await Promise.all([
        startApifyRun('parseforge~ahrefs-tools-scraper', {
          searchType: 'domain',
          domains: allDomains,
        }),
        startApifyRun('doesaiknow~ai-brand-visibility-tracker-chatgpt-perplexity-gemini', {
          brand,
          brandUrl: domain,
          category,
          competitors: competitors,
        }),
      ])

      state.seoRunId = seoRunId
      state.aiRunId = aiRunId
      state.competitorRunIds = []
      state.status = { phase: 'seo', progress: 10 }
      runs.set(auditId, state)

      const { pollApifyRun } = await import('@/lib/apify')
      const { parseSEOData, parseAIData, parseBenchmark, parseCompetitorSEO, runTechnicalChecks, findItemByDomain } = await import('@/lib/parsers')

      // Poll SEO (120s) and AI (900s) in parallel
      const [seoResult, techChecks, aiItems] = await Promise.allSettled([
        pollApifyRun(seoRunId, 120000),
        runTechnicalChecks(url),
        pollApifyRun(aiRunId, 900000),
      ])

      state.status = { phase: 'ai', progress: 60 }

      const allSeoItems = seoResult.status === 'fulfilled' ? seoResult.value : []

      // Log raw output for debugging
      console.log('[SEO] run id:', seoRunId)
      console.log('[SEO] raw items count:', allSeoItems.length)
      if (allSeoItems.length > 0) {
        const first = allSeoItems[0] as Record<string, unknown>
        console.log('[SEO] item[0] keys:', Object.keys(first).join(', '))
        console.log('[SEO] item[0] domain fields:', {
          domain: first.domain, url: first.url, target: first.target,
        })
        console.log('[SEO] item[0] metrics:', {
          dr: first.domainRating ?? first.domain_rating ?? first.dr,
          backlinks: first.backlinks ?? first.total_backlinks,
          keywords: first.organicKeywords ?? first.organic_keywords ?? first.keywords,
        })
      }

      state.debugRaw = {
        seoRunId,
        aiRunId,
        seoItemCount: allSeoItems.length,
        seoItem0: allSeoItems[0] ?? null,
      }
      runs.set(auditId, state)

      const technical = techChecks.status === 'fulfilled' ? techChecks.value : []
      const targetItems = findItemByDomain(allSeoItems, domain)
      console.log('[SEO] target domain items for', domain, ':', targetItems.length)
      const seoData = parseSEOData(targetItems.length > 0 ? targetItems : allSeoItems, technical)

      if (aiItems.status === 'rejected') throw new Error('AI actor failed: ' + aiItems.reason)
      console.log('[AI] raw items count:', aiItems.value?.length ?? 0)
      if (aiItems.value?.length > 0) {
        const ai0 = aiItems.value[0] as Record<string, unknown>
        console.log('[AI] item[0] keys:', Object.keys(ai0).join(', '))
      }
      const aiData = parseAIData(aiItems.value, brand)
      const benchmark = parseBenchmark(aiItems.value, brand, domain, competitors)

      const parsedCompetitors = competitors.map((comp: string, i: number) => {
        const compDomain = resolvedCompetitorDomains[i]
        const compItems = findItemByDomain(allSeoItems, compDomain)
        console.log('[SEO] competitor', comp, '(', compDomain, ') items:', compItems.length)
        const compAI = benchmark.find(b => b.name.toLowerCase() === comp.toLowerCase())
        return parseCompetitorSEO(
          compItems.length > 0 ? compItems : [],
          comp,
          compDomain,
          compAI?.visibility || 0,
          compAI ? String(compAI.firstMentionShare) + '%' : '0%'
        )
      })

      state.status = { phase: 'complete', progress: 100 }
      state.result = {
        brand,
        category,
        url,
        seo: seoData,
        ai: aiData,
        benchmark,
        competitors: parsedCompetitors,
        auditedAt: new Date().toISOString(),
      }
      runs.set(auditId, state)
    } catch (err) {
      const state = runs.get(auditId)
      if (state) {
        state.status = { phase: 'error', progress: 0, error: String(err) }
        runs.set(auditId, state)
      }
    }
  })()

  return NextResponse.json({ auditId })
}
