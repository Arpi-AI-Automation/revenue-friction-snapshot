import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BucketCard from '@/components/report/BucketCard'
import PriorityFixCard from '@/components/report/PriorityFixCard'
import RevenueCalculator from '@/components/report/RevenueCalculator'
import Card from '@/components/ui/Card'
import type { ReportData } from '@/lib/types'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  return {
    title: `Revenue Friction Snapshot | ARPI`,
    robots: 'noindex, nofollow',
  }
}

// ─── Data fetch ──────────────────────────────────────────────────────────────

async function getReport(slug: string): Promise<ReportData | null> {
  // In production this reads from Vercel KV.
  // Stub returns null for now — wired in when auditor is built.
  try {
    const { kv } = await import('@vercel/kv')
    const data = await kv.get<ReportData>(`report:${slug}`)
    return data ?? null
  } catch {
    return null
  }
}

// ─── Sticky header (client island) ──────────────────────────────────────────
// Imported separately so the rest of the page stays RSC.

import StickyHeader from '@/components/report/StickyHeader'

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ReportPage({
  params,
}: {
  params: { slug: string }
}) {
  const report = await getReport(params.slug)

  if (!report) notFound()

  const { domain, generatedAt, platform, status, buckets, topFixes } = report

  const formattedDate = new Date(generatedAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <StickyHeader domain={domain} buckets={buckets} />

      <main className="pb-24">

        {/* ── Report header ── */}
        <header className="border-b border-border py-12">
          <div className="content-wrap">

            {/* Nav logo */}
            <div className="flex items-center justify-between mb-12">
              <a href="/" className="font-serif text-lg text-primary tracking-wide">
                ARPI<span className="text-accent">.</span>
              </a>
              <span className="text-2xs font-mono label-track uppercase text-muted">
                Friction Report
              </span>
            </div>

            {/* Report title */}
            <div>
              <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-3">
                Revenue Friction Snapshot
              </p>
              <h1 className="font-serif text-lg sm:text-xl text-primary mb-4 leading-tight">
                {domain}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                {/* Timestamp */}
                <span className="text-2xs text-muted font-mono">
                  Generated {formattedDate}
                </span>

                <span className="text-border" aria-hidden="true">|</span>

                {/* Platform badge — only if detected */}
                {platform === 'shopify' && (
                  <span className="chip chip-high">
                    Shopify detected
                  </span>
                )}

                {/* Partial report badge */}
                {status === 'partial' && (
                  <span className="chip chip-medium">
                    Partial data
                  </span>
                )}

                {/* Disclaimer badge */}
                <span className="chip chip-low">
                  Public signals only
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Bucket grid ── */}
        <section className="section" aria-labelledby="buckets-heading">
          <div className="content-wrap">
            <h2 id="buckets-heading" className="sr-only">Friction scores by area</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-card">
              {buckets.map(bucket => (
                <BucketCard key={bucket.bucket} data={bucket} />
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── Top 3 Priority Fixes ── */}
        {topFixes.length > 0 && (
          <section className="section" aria-labelledby="fixes-heading">
            <div className="content-wrap">

              <div className="mb-8">
                <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-2">
                  Priority fixes
                </p>
                <h2 id="fixes-heading" className="text-md font-sans font-medium text-primary">
                  Top {topFixes.length} friction points to address first.
                </h2>
                <p className="text-2xs text-muted mt-1">
                  Ranked by estimated revenue impact, confidence level, and implementation effort.
                </p>
              </div>

              <ol className="space-y-4" role="list">
                {topFixes.map((fix, i) => (
                  <PriorityFixCard key={fix.id} fix={fix} number={i + 1} />
                ))}
              </ol>
            </div>
          </section>
        )}

        <div className="divider" />

        {/* ── Tracking disclaimer ── */}
        <section
          className="section"
          aria-label="Tracking detection limitations"
        >
          <div className="content-wrap">
            <Card>
              <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-2">
                Tracking detection note
              </p>
              <p className="text-xs text-muted leading-relaxed">
                The tracking section reflects tag presence in page source only.
                Whether tags fire correctly on key events, such as AddToCart,
                InitiateCheckout, or Purchase, is not verifiable from public signals.
                Server-side tagging implementation cannot be confirmed without store
                access. Treat tracking findings as presence indicators, not accuracy guarantees.
              </p>
            </Card>
          </div>
        </section>

        <div className="divider" />

        {/* ── Revenue Scenario Modeler ── */}
        <section className="section" aria-labelledby="calculator-heading">
          <div className="content-wrap">
            <RevenueCalculator />
          </div>
        </section>

        <div className="divider" />

        {/* ── Footer ── */}
        <footer className="pt-8">
          <div className="content-wrap flex flex-col sm:flex-row items-center justify-between gap-3">
            <a href="/" className="font-serif text-sm text-muted tracking-wide">
              ARPI<span className="text-accent-dim">.</span>
            </a>
            <p className="text-2xs text-muted text-center sm:text-right max-w-xs">
              This report was generated from publicly available signals only.
              Findings reflect what is detectable without store access and may
              not represent the complete picture.
            </p>
          </div>
        </footer>

      </main>
    </div>
  )
}
