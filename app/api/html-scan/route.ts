import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

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

    return NextResponse.json({
      platform,
      ga4:          html.includes('gtag') || html.includes('googletagmanager'),
      meta_pixel:   html.includes('connect.facebook.net') || html.includes('fbevents'),
      email:        html.includes('klaviyo') || html.includes('omnisend') || html.includes('mailchimp'),
      schema:       html.includes('"@type"') || html.includes("'@type'"),
      ssl:          true,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
