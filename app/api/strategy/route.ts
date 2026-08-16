import { NextRequest, NextResponse } from 'next/server'
import { AuditResult } from '@/types/audit'

function buildStrategyPrompt(data: AuditResult): string {
  return `You are an SEO and AI visibility strategist for a digital marketing agency in Southeast Asia.

Brand: "${data.brand}" | Category: "${data.category}"
Domain Rating: ${data.seo.domainRating}/100
Organic Keywords: ${data.seo.organicKeywords.toLocaleString()}
AI Visibility Score (avg): ${data.ai.summary.ais}/100
First Mention Share: ${data.ai.firstMentionShare}
Mention Rate: ${data.ai.summary.mentionRate}%
Share of Voice: ${data.ai.summary.shareOfVoice}%
Dominant AI framing: ${data.ai.summary.dominantFraming}
AI strengths: ${data.ai.summary.aggregateStrengths.join(', ')}
AI weaknesses: ${data.ai.summary.aggregateWeaknesses.join(', ')}
Competitors tracked: ${data.competitors.map(c => c.name).join(', ')}

Return ONLY a JSON object, no markdown, no preamble:
{
  "branded": [{"query":"...","intent":"...","priority":"high|medium"}],
  "category": [{"query":"...","intent":"...","priority":"high|medium"}],
  "comparison": [{"query":"...","intent":"...","priority":"high|medium"}],
  "recommendation": [{"query":"...","intent":"...","priority":"high|medium"}],
  "gaps": [{"query":"...","intent":"...","priority":"high|medium"}],
  "contentPriorities": "2-3 sentences on what to create first and why, specific to this brand."
}
Each array: 3-4 items. Queries must be realistic Southeast Asia-relevant phrasing.`
}

export async function POST(req: NextRequest) {
  const auditResult: AuditResult = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: buildStrategyPrompt(auditResult) }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `Anthropic API error: ${err}` }, { status: 500 })
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const ladder = JSON.parse(text)
    return NextResponse.json(ladder)
  } catch {
    return NextResponse.json({ error: 'Failed to parse strategy response', raw: text }, { status: 500 })
  }
}
