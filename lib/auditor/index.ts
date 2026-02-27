import type { BucketScore, Platform, ReportData } from '@/lib/types'
import { detectPlatform }      from './platform'
import { auditSpeed }          from './speed'
import { auditTracking }       from './tracking'
import { auditFunnel }         from './funnel'
import { auditTrust }          from './trust'
import { deriveTopFixes, deriveReportStatus, deriveCompositeScore } from './scoring'

export async function runAudit(
  slug: string,
  hostname: string
): Promise<ReportData> {
  // 1. Detect platform (used by funnel auditor)
  const platform: Platform = await detectPlatform(hostname)

  // 2. Run all 4 buckets in parallel — never let one failure block the rest
  const [speedResult, trackingResult, funnelResult, trustResult] =
    await Promise.allSettled([
      auditSpeed(hostname),
      auditTracking(hostname),
      auditFunnel(hostname, platform),
      auditTrust(hostname),
    ])

  function unwrap(
    result: PromiseSettledResult<BucketScore>,
    bucket: BucketScore['bucket']
  ): BucketScore {
    if (result.status === 'fulfilled') return result.value
    console.error(`[auditor] ${bucket} bucket failed:`, result.reason)
    return {
      bucket,
      score:        0,
      label:        'High Friction',
      earnedPoints: 0,
      maxPoints:    100,
      findings:     [],
      unavailable:  true,
    }
  }

  const buckets: BucketScore[] = [
    unwrap(speedResult,    'speed'),
    unwrap(trackingResult, 'tracking'),
    unwrap(funnelResult,   'funnel'),
    unwrap(trustResult,    'trust'),
  ]

  const topFixes      = deriveTopFixes(buckets)
  const status        = deriveReportStatus(buckets)
  const compositeScore = deriveCompositeScore(buckets)

  return {
    slug,
    domain:      hostname,
    platform,
    generatedAt: new Date().toISOString(),
    status,
    buckets,
    topFixes,
    compositeScore,
  }
}
