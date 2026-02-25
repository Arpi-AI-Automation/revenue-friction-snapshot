import type { PriorityFix } from '@/lib/types'
import ConfidenceChip from './ConfidenceChip'
import Card from '@/components/ui/Card'

interface PriorityFixCardProps {
  fix: PriorityFix
  number: number
}

const EFFORT_CLASS = {
  Low:    'text-friction-low bg-friction-low-bg border-friction-low/20',
  Medium: 'text-friction-mid bg-friction-mid-bg border-amber-200',
  High:   'text-friction-high bg-friction-high-bg border-red-200',
}

export default function PriorityFixCard({ fix, number }: PriorityFixCardProps) {
  const { title, rationale, outcome, effort, confidence, confidenceReason } = fix

  return (
    <Card as="li">
      <div className="flex items-start gap-4">

        {/* Number */}
        <span
          className="font-mono text-xs text-accent-dim flex-shrink-0 w-5 mt-0.5"
          aria-label={`Priority ${number}`}
        >
          {String(number).padStart(2, '0')}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Title */}
          <h3 className="text-xs font-medium text-primary mb-2">
            {title}
          </h3>

          {/* Rationale */}
          <p className="text-2xs text-muted leading-relaxed mb-3">
            {rationale}
          </p>

          {/* Outcome — hedged */}
          <div className="bg-background border border-border rounded-sm px-3 py-2 mb-3">
            <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-0.5">
              Expected outcome
            </p>
            <p className="text-2xs text-muted leading-relaxed">
              {outcome}
            </p>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`chip border text-2xs ${EFFORT_CLASS[effort]}`}
              aria-label={`Effort: ${effort}`}
            >
              {effort} effort
            </span>
            <ConfidenceChip level={confidence} reason={confidenceReason} />
          </div>

        </div>
      </div>
    </Card>
  )
}
