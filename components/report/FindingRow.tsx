import type { Finding } from '@/lib/types'
import ConfidenceChip from './ConfidenceChip'

interface FindingRowProps {
  finding: Finding
}

export default function FindingRow({ finding }: FindingRowProps) {
  const { passed, partial, label, confidence, confidenceReason } = finding

  const statusColor = passed
    ? 'text-friction-low'
    : partial
    ? 'text-friction-mid'
    : 'text-friction-high'

  const StatusIcon = () => {
    if (passed) return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           aria-hidden="true" className="text-friction-low flex-shrink-0 mt-0.5">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
        <polyline points="4.5 7 6 8.5 9.5 5.5" stroke="currentColor" strokeWidth="1.25"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
    if (partial) return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           aria-hidden="true" className="text-friction-mid flex-shrink-0 mt-0.5">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
        <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.25"
          strokeLinecap="round"/>
      </svg>
    )
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           aria-hidden="true" className="text-friction-high flex-shrink-0 mt-0.5">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
        <line x1="4.5" y1="4.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.25"
          strokeLinecap="round"/>
        <line x1="9.5" y1="4.5" x2="4.5" y2="9.5" stroke="currentColor" strokeWidth="1.25"
          strokeLinecap="round"/>
      </svg>
    )
  }

  return (
    <li className="flex items-start justify-between gap-3 py-2.5 border-b
                   border-border last:border-0">
      <div className="flex items-start gap-2 min-w-0">
        <StatusIcon />
        <span className={`text-2xs leading-relaxed ${statusColor}`}>
          {label}
        </span>
      </div>
      <div className="flex-shrink-0">
        <ConfidenceChip level={confidence} reason={confidenceReason} />
      </div>
    </li>
  )
}
