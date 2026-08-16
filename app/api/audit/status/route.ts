import { NextRequest, NextResponse } from 'next/server'
import { getRunsStore } from '../start/route'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const runs = getRunsStore()
  const state = runs.get(id)
  if (!state) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    phase: state.status.phase,
    progress: state.status.progress,
    error: state.status.error,
    result: state.status.phase === 'complete' ? state.result : undefined,
  })
}
