import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="content-wrap text-center py-24 max-w-sm mx-auto">
        <p className="font-mono text-2xs label-track uppercase text-accent-dim mb-4">
          Report not found
        </p>
        <h1 className="font-serif text-lg text-primary mb-3">
          This snapshot has expired or does not exist.
        </h1>
        <p className="text-xs text-muted mb-8">
          Reports are stored for 30 days. Generate a new snapshot to get fresh data.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium
                     text-accent-dim border border-accent-dim px-4 py-2
                     rounded-sm hover:bg-accent hover:text-primary
                     transition-colors duration-150"
        >
          Generate a new snapshot
        </Link>
      </div>
    </div>
  )
}
