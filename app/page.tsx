'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ─── Section: Analysis categories ───────────────────────────────────────────

const CATEGORIES = [
  {
    title: 'Speed & Load Behavior',
    description: 'LCP, CLS, TTFB, and page weight scored against paid traffic benchmarks.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.25"/>
        <polyline points="9 5 9 9 12 11" stroke="currentColor" strokeWidth="1.25"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Tracking & Attribution Signals',
    description: 'Pixel and analytics tag presence. Event firing is not verifiable from public signals.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <polyline points="1.5 9 5.5 9 7.5 14.5 10.5 3.5 12.5 9 16.5 9"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Funnel Structure',
    description: 'Product, cart, and checkout accessibility plus navigation depth from landing page.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1.5" y="2.5" width="15" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="1.5" y="8"   width="10" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="1.5" y="13.5" width="6" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    title: 'Trust & Clarity Indicators',
    description: 'SSL status, review platforms, return policy, and social proof signals.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 1.5L2.5 4.5v5c0 4 3 6.5 6.5 7 3.5-.5 6.5-3 6.5-7v-5L9 1.5z"
          stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <polyline points="6 9 8 11 12 7" stroke="currentColor" strokeWidth="1.25"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const STEPS = [
  { num: '01', label: 'Enter a domain', detail: 'No login. No scraping behind auth.' },
  { num: '02', label: 'Snapshot is generated', detail: 'Public signals are collected and scored across four friction areas.' },
  { num: '03', label: 'Review friction areas', detail: 'A prioritized breakdown with confidence ratings and suggested fixes.' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const raw = domain.trim().toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')

    if (!raw || !raw.includes('.')) {
      setError('Enter a valid domain, e.g. brand.com')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: raw }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Something went wrong.')
        router.push(`/r/${data.slug}`)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  return (
    <main className="min-h-screen flex flex-col">

      {/* ── Nav ── */}
      <header className="border-b border-border">
        <div className="content-wrap py-4 flex items-center justify-between">
          <span className="font-serif text-lg text-primary tracking-wide">
            ARPI<span className="text-accent">.</span>
          </span>
          <span className="text-2xs text-muted font-mono label-track uppercase">
            Revenue Friction Snapshot
          </span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="section flex-1">
        <div className="content-wrap">
          <div className="max-w-[560px] mx-auto text-center">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-5 h-px bg-accent-dim" />
              <span className="text-2xs font-mono label-track uppercase text-accent-dim">
                Ecommerce Conversion Diagnostic
              </span>
              <span className="w-5 h-px bg-accent-dim" />
            </div>

            {/* Headline */}
            <h1 className="font-serif text-lg sm:text-xl text-primary mb-4 leading-tight">
              Revenue Friction Snapshot
            </h1>

            {/* Subheadline */}
            <p className="text-sm text-muted mb-10 leading-relaxed max-w-[420px] mx-auto">
              Identify conversion friction across speed, funnel flow, and tracking
              before scaling paid traffic.
            </p>

            {/* Input block */}
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
              <div className="w-full max-w-sm">
                <label htmlFor="domain-input" className="sr-only">
                  Enter store domain
                </label>
                <Input
                  id="domain-input"
                  type="text"
                  placeholder="brand.com"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={isPending}
                  aria-describedby={error ? 'domain-error' : undefined}
                  className="text-center"
                />
              </div>

              {error && (
                <p id="domain-error" role="alert" className="text-xs text-friction-high">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending || !domain.trim()}
                loading={isPending}
                className="w-full max-w-sm"
              >
                {isPending ? 'Generating snapshot...' : 'Generate Snapshot'}
              </Button>

              {/* Trust line */}
              <p className="text-2xs text-muted mt-1">
                Public signals only. No login required.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="divider" />

      {/* ── What It Analyzes ── */}
      <section className="section">
        <div className="content-wrap">

          <div className="mb-8">
            <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-2">
              What it analyzes
            </p>
            <h2 className="text-md font-sans font-medium text-primary">
              Four friction areas. One structured view.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.title}
                className={`bg-surface border border-border p-inner rounded-sm
                           hover:shadow-card-hover transition-shadow duration-200
                           animate-fade-up stagger-${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-accent-dim flex-shrink-0">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-primary mb-1">
                      {cat.title}
                    </h3>
                    <p className="text-2xs text-muted leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="divider" />

      {/* ── How It Works ── */}
      <section className="section">
        <div className="content-wrap">

          <div className="mb-8">
            <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-2">
              How it works
            </p>
            <h2 className="text-md font-sans font-medium text-primary">
              Three steps.
            </h2>
          </div>

          <ol className="space-y-6" role="list">
            {STEPS.map((step, i) => (
              <li
                key={step.num}
                className={`flex items-start gap-5 animate-fade-up stagger-${i + 1}`}
              >
                <span className="font-mono text-xs text-accent-dim mt-0.5 flex-shrink-0 w-6">
                  {step.num}
                </span>
                <div>
                  <p className="text-xs font-medium text-primary mb-0.5">
                    {step.label}
                  </p>
                  <p className="text-2xs text-muted">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="content-wrap flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-serif text-sm text-muted tracking-wide">
            ARPI<span className="text-accent-dim">.</span>
          </span>
          <span className="text-2xs text-muted">
            Revenue friction and conversion optimization for ecommerce brands.
          </span>
        </div>
      </footer>

    </main>
  )
}
