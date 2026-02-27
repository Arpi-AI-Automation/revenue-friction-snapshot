'use client'

import { useState, useCallback } from 'react'

// ─── Password ─────────────────────────────────────────────────────────────────
// Change this to whatever you want your audit password to be
const AUDIT_PASSWORD = 'arpi2024'

// ─── Manual checklist ────────────────────────────────────────────────────────

const MANUAL_SECTIONS = [
  {
    id: 'first_impression',
    label: 'First Impression',
    emoji: '👁️',
    items: [
      'Hero instantly communicates what they sell & who it\'s for',
      'Clear visible CTA above the fold',
      'Page feels trustworthy (design quality, no broken elements)',
      'Value prop is specific — not vague ("premium quality" = 🚩)',
      'Mobile hero makes sense without scrolling',
    ],
  },
  {
    id: 'product_page',
    label: 'Product Page',
    emoji: '🛍️',
    items: [
      'Product title is clear and keyword-rich',
      'Multiple image angles + zoom + lifestyle shot',
      'Price visible immediately',
      'Stock / urgency / dispatch time shown',
      'Add to Cart above fold on mobile',
      'Description scannable — benefits not just specs',
      'Reviews visible on page (not hidden in a tab)',
      'Shipping cost/time visible before checkout',
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation & Structure',
    emoji: '🗺️',
    items: [
      'Main categories findable in under 3 seconds',
      'Search bar present and prominent',
      'Breadcrumbs on product/category pages',
      'Footer has contact, policies, trust links',
    ],
  },
  {
    id: 'trust',
    label: 'Trust & Social Proof',
    emoji: '🛡️',
    items: [
      'Star ratings visible site-wide',
      'Trust badges present (secure checkout, returns, guarantee)',
      'About page feels human, not template',
      'Contact options visible — email, phone, chat',
      'Physical address or ABN mentioned',
    ],
  },
  {
    id: 'checkout',
    label: 'Checkout & Conversion',
    emoji: '💳',
    items: [
      'Guest checkout available',
      '3 steps or fewer to purchase',
      'BNPL options visible (Afterpay / Zip / Klarna)',
      'Cart abandonment recovery present',
      'Promo code field not prompting people to leave',
      'Upsell / cross-sell in cart',
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile Experience',
    emoji: '📱',
    items: [
      'Tap targets large enough',
      'Pop-ups not blocking content on mobile',
      'Sticky Add to Cart bar on product pages',
      'Font size readable without zooming',
      'No horizontal scroll anywhere',
    ],
  },
  {
    id: 'seo',
    label: 'SEO & Content',
    emoji: '🔍',
    items: [
      'Unique title tags + meta descriptions per page',
      'H1 present and accurate on every key page',
      'Category page has copy (not just product grid)',
      'Blog/content hub — active, stale, or non-existent?',
      'Schema markup present (Product, Review, Breadcrumb)',
    ],
  },
  {
    id: 'aeo',
    label: 'AEO — AI Engine Optimisation',
    emoji: '🤖',
    items: [
      'Brand findable when asking ChatGPT/Perplexity about category',
      'FAQ content present in crawlable format',
      'Product descriptions in natural language (Q&A style)',
      'Structured data supporting AI snippet eligibility',
      'Brand name + product type consistent across site',
    ],
  },
  {
    id: 'quick_wins',
    label: 'Quick Win Flags',
    emoji: '🚩',
    items: [
      'Email capture / pop-up present',
      'Free shipping threshold promoted visibly',
      'Social proof not buried',
      'Photography quality matches product quality',
      'Loyalty / rewards program visible',
    ],
  },
]

const STATUS_CYCLE = ['none', 'green', 'amber', 'red'] as const
type StatusValue = typeof STATUS_CYCLE[number]

const STATUS_META: Record<StatusValue, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
  none:  { label: '–', textClass: 'text-muted',         bgClass: 'bg-transparent',       borderClass: 'border-border' },
  green: { label: '✓', textClass: 'text-friction-low',  bgClass: 'bg-friction-low-bg',   borderClass: 'border-friction-low/30' },
  amber: { label: '!', textClass: 'text-friction-mid',  bgClass: 'bg-friction-mid-bg',   borderClass: 'border-friction-mid/30' },
  red:   { label: '✗', textClass: 'text-friction-high', bgClass: 'bg-friction-high-bg',  borderClass: 'border-friction-high/30' },
}

// Impact weights for TL;DR ranking
const IMPACT: Record<string, number> = { red: 10, amber: 5 }

// ─── Auto-check signals ───────────────────────────────────────────────────────

interface AutoSignal {
  label: string
  value: string
  status: StatusValue
  impactWeight: number
}

async function fetchAutoSignals(domain: string): Promise<AutoSignal[]> {
  const signals: AutoSignal[] = []

  try {
    const res = await fetch(`/api/html-scan?domain=${encodeURIComponent(domain)}`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const d = await res.json() as {
      platform: string; ga4: boolean; meta_pixel: boolean
      email: boolean; schema: boolean; ssl: boolean; error?: string
    }

    if (d.error) throw new Error(d.error)

    signals.push({ label: 'Platform', value: d.platform, status: d.platform !== 'Unknown' ? 'green' : 'amber', impactWeight: 2 })
    signals.push({ label: 'Google Analytics 4', value: d.ga4 ? 'Detected' : 'Not found', status: d.ga4 ? 'green' : 'red', impactWeight: 7 })
    signals.push({ label: 'Meta Pixel', value: d.meta_pixel ? 'Detected' : 'Not found', status: d.meta_pixel ? 'green' : 'amber', impactWeight: 6 })
    signals.push({ label: 'Email platform (Klaviyo/Omnisend)', value: d.email ? 'Detected' : 'Not found', status: d.email ? 'green' : 'amber', impactWeight: 5 })
    signals.push({ label: 'Schema / structured data', value: d.schema ? 'Detected' : 'Not found', status: d.schema ? 'green' : 'amber', impactWeight: 4 })
    signals.push({ label: 'SSL / HTTPS', value: 'Active', status: 'green', impactWeight: 3 })

  } catch (e) {
    signals.push({ label: 'HTML scan', value: `Failed: ${String(e)}`, status: 'amber', impactWeight: 0 })
  }

  return signals
}

// ─── TL;DR derivation ────────────────────────────────────────────────────────

interface TLDRItem {
  label: string
  value?: string
  status: StatusValue
  impactWeight: number
}

function deriveTLDR(
  autoSignals: AutoSignal[],
  statuses: Record<string, StatusValue>,
  notes: Record<string, string>
): TLDRItem[] {
  const items: TLDRItem[] = []

  // Auto signals that are red/amber
  autoSignals.forEach(s => {
    if (s.status === 'red' || s.status === 'amber') {
      items.push({ label: s.label, value: s.value, status: s.status, impactWeight: s.impactWeight })
    }
  })

  // Manual checklist failures
  MANUAL_SECTIONS.forEach(section => {
    section.items.forEach((item, i) => {
      const key = `${section.id}_${i}`
      const s = statuses[key] || 'none'
      if (s === 'red' || s === 'amber') {
        items.push({
          label: item,
          status: s,
          impactWeight: s === 'red' ? IMPACT.red : IMPACT.amber,
        })
      }
    })
  })

  return items.sort((a, b) => b.impactWeight - a.impactWeight).slice(0, 5)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [phase, setPhase] = useState<'lock' | 'setup' | 'fetching' | 'audit' | 'report'>('lock')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [prospect, setProspect] = useState('')
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')

  const [autoSignals, setAutoSignals] = useState<AutoSignal[]>([])
  const [fetchError, setFetchError] = useState('')

  const [statuses, setStatuses] = useState<Record<string, StatusValue>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState('first_impression')

  const [reportEmail, setReportEmail] = useState('')
  const [reportFull, setReportFull] = useState('')
  const [tldrItems, setTldrItems] = useState<TLDRItem[]>([])
  const [copied, setCopied] = useState('')

  const domain = website.trim().toLowerCase()
    .replace(/^https?:\/\//i, '').replace(/\/.*$/, '')

  // Password gate
  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (password === AUDIT_PASSWORD) {
      setPhase('setup')
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password.')
    }
  }

  // Run auto-checks
  const runAutoChecks = useCallback(async () => {
    if (!domain) return
    setPhase('fetching')
    setFetchError('')
    try {
      const signals = await fetchAutoSignals(domain)
      setAutoSignals(signals)
    } catch (e) {
      setFetchError(String(e))
    }
    setPhase('audit')
  }, [domain])

  // Cycle checklist item status
  function cycleStatus(sectionId: string, itemIndex: number) {
    const key = `${sectionId}_${itemIndex}`
    const cur = (statuses[key] || 'none') as StatusValue
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
    setStatuses(p => ({ ...p, [key]: next }))
  }

  function getStatus(sectionId: string, i: number): StatusValue {
    return (statuses[`${sectionId}_${i}`] || 'none') as StatusValue
  }

  // Generate report + email
  function generateReport() {
    const top = deriveTLDR(autoSignals, statuses, notes)
    setTldrItems(top)

    const totalRed = [
      ...autoSignals.filter(s => s.status === 'red'),
      ...Object.values(statuses).filter(v => v === 'red'),
    ].length
    const totalAmber = [
      ...autoSignals.filter(s => s.status === 'amber'),
      ...Object.values(statuses).filter(v => v === 'amber'),
    ].length

    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

    // Auto section
    const autoLines = autoSignals.map(s => {
      const badge = s.status === 'green' ? '✓' : s.status === 'amber' ? '!' : '✗'
      return `  ${badge}  ${s.label}: ${s.value}`
    }).join('\n')

    // Manual sections
    const manualLines = MANUAL_SECTIONS.map(section => {
      const lines = section.items.map((item, i) => {
        const s = getStatus(section.id, i)
        if (s === 'none') return null
        const badge = s === 'green' ? '✓' : s === 'amber' ? '!' : '✗'
        return `  ${badge}  ${item}`
      }).filter(Boolean)
      const note = notes[`${section.id}_notes`]?.trim()
      if (!lines.length && !note) return null
      return `${section.emoji} ${section.label}\n${lines.join('\n')}${note ? `\n  📝 ${note}` : ''}`
    }).filter(Boolean).join('\n\n')

    const tldrLines = top.map((item, i) => {
      const badge = item.status === 'red' ? '🔴' : '🟡'
      const val = item.value ? ` (${item.value})` : ''
      return `${i + 1}. ${badge} ${item.label}${val}`
    }).join('\n')

    const full = `REVENUE FRICTION SNAPSHOT
${domain}  ·  ${date}
${'─'.repeat(52)}

TL;DR — TOP ${top.length} REVENUE LEAKS
${tldrLines}

SUMMARY: ${totalRed} critical  ·  ${totalAmber} watch items
${'─'.repeat(52)}

AUTO-DETECTED SIGNALS
${autoLines || '  (no auto signals)'}
${'─'.repeat(52)}

MANUAL AUDIT
${manualLines || '  (no items flagged)'}
${'─'.repeat(52)}
Prepared by ARPI · arpi-ai.com`

    const email = `Hi ${prospect || '[Name]'},

I ran a Revenue Friction Snapshot on ${domain} — here's what stood out.

${top.slice(0, 3).map((item, i) => {
  const badge = item.status === 'red' ? '🔴' : '🟡'
  const val = item.value ? ` (${item.value})` : ''
  return `${i + 1}. ${badge} ${item.label}${val}`
}).join('\n')}

${totalRed + totalAmber > 3 ? `There are ${totalRed + totalAmber} friction points in total — the three above are where I'd focus first because they directly impact paid traffic performance.\n\n` : ''}These are signals pulled directly from the public-facing site.

The good news: most are fixable without a rebuild. A few targeted changes could meaningfully shift your conversion rate.

Worth a quick 20-minute call to walk through what matters most for ${company || '[Company]'}?

[Your name]
ARPI · arpi-ai.com`

    setReportEmail(email)
    setReportFull(full)
    setPhase('report')
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  function resetAudit() {
    setPhase('setup')
    setAutoSignals([])
    setStatuses({})
    setNotes({})
    setActiveSection('first_impression')
    setReportEmail('')
    setReportFull('')
    setTldrItems([])
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  // Password lock screen
  if (phase === 'lock') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <span className="font-serif text-lg text-primary tracking-wide">
              ARPI<span className="text-accent">.</span>
            </span>
            <p className="text-2xs font-mono text-muted mt-2 label-track uppercase">Internal Audit Tool</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full border border-border bg-surface text-primary text-sm px-4 py-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50"
            />
            {passwordError && (
              <p className="text-2xs text-friction-high">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-primary text-background text-sm font-medium py-3 rounded-sm hover:bg-primary/90 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="content-wrap py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-serif text-sm text-primary tracking-wide">
              ARPI<span className="text-accent">.</span>
            </span>
            <span className="text-2xs font-mono text-accent-dim label-track uppercase hidden sm:block">
              Internal Audit
            </span>
            {domain && phase !== 'setup' && (
              <span className="text-2xs font-mono text-muted border border-border px-2 py-0.5 rounded-sm">
                {domain}
              </span>
            )}
          </div>
          {phase !== 'setup' && (
            <button
              onClick={resetAudit}
              className="text-2xs text-muted hover:text-primary transition-colors font-mono"
            >
              ← New audit
            </button>
          )}
        </div>
      </header>

      {/* Setup phase */}
      {phase === 'setup' && (
        <div className="section">
          <div className="content-wrap">
            <div className="max-w-sm mx-auto">
              <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-2">Internal Audit Tool</p>
              <h1 className="font-serif text-lg text-primary mb-6">New Snapshot</h1>

              <div className="space-y-4">
                {([
                  { label: 'Prospect name', val: prospect, set: setProspect, ph: 'e.g. Sarah' },
                  { label: 'Company', val: company, set: setCompany, ph: 'e.g. Blume Coffee' },
                  { label: 'Website / domain', val: website, set: setWebsite, ph: 'e.g. blumecoffee.com' },
                ] as const).map(f => (
                  <div key={f.label}>
                    <label className="block text-2xs font-mono label-track uppercase text-muted mb-1.5">
                      {f.label}
                    </label>
                    <input
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.ph}
                      className="w-full border border-border bg-surface text-primary text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/40"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={runAutoChecks}
                disabled={!domain}
                className="mt-6 w-full bg-primary text-background text-sm font-medium py-3 rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Run Auto-Checks + Start Audit →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fetching */}
      {phase === 'fetching' && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="font-serif text-md text-primary">Scanning {domain}…</p>
          <p className="text-2xs text-muted font-mono">Platform · tracking signals · tech stack</p>
          <div className="flex gap-2 mt-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-accent animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audit phase */}
      {phase === 'audit' && (
        <div className="section">
          <div className="max-w-[900px] mx-auto px-6">

            {fetchError && (
              <div className="mb-4 px-4 py-3 bg-friction-mid-bg border border-friction-mid/30 rounded-sm text-2xs text-friction-mid">
                ⚠️ Some auto-checks failed: {fetchError}
              </div>
            )}

            <div className="grid gap-6" style={{ gridTemplateColumns: '220px 1fr' }}>

              {/* Sidebar */}
              <div>

                {/* Auto signals */}
                {autoSignals.length > 0 && (
                  <div className="mb-6">
                    <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-3">Auto-detected</p>
                    <div className="space-y-1.5">
                      {autoSignals.map(s => {
                        const sm = STATUS_META[s.status]
                        return (
                          <div
                            key={s.label}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm border text-2xs ${sm.bgClass} ${sm.borderClass}`}
                          >
                            <span className="text-muted truncate pr-2">{s.label}</span>
                            <span className={`font-mono font-medium shrink-0 ${sm.textClass}`}>{s.value}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="divider mb-6" />

                {/* Manual section nav */}
                <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-3">Manual audit</p>
                <nav className="space-y-0.5">
                  {MANUAL_SECTIONS.map(section => {
                    const redCount   = section.items.filter((_, i) => getStatus(section.id, i) === 'red').length
                    const amberCount = section.items.filter((_, i) => getStatus(section.id, i) === 'amber').length
                    const greenCount = section.items.filter((_, i) => getStatus(section.id, i) === 'green').length
                    const isActive = activeSection === section.id

                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-sm transition-colors ${isActive ? 'bg-surface border border-border' : 'hover:bg-surface/60 border border-transparent'}`}
                      >
                        <span className={`text-2xs ${isActive ? 'text-primary' : 'text-muted'}`}>
                          {section.emoji} {section.label}
                        </span>
                        {(redCount + amberCount + greenCount) > 0 && (
                          <div className="flex gap-1 mt-1">
                            {redCount   > 0 && <span className="text-[10px] bg-friction-high-bg text-friction-high px-1.5 py-0 rounded-sm font-mono">{redCount}✗</span>}
                            {amberCount > 0 && <span className="text-[10px] bg-friction-mid-bg text-friction-mid px-1.5 py-0 rounded-sm font-mono">{amberCount}!</span>}
                            {greenCount > 0 && <span className="text-[10px] bg-friction-low-bg text-friction-low px-1.5 py-0 rounded-sm font-mono">{greenCount}✓</span>}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </nav>

                <button
                  onClick={generateReport}
                  className="mt-6 w-full bg-primary text-background text-2xs font-medium py-2.5 rounded-sm hover:bg-primary/90 transition-colors font-mono label-track uppercase"
                >
                  Generate Report →
                </button>
              </div>

              {/* Main checklist panel */}
              <div>
                {(() => {
                  const section = MANUAL_SECTIONS.find(s => s.id === activeSection)
                  if (!section) return null
                  return (
                    <div className="bg-surface border border-border rounded-sm p-inner">
                      <h2 className="font-serif text-md text-primary mb-1">
                        {section.emoji} {section.label}
                      </h2>
                      <p className="text-2xs text-muted mb-5 font-mono">
                        Click to cycle: – → ✓ GOOD → ! WATCH → ✗ BROKEN
                      </p>

                      <div className="space-y-1.5">
                        {section.items.map((item, i) => {
                          const s = getStatus(section.id, i)
                          const sm = STATUS_META[s]
                          return (
                            <button
                              key={i}
                              onClick={() => cycleStatus(section.id, i)}
                              className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-sm border transition-all ${sm.bgClass} ${sm.borderClass} hover:opacity-80`}
                            >
                              <span className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center text-[11px] font-bold ${sm.textClass} ${sm.borderClass} ${s === 'none' ? 'bg-background' : ''}`}>
                                {sm.label}
                              </span>
                              <span className={`text-2xs ${s === 'none' ? 'text-muted' : 'text-primary'}`}>{item}</span>
                            </button>
                          )
                        })}
                      </div>

                      <textarea
                        placeholder={`Notes for ${section.label}…`}
                        value={notes[`${section.id}_notes`] || ''}
                        onChange={e => setNotes(p => ({ ...p, [`${section.id}_notes`]: e.target.value }))}
                        rows={3}
                        className="mt-4 w-full border border-border bg-background text-primary text-2xs px-3 py-2.5 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/40 font-mono"
                      />
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report phase */}
      {phase === 'report' && (
        <div className="section">
          <div className="content-wrap">

            {/* TL;DR */}
            <div className="bg-surface border border-accent/40 rounded-sm p-inner mb-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-1">TL;DR</p>
                  <h2 className="font-serif text-md text-primary">Top Revenue Leaks</h2>
                </div>
                <span className="text-2xs font-mono text-muted border border-border px-2 py-0.5 rounded-sm">{domain}</span>
              </div>

              <ol className="space-y-3">
                {tldrItems.map((item, i) => {
                  const badge = item.status === 'red' ? '🔴' : '🟡'
                  return (
                    <li key={i} className={`flex items-start gap-3 py-3 ${i < tldrItems.length - 1 ? 'border-b border-border' : ''}`}>
                      <span className="text-sm shrink-0 mt-0.5">{badge}</span>
                      <div>
                        <p className="text-xs text-primary font-medium">{item.label}</p>
                        {item.value && <p className="text-2xs text-accent-dim mt-0.5 font-mono">{item.value}</p>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Cold email */}
            <div className="bg-surface border border-border rounded-sm p-inner mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-1">Cold outreach</p>
                  <h2 className="font-sans text-xs font-medium text-primary">
                    Email draft — {prospect} @ {company}
                  </h2>
                </div>
                <button
                  onClick={() => copyText(reportEmail, 'email')}
                  className="text-2xs font-mono text-muted border border-border px-3 py-1.5 rounded-sm hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {copied === 'email' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-2xs text-muted leading-relaxed bg-background px-4 py-3 rounded-sm font-mono border border-border">
                {reportEmail}
              </pre>
            </div>

            {/* Full report */}
            <div className="bg-surface border border-border rounded-sm p-inner">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-1">Full report</p>
                  <h2 className="font-sans text-xs font-medium text-primary">Complete snapshot</h2>
                </div>
                <button
                  onClick={() => copyText(reportFull, 'report')}
                  className="text-2xs font-mono text-muted border border-border px-3 py-1.5 rounded-sm hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {copied === 'report' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-[11px] text-muted leading-relaxed bg-background px-4 py-3 rounded-sm font-mono border border-border">
                {reportFull}
              </pre>
            </div>

            <button
              onClick={() => setPhase('audit')}
              className="mt-6 text-2xs font-mono text-muted hover:text-primary transition-colors"
            >
              ← Back to audit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
