export function DashboardLoading() {
  return (
    <div aria-label="Loading dashboard" aria-busy="true" className="animate-pulse">
      <div className="h-6 w-44 rounded-lg bg-navy" />
      <div className="mt-2 h-3 w-64 max-w-full rounded bg-navy" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-24 rounded-2xl border border-border bg-card" />)}
      </div>
      <div className="mt-5 space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="h-4 w-32 rounded bg-navy" />
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-12 rounded-xl bg-navy" />)}
      </div>
    </div>
  );
}
