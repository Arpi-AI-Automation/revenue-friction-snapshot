'use client'

import { useState } from 'react'

const PASSWORD = 'arpi2024'

interface ReportSummary {
  id: string
  domain: string
  prospect: string
  company: string
  score: number
  totalRed: number
  totalAmber: number
  savedAt: string
}

interface FullReport extends ReportSummary {
  fullReport: string
  emailDraft: string
}

function scoreLabel(score: number) {
  if (score >= 70) return { text: 'Low Friction',      cls: 'text-friction-low' }
  if (score >= 45) return { text: 'Moderate Friction', cls: 'text-friction-mid' }
  return                  { text: 'High Friction',     cls: 'text-friction-high' }
}

export default function SavedReportsPage() {
  const [phase, setPhase]       = useState<'lock' | 'list' | 'detail'>('lock')
  const [password, setPassword] = useState('')
  const [pwError, setPwError]   = useState('')
  const [reports, setReports]   = useState<ReportSummary[]>([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState<FullReport | null>(null)
  const [copied, setCopied]     = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (password === PASSWORD) {
      setPhase('list')
      loadReports()
    } else {
      setPwError('Incorrect password.')
    }
  }

  async function loadReports() {
    setLoading(true)
    try {
      const res = await fetch(`/api/saved-reports?p=${PASSWORD}`)
      const data = await res.json() as { reports: ReportSummary[] }
      setReports(data.reports || [])
    } catch {
      setReports([])
    }
    setLoading(false)
  }

  async function openReport(id: string) {
    try {
      const res = await fetch(`/api/saved-reports?p=${PASSWORD}&id=${id}`)
      const data = await res.json() as FullReport
      setSelected(data)
      setPhase('detail')
    } catch {}
  }

  async function deleteReport(id: string) {
    setDeleting(id)
    try {
      await fetch('/api/saved-reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-audit-password': PASSWORD },
        body: JSON.stringify({ id }),
      })
      setReports(r => r.filter(x => x.id !== id))
    } catch {}
    setDeleting(null)
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  // ── Lock ──
  if (phase === 'lock') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <span className="font-serif text-lg text-primary tracking-wide">ARPI<span className="text-accent">.</span></span>
            <p className="text-2xs font-mono text-muted mt-2 label-track uppercase">Saved Reports</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" autoFocus
              className="w-full border border-border bg-surface text-primary text-sm px-4 py-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50" />
            {pwError && <p className="text-2xs text-friction-high">{pwError}</p>}
            <button type="submit" className="w-full bg-primary text-background text-sm font-medium py-3 rounded-sm hover:bg-primary/90 transition-colors">
              Enter
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ── Detail view ──
  if (phase === 'detail' && selected) {
    const sl = scoreLabel(selected.score)
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
          <div className="content-wrap py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-serif text-sm text-primary tracking-wide">ARPI<span className="text-accent">.</span></span>
              <span className="text-2xs font-mono text-muted border border-border px-2 py-0.5 rounded-sm">{selected.domain}</span>
            </div>
            <button onClick={() => { setPhase('list'); setSelected(null) }}
              className="text-2xs font-mono text-muted hover:text-primary transition-colors">
              ← All reports
            </button>
          </div>
        </header>

        <div className="section">
          <div className="content-wrap">

            {/* Score header */}
            <div className="flex items-center gap-6 mb-8 p-inner bg-surface border border-border rounded-sm">
              <div>
                <p className="text-2xs font-mono label-track uppercase text-muted mb-1">{selected.domain}</p>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl text-primary">{selected.score}<span className="text-muted text-md">/100</span></span>
                  <span className={`text-sm font-medium ${sl.cls}`}>{sl.text}</span>
                </div>
              </div>
              <div className="flex gap-4 ml-4">
                <div className="text-center">
                  <p className="font-mono text-xs text-friction-high font-bold">{selected.totalRed}</p>
                  <p className="text-2xs text-muted">critical</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xs text-friction-mid font-bold">{selected.totalAmber}</p>
                  <p className="text-2xs text-muted">watch</p>
                </div>
              </div>
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-2xs text-muted font-mono">{new Date(selected.savedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-2xs text-muted font-mono">{selected.prospect} @ {selected.company}</p>
              </div>
            </div>

            {/* Email draft */}
            <div className="bg-surface border border-border rounded-sm p-inner mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-1">Cold outreach</p>
                  <h2 className="font-sans text-xs font-medium text-primary">Email — {selected.prospect} @ {selected.company}</h2>
                </div>
                <button onClick={() => copyText(selected.emailDraft, 'email')}
                  className="text-2xs font-mono text-muted border border-border px-3 py-1.5 rounded-sm hover:text-primary transition-colors">
                  {copied === 'email' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-2xs text-muted leading-relaxed bg-background px-4 py-3 rounded-sm font-mono border border-border">
                {selected.emailDraft}
              </pre>
            </div>

            {/* Full report */}
            <div className="bg-surface border border-border rounded-sm p-inner">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-1">Full report</p>
                  <h2 className="font-sans text-xs font-medium text-primary">Complete snapshot</h2>
                </div>
                <button onClick={() => copyText(selected.fullReport, 'report')}
                  className="text-2xs font-mono text-muted border border-border px-3 py-1.5 rounded-sm hover:text-primary transition-colors">
                  {copied === 'report' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-[11px] text-muted leading-relaxed bg-background px-4 py-3 rounded-sm font-mono border border-border">
                {selected.fullReport}
              </pre>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ── List view ──
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="content-wrap py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-serif text-sm text-primary tracking-wide">ARPI<span className="text-accent">.</span></span>
            <span className="text-2xs font-mono text-accent-dim label-track uppercase hidden sm:block">Saved Reports</span>
          </div>
          <a href="/audit" className="text-2xs font-mono text-muted hover:text-primary transition-colors">
            + New audit
          </a>
        </div>
      </header>

      <div className="section">
        <div className="content-wrap">
          <p className="text-2xs font-mono label-track uppercase text-accent-dim mb-2">Internal</p>
          <h1 className="font-serif text-lg text-primary mb-8">Saved Reports</h1>

          {loading && (
            <div className="flex items-center gap-3 text-2xs text-muted font-mono">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Loading...
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted text-xs mb-2">No saved reports yet.</p>
              <a href="/audit" className="text-2xs font-mono text-accent-dim hover:text-primary transition-colors">
                Run your first audit →
              </a>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="space-y-3">
              {reports.map(r => {
                const sl = scoreLabel(r.score)
                return (
                  <div key={r.id}
                    className="bg-surface border border-border rounded-sm p-inner flex items-center gap-4 hover:shadow-card transition-shadow">

                    {/* Score */}
                    <div className="shrink-0 text-center w-14">
                      <p className={`font-serif text-md font-bold ${sl.cls}`}>{r.score}</p>
                      <p className="text-[10px] text-muted font-mono">/100</p>
                    </div>

                    <div className="w-px h-10 bg-border shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-primary truncate">{r.domain}</p>
                      <p className="text-2xs text-muted">{r.prospect} · {r.company}</p>
                    </div>

                    {/* Counts */}
                    <div className="flex gap-3 shrink-0">
                      <span className="text-2xs font-mono text-friction-high">{r.totalRed}✗</span>
                      <span className="text-2xs font-mono text-friction-mid">{r.totalAmber}!</span>
                    </div>

                    {/* Date */}
                    <p className="text-2xs text-muted font-mono shrink-0 hidden sm:block">
                      {new Date(r.savedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openReport(r.id)}
                        className="text-2xs font-mono text-muted border border-border px-3 py-1.5 rounded-sm hover:text-primary hover:border-primary/40 transition-colors">
                        Open
                      </button>
                      <button onClick={() => deleteReport(r.id)}
                        disabled={deleting === r.id}
                        className="text-2xs font-mono text-muted border border-border px-3 py-1.5 rounded-sm hover:text-friction-high hover:border-friction-high/40 transition-colors disabled:opacity-40">
                        {deleting === r.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
