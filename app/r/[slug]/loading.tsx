export default function ReportLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="content-wrap text-center py-24">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-4 h-4 border border-accent-dim border-t-transparent
                          rounded-full animate-spin" />
          <span className="text-xs text-muted font-mono">Generating snapshot...</span>
        </div>
        <p className="text-2xs text-muted max-w-xs mx-auto">
          Collecting public signals. This typically takes 10 to 30 seconds.
        </p>
      </div>
    </div>
  )
}
