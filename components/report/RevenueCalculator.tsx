'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function RevenueCalculator() {
  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState('')
  const [cvr, setCvr]       = useState('')
  const [aov, setAov]       = useState('')
  const [lift, setLift]     = useState(10)

  const s  = parseFloat(sessions) || 0
  const c  = parseFloat(cvr) / 100 || 0
  const a  = parseFloat(aov) || 0

  const baseRevenue    = s * c * a
  const lowLift        = lift * 0.5
  const highLift       = lift * 1.0
  const lowDelta       = baseRevenue * (lowLift / 100)
  const highDelta      = baseRevenue * (highLift / 100)
  const hasResult      = s > 0 && c > 0 && a > 0

  return (
    <div>
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs font-medium text-muted
                   hover:text-primary transition-colors duration-150 group"
        aria-expanded={open}
        aria-controls="revenue-calculator"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <polyline
            points="2.5 5 7 9.5 11.5 5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Revenue Scenario Modeler
      </button>

      {open && (
        <Card className="mt-4">
          {/* Disclaimer */}
          <div className="bg-background border border-border rounded-sm px-3 py-2 mb-6">
            <p className="text-2xs text-muted leading-relaxed">
              This is a modeled scenario based on your inputs. Not a forecast.
              Results are illustrative only and depend on factors that are not
              detectable from public signals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

            {/* Monthly sessions */}
            <div>
              <label
                htmlFor="calc-sessions"
                className="block text-2xs font-mono label-track uppercase text-muted mb-1.5"
              >
                Monthly sessions
              </label>
              <input
                id="calc-sessions"
                type="number"
                min="0"
                placeholder="50000"
                value={sessions}
                onChange={e => setSessions(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-border
                           rounded-sm bg-background text-primary
                           focus:outline-none focus:ring-1 focus:ring-accent
                           placeholder:text-muted/50"
              />
            </div>

            {/* Conversion rate */}
            <div>
              <label
                htmlFor="calc-cvr"
                className="block text-2xs font-mono label-track uppercase text-muted mb-1.5"
              >
                Conversion rate (%)
              </label>
              <input
                id="calc-cvr"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="1.8"
                value={cvr}
                onChange={e => setCvr(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-border
                           rounded-sm bg-background text-primary
                           focus:outline-none focus:ring-1 focus:ring-accent
                           placeholder:text-muted/50"
              />
            </div>

            {/* AOV */}
            <div>
              <label
                htmlFor="calc-aov"
                className="block text-2xs font-mono label-track uppercase text-muted mb-1.5"
              >
                Avg. order value ($)
              </label>
              <input
                id="calc-aov"
                type="number"
                min="0"
                placeholder="95"
                value={aov}
                onChange={e => setAov(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-border
                           rounded-sm bg-background text-primary
                           focus:outline-none focus:ring-1 focus:ring-accent
                           placeholder:text-muted/50"
              />
            </div>
          </div>

          {/* Lift slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="calc-lift"
                className="text-2xs font-mono label-track uppercase text-muted"
              >
                Estimated friction improvement
              </label>
              <span className="font-mono text-xs text-primary">
                {lift}%
              </span>
            </div>
            <input
              id="calc-lift"
              type="range"
              min={5}
              max={30}
              step={1}
              value={lift}
              onChange={e => setLift(Number(e.target.value))}
              className="w-full accent-accent h-1 rounded-full cursor-pointer"
              aria-valuemin={5}
              aria-valuemax={30}
              aria-valuenow={lift}
              aria-valuetext={`${lift}% improvement scenario`}
            />
            <div className="flex justify-between text-2xs text-muted mt-1">
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Output */}
          {hasResult ? (
            <div className="border-t border-border pt-4">
              <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-3">
                Modeled scenario output
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-background border border-border rounded-sm px-4 py-3">
                  <p className="text-2xs text-muted mb-1">Current monthly baseline</p>
                  <p className="font-mono text-md text-primary">
                    {formatCurrency(baseRevenue)}
                  </p>
                </div>
                <div className="flex-1 bg-friction-low-bg border border-friction-low/20
                                rounded-sm px-4 py-3">
                  <p className="text-2xs text-muted mb-1">
                    Additional revenue (modeled range)
                  </p>
                  <p className="font-mono text-md text-friction-low">
                    {formatCurrency(lowDelta)} – {formatCurrency(highDelta)}
                  </p>
                </div>
              </div>

              <p className="text-2xs text-muted mt-3 leading-relaxed">
                Assumes conversion rate improvement of {lowLift.toFixed(0)}% to{' '}
                {highLift.toFixed(0)}% relative to your current rate. Actual
                results depend on implementation quality and factors not visible
                from public signals.
              </p>
            </div>
          ) : (
            <div className="border-t border-border pt-4">
              <p className="text-2xs text-muted">
                Enter all three inputs above to see the modeled scenario.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
