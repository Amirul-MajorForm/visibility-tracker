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
      // Start one SEO run per domain (actor processes one domain at a time)
      // and one AI run for all brands together.
      const [seoRunId, aiRunId, ...competitorRunIds] = await Promise.all([
        startApifyRun('parseforge~ahrefs-tools-scraper', {
          searchType: 'domain',
          domains: [domain],
        }),
        startApifyRun('doesaiknow~ai-brand-visibility-tracker-chatgpt-perplexity-gemini', {
          brand,
          brandUrl: domain,
          category,
          competitors: competitors,
        }),
        ...resolvedCompetitorDomains.map((compDomain: string) =>
          startApifyRun('parseforge~ahrefs-tools-scraper', {
            searchType: 'domain',
            domains: [compDomain],
          })
        ),
      ])

      state.seoRunId = seoRunId
      state.aiRunId = aiRunId
      state.competitorRunIds = competitorRunIds
      state.status = { phase: 'seo', progress: 10 }
      state.debugRaw = { seoRunId, aiRunId, competitorRunIds }
      runs.set(auditId, state)

      const { pollApifyRun } = await import('@/lib/apify')
      const { parseSEOData, parseAIData, parseBenchmark, parseCompetitorSEO, runTechnicalChecks } = await import('@/lib/parsers')

      // Poll SEO (120s) and AI (900s) in parallel
      const [seoResult, techChecks, aiResult, ...competitorSeoResults] = await Promise.allSettled([
        pollApifyRun(seoRunId, 120000),
        runTechnicalChecks(url),
        pollApifyRun(aiRunId, 900000),
        ...competitorRunIds.map((runId: string) => pollApifyRun(runId, 120000)),
      ])

      state.status = { phase: 'ai', progress: 60 }

      const seoItems = seoResult.status === 'fulfilled' ? seoResult.value : []

      // Log raw output for debugging
      console.log('[SEO] run id:', seoRunId, '| items:', seoItems.length)
      if (seoItems.length > 0) {
        const first = seoItems[0] as Record<string, unknown>
        console.log('[SEO] item[0] keys:', Object.keys(first).join(', '))
        console.log('[SEO] item[0] metrics:', {
          dr: first.domainRating ?? first.domain_rating ?? first.dr,
          backlinks: first.backlinks ?? first.total_backlinks,
          keywords: first.organicKeywords ?? first.organic_keywords ?? first.keywords,
          domain: first.domain ?? first.url ?? first.target,
        })
      } else {
        console.log('[SEO] WARN: actor returned 0 items — check Apify run', seoRunId)
      }

      state.debugRaw = {
        seoRunId,
        aiRunId,
        competitorRunIds,
        seoItemCount: seoItems.length,
        seoItem0: seoItems[0] ?? null,
      }
      runs.set(auditId, state)

      const technical = techChecks.status === 'fulfilled' ? techChecks.value : []
      const seoData = parseSEOData(seoItems, technical)

      const aiItems = aiResult.status === 'fulfilled' ? aiResult.value : []
      console.log('[AI] run id:', aiRunId, '| items:', aiItems.length)
      if (aiItems.length > 0) {
        const ai0 = aiItems[0] as Record<string, unknown>
        console.log('[AI] item[0] keys:', Object.keys(ai0).join(', '))
      } else {
        console.log('[AI] WARN: actor returned 0 items — check Apify run', aiRunId)
      }
      if (aiResult.status === 'rejected') throw new Error('AI actor failed: ' + aiResult.reason)

      const aiData = parseAIData(aiItems, brand)
      const benchmark = parseBenchmark(aiItems, brand, domain, competitors)

      const parsedCompetitors = competitors.map((comp: string, i: number) => {
        const compResult = competitorSeoResults[i]
        const compItems = compResult?.status === 'fulfilled' ? (compResult as PromiseFulfilledResult<unknown[]>).value : []
        console.log('[SEO] competitor', comp, '(', resolvedCompetitorDomains[i], ') run:', competitorRunIds[i], '| items:', compItems.length)
        if (compItems.length > 0) {
          const c0 = compItems[0] as Record<string, unknown>
          console.log('[SEO] competitor item[0] metrics:', {
            dr: c0.domainRating ?? c0.domain_rating ?? c0.dr,
            backlinks: c0.backlinks ?? c0.total_backlinks,
            domain: c0.domain ?? c0.url ?? c0.target,
          })
        }
        const compAI = benchmark.find(b => b.name.toLowerCase() === comp.toLowerCase())
        return parseCompetitorSEO(
          compItems,
          comp,
          resolvedCompetitorDomains[i],
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
