import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  // ── HTML signals ─────────────────────────────────────────────────
  let htmlSignals: Record<string, unknown> = {}
  try {
    const res = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ARPI-Snapshot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = (await res.text()).toLowerCase()

    const platform =
      html.includes('cdn.shopify.com') || html.includes('myshopify') ? 'Shopify'
      : html.includes('woocommerce') ? 'WooCommerce'
      : html.includes('bigcommerce') ? 'BigCommerce'
      : 'Unknown'

    htmlSignals = {
      platform,
      ga4:        html.includes('gtag') || html.includes('googletagmanager'),
      meta_pixel: html.includes('connect.facebook.net') || html.includes('fbevents'),
      email:      html.includes('klaviyo') || html.includes('omnisend') || html.includes('mailchimp'),
      schema:     html.includes('"@type"') || html.includes("'@type'"),
      ssl:        true,
    }
  } catch (e) {
    htmlSignals = { html_error: `HTML scan failed: ${String(e)}` }
  }

  // ── PageSpeed signals ─────────────────────────────────────────────
  let speedSignals: Record<string, unknown> = {}
  const apiKey = process.env.PAGESPEED_API_KEY

  if (apiKey) {
    try {
      const psUrl =
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
        `?url=https://${domain}&strategy=mobile&category=performance&key=${apiKey}`

      const psRes = await fetch(psUrl, { signal: AbortSignal.timeout(25000) })
      if (psRes.ok) {
        const data = await psRes.json() as {
          lighthouseResult?: {
            categories?: { performance?: { score: number | null } }
            audits?: {
              'largest-contentful-paint'?: { numericValue?: number }
              'cumulative-layout-shift'?:  { numericValue?: number }
              'total-blocking-time'?:       { numericValue?: number }
              'server-response-time'?:      { numericValue?: number }
              'total-byte-weight'?:         { numericValue?: number }
              'render-blocking-resources'?: { score?: number }
            }
          }
        }
        const audits = data.lighthouseResult?.audits
        const cats   = data.lighthouseResult?.categories

        speedSignals = {
          mobile_score:    cats?.performance?.score != null ? Math.round(cats.performance.score * 100) : null,
          lcp_ms:          audits?.['largest-contentful-paint']?.numericValue ?? null,
          cls:             audits?.['cumulative-layout-shift']?.numericValue   ?? null,
          tbt_ms:          audits?.['total-blocking-time']?.numericValue        ?? null,
          ttfb_ms:         audits?.['server-response-time']?.numericValue       ?? null,
          page_weight_mb:  audits?.['total-byte-weight']?.numericValue != null
                             ? audits!['total-byte-weight']!.numericValue! / 1_048_576
                             : null,
          render_blocking: audits?.['render-blocking-resources']?.score != null
                             ? audits!['render-blocking-resources']!.score! < 0.9
                             : null,
        }
      } else {
        speedSignals = { speed_error: `PageSpeed API returned ${psRes.status}` }
      }
    } catch (e) {
      speedSignals = { speed_error: `PageSpeed failed: ${String(e)}` }
    }
  } else {
    speedSignals = { speed_error: 'PAGESPEED_API_KEY not configured' }
  }

  return NextResponse.json({ ...htmlSignals, ...speedSignals })
}
