import { safeFetchText } from '@/lib/security/safeFetch'
import { load } from 'cheerio'
import type { BucketScore, Finding } from '@/lib/types'
import { scoreToLabel } from './scoring'

export async function auditTracking(hostname: string): Promise<BucketScore> {
  let html: string
  try {
    html = await safeFetchText(`https://${hostname}`, { timeoutMs: 8_000 })
  } catch {
    return unavailable('Could not fetch homepage HTML.')
  }

  const $ = load(html)
  const source = html.toLowerCase()
  const scripts: string[] = []
  $('script').each((_, el) => {
    const src = $(el).attr('src') || ''
    const inline = $(el).html() || ''
    scripts.push(src.toLowerCase(), inline.toLowerCase())
  })
  const allScripts = scripts.join('\n')

  const findings: Finding[] = []
  let earned = 0

  // ── Google Analytics / GA4 (20 pts) ─────────────────────────────
  const hasGA4 = allScripts.includes('gtag') ||
                 allScripts.includes('googletagmanager.com') ||
                 allScripts.includes('google-analytics.com/g/')
  const hasUAOnly = !hasGA4 &&
                (allScripts.includes('google-analytics.com/analytics.js') ||
                 allScripts.includes('ua-'))

  if (hasGA4) {
    earned += 20
    findings.push({
      id:               'ga4',
      label:            'Google Analytics 4 detected',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'GA4 tag or gtag.js detected in page source. Does not confirm events are firing correctly.',
      impactWeight:     8,
      actionability:    'Low',
    })
  } else if (hasUAOnly) {
    earned += 8
    findings.push({
      id:               'ga-ua',
      label:            'Universal Analytics detected (GA4 not found)',
      passed:           false,
      partial:          true,
      confidence:       'medium',
      confidenceReason: 'analytics.js detected. UA was sunset in 2023 — data may no longer be collected.',
      impactWeight:     8,
      actionability:    'Medium',
      fixTitle:         'Migrate from Universal Analytics to GA4',
      fixRationale:     'Universal Analytics stopped processing data in 2023. If this is still the only analytics tag, you have no conversion data.',
      fixOutcome:       'Migrating to GA4 may restore visibility into traffic source performance and conversion attribution.',
      fixEffort:        'Low',
    })
  } else {
    findings.push({
      id:               'ga-missing',
      label:            'No Google Analytics detected',
      passed:           false,
      confidence:       'medium',
      confidenceReason: 'No GA4 or GTM tag found in page source. Server-side tracking cannot be verified.',
      impactWeight:     8,
      actionability:    'Low',
      fixTitle:         'Install Google Analytics 4',
      fixRationale:     'No analytics tag detected. Without analytics, paid traffic performance cannot be measured or optimised.',
      fixOutcome:       'Installing GA4 may enable traffic source attribution and conversion tracking.',
      fixEffort:        'Low',
    })
  }

  // ── Meta Pixel (20 pts) ──────────────────────────────────────────
  const hasMeta = allScripts.includes('connect.facebook.net') ||
                  allScripts.includes('fbevents.js') ||
                  source.includes('fbq(') ||
                  source.includes('"pixel_id"')

  if (hasMeta) {
    earned += 20
    findings.push({
      id:               'meta-pixel',
      label:            'Meta Pixel detected',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Meta Pixel script found in page source. Event firing and server-side API not verifiable from public signals.',
      impactWeight:     9,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'meta-pixel-missing',
      label:            'Meta Pixel not detected',
      passed:           false,
      confidence:       'medium',
      confidenceReason: 'No Meta Pixel found in page source. Server-side Conversions API cannot be confirmed either way.',
      impactWeight:     9,
      actionability:    'Low',
      fixTitle:         'Install or verify Meta Pixel',
      fixRationale:     'No Meta Pixel detected. For paid social campaigns this means no attribution data and no audience data for retargeting.',
      fixOutcome:       'A correctly installed pixel may improve ad attribution and allow retargeting audiences to be built.',
      fixEffort:        'Low',
    })
  }

  // ── Google Ads tag (15 pts) ──────────────────────────────────────
  const hasGAds = allScripts.includes('googleadservices.com') ||
                  allScripts.includes('google_conversion') ||
                  allScripts.includes('aw-') ||
                  (allScripts.includes('gtag') && allScripts.includes('aw-'))

  if (hasGAds) {
    earned += 15
    findings.push({
      id:               'google-ads',
      label:            'Google Ads conversion tag detected',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'Google Ads tag found in source. Conversion events are not verifiable from public signals.',
      impactWeight:     8,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'google-ads-missing',
      label:            'Google Ads conversion tag not detected',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'No Google Ads tag found in page source. May be loaded server-side or via GTM.',
      impactWeight:     8,
      actionability:    'Low',
      fixTitle:         'Verify Google Ads conversion tracking',
      fixRationale:     'No Google Ads tag found in public source. If running Google Ads without conversion tracking, bidding algorithms cannot optimise for revenue.',
      fixOutcome:       'Verified conversion tracking may allow smart bidding to optimise toward revenue events.',
      fixEffort:        'Low',
    })
  }

  // ── Email platform (15 pts) ──────────────────────────────────────
  const hasKlaviyo   = allScripts.includes('klaviyo') || source.includes('klaviyo')
  const hasOmnisend  = allScripts.includes('omnisend')
  const hasMailchimp = allScripts.includes('mailchimp') || allScripts.includes('mc.js')
  const hasPostscript = allScripts.includes('postscript') || source.includes('postscript.io')
  const hasEmail     = hasKlaviyo || hasOmnisend || hasMailchimp || hasPostscript

  const emailPlatform = hasKlaviyo ? 'Klaviyo' :
                        hasOmnisend ? 'Omnisend' :
                        hasMailchimp ? 'Mailchimp' :
                        hasPostscript ? 'Postscript' : null

  if (hasEmail) {
    earned += 15
    findings.push({
      id:               'email-platform',
      label:            `${emailPlatform} detected`,
      passed:           true,
      confidence:       'medium',
      confidenceReason: `${emailPlatform} script found in page source.`,
      impactWeight:     6,
      actionability:    'Low',
    })
  } else {
    findings.push({
      id:               'email-platform-missing',
      label:            'No email platform detected',
      passed:           false,
      confidence:       'low',
      confidenceReason: 'No recognised email platform script found. May be loaded server-side.',
      impactWeight:     6,
      actionability:    'Low',
      fixTitle:         'Verify email capture is active',
      fixRationale:     'No email platform detected in page source. Email capture is one of the highest-ROI channels for recovering abandoned carts from paid traffic.',
      fixOutcome:       'Active email capture may improve recovery of visitors who do not convert on the first visit.',
      fixEffort:        'Low',
    })
  }

  // ── Duplicate analytics tags (−10 pts if present) ───────────────
  const gtagMatches = (allScripts.match(/gtag\(/g) || []).length
  const hasDuplicates = gtagMatches > 4 // more than a few calls suggests multiple instances

  if (hasDuplicates) {
    earned = Math.max(0, earned - 10)
    findings.push({
      id:               'duplicate-tags',
      label:            'Possible duplicate analytics tags detected',
      passed:           false,
      partial:          true,
      confidence:       'low',
      confidenceReason: 'Multiple gtag() calls found. May indicate duplicate tag installations causing inflated event counts.',
      impactWeight:     7,
      actionability:    'Medium',
      fixTitle:         'Audit for duplicate tracking tags',
      fixRationale:     'Multiple analytics calls detected in source. Duplicate tags inflate conversion counts, skew attribution data, and cause incorrect bidding signals.',
      fixOutcome:       'Removing duplicate tags may restore accurate conversion data and prevent over-reporting.',
      fixEffort:        'Low',
    })
  }

  // ── TikTok Pixel (10 pts) ────────────────────────────────────────
  const hasTikTok = allScripts.includes('analytics.tiktok.com') ||
                    allScripts.includes('ttq.') ||
                    source.includes('tiktok pixel')

  if (hasTikTok) {
    earned += 10
    findings.push({
      id:               'tiktok-pixel',
      label:            'TikTok Pixel detected',
      passed:           true,
      confidence:       'medium',
      confidenceReason: 'TikTok Pixel script found in page source.',
      impactWeight:     5,
      actionability:    'Low',
    })
  }

  const score = Math.round(Math.min(100, (earned / 80) * 100))

  return {
    bucket:       'tracking',
    score,
    label:        scoreToLabel(score),
    earnedPoints: earned,
    maxPoints:    80,
    findings,
  }
}

function unavailable(reason: string): BucketScore {
  console.warn(`[tracking] ${reason}`)
  return {
    bucket:       'tracking',
    score:        0,
    label:        'High Friction',
    earnedPoints: 0,
    maxPoints:    80,
    findings:     [],
    unavailable:  true,
  }
}
