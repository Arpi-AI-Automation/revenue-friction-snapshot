import { Redis } from '@upstash/redis'

let client: Redis | null = null

export function getRedis(): Redis {
  if (client) return client

  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
  }

  client = new Redis({ url, token })
  return client
}

// TTL: 30 days in seconds
export const REPORT_TTL = 60 * 60 * 24 * 30
