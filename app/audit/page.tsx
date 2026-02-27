'use client'

import { useState, useCallback } from 'react'

// ─── Config ───────────────────────────────────────────────────────────────────
const AUDIT_PASSWORD = 'arpi2024'

// ─── Business language map ────────────────────────────────────────────────────
// Translates raw checklist labels into prospect-facing business language
const BUSINESS_LANGUAGE: Record<string, { headline: string; pain: string }> = {
  'Hero instantly communicates what they sell & who it\'s for': {
    headline: 'Unclear value proposition above the fold',
    pain: 'Paid traffic is landing and immediately asking "what is this?" — that hesitation kills conversions before the scroll.',
  },
  'Clear visible CTA above the fold': {
    headline: 'No clear call-to-action above the fold',
    pain: 'Visitors arrive from an ad with buying intent but no obvious next step. That momentum dies in seconds.',
  },
  'Value prop is specific — not vague ("premium quality" = 🚩)': {
    headline: 'Vague value proposition',
    pain: '"Premium quality" and "best in class" are ignored by buyers. Specificity is what converts paid traffic.',
  },
  'Mobile hero makes sense without scrolling': {
    headline: 'Mobile hero experience broken',
    pain: 'Most of your paid traffic is on mobile. If the hero doesn\'t land on mobile, you\'re paying for bounces.',
  },
  'Reviews visible on page (not hidden in a tab)': {
    headline: 'Reviews hidden from product pages',
    pain: 'Social proof buried in a tab gets ignored. Cold paid traffic needs visible reviews at the decision point to convert.',
  },
  'Stock / urgency / dispatch time shown': {
    headline: 'No urgency or dispatch signals',
    pain: 'Without stock levels or dispatch times, buyers have no reason to act now. They leave and often don\'t come back.',
  },
  'Add to Cart above fold on mobile': {
    headline: 'Add to Cart not visible on mobile without scrolling',
    pain: 'If buyers have to hunt for the button, many won\'t. Friction at the purchase moment is the most expensive friction.',
  },
  'Description scannable — benefits not just specs': {
    headline: 'Product copy lists specs, not benefits',
    pain: 'Specs tell, benefits sell. Cold traffic doesn\'t know your product — they need to see why it matters to them.',
  },
  'Shipping cost/time visible before checkout': {
    headline: 'Shipping cost hidden until checkout',
    pain: 'Surprise shipping costs are the #1 reason for cart abandonment. Show it early or lose them late.',
  },
  'Star ratings visible site-wide': {
    headline: 'No star ratings visible site-wide',
    pain: 'First-time visitors from ads have zero brand trust. Star ratings are the fastest trust signal you can show — and yours aren\'t visible.',
  },
  'Trust badges present (secure checkout, returns, guarantee)': {
    headline: 'No trust badges at point of purchase',
    pain: 'New visitors are sceptical. Without visible security and guarantee signals, hesitation wins and they don\'t buy.',
  },
  'About page feels human, not template': {
    headline: 'No credible brand story',
    pain: 'Cold traffic checks "who are these people" before buying. A template About page or no About page loses that trust check.',
  },
  'Contact options visible — email, phone, chat': {
    headline: 'Contact options not visible',
    pain: 'Buyers who can\'t find a way to reach you before purchase often don\'t buy. Visibility of support = purchase confidence.',
  },
  'Guest checkout available': {
    headline: 'No guest checkout',
    pain: 'Forcing account creation before purchase is a proven conversion killer — especially for cold paid traffic buying for the first time.',
  },
  'BNPL options visible (Afterpay / Zip / Klarna)': {
    headline: 'No buy-now-pay-later options visible',
    pain: 'BNPL is table stakes for ecommerce. Not showing it — especially on higher-AOV products — leaves money on the table.',
  },
  'Promo code field not prompting people to leave': {
    headline: 'Promo code field causing cart abandonment',
    pain: 'A visible promo code box tells buyers they\'re paying too much. They leave to Google a code and often don\'t come back.',
  },
  'Upsell / cross-sell in cart': {
    headline: 'No upsell or cross-sell in cart',
    pain: 'Cart is your highest-intent moment. No upsell here means you\'re leaving AOV — and margin — on the table every order.',
  },
  'Sticky Add to Cart bar on product pages': {
    headline: 'No sticky Add to Cart on mobile',
    pain: 'Once a buyer scrolls past your Add to Cart button on mobile, they\'re reading your copy with no way to act. You lose the impulse.',
  },
  'Category page has copy (not just product grid)': {
    headline: 'Category pages have no copy',
    pain: 'No copy means no SEO signal, no context, and no help for buyers who are still deciding. It\'s a missed conversion and ranking opportunity.',
  },
  'Brand findable when asking ChatGPT/Perplexity about category': {
    headline: 'Brand not visible in AI search results',
    pain: 'AI-assisted shopping is growing fast. Brands not optimised for it are invisible to a rising share of research-led buyers.',
  },
  'Social proof not buried': {
    headline: 'Social proof buried or absent',
    pain: 'If buyers have to look for proof that others bought and loved your product, most won\'t bother. Proof needs to be unmissable.',
  },
  'Loyalty / rewards program visible': {
    headline: 'No visible loyalty or rewards program',
    pain: 'Loyalty programs increase repeat purchase rate and LTV. If you have one and it\'s not visible, it\'s not working.',
  },
  'Unique title tags + meta descriptions per page': {
    headline: 'Duplicate or missing meta tags',
    pain: 'Generic title tags mean your pages compete with each other in search and look unprofessional in shared links. Both hurt traffic quality.',
  },
  'Breadcrumbs on product/category pages': {
    headline: 'No breadcrumbs on product/category pages',
    pain: 'Without breadcrumbs, buyers who arrive mid-funnel from ads can\'t orient themselves — and bounce instead of browsing.',
  },
}

function translateLabel(label: string): { headline: string; pain: string } {
  // Strip emojis from label for lookup
  const clean = label.replace(/[🚩🔴🟡✓!✗]/g, '').trim()
  return BUSINESS_LANGUAGE[clean] || { headline: label, pain: '' }
}

// ─── Manual checklist ─────────────────────────────────────────────────────────
const MANUAL_SECTIONS = [
  {
    id: 'first_impression', label: 'First Impression', emoji: '👁️',
    items: [
      "Hero instantly communicates what they sell & who it's for",
      'Clear visible CTA above the fold',
      'Page feels trustworthy (design quality, no broken elements)',
      'Value prop is specific — not vague ("premium quality" = 🚩)',
      'Mobile hero makes sense without scrolling',
    ],
  },
  {
    id: 'product_page', label: 'Product Page', emoji: '🛍️',
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
    id: 'navigation', label: 'Navigation & Structure', emoji: '🗺️',
    items: [
      'Main categories findable in under 3 seconds',
      'Search bar present and prominent',
      'Breadcrumbs on product/category pages',
      'Footer has contact, policies, trust links',
    ],
  },
  {
    id: 'trust', label: 'Trust & Social Proof', emoji: '🛡️',
    items: [
      'Star ratings visible site-wide',
      'Trust badges present (secure checkout, returns, guarantee)',
      'About page feels human, not template',
      'Contact options visible — email, phone, chat',
      'Physical address or ABN mentioned',
    ],
  },
  {
    id: 'checkout', label: 'Checkout & Conversion', emoji: '💳',
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
    id: 'mobile', label: 'Mobile Experience', emoji: '📱',
    items: [
      'Tap targets large enough',
      'Pop-ups not blocking content on mobile',
      'Sticky Add to Cart bar on product pages',
      'Font size readable without zooming',
      'No horizontal scroll anywhere',
    ],
  },
  {
    id: 'seo', label: 'SEO & Content', emoji: '🔍',
    items: [
      'Unique title tags + meta descriptions per page',
      'H1 present and accurate on every key page',
      'Category page has copy (not just product grid)',
      'Blog/content hub — active, stale, or non-existent?',
      'Schema markup present (Product, Review, Breadcrumb)',
    ],
  },
  {
    id: 'aeo', label: 'AEO — AI Engine Optimisation', emoji: '🤖',
    items: [
      'Brand findable when asking ChatGPT/Perplexity about category',
      'FAQ content present in crawlable format',
      'Product descriptions in natural language (Q&A style)',
      'Structured data supporting AI snippet eligibility',
      'Brand name + product type consistent across site',
    ],
  },
  {
    id: 'quick_wins', label: 'Quick Win Flags', emoji: '🚩',
    items: [
      'Email capture / pop-up present',
      'Free shipping threshold promoted visibly',
      'Social proof not buried',
      'Photography quality matches product quality',
      'Loyalty / rewards program visible',
    ],
  },
]

const TOTAL_MANUAL_ITEMS = MANUAL_SECTIONS.reduce((s, sec) => s + sec.items.length, 0)

const STATUS_CYCLE = ['none', 'green', 'amber', 'red'] as const
type StatusValue = typeof STATUS_CYCLE[number]

const STATUS_META: Record<StatusValue, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
  none:  { label: '–', textClass: 'text-muted',         bgClass: 'bg-transparent',      borderClass: 'border-border' },
  green: { label: '✓', textClass: 'text-friction-low',  bgClass: 'bg-friction-low-bg',  borderClass: 'border-friction-low/30' },
  amber: { label: '!', textClass: 'text-friction-mid',  bgClass: 'bg-friction-mid-bg',  borderClass: 'border-friction-mid/30' },
  red:   { label: '✗', textClass: 'text-friction-high', bgClass: 'bg-friction-high-bg', borderClass: 'border-friction-high/30' },
}

// ─── Auto signal types ────────────────────────────────────────────────────────
interface AutoSignal {
  label: string
  value: string
  status: StatusValue
  impactWeight: number
  businessLabel?: string
  businessPain?: string
}

interface ScanResult {
  platform?: string
  ga4?: boolean
  meta_pixel?: boolean
  email?: boolean
  schema?: boolean
  ssl?: boolean
  mobile_score?: number | null
  lcp_ms?: number | null
  cls?: number | null
  tbt_ms?: number | null
  ttfb_ms?: number | null
  page_weight_mb?: number | null
  render_blocking?: boolean | null
  html_error?: string
  speed_error?: string
}

function parseAutoSignals(d: ScanResult): AutoSignal[] {
  const signals: AutoSignal[] = []

  // ── Speed signals ──
  if (d.mobile_score != null) {
    const score = d.mobile_score
    const status: StatusValue = score >= 70 ? 'green' : score >= 50 ? 'amber' : 'red'
    signals.push({
      label: 'Mobile performance score',
      value: `${score}/100`,
      status,
      impactWeight: 9,
      businessLabel: status !== 'green' ? 'Poor mobile performance score' : undefined,
      businessPain: status !== 'green' ? `A mobile score of ${score}/100 means most paid traffic — which arrives on mobile — is experiencing a slow, frustrating load. You\'re paying for visitors who bounce before your page renders.` : undefined,
    })
  }

  if (d.lcp_ms != null) {
    const lcp = d.lcp_ms / 1000
    const status: StatusValue = lcp <= 2.5 ? 'green' : lcp <= 4 ? 'amber' : 'red'
    signals.push({
      label: 'LCP (largest content loads in)',
      value: `${lcp.toFixed(1)}s`,
      status,
      impactWeight: 10,
      businessLabel: status !== 'green' ? `Slow page load — ${lcp.toFixed(1)}s to show main content` : undefined,
      businessPain: status !== 'green' ? `Google's benchmark is 2.5s. At ${lcp.toFixed(1)}s, visitors from paid ads are waiting and leaving before they see your product. Every second over 2.5s costs you conversions.` : undefined,
    })
  }

  if (d.cls != null) {
    const cls = d.cls
    const status: StatusValue = cls <= 0.1 ? 'green' : cls <= 0.25 ? 'amber' : 'red'
    signals.push({
      label: 'Layout stability (CLS)',
      value: cls.toFixed(3),
      status,
      impactWeight: 6,
      businessLabel: status !== 'green' ? 'Page elements jumping around on load' : undefined,
      businessPain: status !== 'green' ? `Your page layout shifts as it loads (CLS: ${cls.toFixed(3)}). On mobile this causes accidental taps, frustration, and loss of the purchase moment.` : undefined,
    })
  }

  if (d.ttfb_ms != null) {
    const ttfb = d.ttfb_ms
    const status: StatusValue = ttfb <= 600 ? 'green' : ttfb <= 1500 ? 'amber' : 'red'
    signals.push({
      label: 'Server response time (TTFB)',
      value: `${Math.round(ttfb)}ms`,
      status,
      impactWeight: 7,
      businessLabel: status !== 'green' ? 'Slow server response' : undefined,
      businessPain: status !== 'green' ? `Your server takes ${Math.round(ttfb)}ms to respond. This delays everything that follows — images, scripts, your product. Slow servers waste ad spend on visitors who leave before content appears.` : undefined,
    })
  }

  if (d.page_weight_mb != null) {
    const mb = d.page_weight_mb
    const status: StatusValue = mb <= 2 ? 'green' : mb <= 4 ? 'amber' : 'red'
    signals.push({
      label: 'Page weight',
      value: `${mb.toFixed(1)}MB`,
      status,
      impactWeight: 5,
      businessLabel: status !== 'green' ? `Heavy page weight (${mb.toFixed(1)}MB)` : undefined,
      businessPain: status !== 'green' ? `At ${mb.toFixed(1)}MB, your page is heavy for mobile connections. This directly increases load time and bounce rate for visitors on 4G.` : undefined,
    })
  }

  if (d.render_blocking != null) {
    const blocking = d.render_blocking
    signals.push({
      label: 'Render-blocking scripts',
      value: blocking ? 'Present' : 'None',
      status: blocking ? 'amber' : 'green',
      impactWeight: 5,
      businessLabel: blocking ? 'Scripts delaying your page from rendering' : undefined,
      businessPain: blocking ? 'Scripts are loading before your page content renders. Every millisecond they block is a millisecond your paid visitor is staring at a blank or partial screen.' : undefined,
    })
  }

  if (d.speed_error && !d.mobile_score) {
    signals.push({
      label: 'Speed scan',
      value: d.speed_error || 'Not available',
      status: 'amber',
      impactWeight: 0,
    })
  }

  // ── Tracking & tech signals ──
  if (d.platform) {
    signals.push({
      label: 'Platform',
      value: d.platform,
      status: d.platform !== 'Unknown' ? 'green' : 'amber',
      impactWeight: 2,
    })
  }

  if (d.ga4 !== undefined) {
    signals.push({
      label: 'Google Analytics 4',
      value: d.ga4 ? 'Detected' : 'Not found',
      status: d.ga4 ? 'green' : 'red',
      impactWeight: 7,
      businessLabel: !d.ga4 ? 'No analytics detected' : undefined,
      businessPain: !d.ga4 ? 'Without analytics you\'re spending on ads with no visibility into which traffic converts. You\'re optimising blind.' : undefined,
    })
  }

  if (d.meta_pixel !== undefined) {
    signals.push({
      label: 'Meta Pixel',
      value: d.meta_pixel ? 'Detected' : 'Not found',
      status: d.meta_pixel ? 'green' : 'amber',
      impactWeight: 6,
      businessLabel: !d.meta_pixel ? 'Meta Pixel not detected' : undefined,
      businessPain: !d.meta_pixel ? 'No Meta Pixel means no attribution data for paid social, no lookalike audiences, and no retargeting. If you\'re running Meta ads, you\'re flying without data.' : undefined,
    })
  }

  if (d.email !== undefined) {
    signals.push({
      label: 'Email platform',
      value: d.email ? 'Detected' : 'Not found',
      status: d.email ? 'green' : 'amber',
      impactWeight: 5,
      businessLabel: !d.email ? 'No email platform detected' : undefined,
      businessPain: !d.email ? 'Email is the highest-ROI recovery channel for paid traffic that doesn\'t convert. Without it, every non-purchase is a permanent loss.' : undefined,
    })
  }

  if (d.schema !== undefined) {
    signals.push({
      label: 'Structured data / schema',
      value: d.schema ? 'Detected' : 'Not found',
      status: d.schema ? 'green' : 'amber',
      impactWeight: 4,
    })
  }

  if (d.ssl !== undefined) {
    signals.push({
      label: 'SSL / HTTPS',
      value: 'Active',
      status: 'green',
      impactWeight: 3,
    })
  }

  return signals
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
function computeOverallScore(
  autoSignals: AutoSignal[],
  statuses: Record<string, StatusValue>
): number {
  // Manual: green = 1, amber = 0.5, red = 0, none = skip
  let manualEarned = 0
  let manualTotal = 0
  MANUAL_SECTIONS.forEach(section => {
    section.items.forEach((_, i) => {
      const s = (statuses[`${section.id}_${i}`] || 'none') as StatusValue
      if (s !== 'none') {
        manualTotal++
        if (s === 'green') manualEarned += 1
        else if (s === 'amber') manualEarned += 0.5
      }
    })
  })

  // Auto: count non-none signals
  let autoEarned = 0
  let autoTotal = 0
  autoSignals.forEach(s => {
    if (s.status !== 'none' && s.impactWeight > 0) {
      autoTotal += s.impactWeight
      if (s.status === 'green') autoEarned += s.impactWeight
      else if (s.status === 'amber') autoEarned += s.impactWeight * 0.5
    }
  })

  const manualScore = manualTotal > 0 ? (manualEarned / Math.max(manualTotal, TOTAL_MANUAL_ITEMS * 0.3)) : 0
  const autoScore   = autoTotal > 0   ? (autoEarned / autoTotal) : 0
  const weight      = manualTotal > 0 ? 0.6 : 0.4

  const combined = (manualScore * weight) + (autoScore * (1 - weight))
  return Math.round(combined * 100)
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Low Friction'
  if (score >= 45) return 'Moderate Friction'
  return 'High Friction'
}

function scoreLabelClass(score: number): string {
  if (score >= 70) return 'text-friction-low'
  if (score >= 45) return 'text-friction-mid'
  return 'text-friction-high'
}

// ─── TL;DR derivation ─────────────────────────────────────────────────────────
interface TLDRItem {
  headline: string
  pain: string
  value?: string
  status: StatusValue
  impactWeight: number
}

function deriveTLDR(
  autoSignals: AutoSignal[],
  statuses: Record<string, StatusValue>,
): TLDRItem[] {
  const items: TLDRItem[] = []

  autoSignals.forEach(s => {
    if ((s.status === 'red' || s.status === 'amber') && s.businessLabel) {
      items.push({
        headline: s.businessLabel,
        pain: s.businessPain || '',
        value: s.value,
        status: s.status,
        impactWeight: s.impactWeight,
      })
    }
  })

  MANUAL_SECTIONS.forEach(section => {
    section.items.forEach((item, i) => {
      const s = (statuses[`${section.id}_${i}`] || 'none') as StatusValue
      if (s === 'red' || s === 'amber') {
        const translated = translateLabel(item)
        items.push({
          headline: translated.headline,
          pain: translated.pain,
          status: s,
          impactWeight: s === 'red' ? 10 : 5,
        })
      }
    })
  })

  return items.sort((a, b) => b.impactWeight - a.impactWeight).slice(0, 5)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const [phase, setPhase] = useState<'lock' | 'setup' | 'fetching' | 'audit' | 'report'>('lock')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [prospect, setProspect] = useState('')
  const [company,  setCompany]  = useState('')
  const [website,  setWebsite]  = useState('')

  const [autoSignals, setAutoSignals] = useState<AutoSignal[]>([])
  const [fetchError,  setFetchError]  = useState('')

  const [statuses,       setStatuses]       = useState<Record<string, StatusValue>>({})
  const [notes,          setNotes]          = useState<Record<string, string>>({})
  const [activeSection,  setActiveSection]  = useState('first_impression')

  const [tldrItems,   setTldrItems]   = useState<TLDRItem[]>([])
  const [reportEmail, setReportEmail] = useState('')
  const [reportFull,  setReportFull]  = useState('')
  const [overallScore, setOverallScore] = useState(0)
  const [copied, setCopied]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)

  const domain = website.trim().toLowerCase()
    .replace(/^https?:\/\//i, '').replace(/\/.*$/, '')

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (password === AUDIT_PASSWORD) {
      setPhase('setup')
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password.')
    }
  }

  const runAutoChecks = useCallback(async () => {
    if (!domain) return
    setPhase('fetching')
    setFetchError('')
    try {
      const res = await fetch(`/api/html-scan?domain=${encodeURIComponent(domain)}`)
      const d = await res.json() as ScanResult
      if (d.html_error && !d.platform) {
        setFetchError(d.html_error)
      }
      setAutoSignals(parseAutoSignals(d))
    } catch (e) {
      setFetchError(String(e))
      setAutoSignals([])
    }
    setPhase('audit')
  }, [domain])

  function cycleStatus(sectionId: string, itemIndex: number) {
    const key = `${sectionId}_${itemIndex}`
    const cur = (statuses[key] || 'none') as StatusValue
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
    setStatuses(p => ({ ...p, [key]: next }))
  }

  function getStatus(sectionId: string, i: number): StatusValue {
    return (statuses[`${sectionId}_${i}`] || 'none') as StatusValue
  }

  async function saveReport(email: string, full: string, score: number) {
    setSaving(true)
    const totalRed   = [...autoSignals.filter(s => s.status === 'red'),   ...Object.values(statuses).filter(v => v === 'red')].length
    const totalAmber = [...autoSignals.filter(s => s.status === 'amber'), ...Object.values(statuses).filter(v => v === 'amber')].length
    const id = `${domain.replace(/\./g, '-')}-${Date.now()}`
    try {
      await fetch('/api/saved-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-audit-password': 'arpi2024' },
        body: JSON.stringify({
          id, domain, prospect, company, score,
          totalRed, totalAmber,
          savedAt: new Date().toISOString(),
          fullReport: full,
          emailDraft: email,
          autoSignals,
        }),
      })
      setSaved(true)
    } catch { /* fail silently */ }
    setSaving(false)
  }

  function generateReport() {
    const top = deriveTLDR(autoSignals, statuses)
    const score = computeOverallScore(autoSignals, statuses)
    setTldrItems(top)
    setOverallScore(score)

    const totalRed   = [...autoSignals.filter(s => s.status === 'red'),   ...Object.values(statuses).filter(v => v === 'red')].length
    const totalAmber = [...autoSignals.filter(s => s.status === 'amber'), ...Object.values(statuses).filter(v => v === 'amber')].length
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

    // Auto section for full report
    const autoLines = autoSignals.map(s => {
      const badge = s.status === 'green' ? '✓' : s.status === 'amber' ? '!' : s.status === 'red' ? '✗' : '–'
      return `  ${badge}  ${s.label}: ${s.value}`
    }).join('\n')

    // Manual sections for full report
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
      return `${i + 1}. ${badge} ${item.headline}${val}`
    }).join('\n')

    const full = `REVENUE FRICTION SNAPSHOT — INTERNAL
${domain}  ·  ${date}  ·  Score: ${score}/100 (${scoreLabel(score)})
${'─'.repeat(56)}

TL;DR — TOP ${top.length} REVENUE LEAKS
${tldrLines}

SUMMARY: ${totalRed} critical  ·  ${totalAmber} watch items
${'─'.repeat(56)}

AUTO-DETECTED SIGNALS
${autoLines || '  (no auto signals)'}
${'─'.repeat(56)}

MANUAL AUDIT
${manualLines || '  (no items flagged)'}
${'─'.repeat(56)}
ARPI · arpi-ai.com`

    // ── Cold email — business language, drip-friendly ──
    const emailIssues = top.slice(0, 3)
    const emailBody = emailIssues.map((item, i) => {
      const badge = item.status === 'red' ? '🔴' : '🟡'
      const val = item.value ? ` (${item.value})` : ''
      const pain = item.pain ? `\n   ${item.pain}` : ''
      return `${i + 1}. ${badge} ${item.headline}${val}${pain}`
    }).join('\n\n')

    const email = `Hi ${prospect || '[Name]'},

I spent some time on ${domain} — a few things stood out that are worth a conversation.

${emailBody}

${totalRed + totalAmber > 3 ? `There's more, but these three are where I'd start — they directly impact what you're spending on paid traffic right now.\n\n` : ''}None of this requires a rebuild. Most are configuration and content changes — the kind of thing that moves conversion rate without touching your tech stack.

Worth a 20-minute call to walk through what matters most for ${company || '[Company]'}?

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
    setSaved(false)
    setPhase('setup')
    setAutoSignals([])
    setStatuses({})
    setNotes({})
    setActiveSection('first_impression')
    setReportEmail('')
    setReportFull('')
    setTldrItems([])
    setOverallScore(0)
  }

  // ─── Lock screen ────────────────────────────────────────────────
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
            {passwordError && <p className="text-2xs text-friction-high">{passwordError}</p>}
            <button type="submit" className="w-full bg-primary text-background text-sm font-medium py-3 rounded-sm hover:bg-primary/90 transition-colors">
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
        <div className="max-w-[960px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-serif text-sm text-primary tracking-wide">
              ARPI<span className="text-accent">.</span>
            </span>
            <span className="text-2xs font-mono text-accent-dim label-track uppercase hidden sm:block">Internal Audit</span>
            {domain && phase !== 'setup' && (
              <span className="text-2xs font-mono text-muted border border-border px-2 py-0.5 rounded-sm">{domain}</span>
            )}
          </div>
          {phase !== 'setup' && (
            <button onClick={resetAudit} className="text-2xs text-muted hover:text-primary transition-colors font-mono">
              ← New audit
            </button>
          )}
        </div>
      </header>

      {/* Setup */}
      {phase === 'setup' && (
        <div className="py-16">
          <div className="max-w-sm mx-auto px-6">
            <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-2">Internal Audit Tool</p>
            <h1 className="font-serif text-lg text-primary mb-6">New Snapshot</h1>
            <div className="space-y-4">
              {([
                { label: 'Prospect name', val: prospect, set: setProspect, ph: 'e.g. Glenn' },
                { label: 'Company',       val: company,  set: setCompany,  ph: 'e.g. Walker Golf Things' },
                { label: 'Website',       val: website,  set: setWebsite,  ph: 'e.g. walkergolfthings.com' },
              ] as const).map(f => (
                <div key={f.label}>
                  <label className="block text-2xs font-mono label-track uppercase text-muted mb-1.5">{f.label}</label>
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
      )}

      {/* Fetching */}
      {phase === 'fetching' && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="font-serif text-md text-primary">Scanning {domain}…</p>
          <p className="text-2xs text-muted font-mono">Speed · tracking · platform · tech stack</p>
          <div className="flex gap-2 mt-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* Audit */}
      {phase === 'audit' && (
        <div className="py-8">
          <div className="max-w-[960px] mx-auto px-6">

            {fetchError && (
              <div className="mb-4 px-4 py-3 bg-friction-mid-bg border border-friction-mid/30 rounded-sm text-2xs text-friction-mid">
                ⚠️ {fetchError}
              </div>
            )}

            <div className="grid gap-6" style={{ gridTemplateColumns: '240px 1fr' }}>

              {/* Sidebar */}
              <div>
                {autoSignals.length > 0 && (
                  <div className="mb-6">
                    <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-3">Auto-detected</p>
                    <div className="space-y-1.5">
                      {autoSignals.map(s => {
                        const sm = STATUS_META[s.status]
                        return (
                          <div key={s.label} className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm border text-2xs ${s.impactWeight === 0 ? 'bg-transparent border-border' : sm.bgClass + ' ' + sm.borderClass}`}>
                            <span className="text-muted truncate pr-2">{s.label}</span>
                            <span className={`font-mono font-medium shrink-0 truncate max-w-[120px] ${s.impactWeight === 0 ? 'text-muted' : sm.textClass}`} title={s.value}>{s.value}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="divider mb-5" />

                <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-3">Manual audit</p>
                <nav className="space-y-0.5">
                  {MANUAL_SECTIONS.map(section => {
                    const red   = section.items.filter((_, i) => getStatus(section.id, i) === 'red').length
                    const amber = section.items.filter((_, i) => getStatus(section.id, i) === 'amber').length
                    const green = section.items.filter((_, i) => getStatus(section.id, i) === 'green').length
                    const isActive = activeSection === section.id
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-sm transition-colors ${isActive ? 'bg-surface border border-border' : 'hover:bg-surface/60 border border-transparent'}`}
                      >
                        <span className={`text-2xs ${isActive ? 'text-primary' : 'text-muted'}`}>{section.emoji} {section.label}</span>
                        {(red + amber + green) > 0 && (
                          <div className="flex gap-1 mt-1">
                            {red   > 0 && <span className="text-[10px] bg-friction-high-bg text-friction-high px-1.5 rounded-sm font-mono">{red}✗</span>}
                            {amber > 0 && <span className="text-[10px] bg-friction-mid-bg  text-friction-mid  px-1.5 rounded-sm font-mono">{amber}!</span>}
                            {green > 0 && <span className="text-[10px] bg-friction-low-bg  text-friction-low  px-1.5 rounded-sm font-mono">{green}✓</span>}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </nav>

                <button
                  onClick={generateReport}
                  className="mt-5 w-full bg-primary text-background text-2xs font-medium py-2.5 rounded-sm hover:bg-primary/90 transition-colors font-mono label-track uppercase"
                >
                  Generate Report →
                </button>
              </div>

              {/* Checklist panel */}
              <div>
                {(() => {
                  const section = MANUAL_SECTIONS.find(s => s.id === activeSection)
                  if (!section) return null
                  return (
                    <div className="bg-surface border border-border rounded-sm p-inner">
                      <h2 className="font-serif text-md text-primary mb-1">{section.emoji} {section.label}</h2>
                      <p className="text-2xs text-muted mb-5 font-mono">Click to cycle: – → ✓ GOOD → ! WATCH → ✗ BROKEN</p>
                      <div className="space-y-1.5">
                        {section.items.map((item, i) => {
                          const s  = getStatus(section.id, i)
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

      {/* Report */}
      {phase === 'report' && (
        <div className="py-8">
          <div className="content-wrap">

            {/* Score header */}
            <div className="flex items-center gap-6 mb-8 p-inner bg-surface border border-border rounded-sm">
              <div>
                <p className="text-2xs font-mono label-track uppercase text-muted mb-1">{domain}</p>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl text-primary">{overallScore}<span className="text-muted text-md">/100</span></span>
                  <span className={`text-sm font-medium ${scoreLabelClass(overallScore)}`}>{scoreLabel(overallScore)}</span>
                </div>
              </div>
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-2xs text-muted font-mono">{new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-2xs text-muted font-mono">{prospect} @ {company}</p>
              </div>
            </div>

            {/* TL;DR */}
            <div className="bg-surface border border-accent/30 rounded-sm p-inner mb-6">
              <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-1">TL;DR</p>
              <h2 className="font-serif text-md text-primary mb-5">Top Revenue Leaks</h2>
              <ol className="space-y-4">
                {tldrItems.map((item, i) => {
                  const badge = item.status === 'red' ? '🔴' : '🟡'
                  return (
                    <li key={i} className={`pb-4 ${i < tldrItems.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-sm shrink-0 mt-0.5">{badge}</span>
                        <div>
                          <p className="text-xs text-primary font-medium">{item.headline}{item.value && <span className="text-accent-dim font-mono font-normal ml-2">{item.value}</span>}</p>
                          {item.pain && <p className="text-2xs text-muted mt-1 leading-relaxed">{item.pain}</p>}
                        </div>
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
                  <h2 className="font-sans text-xs font-medium text-primary">Email — {prospect} @ {company}</h2>
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
                  <h2 className="font-sans text-xs font-medium text-primary">Complete snapshot — internal only</h2>
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

            <div className="mt-6 flex items-center gap-4">
              <button onClick={() => setPhase('audit')} className="text-2xs font-mono text-muted hover:text-primary transition-colors">
                ← Back to audit
              </button>
              <button
                onClick={() => saveReport(reportEmail, reportFull, overallScore)}
                disabled={saving || saved}
                className="text-2xs font-mono border border-border px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50 hover:text-primary hover:border-primary/40 text-muted"
              >
                {saved ? '✓ Saved to reports' : saving ? 'Saving…' : 'Save report'}
              </button>
              {saved && (
                <a href="/audit/reports" className="text-2xs font-mono text-accent-dim hover:text-primary transition-colors">
                  View all reports →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
