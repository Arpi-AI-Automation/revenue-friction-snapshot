import { safeFetchJson } from '@/lib/security/safeFetch'
import type { BucketScore, Finding } from '@/lib/types'
import { scoreToLabel } from './scoring'

interface PageSpeedCategory {
  score: number | null
}

interface PageSpeedAudit {
  score:       number | null
  numericValue?: number
  displayValue?: string
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: PageSpeedCategory
    }
    audits?: {
      'largest-contentful-paint'?: PageSpeedAudit
      'total-blocking-time'?:      PageSpeedAudit
      'cumulative-layout-shift'?:  PageSpeedAudit
      'speed-index'?:              PageSpeedAudit
      'interactive'?:              PageSpeedAudit
      'first-contentful-paint'?:   PageSpeedAudit
      'server-response-time'?:     PageSpeedAudit
      'total-byte-weight'?:        PageSpeedAudit
      'render-blocking-resources'?: PageSpeedAudit
      'uses-optimized-images'?:    PageSpeedAudit
    }
  }
}

export async function auditSpeed(hostname: string): Promise<BucketScore> {
  const apiKey = process.env.PAGESPEED_API_KEY

  if (!apiKey) {
    return unavailable('PAGESPEED_API_KEY not configured.')
  }

  let data: PageSpeedResponse
  try {
    const url =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
      `?url=https://${hostname}&strategy=mobile&key=${apiKey}` +
      `&category=performance`

    data = await safeFetchJson<PageSpeedResponse>(url, { timeoutMs: 25_000 })
  } catch {
    return unavailable('PageSpeed API request failed or timed out.')
  }

  const audits = data.lighthouseResult?.audits
  if (!audits) return unavailable('No audit data returned.')

  const findings: Finding[] = []
  let earned = 0
  const max = 100

  // ── LCP Mobile (30 pts) ─────────────────────────────────────────
  const lcpAudit = audits['largest-contentful-paint']
  const lcpMs    = lcpAudit?.numericValue ?? null
  const lcpSec   = lcpMs !== null ? lcpMs / 1000 : null

  if (lcpSec !== null) {
    const pass    = lcpSec <= 2.5
    const partial = !pass && lcpSec <= 4.0
    const pts     = pass ? 30 : partial ? 15 : 0
    earned += pts
    findings.push({
      id:               'lcp',
      label:            `LCP (mobile): ${lcpSec.toFixed(1)}s ${pass ? '(good)' : lcpSec <= 4 ? '(needs improvement)' : '(poor)'}`,
      passed:           pass,
      partial:          partial && !pass,
      confidence:       'high',
      confidenceReason: 'Measured directly by Google PageSpeed Insights API.',
      impactWeight:     10,
      actionability:    'Medium',
      fixTitle:         pass ? undefined : 'Improve Largest Contentful Paint',
      fixRationale:     pass ? undefined : `LCP of ${lcpSec.toFixed(1)}s exceeds the 2.5s threshold. This is the primary metric Google uses to measure perceived load speed for paid traffic landing pages.`,
      fixOutcome:       pass ? undefined : 'Reducing LCP may improve conversion rate for paid traffic by reducing the perceived wait time before content is visible.',
      fixEffort:        'Medium',
    })
  }

  // ── CLS (20 pts) ────────────────────────────────────────────────
  const clsAudit = audits['cumulative-layout-shift']
  const clsScore = clsAudit?.numericValue ?? null

  if (clsScore !== null) {
    const pass    = clsScore <= 0.1
    const partial = !pass && clsScore <= 0.25
    const pts     = pass ? 20 : partial ? 10 : 0
    earned += pts
    findings.push({
      id:               'cls',
      label:            `CLS: ${clsScore.toFixed(3)} ${pass ? '(good)' : clsScore <= 0.25 ? '(needs improvement)' : '(poor)'}`,
      passed:           pass,
      partial:          partial && !pass,
      confidence:       'high',
      confidenceReason: 'Measured directly by Google PageSpeed Insights API.',
      impactWeight:     7,
      actionability:    'Medium',
      fixTitle:         pass ? undefined : 'Reduce Cumulative Layout Shift',
      fixRationale:     pass ? undefined : `CLS of ${clsScore.toFixed(3)} indicates elements are shifting after load. This disrupts the visitor experience and likely increases bounce rate.`,
      fixOutcome:       pass ? undefined : 'Fixing layout shift may reduce accidental taps/clicks and improve add-to-cart rates on mobile.',
      fixEffort:        'Medium',
    })
  }

  // ── TTFB (15 pts) ───────────────────────────────────────────────
  const ttfbAudit = audits['server-response-time']
  const ttfbMs    = ttfbAudit?.numericValue ?? null

  if (ttfbMs !== null) {
    const pass    = ttfbMs <= 600
    const partial = !pass && ttfbMs <= 1500
    const pts     = pass ? 15 : partial ? 7 : 0
    earned += pts
    findings.push({
      id:               'ttfb',
      label:            `TTFB: ${Math.round(ttfbMs)}ms ${pass ? '(good)' : ttfbMs <= 1500 ? '(slow)' : '(very slow)'}`,
      passed:           pass,
      partial:          partial && !pass,
      confidence:       'high',
      confidenceReason: 'Server response time measured by PageSpeed Insights.',
      impactWeight:     6,
      actionability:    'High',
      fixTitle:         pass ? undefined : 'Reduce Server Response Time',
      fixRationale:     pass ? undefined : `TTFB of ${Math.round(ttfbMs)}ms slows every subsequent resource. Common causes: unoptimised hosting, no CDN, or slow database queries.`,
      fixOutcome:       pass ? undefined : 'Improving TTFB may reduce overall load time and positively affect all Core Web Vitals.',
      fixEffort:        'High',
    })
  }

  // ── Page weight (20 pts) ─────────────────────────────────────────
  const weightAudit = audits['total-byte-weight']
  const weightBytes = weightAudit?.numericValue ?? null

  if (weightBytes !== null) {
    const weightMb = weightBytes / 1_048_576
    const pass     = weightMb <= 2
    const partial  = !pass && weightMb <= 4
    const pts      = pass ? 20 : partial ? 10 : 0
    earned += pts
    findings.push({
      id:               'weight',
      label:            `Page weight: ${weightMb.toFixed(1)}MB ${pass ? '(good)' : weightMb <= 4 ? '(heavy)' : '(very heavy)'}`,
      passed:           pass,
      partial:          partial && !pass,
      confidence:       'high',
      confidenceReason: 'Total byte weight measured by PageSpeed Insights.',
      impactWeight:     5,
      actionability:    'Medium',
      fixTitle:         pass ? undefined : 'Reduce Total Page Weight',
      fixRationale:     pass ? undefined : `Page transfers ${weightMb.toFixed(1)}MB. Oversized pages slow load on mobile connections and increase bounce rate before content is visible.`,
      fixOutcome:       pass ? undefined : 'Compressing images and removing unused scripts may improve load speed, particularly for mobile visitors on 4G.',
      fixEffort:        'Medium',
    })
  }

  // ── Render-blocking resources (15 pts) ──────────────────────────
  const rbAudit  = audits['render-blocking-resources']
  const rbScore  = rbAudit?.score ?? null

  if (rbScore !== null) {
    const pass = rbScore >= 0.9
    const pts  = pass ? 15 : rbScore >= 0.5 ? 7 : 0
    earned += pts
    findings.push({
      id:               'render-blocking',
      label:            `Render-blocking resources: ${pass ? 'none detected' : 'present'}`,
      passed:           pass,
      partial:          !pass && rbScore >= 0.5,
      confidence:       'high',
      confidenceReason: 'Detected by PageSpeed Insights audit.',
      impactWeight:     5,
      actionability:    'Medium',
      fixTitle:         pass ? undefined : 'Remove or defer render-blocking resources',
      fixRationale:     pass ? undefined : 'Scripts or stylesheets are blocking the browser from rendering the page. This delays the first visible content for the visitor.',
      fixOutcome:       pass ? undefined : 'Deferring non-critical JS and CSS may reduce time to first paint and improve LCP.',
      fixEffort:        'Medium',
    })
  }

  const score = Math.round((earned / max) * 100)

  return {
    bucket:       'speed',
    score:        Math.min(100, score),
    label:        scoreToLabel(score),
    earnedPoints: earned,
    maxPoints:    max,
    findings,
  }
}

function unavailable(reason: string): BucketScore {
  console.warn(`[speed] ${reason}`)
  return {
    bucket:       'speed',
    score:        0,
    label:        'High Friction',
    earnedPoints: 0,
    maxPoints:    100,
    findings:     [],
    unavailable:  true,
  }
}
