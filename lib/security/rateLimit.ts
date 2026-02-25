import { getRedis } from '@/lib/db'

const MAX_REQUESTS = 10
const WINDOW_SECONDS = 60 * 60 // 1 hour

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // seconds
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const redis = getRedis()
  const key = `ratelimit:audit:${ip}`

  try {
    const current = await redis.incr(key)

    // Set TTL only on first request in this window
    if (current === 1) {
      await redis.expire(key, WINDOW_SECONDS)
    }

    const ttl = await redis.ttl(key)
    const remaining = Math.max(0, MAX_REQUESTS - current)
    const allowed = current <= MAX_REQUESTS

    return { allowed, remaining, resetIn: ttl }
  } catch {
    // If Redis is unavailable, fail open (allow the request)
    // This prevents Redis outages from breaking the audit tool entirely
    console.error('[rateLimit] Redis unavailable — failing open')
    return { allowed: true, remaining: MAX_REQUESTS, resetIn: WINDOW_SECONDS }
  }
}
