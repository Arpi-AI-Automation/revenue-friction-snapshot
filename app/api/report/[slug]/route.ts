import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRedis } from '@/lib/db'
import type { ReportData } from '@/lib/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug) {
    return NextResponse.json({ error: 'Slug required.' }, { status: 400 })
  }

  try {
    const redis = getRedis()
    const raw = await redis.get<string>(`report:${slug}`)

    if (!raw) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
    }

    const report: ReportData = typeof raw === 'string' ? JSON.parse(raw) : raw

    return NextResponse.json(report)
  } catch (err) {
    console.error('[report] Failed to read from Redis:', err)
    return NextResponse.json({ error: 'Could not retrieve report.' }, { status: 500 })
  }
}
