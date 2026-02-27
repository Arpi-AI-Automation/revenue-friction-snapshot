import { safeFetch, safeFetchText } from '@/lib/security/safeFetch'
import { load } from 'cheerio'
import type { BucketScore, Finding } from '@/lib/types'
import { scoreToLabel } from './scoring'

async function checkHttps(hostname: string): Promise<boolean> {
  try {
    const res = await safeFetch(`https://${hostname}`, { timeoutMs: 6_000 })
    return res.ok || res.status < 400
  } catch {
    return false
  }
}

async function checkHsts(hostname: string): Promise<boolean> {
  try {
    const res = await safeFetch(`https://${hostname}`, { timeoutMs: 6_000 })
    return res.headers.has('strict-transport-security')
  } catch {
    return false
  }
}

async function urlAccessible(url: string): Promise<boolean> {
  try {
    const res = await safeFetch(url, { timeoutMs: 6_000 })
    return res.status < 400
  } catch {
    return false
  }
}

export async function auditTrust(hostname: string): Promise<BucketScore> {
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

  // ── SSL / HTTPS (20 pts) ─────────────────────────────────────────
  const [sslOk, hstsOk] = await Promise.all([
    checkHttps(hostname),
    checkHsts(hostname),
  ])

  if (sslOk && hstsOk) {
    earned += 20
    findings.push({
      id:               'ssl-hsts',
      label:            'HTTPS active and HSTS header present',
      passed:           true,
      confidence:       'high',
      confidenceReason: 'HTTPS connection successful and Strict-Transport-Security header confirmed.',
      impactWeight:     7,
      actionability:    'Low',
    })
  } else if (sslOk) {
    earned += 14
    findings.push({
      id:               'ssl-no-hsts',
      label:            'HTTPS active, HSTS header not detected',
      passed:           false,
      partial:          true,
      confidence:       'high',
      confidenceReason: 'HTTPS works but no Strict-Transport-Security header found. HSTS protects against downgrade attacks.',
      impactWeight:     4,
      actionability:    'Low',
      fixTitle:         'Enable HSTS header',
      fixRationale:     'HTTPS is active but HSTS is not configured. HSTS prevents browsers from ever connecting over HTTP, reducing the risk of mixed-content issues.',
      fixOutcome:       'Adding HSTS may improve browser trust signals and protect against downgrade attacks.',
      fixEffort:        'Low',
    })
  } else {
    findings.push({
      id:               'ssl-missing',
      label:            'HTTPS not confirmed',
      passed:           false,
      confidence:       'high',
      confidenceReason: 'HTTPS connection could not be confirmed.',
      impactWeight:     10,
      actionability:    'High',
      fixTitle:         'Enable HTTPS',
      fixRationale:     'HTTPS could not be confirmed. Most browsers warn visitors about non-HTTPS sites, which directly kills conversion for paid traffic.',
      fixOutcome:       'HTTPS is a baseline requirement for ecommerce. Enabling it is likely to prevent browser security warnings from deterring purchases.',
      fixEffort:        'Low',
    })
  }

  // ── Review platform (20 pts) ─────────────────────────────────────
  const reviewPlatforms: { name: string; patterns: string[] }[] = [
    { name: 'Okendo',      patterns: ['okendo'] },
    { name: 'Yotpo',       patterns: ['yotpo'] },
    { name: 'Judge.me',    patterns: ['judge.me', 'judgeme'] },
    { name: 'Stamped',     patterns: ['stamped.io', 'stamped'] },
    { name: 'Trustpilot',  patterns: ['trustpilot'] },
    { name: 'Loox',        patterns: ['loox.io', 'loox'] },
    { name: 'Reviews.io',  patterns: ['reviews.io'] },
    { name: 'Junip',       patterns: ['junip.co', 'junip'] },
  ]

  let detectedReview: string | null = null
  for (const platform of reviewPlatforms) {
    if (platform.patterns.some(p => source.includes(p))) {
      detectedReview = platform.name
      break
    }
  }

  // Require BOTH platform script AND visible rating markup to pass.
  // Script alone (Okendo loaded but reviews not rendered on page) = partial only.
  const hasVisibleRatings = source.includes('aggregaterating') ||
                            source.includes('reviewcount') ||
                            source.includes('star-rating') ||
                            source.includes('rating-stars') ||
                            source.includes('review-stars') ||
                            source.includes('okendo-reviews') ||
                            source.includes('data-rating')

  if (detectedReview && hasVisibleRatings) {
    earned += 20
    findings.push({
      id:               'reviews',
      label:            `${detectedReview} reviews detected and visible`,
      passed:           true,
      confidence:       'medium',
      confidenceReason: `${detectedReview} script found and rating markup confirmed in page source.`,
      impactWeight:     8,
      actionability:    'Low',
    })
  } else if (detectedReview && !hasVisibleRatings) {
    earned += 8
    findings.push({
      id:               'reviews-not-visible',
      label:            `${detectedReview} installed but ratings not visible site-wide`,
      passed:           false,
      partial:          true,
      confidence:       'medium',
      confidenceReason: `${detectedReview} script detected but no visible star rating markup found. Reviews may exist on product pages but are not surfaced site-wide.`,
      impactWeight:     8,
      actionability:    'Medium',
      fixTitle:         'Surface reviews and star ratings site-wide',
      fixRationale:     `${detectedReview} is installed but star ratings are not visible in page source. Cold paid traffic needs social proof at the decision point — not buried in a tab.`,
      fixOutcome:       'Displaying star ratings site-wide may increase purchase confidence for first-time visitors arriving from paid channels.',
      fixEffort:        'Low',
    })
  } else {
    findings.push({
      id:               'reviews-missing',
      label:            'No review platform detected',
      passed:           false,
      confidence:       'medium',
      confidenceReason: 'No known review platform or review schema found in page source.',
      impactWeight:     8,
      actionability:    'Medium',
      fixTitle:         'Add a product review platform',
      fixRationale:     'No reviews platform detected. Social proof is one of the highest-impact conversion levers for cold paid traffic.',
      fixOutcome:       'Adding reviews may increase purchase confidence for visitors who have no prior brand awareness.',
      fixEffort:        'Low',
    })
  }

  // ── Return / Refund policy page (15 pts) ─────────────────────────
  const policyUrls = [
    `https://${hostname}/policies/refund-policy`,
    `https://${hostname}/refund-policy`,
    `https://${hostname}/returns`,
    `https://${hostname}/return-policy`,
    `https://${hostname}/pages/returns`,
  ]

  const hasPolicyLink = $('a[href]').toArray().some(el => {
    const href = ($(el).attr('href') || '').toLowerCase()
    return href.includes('refund') || href.includes('return') || href.includes('policy')
  })

  const hasPolicyText = source.includes('refund policy') ||
                        source.includes('return policy') ||
                        source.includes('free returns') ||
                        source.includes('easy returns')

  if (hasPolicyLink || hasPolicyText) {
    earned += 15
    findings.push({
      id:               'return-policy',
      label:            'Return or refund policy referenced',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Return/refund policy link or text found on homepage.',
      impactWeight:     7,
      actionability:    'Low',
    })
  } else {
    // Try to actually fetch a known policy URL
    const policyAccessible = await urlAccessible(policyUrls[0])
    if (policyAccessible) {
      earned += 15
      findings.push({
        id:               'return-policy',
        label:            'Refund policy page accessible',
        passed:           true,
        confidence:       'high',
        confidenceReason: '/policies/refund-policy URL returned a successful response.',
        impactWeight:     7,
        actionability:    'Low',
      })
    } else {
      findings.push({
        id:               'return-policy-missing',
        label:            'Return or refund policy not found',
        passed:           false,
        confidence:       'medium',
        confidenceReason: 'No return policy link or text found on homepage or at common URLs.',
        impactWeight:     7,
        actionability:    'Low',
        fixTitle:         'Display return policy prominently',
        fixRationale:     'No return policy detected. For cold paid traffic, a clear return policy reduces purchase risk and likely increases conversion.',
        fixOutcome:       'A visible return policy may reduce purchase hesitation, particularly for higher AOV products.',
        fixEffort:        'Low',
      })
    }
  }

  // ── Shipping information (10 pts) ────────────────────────────────
  const hasShipping = source.includes('free shipping') ||
                      source.includes('free delivery') ||
                      source.includes('shipping policy') ||
                      source.includes('ships in') ||
                      source.includes('delivery time') ||
                      $('a[href*="shipping"]').length > 0

  if (hasShipping) {
    earned += 10
    findings.push({
      id:               'shipping',
      label:            'Shipping information referenced',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Shipping text or links found on homepage.',
      impactWeight:     5,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'shipping-missing',
      label:            'Shipping information not visible',
      passed:           false,
      confidence:       'medium',
      confidenceReason: 'No shipping info or links found on homepage.',
      impactWeight:     5,
      actionability:    'Low',
      fixTitle:         'Display shipping information prominently',
      fixRationale:     'Shipping cost and delivery time are two of the most common reasons shoppers abandon before checkout. Not showing this information creates unnecessary friction.',
      fixOutcome:       'Displaying shipping information upfront may reduce cart abandonment.',
      fixEffort:        'Low',
    })
  }

  // ── About page / Brand story (10 pts) ───────────────────────────
  const hasAbout = $('a[href*="about"]').length > 0 ||
                   $('a[href*="our-story"]').length > 0 ||
                   source.includes('/pages/about') ||
                   source.includes('our story') ||
                   source.includes('about us')

  if (hasAbout) {
    earned += 10
    findings.push({
      id:               'about',
      label:            'About page or brand story linked',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'About or brand story link found on homepage.',
      impactWeight:     3,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'about-missing',
      label:            'About page not detected',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'No about or brand story link found. May exist but not be linked from homepage.',
      impactWeight:     3,
      actionability:    'Low',
      fixTitle:         'Add an About or Brand Story page',
      fixRationale:     'No about page found. For cold paid traffic, brand credibility signals reduce purchase hesitation — particularly for DTC brands.',
      fixOutcome:       'A brand story page may improve trust for visitors with no prior brand exposure.',
      fixEffort:        'Low',
    })
  }

  // ── Security badges / Trust badges (5 pts) ──────────────────────
  const hasBadges = source.includes('secure checkout') ||
                    source.includes('ssl secure') ||
                    source.includes('norton') ||
                    source.includes('mcafee') ||
                    source.includes('trust badge') ||
                    source.includes('money-back guarantee') ||
                    source.includes('money back guarantee') ||
                    source.includes('guaranteed safe')

  if (hasBadges) {
    earned += 5
    findings.push({
      id:               'trust-badges',
      label:            'Security or trust badges detected',
      passed:           true,
      confidence:       'low',
      confidenceReason: 'Trust badge text or patterns found in page source.',
      impactWeight:     3,
      actionability:    'Low',
    })
  }

  const score = Math.round(Math.min(100, (earned / 80) * 100))

  return {
    bucket:       'trust',
    score,
    label:        scoreToLabel(score),
    earnedPoints: earned,
    maxPoints:    80,
    findings,
  }
}

function unavailable(reason: string): BucketScore {
  console.warn(`[trust] ${reason}`)
  return {
    bucket:       'trust',
    score:        0,
    label:        'High Friction',
    earnedPoints: 0,
    maxPoints:    80,
    findings:     [],
    unavailable:  true,
  }
}
