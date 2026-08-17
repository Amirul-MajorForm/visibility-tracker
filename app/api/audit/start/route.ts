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
  const { brand, category, url } = await req.json()

  if (!brand || !category || !url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const auditId = uuidv4()
  const domain = extractDomain(url)
  const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.APIFY_TOKEN

  const initialState: RunState = {
    seoRunId: null,
    aiRunId: null,
    competitorRunIds: [],
    brand,
    category,
    url,
    competitors: [],
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
      const result = getMockAuditResult(brand, category, url, [])
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
      // The actor uses { target, tool } not { searchType, domains }
      const [seoRunId, aiRunId] = await Promise.all([
        startApifyRun('parseforge~ahrefs-tools-scraper', {
          target: domain,
          tool: 'domain_rating',
        }),
        startApifyRun('doesaiknow~ai-brand-visibility-tracker-chatgpt-perplexity-gemini', {
          brand,
          brandUrl: domain,
          category,
          competitors: [],
        }),
      ])

      state.seoRunId = seoRunId
      state.aiRunId = aiRunId
      state.competitorRunIds = []
      state.status = { phase: 'seo', progress: 10 }
      state.debugRaw = { seoRunId, aiRunId }
      runs.set(auditId, state)

      const { pollApifyRun } = await import('@/lib/apify')
      const { parseSEOData, parseAIData, parseBenchmark, runTechnicalChecks } = await import('@/lib/parsers')

      const [seoResult, techChecks, aiResult] = await Promise.allSettled([
        pollApifyRun(seoRunId, 120000),
        runTechnicalChecks(url),
        pollApifyRun(aiRunId, 900000),
      ])

      state.status = { phase: 'ai', progress: 60 }

      const seoItems = seoResult.status === 'fulfilled' ? seoResult.value : []
      console.log('[SEO] run:', seoRunId, '| items:', seoItems.length)
      if (seoItems.length > 0) {
        const f = seoItems[0] as Record<string, unknown>
        console.log('[SEO] item[0] target:', f.target, '| keys:', Object.keys(f).join(', '))
        console.log('[SEO] metrics:', { dr: f.domainRating, backlinks: f.backlinks, refdomains: f.referringDomains })
      }

      state.debugRaw = { seoRunId, aiRunId, seoItemCount: seoItems.length, seoItem0: seoItems[0] ?? null }
      runs.set(auditId, state)

      const technical = techChecks.status === 'fulfilled' ? techChecks.value : []
      const seoData = parseSEOData(seoItems, technical)

      const aiItems = aiResult.status === 'fulfilled' ? aiResult.value : []
      console.log('[AI] run:', aiRunId, '| items:', aiItems.length)
      if (aiItems.length > 0) {
        const ai0 = aiItems[0] as Record<string, unknown>
        console.log('[AI] keys:', Object.keys(ai0).join(', '))
      }
      if (aiResult.status === 'rejected') throw new Error('AI actor failed: ' + aiResult.reason)

      const aiData = parseAIData(aiItems, brand)
      const benchmark = parseBenchmark(aiItems, brand, domain, [])

      state.status = { phase: 'complete', progress: 100 }
      state.result = {
        brand,
        category,
        url,
        seo: seoData,
        ai: aiData,
        benchmark,
        competitors: [],
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
