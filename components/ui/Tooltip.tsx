'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!visible || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPosition(rect.top < 80 ? 'bottom' : 'top')
  }, [visible])

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {visible && (
        <span
          role="tooltip"
          className={`
            absolute z-50 left-1/2 -translate-x-1/2
            w-max max-w-[200px] px-2.5 py-1.5
            bg-primary text-background text-2xs leading-relaxed
            rounded-sm pointer-events-none
            ${position === 'top'
              ? 'bottom-full mb-1.5'
              : 'top-full mt-1.5'}
          `}
        >
          {content}
        </span>
      )}
    </span>
  )
}
