import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { validateDomain, DomainValidationError } from '@/lib/security/validateDomain'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { runAudit } from '@/lib/auditor/index'
import { getRedis, REPORT_TTL } from '@/lib/db'

export const maxDuration = 55

export async function POST(request: NextRequest) {
  // 1. Parse body
  let domain: string
  try {
    const body = await request.json()
    domain = body?.domain
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'A valid domain is required.' }, { status: 400 })
  }

  // 2. Validate domain (SSRF protection)
  let hostname: string
  try {
    const validated = await validateDomain(domain)
    hostname = validated.hostname
  } catch (err) {
    const message = err instanceof DomainValidationError
      ? err.message
      : 'Invalid domain.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // 3. Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? request.headers.get('x-real-ip')
           ?? '0.0.0.0'

  try {
    const limit = await checkRateLimit(ip)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${Math.ceil(limit.resetIn / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': String(limit.resetIn) } }
      )
    }
  } catch {
    console.error('[audit] Rate limit check failed — continuing')
  }

  // 4. Generate slug, store pending state
  const slug = nanoid(10)

  try {
    const redis = getRedis()
    await redis.set(
      `report:${slug}`,
      JSON.stringify({ slug, domain: hostname, status: 'pending' }),
      { ex: REPORT_TTL }
    )
  } catch {
    console.error('[audit] Could not write pending state to Redis')
  }

  // 5. Run audit
  try {
    const report = await runAudit(slug, hostname)
    const redis = getRedis()
    await redis.set(`report:${slug}`, JSON.stringify(report), { ex: REPORT_TTL })
  } catch (err) {
    console.error('[audit] Audit failed:', err)
    try {
      const redis = getRedis()
      await redis.set(
        `report:${slug}`,
        JSON.stringify({ slug, domain: hostname, status: 'error' }),
        { ex: 3600 }
      )
    } catch { /* best effort */ }
    return NextResponse.json({ error: 'Audit failed. Please try again.' }, { status: 500 })
  }

  // 6. Return slug
  return NextResponse.json({ slug })
}
