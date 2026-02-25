import { safeFetch, safeFetchText } from '@/lib/security/safeFetch'
import { load } from 'cheerio'
import type { BucketScore, Finding, Platform } from '@/lib/types'
import { scoreToLabel } from './scoring'

async function urlAccessible(url: string): Promise<boolean> {
  try {
    const res = await safeFetch(url, { timeoutMs: 6_000 })
    return res.status < 400
  } catch {
    return false
  }
}

export async function auditFunnel(
  hostname: string,
  platform: Platform
): Promise<BucketScore> {
  let html: string
  let $: ReturnType<typeof load>

  try {
    html = await safeFetchText(`https://${hostname}`, { timeoutMs: 8_000 })
    $ = load(html)
  } catch {
    return unavailable('Could not fetch homepage.')
  }

  const source = html.toLowerCase()
  const findings: Finding[] = []
  let earned = 0

  // ── Product page reachable (20 pts) ─────────────────────────────
  const productUrls = platform === 'shopify'
    ? [`https://${hostname}/collections/all`, `https://${hostname}/products`]
    : [`https://${hostname}/shop`, `https://${hostname}/products`, `https://${hostname}/store`]

  // Also scan homepage links for product-like paths
  const links: string[] = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (href.includes('/product') || href.includes('/shop') ||
        href.includes('/collection') || href.includes('/store')) {
      links.push(href.startsWith('http') ? href : `https://${hostname}${href}`)
    }
  })

  const hasProductLink = links.length > 0
  const ogType = $('meta[property="og:type"]').attr('content') || ''
  const isProductPage = ogType === 'product'

  if (hasProductLink || isProductPage || platform === 'shopify') {
    earned += 20
    findings.push({
      id:               'product-page',
      label:            'Product pages linked from homepage',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Product or collection links detected in homepage navigation.',
      impactWeight:     8,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'product-page-missing',
      label:            'No product page links detected from homepage',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'No product or shop links found in homepage source. May be loaded dynamically.',
      impactWeight:     8,
      actionability:    'High',
      fixTitle:         'Ensure product pages are linked from homepage',
      fixRationale:     'No product links detected from homepage. Paid traffic landing on the homepage needs a clear path to product pages.',
      fixOutcome:       'Clear product navigation may reduce drop-off for visitors who arrive on the homepage.',
      fixEffort:        'Low',
    })
  }

  // ── Cart accessible (20 pts) ─────────────────────────────────────
  const cartUrl = `https://${hostname}/cart`
  const cartOk  = platform === 'shopify'
    ? await urlAccessible(cartUrl)
    : (source.includes('/cart') || source.includes('cart'))

  if (cartOk) {
    earned += 20
    findings.push({
      id:               'cart',
      label:            'Cart page accessible',
      passed:           true,
      confidence:       platform === 'shopify' ? 'high' : 'medium',
      confidenceReason: platform === 'shopify'
        ? '/cart URL returned a successful response.'
        : 'Cart reference found in page source.',
      impactWeight:     9,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'cart-missing',
      label:            'Cart page not confirmed accessible',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'Could not confirm /cart URL is accessible. May be a headless implementation.',
      impactWeight:     9,
      actionability:    'High',
      fixTitle:         'Verify cart page is accessible',
      fixRationale:     'Cart page could not be confirmed. If visitors cannot access their cart, they cannot complete a purchase.',
      fixOutcome:       'A working cart page is required for any purchase to complete.',
      fixEffort:        'High',
    })
  }

  // ── Checkout accessible (15 pts) ─────────────────────────────────
  const hasCheckout = platform === 'shopify'
    ? (source.includes('checkout') || source.includes('shopify.com/checkouts'))
    : (source.includes('/checkout') || source.includes('checkout'))

  if (hasCheckout) {
    earned += 15
    findings.push({
      id:               'checkout',
      label:            'Checkout references found',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Checkout references detected in page source. Actual checkout flow not testable from public signals.',
      impactWeight:     9,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'checkout-missing',
      label:            'No checkout references detected',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'No checkout path found in public source. May be embedded or loaded dynamically.',
      impactWeight:     9,
      actionability:    'High',
      fixTitle:         'Verify checkout flow is accessible',
      fixRationale:     'No checkout references detected. Without a working checkout, paid traffic cannot convert.',
      fixOutcome:       'A working checkout flow is required for revenue.',
      fixEffort:        'High',
    })
  }

  // ── Mobile navigation (15 pts) ───────────────────────────────────
  const hasMobileNav = source.includes('hamburger') ||
                       source.includes('mobile-nav') ||
                       source.includes('menu-toggle') ||
                       source.includes('navbar-toggler') ||
                       $('[class*="mobile"][class*="nav"]').length > 0 ||
                       $('[class*="hamburger"]').length > 0 ||
                       $('button[aria-label*="menu" i]').length > 0 ||
                       $('button[aria-label*="navigation" i]').length > 0

  if (hasMobileNav) {
    earned += 15
    findings.push({
      id:               'mobile-nav',
      label:            'Mobile navigation detected',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Mobile nav pattern found in page source. Actual usability not testable from public signals.',
      impactWeight:     6,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'mobile-nav-missing',
      label:            'Mobile navigation not confirmed',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'No mobile nav pattern detected in source. May be implemented differently.',
      impactWeight:     6,
      actionability:    'Medium',
      fixTitle:         'Verify mobile navigation usability',
      fixRationale:     'No mobile navigation pattern detected. Most paid traffic arrives on mobile. Poor mobile nav directly increases bounce rate.',
      fixOutcome:       'Clear mobile navigation may reduce drop-off for visitors arriving from paid channels.',
      fixEffort:        'Medium',
    })
  }

  // ── Search functionality (10 pts) ───────────────────────────────
  const hasSearch = $('input[type="search"]').length > 0 ||
                    $('[class*="search"]').length > 0 ||
                    source.includes('predictive-search') ||
                    source.includes('search-form')

  if (hasSearch) {
    earned += 10
    findings.push({
      id:               'search',
      label:            'Site search detected',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Search input or search component found in page source.',
      impactWeight:     4,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'search-missing',
      label:            'Site search not detected',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'No search input found. Visitors who cannot find products via search may drop off.',
      impactWeight:     4,
      actionability:    'Low',
      fixTitle:         'Add site search',
      fixRationale:     'No search functionality detected. Visitors looking for specific products who cannot find them via navigation are likely to leave.',
      fixOutcome:       'Search may reduce friction for visitors with specific product intent.',
      fixEffort:        'Low',
    })
  }

  // ── Pop-up on load (−10 pts if detected immediately) ────────────
  const hasPopup = source.includes('popup-overlay') ||
                   source.includes('email-popup') ||
                   source.includes('klaviyo-form') ||
                   ($('[class*="popup"]').length > 0 && $('[class*="popup"]').length < 10)

  if (hasPopup) {
    earned = Math.max(0, earned - 5)
    findings.push({
      id:               'popup',
      label:            'Pop-up overlay likely present on load',
      passed:           false,
      partial:          true,
      confidence:       'low',
      confidenceReason: 'Pop-up markup detected in source. Timing and trigger conditions not verifiable from public signals.',
      impactWeight:     5,
      actionability:    'Low',
      fixTitle:         'Review pop-up timing on paid traffic',
      fixRationale:     'A pop-up overlay appears to load on the page. Immediate pop-ups interrupt the ad-to-landing-page experience and can increase bounce rate for paid visitors.',
      fixOutcome:       'Delaying pop-ups to 30+ seconds or exit intent may reduce friction for first-time paid visitors.',
      fixEffort:        'Low',
    })
  }

  const score = Math.round(Math.min(100, (earned / 80) * 100))

  return {
    bucket:       'funnel',
    score,
    label:        scoreToLabel(score),
    earnedPoints: earned,
    maxPoints:    80,
    findings,
  }
}

function unavailable(reason: string): BucketScore {
  console.warn(`[funnel] ${reason}`)
  return {
    bucket:       'funnel',
    score:        0,
    label:        'High Friction',
    earnedPoints: 0,
    maxPoints:    80,
    findings:     [],
    unavailable:  true,
  }
}
