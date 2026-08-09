export function DashboardLoading() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading page">
      <div className="mb-6 h-7 w-44 rounded-lg bg-white/[0.08]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 rounded-2xl border border-border bg-card/70" />
        ))}
      </div>
      <div className="mt-5 space-y-3 rounded-2xl border border-border bg-card/70 p-4">
        <div className="h-4 w-2/5 rounded bg-white/[0.08]" />
        <div className="h-14 rounded-xl bg-white/[0.05]" />
        <div className="h-14 rounded-xl bg-white/[0.05]" />
        <div className="h-14 rounded-xl bg-white/[0.05]" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
