import { safeFetchText } from '@/lib/security/safeFetch'
import type { Platform } from '@/lib/types'

export async function detectPlatform(hostname: string): Promise<Platform> {
  try {
    const html = await safeFetchText(`https://${hostname}`, { timeoutMs: 8_000 })
    const lower = html.toLowerCase()

    if (
      lower.includes('cdn.shopify.com') ||
      lower.includes('shopify.com/s/files') ||
      lower.includes('"shop_id"') ||
      lower.includes('myshopify.com') ||
      lower.includes('shopify-section')
    ) {
      return 'shopify'
    }

    return 'generic'
  } catch {
    return 'generic'
  }
}
