import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = 'arpi2024'

export interface AutoSignal {
  label:         string
  value:         string
  status:        'none' | 'green' | 'amber' | 'red'
  impactWeight:  number
  businessLabel?: string
  businessPain?:  string
}

export interface SavedReport {
  id:           string
  domain:       string
  prospect:     string
  company:      string
  score:        number
  totalRed:     number
  totalAmber:   number
  savedAt:      string
  fullReport:   string
  emailDraft:   string
  autoSignals?: AutoSignal[]
}

async function getRedis() {
  const { Redis } = await import('@upstash/redis')
  return Redis.fromEnv()
}

// POST — save a report
export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-audit-password')
  if (auth !== PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as SavedReport
  if (!body.domain || !body.id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  try {
    const redis = await getRedis()
    // Store the full report
    await redis.set(`audit:${body.id}`, JSON.stringify(body), { ex: 60 * 60 * 24 * 365 }) // 1 year TTL
    // Add to the index list (prepend so newest first)
    await redis.lpush('audit:index', body.id)
    // Keep index trimmed to 200 entries
    await redis.ltrim('audit:index', 0, 199)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET — list all reports or fetch one
export async function GET(req: NextRequest) {
  const auth = req.nextUrl.searchParams.get('p')
  if (auth !== PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')

  try {
    const redis = await getRedis()

    if (id) {
      // Fetch single report
      const raw = await redis.get<string>(`audit:${id}`)
      if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(typeof raw === 'string' ? JSON.parse(raw) : raw)
    }

    // List all report IDs
    const ids = await redis.lrange('audit:index', 0, 199)
    if (!ids || ids.length === 0) return NextResponse.json({ reports: [] })

    // Fetch summaries (domain, prospect, score, savedAt only)
    const pipeline = redis.pipeline()
    for (const rid of ids) pipeline.get(`audit:${rid}`)
    const results = await pipeline.exec()

    const reports = (results as (string | null)[])
      .map(r => {
        if (!r) return null
        try {
          const d = typeof r === 'string' ? JSON.parse(r) : r as SavedReport
          // Return summary only (no full text for list view)
          return {
            id:        d.id,
            domain:    d.domain,
            prospect:  d.prospect,
            company:   d.company,
            score:     d.score,
            totalRed:  d.totalRed,
            totalAmber: d.totalAmber,
            savedAt:   d.savedAt,
          }
        } catch { return null }
      })
      .filter(Boolean)

    return NextResponse.json({ reports })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE — remove a report
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('x-audit-password')
  if (auth !== PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const redis = await getRedis()
    await redis.del(`audit:${id}`)
    await redis.lrem('audit:index', 0, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
