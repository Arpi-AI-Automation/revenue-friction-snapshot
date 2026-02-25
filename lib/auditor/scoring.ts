import type {
  BucketScore,
  Finding,
  FrictionLevel,
  PriorityFix,
  Confidence,
  Effort,
} from '@/lib/types'

export function scoreToLabel(score: number): FrictionLevel {
  if (score >= 70) return 'Low Friction'
  if (score >= 40) return 'Moderate Friction'
  return 'High Friction'
}

interface ScoredFinding {
  finding:    Finding
  bucket:     BucketScore['bucket']
  priority:   number
}

function confidenceScore(c: Confidence): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1
}

function effortScore(e: Effort): number {
  // Lower effort = higher priority score (easier wins first)
  return e === 'Low' ? 3 : e === 'Medium' ? 2 : 1
}

export function deriveTopFixes(buckets: BucketScore[]): PriorityFix[] {
  const candidates: ScoredFinding[] = []

  for (const bucket of buckets) {
    if (bucket.unavailable) continue

    for (const finding of bucket.findings) {
      // Only failed or partial findings with a fix defined
      if (finding.passed) continue
      if (!finding.fixTitle || !finding.fixRationale || !finding.fixOutcome) continue

      const priority =
        finding.impactWeight     * 3 +
        confidenceScore(finding.confidence) * 2 +
        effortScore(finding.fixEffort ?? 'High') * 1

      candidates.push({ finding, bucket: bucket.bucket, priority })
    }
  }

  // Sort descending by priority score, take top 3
  candidates.sort((a, b) => b.priority - a.priority)
  const top = candidates.slice(0, 3)

  return top.map((c, i) => ({
    id:               `fix-${i + 1}`,
    title:            c.finding.fixTitle!,
    rationale:        c.finding.fixRationale!,
    outcome:          c.finding.fixOutcome!,
    effort:           c.finding.fixEffort ?? 'Medium',
    confidence:       c.finding.confidence,
    confidenceReason: c.finding.confidenceReason,
  }))
}

export function deriveReportStatus(
  buckets: BucketScore[]
): 'complete' | 'partial' {
  const unavailableCount = buckets.filter(b => b.unavailable).length
  return unavailableCount > 0 ? 'partial' : 'complete'
}
