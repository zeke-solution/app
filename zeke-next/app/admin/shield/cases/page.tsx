import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/domain/format";
import { SHIELD_CASE_STATUS, type ShieldCaseStatus } from "@/lib/domain/shield-case";

interface RawCase {
  id: string;
  status: ShieldCaseStatus;
  creator_path: string;
  updated_at: string;
  opened_at: string;
  creator: { display_name?: string } | null;
  dispute: {
    reason: string;
    deal: {
      title: string;
      brand: { display_name?: string } | null;
    } | null;
  } | null;
}

export default async function AdminShieldCasesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shield_cases")
    .select(
      "id,status,creator_path,updated_at,opened_at,creator:profiles!shield_cases_creator_id_fkey(display_name),dispute:disputes(reason,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name)))"
    )
    .order("updated_at", { ascending: false });
  const cases = (data ?? []) as unknown as RawCase[];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-purple">Shield operations</div>
          <h1 className="mt-1 text-xl font-black text-light">Shield cases</h1>
          <p className="mt-1 text-sm text-muted">Creator decisions, follow-ups, table talks and legal coordination in one audit trail.</p>
        </div>
        <Link href="/admin/legal-pool" className="rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs font-bold text-gold">Manage provider pool</Link>
      </div>

      <div className="space-y-3">
        {cases.map((item) => {
          const meta = SHIELD_CASE_STATUS[item.status];
          return (
            <Link key={item.id} href={`/admin/shield/cases/${item.id}`} className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-purple/35">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-light">{item.creator?.display_name ?? "Creator"} × {item.dispute?.deal?.brand?.display_name ?? "Brand"}</div>
                  <div className="mt-0.5 text-xs text-muted">{item.dispute?.deal?.title ?? "Shield case"} · Path: {item.creator_path.replaceAll("_", " ")}</div>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ color: meta.color, background: `${meta.color}1A` }}>{meta.label}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-light">{item.dispute?.reason ?? "No summary available."}</p>
              <div className="mt-3 text-[10px] text-muted">Updated {fmtDate(item.updated_at)}</div>
            </Link>
          );
        })}
        {cases.length === 0 && <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted">No Shield cases yet.</div>}
      </div>
    </div>
  );
}
