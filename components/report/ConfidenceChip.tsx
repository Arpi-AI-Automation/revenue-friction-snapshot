import type { Confidence } from '@/lib/types'
import Tooltip from '@/components/ui/Tooltip'

interface ConfidenceChipProps {
  level: Confidence
  reason: string
}

const LABEL: Record<Confidence, string> = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
}

const CLASS: Record<Confidence, string> = {
  high:   'chip-high',
  medium: 'chip-medium',
  low:    'chip-low',
}

export default function ConfidenceChip({ level, reason }: ConfidenceChipProps) {
  return (
    <Tooltip content={reason}>
      <span className={`chip ${CLASS[level]}`} aria-label={`${LABEL[level]} confidence. ${reason}`}>
        {LABEL[level]}
      </span>
    </Tooltip>
  )
}
