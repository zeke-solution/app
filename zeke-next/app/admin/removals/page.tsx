import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/domain/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { RemovalRetryButton } from "@/components/admin/RemovalRetryButton";

const STATUS_LABEL = {
  pending: "Pending",
  database_complete: "Finishing cleanup",
  needs_review: "Needs review",
  complete: "Complete",
} as const;

const STATUS_CLASS = {
  pending: "bg-gold/10 text-gold",
  database_complete: "bg-cyan/10 text-cyan",
  needs_review: "bg-danger/10 text-danger",
  complete: "bg-zgreen/10 text-zgreen",
} as const;

export default async function AdminRemovalLogPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { data: legacyEntries }] = await Promise.all([
    supabase
      .from("admin_removal_jobs")
      .select(
        "id,entity_type,entity_id,entity_label,status,details,last_error,attempt_count,database_completed_at,completed_at,created_at,actor:profiles!admin_removal_jobs_actor_id_fkey(display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("admin_removal_audit")
      .select(
        "id,entity_type,entity_id,entity_label,details,created_at,actor:profiles!admin_removal_audit_actor_id_fkey(display_name)",
      )
      .is("job_id", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const operations = jobs ?? [];
  const earlierEntries = legacyEntries ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Accountability"
        title="Removal log"
        description="Every master-control removal is recorded before deletion. Incomplete Auth or file cleanup stays visible here and can be retried safely."
        actions={
          <span className="rounded-md bg-card px-3 py-1.5 text-sm font-semibold text-muted">
            Latest {operations.length}
          </span>
        }
      />

      <div className="space-y-2">
        {operations.map((job) => {
          const actor = job.actor as unknown as { display_name?: string } | null;
          const details = visibleDetails(job.details);
          const status = job.status as keyof typeof STATUS_LABEL;
          return (
            <article key={job.id} className="rounded-2xl bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-light">{job.entity_label}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_CLASS[status]}`}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  <div className="mt-0.5 break-all text-[11px] text-muted">
                    {job.entity_type.replaceAll("_", " ")} · {job.entity_id}
                  </div>
                  <div className="mt-1 text-[10px] text-muted">
                    Started {fmtDate(job.created_at)} by {actor?.display_name ?? "Admin"} ·{" "}
                    {job.attempt_count} {job.attempt_count === 1 ? "attempt" : "attempts"}
                  </div>
                </div>
                {job.status !== "complete" && <RemovalRetryButton jobId={job.id} />}
              </div>

              {job.last_error && (
                <p className="mt-3 rounded-xl bg-danger/[0.07] px-3 py-2 text-xs text-danger">
                  {job.last_error}
                </p>
              )}
              {details.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {details.map(([key, value]) => (
                    <span key={key} className="rounded-full bg-dark px-2.5 py-1 text-[10px] text-muted">
                      {key.replaceAll("_", " ")}: {Array.isArray(value) ? value.length : String(value)}
                    </span>
                  ))}
                </div>
              )}
            </article>
          );
        })}

        {operations.length === 0 && earlierEntries.length === 0 && (
          <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted">
            No administrator removals have been recorded.
          </div>
        )}
      </div>

      {earlierEntries.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-light">Earlier completed removals</h2>
          <div className="space-y-2">
            {earlierEntries.map((entry) => {
              const actor = entry.actor as unknown as { display_name?: string } | null;
              return (
                <article key={entry.id} className="rounded-2xl bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-light">{entry.entity_label}</div>
                      <div className="mt-0.5 break-all text-[11px] text-muted">
                        {entry.entity_type.replaceAll("_", " ")} · {entry.entity_id}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-muted">
                      <div>{fmtDate(entry.created_at)}</div>
                      <div>by {actor?.display_name ?? "Admin"}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function visibleDetails(details: Record<string, unknown>) {
  return Object.entries(details ?? {}).filter(
    ([, value]) =>
      value !== null &&
      value !== "" &&
      value !== 0 &&
      (!Array.isArray(value) || value.length > 0),
  );
}
