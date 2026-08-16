const APIFY_TOKEN = process.env.APIFY_TOKEN

export async function startApifyRun(actorId: string, input: Record<string, unknown>): Promise<string> {
  const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${APIFY_TOKEN}`,
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Apify start failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.data.id
}

export async function getApifyRun(runId: string) {
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
    headers: { Authorization: `Bearer ${APIFY_TOKEN}` },
  })
  if (!res.ok) throw new Error(`Apify get run failed: ${res.status}`)
  const data = await res.json()
  return data.data
}

export async function getApifyDataset(datasetId: string): Promise<unknown[]> {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
    headers: { Authorization: `Bearer ${APIFY_TOKEN}` },
  })
  if (!res.ok) throw new Error(`Apify dataset failed: ${res.status}`)
  const data = await res.json()
  return data
}

export async function pollApifyRun(runId: string, timeoutMs: number): Promise<unknown[]> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const run = await getApifyRun(runId)
    if (run.status === 'SUCCEEDED') return getApifyDataset(run.defaultDatasetId)
    if (run.status === 'FAILED' || run.status === 'ABORTED') throw new Error(`Run ${runId} ${run.status}`)
    await new Promise(r => setTimeout(r, 4000))
  }
  throw new Error('Apify run timeout')
}
