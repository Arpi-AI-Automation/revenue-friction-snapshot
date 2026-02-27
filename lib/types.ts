// ─── Enums / Unions ──────────────────────────────────────────────────────────

export type Confidence    = 'high' | 'medium' | 'low'
export type FrictionLevel = 'Low Friction' | 'Moderate Friction' | 'High Friction'
export type Platform      = 'shopify' | 'generic'
export type ReportStatus  = 'complete' | 'partial' | 'pending' | 'error'
export type Effort        = 'Low' | 'Medium' | 'High'
export type BucketKey     = 'speed' | 'tracking' | 'funnel' | 'trust'

// ─── Finding ─────────────────────────────────────────────────────────────────

export interface Finding {
  id:               string
  label:            string           // e.g. "LCP Mobile: 5.8s"
  passed:           boolean
  partial?:         boolean          // detected but incomplete/ambiguous
  confidence:       Confidence
  confidenceReason: string           // shown in tooltip
  impactWeight:     number           // 1–10, used in Top 3 derivation
  actionability:    Effort
  // Only populated on failed/partial findings:
  fixTitle?:        string
  fixRationale?:    string
  fixOutcome?:      string           // hedged language always
  fixEffort?:       Effort
}

// ─── Bucket ──────────────────────────────────────────────────────────────────

export interface BucketScore {
  bucket:        BucketKey
  score:         number              // 0–100
  label:         FrictionLevel
  earnedPoints:  number
  maxPoints:     number
  findings:      Finding[]
  unavailable?:  boolean             // true if data could not be fetched
}

// ─── Priority Fix ────────────────────────────────────────────────────────────

export interface PriorityFix {
  id:               string
  title:            string
  rationale:        string
  outcome:          string           // always hedged: "may", "likely", "indicates"
  effort:           Effort
  confidence:       Confidence
  confidenceReason: string
}

// ─── Report ──────────────────────────────────────────────────────────────────

export interface ReportData {
  slug:           string
  domain:         string
  platform:       Platform
  generatedAt:    string                // ISO 8601
  status:         ReportStatus
  buckets:        BucketScore[]
  topFixes:       PriorityFix[]
  compositeScore: number                // 0-100 weighted average across buckets
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface AuditRequest {
  domain: string
}

export interface AuditResponse {
  slug: string
  url:  string
}

export interface ApiError {
  error: string
  code?:  string
}
