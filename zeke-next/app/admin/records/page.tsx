import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/roles";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";

const PAGE_SIZE = 50;

const RECORD_VIEWS = [
  { key: "messages", label: "Messages", table: "deal_messages" },
  { key: "notifications", label: "Notifications", table: "notifications" },
  { key: "submissions", label: "Submissions", table: "submissions" },
  { key: "agreements", label: "Agreements", table: "agreements" },
  { key: "payments", label: "Payments", table: "payments" },
  { key: "final-links", label: "Final links", table: "final_links" },
  { key: "guardians", label: "Guardians", table: "guardians" },
] as const;

type RecordView = (typeof RECORD_VIEWS)[number]["key"];
type Supabase = Awaited<ReturnType<typeof createClient>>;

interface PartyDeal {
  title?: string | null;
  brand?: { display_name?: string } | null;
  creator?: { display_name?: string } | null;
}

export default async function AdminRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const view = isRecordView(params.view) ? params.view : "messages";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const supabase = await createClient();

  const countResults = await Promise.all(
    RECORD_VIEWS.map(async (item) => {
      const { count } = await supabase
        .from(item.table)
        .select("*", { count: "exact", head: true });
      return [item.key, count ?? 0] as const;
    }),
  );
  const counts = Object.fromEntries(countResults) as Record<RecordView, number>;
  const records = await loadRecords(supabase, view, page);

  return (
    <div>
      <PageHeader
        eyebrow="Operational data"
        title="Platform records"
        description="Read the complete workflow trail across communications, content delivery, agreements, payments, and account safeguards."
        actions={
          <span className="rounded-md bg-card px-3 py-1.5 text-sm font-semibold text-muted">
            {counts[view]} {RECORD_VIEWS.find((item) => item.key === view)?.label.toLowerCase()}
          </span>
        }
      />

      <nav aria-label="Record types" className="mb-5 flex flex-wrap gap-2 rounded-xl bg-card p-2">
        {RECORD_VIEWS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/records?view=${item.key}`}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              view === item.key ? "bg-accent text-white" : "text-muted hover:bg-dark hover:text-light"
            }`}
          >
            {item.label} <span className="ml-1 opacity-75">{counts[item.key]}</span>
          </Link>
        ))}
      </nav>

      {records.error ? (
        <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {records.error}
        </div>
      ) : (
        records.content
      )}

      <Pagination view={view} page={page} total={counts[view]} />
    </div>
  );
}

function isRecordView(value: string | undefined): value is RecordView {
  return RECORD_VIEWS.some((item) => item.key === value);
}

async function loadRecords(supabase: Supabase, view: RecordView, page: number) {
  if (view === "messages") return loadMessages(supabase, page);
  if (view === "notifications") return loadNotifications(supabase, page);
  if (view === "submissions") return loadSubmissions(supabase, page);
  if (view === "agreements") return loadAgreements(supabase, page);
  if (view === "payments") return loadPayments(supabase, page);
  if (view === "final-links") return loadFinalLinks(supabase, page);
  return loadGuardians(supabase, page);
}

function range(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}

async function loadMessages(supabase: Supabase, page: number) {
  const { from, to } = range(page);
  const { data, error } = await supabase
    .from("deal_messages")
    .select(
      "id,deal_id,sender_id,msg_type,content,created_at,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name)),sender:profiles!deal_messages_sender_id_fkey(display_name)",
    )
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) return { error: "Message records could not be loaded.", content: null };

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    deal_id: string | null;
    msg_type: string | null;
    content: string;
    created_at: string | null;
    deal: PartyDeal | null;
    sender: { display_name?: string } | null;
  }>;

  return {
    error: null,
    content: (
      <RecordList empty="No message records yet.">
        {rows.map((row) => (
          <RecordCard
            key={row.id}
            title={row.sender?.display_name ?? (row.msg_type?.startsWith("event") ? "System event" : "Unknown sender")}
            meta={`${dealLabel(row.deal)} · ${fmtDate(row.created_at)}`}
            badge={<Badge variant={row.msg_type?.startsWith("event") ? "gold" : "muted"}>{row.msg_type ?? "text"}</Badge>}
            actions={row.deal_id ? <Link className="text-sm font-semibold text-accent" href={`/admin/deals`}>Open deals</Link> : null}
          >
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-light">{row.content}</p>
            <RecordId value={row.id} />
          </RecordCard>
        ))}
      </RecordList>
    ),
  };
}

async function loadNotifications(supabase: Supabase, page: number) {
  const { from, to } = range(page);
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,type,read,related_deal_id,created_at,recipient:profiles!notifications_user_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) return { error: "Notification records could not be loaded.", content: null };
  const rows = (data ?? []) as unknown as Array<{
    id: string; title: string; body: string | null; type: string | null; read: boolean | null;
    related_deal_id: string | null; created_at: string | null; recipient: { display_name?: string } | null;
  }>;

  return {
    error: null,
    content: (
      <RecordList empty="No notification records yet.">
        {rows.map((row) => (
          <RecordCard
            key={row.id}
            title={row.title}
            meta={`To ${row.recipient?.display_name ?? "Unknown account"} · ${fmtDate(row.created_at)}`}
            badge={<Badge variant={row.read ? "muted" : "accent"}>{row.read ? "Read" : "Unread"}</Badge>}
          >
            <p className="break-words text-sm leading-6 text-light">{row.body || "No notification body."}</p>
            <div className="mt-2 text-xs text-muted">Type: {row.type ?? "general"}</div>
            <RecordId value={row.id} />
          </RecordCard>
        ))}
      </RecordList>
    ),
  };
}

async function loadSubmissions(supabase: Supabase, page: number) {
  const { from, to } = range(page);
  const { data, error } = await supabase
    .from("submissions")
    .select("id,deal_id,round,file_url,file_name,file_size_mb,status,review_note,submitted_at,reviewed_at,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name))")
    .order("submitted_at", { ascending: false })
    .range(from, to);
  if (error) return { error: "Submission records could not be loaded.", content: null };
  const admin = createAdminClient();
  const rows = await Promise.all(((data ?? []) as unknown as Array<{
    id: string; deal_id: string | null; round: number | null; file_url: string | null; file_name: string | null;
    file_size_mb: number | null; status: string | null; review_note: string | null; submitted_at: string | null;
    reviewed_at: string | null; deal: PartyDeal | null;
  }>).map(async (row) => {
    if (!row.file_url) return { ...row, signedUrl: null };
    const { data: signed } = await admin.storage.from("submissions").createSignedUrl(row.file_url, 300);
    return { ...row, signedUrl: signed?.signedUrl ?? null };
  }));

  return {
    error: null,
    content: (
      <RecordList empty="No submission records yet.">
        {rows.map((row) => (
          <RecordCard key={row.id} title={row.file_name ?? `Submission round ${row.round ?? "-"}`} meta={`${dealLabel(row.deal)} · ${fmtDate(row.submitted_at)}`} badge={<StatusBadge status={row.status} />}>
            <RecordFields fields={[
              ["Round", row.round ?? "-"], ["File size", row.file_size_mb ? `${row.file_size_mb} MB` : "-"],
              ["Reviewed", row.reviewed_at ? fmtDate(row.reviewed_at) : "Not reviewed"], ["Review note", row.review_note || "-"],
            ]} />
            {row.signedUrl && <a href={row.signedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-accent">Open private submission</a>}
            <RecordId value={row.id} />
          </RecordCard>
        ))}
      </RecordList>
    ),
  };
}

async function loadAgreements(supabase: Supabase, page: number) {
  const { from, to } = range(page);
  const { data, error } = await supabase
    .from("agreements")
    .select("id,deal_id,pdf_url,generated_at,signed_brand,signed_creator,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name))")
    .order("generated_at", { ascending: false })
    .range(from, to);
  if (error) return { error: "Agreement records could not be loaded.", content: null };
  const rows = (data ?? []) as unknown as Array<{
    id: string; deal_id: string | null; pdf_url: string | null; generated_at: string | null;
    signed_brand: boolean | null; signed_creator: boolean | null; deal: PartyDeal | null;
  }>;
  return {
    error: null,
    content: (
      <RecordList empty="No agreement records yet.">
        {rows.map((row) => (
          <RecordCard key={row.id} title={row.deal?.title ?? "Campaign agreement"} meta={`${dealLabel(row.deal)} · ${fmtDate(row.generated_at)}`} badge={<Badge variant={row.signed_brand && row.signed_creator ? "green" : "gold"}>{row.signed_brand && row.signed_creator ? "Signed" : "Generated"}</Badge>}>
            <RecordFields fields={[["Brand signature", row.signed_brand ? "Signed" : "Pending"], ["Creator signature", row.signed_creator ? "Signed" : "Pending"]]} />
            <Link href={`/api/agreements/${row.id}/pdf`} target="_blank" className="mt-3 inline-flex text-sm font-semibold text-accent">Download agreement PDF</Link>
            <RecordId value={row.id} />
          </RecordCard>
        ))}
      </RecordList>
    ),
  };
}

async function loadPayments(supabase: Supabase, page: number) {
  const { from, to } = range(page);
  const { data, error } = await supabase
    .from("payments")
    .select("id,deal_id,amount,currency,proof_url,status,sent_at,confirmed_at,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name))")
    .order("sent_at", { ascending: false })
    .range(from, to);
  if (error) return { error: "Payment records could not be loaded.", content: null };
  const admin = createAdminClient();
  const rows = await Promise.all(((data ?? []) as unknown as Array<{
    id: string; deal_id: string | null; amount: number | null; currency: string | null; proof_url: string | null;
    status: string | null; sent_at: string | null; confirmed_at: string | null; deal: PartyDeal | null;
  }>).map(async (row) => {
    if (!row.proof_url) return { ...row, signedUrl: null };
    const { data: signed } = await admin.storage.from("payment-proof").createSignedUrl(row.proof_url, 300);
    return { ...row, signedUrl: signed?.signedUrl ?? null };
  }));
  return {
    error: null,
    content: (
      <RecordList empty="No payment records yet.">
        {rows.map((row) => (
          <RecordCard key={row.id} title={`${row.currency ?? "INR"} ${fmtNum(row.amount)}`} meta={`${dealLabel(row.deal)} · ${fmtDate(row.sent_at)}`} badge={<StatusBadge status={row.status} />}>
            <RecordFields fields={[["Sent", row.sent_at ? fmtDate(row.sent_at) : "Not sent"], ["Confirmed", row.confirmed_at ? fmtDate(row.confirmed_at) : "Not confirmed"]]} />
            {row.signedUrl && <a href={row.signedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-accent">Open payment proof</a>}
            <RecordId value={row.id} />
          </RecordCard>
        ))}
      </RecordList>
    ),
  };
}

async function loadFinalLinks(supabase: Supabase, page: number) {
  const { from, to } = range(page);
  const { data, error } = await supabase
    .from("final_links")
    .select("id,deal_id,url,submitted_at,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name))")
    .order("submitted_at", { ascending: false })
    .range(from, to);
  if (error) return { error: "Final-link records could not be loaded.", content: null };
  const rows = (data ?? []) as unknown as Array<{ id: string; url: string; submitted_at: string | null; deal: PartyDeal | null }>;
  return { error: null, content: <RecordList empty="No final-link records yet.">{rows.map((row) => <RecordCard key={row.id} title={row.deal?.title ?? "Published deliverable"} meta={`${dealLabel(row.deal)} · ${fmtDate(row.submitted_at)}`} badge={<Badge variant="green">Published</Badge>}><a href={row.url} target="_blank" rel="noreferrer" className="break-all text-sm font-semibold text-accent">{row.url}</a><RecordId value={row.id} /></RecordCard>)}</RecordList> };
}

async function loadGuardians(supabase: Supabase, page: number) {
  const { from, to } = range(page);
  const { data, error } = await supabase
    .from("guardians")
    .select("id,influencer_id,guardian_name,guardian_email,relation,created_at")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) return { error: "Guardian records could not be loaded.", content: null };
  const rows = (data ?? []) as Array<{ id: string; influencer_id: string | null; guardian_name: string; guardian_email: string; relation: string; created_at: string | null }>;
  const creatorIds = [...new Set(rows.map((row) => row.influencer_id).filter((id): id is string => Boolean(id)))];
  const creatorNames = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: creators, error: creatorError } = await supabase.from("profiles").select("id,display_name").in("id", creatorIds);
    if (creatorError) return { error: "Guardian creator profiles could not be loaded.", content: null };
    for (const creator of creators ?? []) creatorNames.set(creator.id, creator.display_name);
  }
  return { error: null, content: <RecordList empty="No guardian records yet.">{rows.map((row) => <RecordCard key={row.id} title={row.guardian_name} meta={`Guardian for ${row.influencer_id ? creatorNames.get(row.influencer_id) ?? "Unknown creator" : "Unknown creator"} · ${fmtDate(row.created_at)}`} badge={<Badge variant="muted">{row.relation}</Badge>}><a href={`mailto:${row.guardian_email}`} className="break-all text-sm font-semibold text-accent">{row.guardian_email}</a><RecordId value={row.id} /></RecordCard>)}</RecordList> };
}

function RecordList({ children, empty }: { children: ReactNode; empty: string }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return hasChildren ? <div className="space-y-3">{children}</div> : <div className="rounded-xl bg-card p-10 text-center text-sm text-muted">{empty}</div>;
}

function RecordCard({ title, meta, badge, actions, children }: { title: ReactNode; meta: string; badge?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return <article className="min-w-0 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgba(43,36,56,0.06),0_6px_18px_rgba(43,36,56,0.035)]"><div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-sm font-bold text-light">{title}</h2><p className="mt-1 break-words text-xs text-muted">{meta}</p></div><div className="flex flex-shrink-0 items-center gap-2">{badge}{actions}</div></div><div className="mt-3">{children}</div></article>;
}

function RecordFields({ fields }: { fields: Array<[string, ReactNode]> }) {
  return <div className="grid gap-2 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="min-w-0 rounded-lg bg-dark px-3 py-2"><div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div><div className="mt-1 break-words text-sm text-light">{value}</div></div>)}</div>;
}

function RecordId({ value }: { value: string }) {
  return <div className="mt-3 break-all text-[11px] text-muted">Record ID {value}</div>;
}

function StatusBadge({ status }: { status: string | null }) {
  const variant = status === "confirmed" || status === "approved" ? "green" : status === "rejected" ? "danger" : "gold";
  return <Badge variant={variant}>{status ?? "unknown"}</Badge>;
}

function dealLabel(deal: PartyDeal | null) {
  return `${deal?.brand?.display_name ?? "Brand"} × ${deal?.creator?.display_name ?? "Creator"} · ${deal?.title ?? "Deal"}`;
}

function Pagination({ view, page, total }: { view: RecordView; page: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return <nav aria-label="Records pagination" className="mt-5 flex items-center justify-between gap-3"><span className="text-sm text-muted">Page {Math.min(page, pages)} of {pages}</span><div className="flex gap-2">{page > 1 && <Link href={`/admin/records?view=${view}&page=${page - 1}`} className="rounded-lg bg-card px-3 py-2 text-sm font-semibold text-accent">Previous</Link>}{page < pages && <Link href={`/admin/records?view=${view}&page=${page + 1}`} className="rounded-lg bg-card px-3 py-2 text-sm font-semibold text-accent">Next</Link>}</div></nav>;
}
