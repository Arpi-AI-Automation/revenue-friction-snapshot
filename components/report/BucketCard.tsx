import type { BucketScore, FrictionLevel } from '@/lib/types'
import ScoreRing from './ScoreRing'
import FindingRow from './FindingRow'
import Card from '@/components/ui/Card'

interface BucketCardProps {
  data: BucketScore
}

const BUCKET_LABEL: Record<BucketScore['bucket'], string> = {
  speed:    'Speed & Load Behavior',
  tracking: 'Tracking & Attribution',
  funnel:   'Funnel Structure',
  trust:    'Trust & Clarity',
}

const LEVEL_CLASS: Record<FrictionLevel, string> = {
  'Low Friction':      'text-friction-low',
  'Moderate Friction': 'text-friction-mid',
  'High Friction':     'text-friction-high',
}

export default function BucketCard({ data }: BucketCardProps) {
  const { bucket, score, label, findings, unavailable } = data

  return (
    <Card as="article" className="flex flex-col gap-4"
      {...{ 'aria-label': `${BUCKET_LABEL[bucket]}: ${label}` }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xs font-mono label-track uppercase text-muted mb-1">
            {BUCKET_LABEL[bucket]}
          </p>
          {unavailable ? (
            <p className="text-xs text-muted italic">Data unavailable</p>
          ) : (
            <p className={`text-xs font-medium ${LEVEL_CLASS[label]}`}>
              {label}
            </p>
          )}
        </div>

        {!unavailable && (
          <div className="flex-shrink-0">
            <ScoreRing score={score} level={label} />
          </div>
        )}

        {unavailable && (
          <div className="w-20 h-20 border border-border rounded-sm flex items-center
                          justify-center text-2xs text-muted font-mono">
            N/A
          </div>
        )}
      </div>

      {/* Score label in mono below ring */}
      {!unavailable && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">
            {score}<span className="text-border">/100</span>
          </span>
        </div>
      )}

      {/* Findings */}
      {!unavailable && findings.length > 0 && (
        <ul className="mt-1" aria-label="Findings">
          {findings.map(f => (
            <FindingRow key={f.id} finding={f} />
          ))}
        </ul>
      )}

      {unavailable && (
        <p className="text-2xs text-muted leading-relaxed">
          Could not retrieve data for this section. This may be due to a
          timeout or API unavailability. Regenerate the snapshot to retry.
        </p>
      )}
    </Card>
  )
}
