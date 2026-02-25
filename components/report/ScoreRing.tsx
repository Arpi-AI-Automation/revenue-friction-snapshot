import type { FrictionLevel } from '@/lib/types'

interface ScoreRingProps {
  score: number
  level: FrictionLevel
  size?: number
}

const LEVEL_COLOR: Record<FrictionLevel, string> = {
  'Low Friction':      '#2D6A4F',
  'Moderate Friction': '#B45309',
  'High Friction':     '#991B1B',
}

export default function ScoreRing({ score, level, size = 80 }: ScoreRingProps) {
  const strokeWidth = 5
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const fill = Math.max(0, Math.min(100, score)) / 100 * circumference
  const color = LEVEL_COLOR[level]

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Score: ${score} out of 100. ${level}.`}
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#E5E2DC"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${fill} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Score number */}
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontSize="16"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="500"
        fill={color}
      >
        {score}
      </text>
    </svg>
  )
}
