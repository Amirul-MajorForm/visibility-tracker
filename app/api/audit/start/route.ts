import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { RunState } from '@/types/audit'
import { extractDomain } from '@/lib/parsers'
import { startApifyRun } from '@/lib/apify'
import { generateQueries } from '@/lib/queries'
import { getMockAuditResult } from '@/lib/mockData'

// In-memory store for audit runs
const runs = new Map<string, RunState>()

export function getRunsStore() {
  return runs
}

export async function POST(req: NextRequest) {
  const { brand, category, url, competitors } = await req.json()

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
    competitors,
    status: { phase: 'seo', progress: 0 },
  }

  runs.set(auditId, initialState)

  if (USE_MOCK) {
    // Return mock data after a brief delay for demo purposes
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
      // Start SEO + AI runs in parallel
      const [seoRunId, aiRunId, ...competitorRunIds] = await Promise.all([
        startApifyRun('parseforge~ahrefs-tools-scraper', {
          searchType: 'domain',
          domains: [domain],
        }),
        startApifyRun('doesaiknow~ai-brand-visibility-tracker-chatgpt-perplexity-gemini', {
          brand,
          brandUrl: domain,
          category,
          competitors,
          language: 'sg',
          queries: generateQueries(brand, category),
          includePerception: true,
        }),
        ...competitors.map((comp: string) =>
          startApifyRun('parseforge~ahrefs-tools-scraper', {
            searchType: 'domain',
            domains: [comp.toLowerCase().replace(/\s+/g, '') + '.com'],
          })
        ),
      ])

      state.seoRunId = seoRunId
      state.aiRunId = aiRunId
      state.competitorRunIds = competitorRunIds
      state.status = { phase: 'seo', progress: 10 }
      runs.set(auditId, state)

      // Import polling and parsing functions
      const { pollApifyRun } = await import('@/lib/apify')
      const { parseSEOData, parseAIData, parseBenchmark, parseCompetitorSEO, runTechnicalChecks } = await import('@/lib/parsers')

      // Poll SEO (120s) and AI (900s) in parallel
      const [seoItems, techChecks, aiItems, ...competitorSeoItems] = await Promise.allSettled([
        pollApifyRun(seoRunId, 120000),
        runTechnicalChecks(url),
        pollApifyRun(aiRunId, 900000),
        ...competitorRunIds.map((runId: string) => pollApifyRun(runId, 120000)),
      ])

      state.status = { phase: 'ai', progress: 60 }
      runs.set(auditId, state)

      const technical = techChecks.status === 'fulfilled' ? techChecks.value : []
      const seoData = parseSEOData(
        seoItems.status === 'fulfilled' ? seoItems.value : [],
        technical
      )

      if (aiItems.status === 'rejected') throw new Error('AI actor failed: ' + aiItems.reason)
      const aiData = parseAIData(aiItems.value, brand)
      const benchmark = parseBenchmark(aiItems.value, brand, domain, competitors)

      const parsedCompetitors = competitors.map((comp: string, i: number) => {
        const items = competitorSeoItems[i]?.status === 'fulfilled' ? competitorSeoItems[i].value as unknown[] : []
        const compAI = benchmark.find(b => b.name.toLowerCase() === comp.toLowerCase())
        return parseCompetitorSEO(
          items,
          comp,
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
