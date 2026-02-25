'use client'

import { useEffect, useState } from 'react'
import type { BucketScore, FrictionLevel } from '@/lib/types'

interface StickyHeaderProps {
  domain: string
  buckets: BucketScore[]
}

const LEVEL_DOT: Record<FrictionLevel, string> = {
  'Low Friction':      'bg-friction-low',
  'Moderate Friction': 'bg-friction-mid',
  'High Friction':     'bg-friction-high',
}

export default function StickyHeader({ domain, buckets }: StickyHeaderProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 160)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm
                  border-b border-border transition-all duration-300
                  ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
      aria-hidden={!visible}
    >
      <div className="content-wrap py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-serif text-sm text-primary tracking-wide flex-shrink-0">
            ARPI<span className="text-accent">.</span>
          </span>
          <span className="text-border" aria-hidden="true">/</span>
          <span className="text-xs text-muted font-mono truncate">
            {domain}
          </span>
        </div>

        {/* Bucket dots */}
        <div className="flex items-center gap-2 flex-shrink-0" aria-label="Friction summary">
          {buckets.map(b => (
            <div key={b.bucket} className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${LEVEL_DOT[b.label]}`}
                title={`${b.bucket}: ${b.label} (${b.score}/100)`}
              />
              <span className="text-2xs font-mono text-muted hidden sm:inline">
                {b.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
