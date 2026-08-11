import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/domain/format";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminRemovalLogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_removal_audit")
    .select("id,entity_type,entity_id,entity_label,details,created_at,actor:profiles!admin_removal_audit_actor_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const entries = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Accountability"
        title="Removal log"
        description="Permanent audit entries for destructive actions completed through admin master controls."
        actions={<span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted">Latest {entries.length}</span>}
      />

      <div className="space-y-2">
        {entries.map((entry) => {
          const actor = entry.actor as unknown as { display_name?: string } | null;
          const details = Object.entries(entry.details ?? {}).filter(([, value]) =>
            Array.isArray(value) ? value.length > 0 : value !== null && value !== "" && value !== 0,
          );
          return (
            <div key={entry.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-light">{entry.entity_label}</div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {entry.entity_type.replaceAll("_", " ")} · {entry.entity_id}
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted">
                  <div>{fmtDate(entry.created_at)}</div>
                  <div>by {actor?.display_name ?? "Admin"}</div>
                </div>
              </div>
              {details.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {details.map(([key, value]) => (
                    <span key={key} className="rounded-full border border-border bg-dark px-2.5 py-1 text-[10px] text-muted">
                      {key.replaceAll("_", " ")}: {Array.isArray(value) ? value.length : String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted">
            No administrator removals have been recorded.
          </div>
        )}
      </div>
    </div>
  );
}
