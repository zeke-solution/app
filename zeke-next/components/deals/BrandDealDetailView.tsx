"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEAL_STATUS_META, dealStatusLabel, type DealStatus } from "@/lib/domain/deal-status";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { BackIcon, ChatIcon, AgreementIcon, DisputeIcon } from "@/components/layout/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { markPaymentSent } from "@/actions/payments";
import { createSubmissionDownloadUrl, reviewSubmission } from "@/actions/submissions";
import { acceptCancel, declineCancel, requestCancel } from "@/actions/deals";
import { raiseDispute } from "@/actions/disputes";
import { editOffer } from "@/actions/offers";
import { AgreementPreview } from "@/components/agreements/AgreementPreview";

type TabKey = "overview" | "review" | "finallink" | "payment" | "agreement" | "cancel";

interface EventRow {
  msg_type: string | null;
  content: string;
  created_at: string | null;
}
interface SubmissionRow {
  id: string;
  round: number | null;
  file_url: string | null;
  file_name: string | null;
  file_size_mb: number | null;
  status: string | null;
  review_note: string | null;
}
interface AgreementInfo {
  id: string;
  generatedAt: string | null;
  creatorIsShield: boolean;
}

export function BrandDealDetailView({
  dealId,
  brandName,
  creatorName,
  title,
  platform,
  amount,
  status,
  deliverables,
  deadline,
  cancelRequestedBy,
  viewerId,
  events,
  submissions,
  finalLink,
  payment,
  agreement,
  initialTab,
}: {
  dealId: string;
  brandName: string;
  creatorName: string;
  title: string;
  platform: string | null;
  amount: number;
  status: DealStatus;
  deliverables: string | null;
  deadline: string | null;
  cancelRequestedBy: string | null;
  viewerId: string;
  events: EventRow[];
  submissions: SubmissionRow[];
  finalLink: { url: string; submitted_at: string | null } | null;
  payment: { id: string; amount: number | null; status: string | null } | null;
  agreement: AgreementInfo | null;
  initialTab?: string;
}) {
  const meta = DEAL_STATUS_META[status];
  const router = useRouter();

  const tabs: { key: Exclude<TabKey, "cancel">; label: string }[] = [
    { key: "overview", label: "Overview" },
  ];
  if (submissions.length > 0 || status === "submitted" || status === "approved") {
    tabs.push({ key: "review", label: "Content review" });
  }
  if (finalLink || ["link_submitted", "payment_sent", "completed"].includes(status)) {
    tabs.push({ key: "finallink", label: "Final link" });
  }
  if (payment || ["link_submitted", "payment_sent", "completed"].includes(status)) {
    tabs.push({ key: "payment", label: "Payment" });
  }
  if (agreement) tabs.push({ key: "agreement", label: "Agreement" });
  const initialKey = initialTab as TabKey | undefined;
  const [tab, setTab] = useState<TabKey>(
    initialKey && (initialKey === "cancel" || tabs.some((item) => item.key === initialKey))
      ? initialKey
      : "overview",
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/brand/partnerships" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-white/5 text-light">
          <BackIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold text-light">{creatorName}</div>
          <div className="text-xs text-muted">
            {title} · ₹{fmtNum(amount)}
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: `${meta.color}26`, color: meta.color }}>
          {dealStatusLabel(status, "brand")}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full transition-all" style={{ width: `${meta.progress}%`, background: meta.color }} />
        </div>
        <span className="whitespace-nowrap text-xs font-bold" style={{ color: meta.color }}>
          {dealStatusLabel(status, "brand")}
        </span>
      </div>

      <div className="mb-5 flex items-end justify-between gap-3 border-b border-border">
        <div className="flex min-w-0 gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`min-h-11 whitespace-nowrap px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                tab === t.key ? "border-b-2 border-accent text-accent" : "text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setTab("cancel")}
          className={`min-h-11 flex-shrink-0 px-2 text-xs font-semibold transition-colors ${
            tab === "cancel" ? "border-b-2 border-danger text-danger" : "text-muted hover:text-light"
          }`}
        >
          Partnership options
        </button>
      </div>

      {tab === "overview" && (
        <OverviewTab
          dealId={dealId}
          title={title}
          platform={platform}
          amount={amount}
          deliverables={deliverables}
          deadline={deadline}
          status={status}
          events={events}
          cancelRequestedBy={cancelRequestedBy}
          viewerId={viewerId}
        />
      )}
      {tab === "review" && <ReviewTab dealId={dealId} submissions={submissions} />}
      {tab === "finallink" && <FinalLinkTab finalLink={finalLink} />}
      {tab === "payment" && <PaymentTab dealId={dealId} amount={amount} status={status} payment={payment} />}
      {tab === "agreement" && (
        <AgreementTab
          agreement={agreement}
          brandName={brandName}
          creatorName={creatorName}
          title={title}
          platform={platform}
          amount={amount}
          deliverables={deliverables}
        />
      )}
      {tab === "cancel" && (
        <BrandCancelTab dealId={dealId} status={status} cancelRequestedBy={cancelRequestedBy} viewerId={viewerId} />
      )}
    </div>
  );

  function OverviewTab(p: {
    dealId: string;
    title: string;
    platform: string | null;
    amount: number;
    deliverables: string | null;
    deadline: string | null;
    status: DealStatus;
    events: EventRow[];
    cancelRequestedBy: string | null;
    viewerId: string;
  }) {
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const showCancelBanner =
      p.status !== "completed" &&
      p.status !== "cancelled" &&
      p.status !== "disputed" &&
      !!p.cancelRequestedBy &&
      p.cancelRequestedBy !== p.viewerId;

    async function handleAcceptCancel() {
      if (!confirm("Cancel this deal?")) return;
      const res = await acceptCancel(p.dealId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    }
    async function handleDeclineCancel() {
      const res = await declineCancel(p.dealId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    }

    return (
      <div>
        {p.status === "negotiating" && (
          <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl border border-gold/25 bg-gold/[0.06] p-3.5">
            <div className="flex-1 text-xs leading-relaxed text-gold">
              <span className="font-bold">Negotiating</span> · You can still update the offer (price,
              platform, deliverables) before the creator accepts.
            </div>
            <Button variant="gold" size="sm" onClick={() => setEditOpen(true)}>Update Offer</Button>
          </div>
        )}

        {showCancelBanner && (
          <div className="mb-3.5 rounded-2xl border border-accent/25 bg-accent/[0.06] p-4">
            <div className="mb-1.5 text-[13px] font-bold text-accent">⊘ Cancellation requested by creator</div>
            <div className="flex gap-2">
              <button onClick={handleAcceptCancel} className="flex-1 rounded-lg border border-zgreen/30 bg-zgreen/[0.05] py-2 text-xs font-bold text-zgreen">
                Accept Cancellation
              </button>
              <button onClick={handleDeclineCancel} className="rounded-lg border border-accent/30 bg-accent/[0.05] px-4 py-2 text-xs font-bold text-accent">
                Decline
              </button>
            </div>
          </div>
        )}

        <div className="mb-3.5 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3.5 text-xs font-bold text-light">Deal Timeline</div>
          {p.events.length === 0 ? (
            <div className="text-xs text-muted">No events yet.</div>
          ) : (
            p.events.map((ev, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1.5">
                <div className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: ev.msg_type === "event_gold" ? "#92400E" : "#047857" }} />
                <div className="flex-1 text-xs leading-snug text-light">{ev.content}</div>
                <div className="flex-shrink-0 text-[11px] text-muted">{fmtDate(ev.created_at)}</div>
              </div>
            ))
          )}
        </div>

        <div className="mb-3.5 rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 text-xs font-bold text-light">Deliverables</div>
          <div className="text-xs leading-relaxed text-muted">{p.deliverables || "No deliverables specified."}</div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Link href={`/brand/chats/${p.dealId}`}>
            <Button variant="outline" size="sm"><ChatIcon width={13} height={13} /> Message creator</Button>
          </Link>
          {agreement && (
            <Button variant="ghost" size="sm" onClick={() => setTab("agreement")}>
              <AgreementIcon width={13} height={13} /> Agreement
            </Button>
          )}
        </div>

        <details className="mt-3 rounded-xl bg-dark/60 px-3.5 py-2.5">
          <summary className="min-h-8 cursor-pointer text-xs font-semibold text-muted">
            Problem with this partnership?
          </summary>
          <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button variant="ghost" size="sm" className="!text-danger" onClick={() => setDisputeOpen((o) => !o)}>
              <DisputeIcon width={13} height={13} /> Raise dispute
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTab("cancel")}>
              Cancellation options
            </Button>
          </div>
        </details>

        {disputeOpen && <DisputeForm dealId={p.dealId} onDone={() => setDisputeOpen(false)} />}
        {editOpen && (
          <EditOfferModal
            dealId={p.dealId}
            initial={{ title: p.title, platform: p.platform ?? "", amount: p.amount, deliverables: p.deliverables ?? "", deadline: p.deadline ?? "" }}
            onClose={() => setEditOpen(false)}
          />
        )}
      </div>
    );
  }

  function DisputeForm({ dealId, onDone }: { dealId: string; onDone: () => void }) {
    const [reason, setReason] = useState("");
    const [pending, setPending] = useState(false);

    async function handleSubmit() {
      setPending(true);
      const res = await raiseDispute(dealId, reason);
      setPending(false);
      if (!res.ok) return alert(res.error);
      onDone();
      router.refresh();
    }

    return (
      <div className="mt-3 rounded-xl border border-accent/20 bg-accent/[0.04] p-3.5">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the issue (the creator and Zeke admin will see this)..."
          className="mb-2.5 min-h-20 w-full resize-y rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none"
        />
        <Button size="sm" disabled={pending || !reason.trim()} onClick={handleSubmit}>
          {pending ? "Submitting..." : "Submit Dispute"}
        </Button>
      </div>
    );
  }

  function EditOfferModal({
    dealId,
    initial,
    onClose,
  }: {
    dealId: string;
    initial: { title: string; platform: string; amount: number; deliverables: string; deadline: string };
    onClose: () => void;
  }) {
    const [form, setForm] = useState(initial);
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    async function handleSave() {
      setPending(true);
      const res = await editOffer({ dealId, ...form });
      setPending(false);
      if (!res.ok) return setError(res.error);
      onClose();
      router.refresh();
    }

    return (
      <div className="fixed inset-0 z-50 flex h-[100dvh] items-stretch justify-center bg-black/65 p-0 sm:items-center sm:p-5" onClick={onClose}>
        <div className="h-full w-full overflow-y-auto rounded-none border-0 bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:h-auto sm:max-h-[92vh] sm:max-w-[440px] sm:rounded-2xl sm:border sm:p-6" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 text-base font-bold text-light">Update Offer</div>
          <div className="flex flex-col gap-2.5">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
            <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="Platform" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Amount" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
            <textarea value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="Deliverables" rows={3} className="resize-y rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
          </div>
          {error && <div className="mt-2 rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">{error}</div>}
          <div className="mt-4 flex gap-2.5">
            <Button className="flex-1" disabled={pending} onClick={handleSave}>{pending ? "Saving..." : "Save & Notify"}</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  function ReviewTab({ dealId, submissions }: { dealId: string; submissions: SubmissionRow[] }) {
    return (
      <div>
        <p className="mb-4 text-xs text-muted">Review submitted content from the creator before approving for posting.</p>
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">No submissions yet.</div>
        ) : (
          submissions.map((s) => <SubmissionReviewCard key={s.id} dealId={dealId} submission={s} />)
        )}
      </div>
    );
  }

  function FinalLinkTab({
    finalLink,
  }: {
    finalLink: { url: string; submitted_at: string | null } | null;
  }) {
    if (!finalLink) {
      return (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
          The creator has not submitted a final live link yet.
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-zgreen/25 bg-card p-4">
        <div className="mb-2 text-xs font-bold text-light">Submitted live link</div>
        <a
          href={finalLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block break-all rounded-xl bg-dark px-3.5 py-2.5 text-[13px] text-zgreen hover:underline"
        >
          {finalLink.url}
        </a>
        <div className="mt-2 text-[11px] text-muted">Submitted {fmtDate(finalLink.submitted_at)}</div>
      </div>
    );
  }

  function SubmissionReviewCard({ dealId, submission }: { dealId: string; submission: SubmissionRow }) {
    const [pending, setPending] = useState(false);
    const [opening, setOpening] = useState(false);
    const isPending = submission.status === "pending";

    async function handleApprove() {
      setPending(true);
      const res = await reviewSubmission(submission.id, dealId, "approved");
      setPending(false);
      if (!res.ok) alert(res.error);
      else router.refresh();
    }
    async function handleReject() {
      const note = prompt("Reason for requesting changes:");
      if (!note) return;
      setPending(true);
      const res = await reviewSubmission(submission.id, dealId, "rejected", note);
      setPending(false);
      if (!res.ok) alert(res.error);
      else router.refresh();
    }

    async function handleOpenFile() {
      setOpening(true);
      const res = await createSubmissionDownloadUrl(submission.id, dealId);
      setOpening(false);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    }

    return (
      <div className="mb-2.5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[13px] font-bold text-light">Round {submission.round}</div>
          <Badge variant={isPending ? "gold" : submission.status === "approved" ? "green" : "accent"}>
            {isPending ? "Awaiting Review" : (submission.status ?? "").replace(/^./, (c) => c.toUpperCase())}
          </Badge>
        </div>
        {submission.file_name && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-dark px-3 py-2.5 text-[13px] text-light">
            <span className="min-w-0 truncate">{submission.file_name} · {submission.file_size_mb}MB</span>
            <button
              onClick={handleOpenFile}
              disabled={opening || !submission.file_url}
              className="flex-shrink-0 text-xs font-bold text-accent disabled:opacity-50"
            >
              {opening ? "Opening..." : "Open file"}
            </button>
          </div>
        )}
        {isPending && (
          <div className="flex gap-2">
            <button onClick={handleApprove} disabled={pending} className="flex-1 rounded-lg border border-zgreen/30 bg-zgreen/[0.05] py-2 text-xs font-bold text-zgreen disabled:opacity-50">
              &#10003; Approve
            </button>
            <button onClick={handleReject} disabled={pending} className="rounded-lg border border-accent/30 bg-accent/[0.05] px-4 py-2 text-xs font-bold text-accent disabled:opacity-50">
              &#10006; Request Changes
            </button>
          </div>
        )}
        {submission.review_note && <div className="mt-2 rounded-lg bg-black/10 px-2.5 py-2 text-xs text-muted">{submission.review_note}</div>}
      </div>
    );
  }

  function PaymentTab({
    dealId,
    amount,
    status,
    payment,
  }: {
    dealId: string;
    amount: number;
    status: DealStatus;
    payment: { id: string; amount: number | null; status: string | null } | null;
  }) {
    const [pending, setPending] = useState(false);

    async function handleMarkSent() {
      setPending(true);
      const res = await markPaymentSent(dealId, amount);
      setPending(false);
      if (!res.ok) alert(res.error);
      else router.refresh();
    }

    return (
      <div>
        <p className="mb-4 text-xs text-muted">Mark payment as sent once you have transferred the agreed amount.</p>
        {!payment && status !== "link_submitted" ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted">
            Payment becomes available after the creator submits the final live link.
          </div>
        ) : !payment ? (
          <div className="rounded-2xl border border-gold/25 bg-card p-4">
            <div className="mb-3 text-[13px] font-bold text-light">Mark Payment as Sent</div>
            <div className="mb-4 text-[13px] text-muted">
              Agreed amount: <span className="font-bold text-light">₹{fmtNum(amount)}</span>
            </div>
            <Button fullWidth disabled={pending} onClick={handleMarkSent}>
              {pending ? "Marking..." : "I have sent the payment"}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zgreen/25 bg-card p-4">
            <div className="mb-3 text-[13px] font-bold text-light">Payment Status</div>
            <div className="flex items-center gap-2.5 rounded-xl border border-zgreen/30 bg-dark px-3 py-2.5">
              <div className="flex-1 text-[13px] font-semibold text-light">₹{fmtNum(payment.amount)} sent</div>
              <Badge variant={payment.status === "confirmed" ? "green" : "gold"}>
                {payment.status === "confirmed" ? "Confirmed by Creator" : "Awaiting Confirmation"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    );
  }

  function AgreementTab({
    agreement,
    brandName,
    creatorName,
    title,
    platform,
    amount,
    deliverables,
  }: {
    agreement: AgreementInfo | null;
    brandName: string;
    creatorName: string;
    title: string;
    platform: string | null;
    amount: number;
    deliverables: string | null;
  }) {
    if (!agreement) {
      return (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[13px] font-bold text-light">No Agreement Yet</div>
          <div className="mt-1.5 text-xs text-muted">Generated automatically once the creator accepts the offer.</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <AgreementPreview
          agreementId={agreement.id}
          brandName={brandName}
          creatorName={creatorName}
          title={title}
          platform={platform}
          amount={amount}
          deliverables={deliverables}
          generatedAt={agreement.generatedAt}
        />
        {agreement.creatorIsShield ? (
          <a href={`/api/agreements/${agreement.id}/pdf`} className="block w-full rounded-lg border border-border py-2.5 text-center text-xs font-bold text-light">
            &#11015; Download official PDF
          </a>
        ) : (
          <div className="text-center text-[11px] text-muted">PDF available when the creator is a Shield member.</div>
        )}
      </div>
    );
  }
}

function BrandCancelTab({
  dealId,
  status,
  cancelRequestedBy,
  viewerId,
}: {
  dealId: string;
  status: DealStatus;
  cancelRequestedBy: string | null;
  viewerId: string;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setPending(true);
    const res = await requestCancel(dealId, reason);
    setPending(false);
    if (!res.ok) alert(res.error);
    else {
      setSent(true);
      router.refresh();
    }
  }

  async function handleAccept() {
    setPending(true);
    const res = await acceptCancel(dealId);
    setPending(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  async function handleDecline() {
    setPending(true);
    const res = await declineCancel(dealId);
    setPending(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  const alreadyRequestedByMe = cancelRequestedBy === viewerId;
  const unavailable = status === "completed" || status === "cancelled" || status === "disputed";

  return (
    <div>
      <div className="mb-3.5 rounded-2xl border border-accent/20 bg-accent/[0.04] p-4">
        <div className="mb-1.5 text-[13px] font-bold text-light">Cancel Agreement</div>
        {unavailable ? (
          <div className="rounded-lg bg-white/5 p-3 text-center text-xs text-muted">
            {status === "disputed"
              ? "Resolve the active dispute before changing or closing this deal."
              : "Cancellation not available for this deal."}
          </div>
        ) : cancelRequestedBy && !alreadyRequestedByMe ? (
          <div>
            <div className="mb-3 rounded-lg border border-gold/20 bg-gold/[0.06] p-3 text-xs font-semibold text-gold">
              The creator requested cancellation. Accepting will close the deal.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={pending}
                className="flex-1 rounded-lg border border-zgreen/30 bg-zgreen/[0.05] py-2.5 text-xs font-bold text-zgreen disabled:opacity-50"
              >
                Accept cancellation
              </button>
              <button
                onClick={handleDecline}
                disabled={pending}
                className="flex-1 rounded-lg border border-accent/30 bg-accent/[0.05] py-2.5 text-xs font-bold text-accent disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        ) : sent || alreadyRequestedByMe ? (
          <div className="rounded-lg border border-gold/20 bg-gold/[0.06] p-3 text-xs font-semibold text-gold">
            Cancellation request sent. The creator must agree before the deal closes.
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs leading-relaxed text-muted">
              Send a cancellation request. The creator must agree before the deal is cancelled.
            </div>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for cancellation..."
              className="mb-2.5 min-h-20 w-full resize-y rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={pending || !reason.trim()}
              className="w-full rounded-lg border border-accent/30 bg-accent/10 py-2.5 font-bold text-accent disabled:opacity-50"
            >
              {pending ? "Sending..." : "Send Request"}
            </button>
          </>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card p-3.5 text-xs leading-relaxed text-muted">
        <div className="mb-2 text-xs font-bold text-light">How cancellation works</div>
        <div>&#10137; Either party sends a request with a reason</div>
        <div className="mt-1">&#10137; The other party must Accept or Decline</div>
        <div className="mt-1">&#10137; Both must agree for the deal to be cancelled</div>
        <div className="mt-1">&#10137; If stuck, open a dispute and Zeke steps in</div>
      </div>
    </div>
  );
}
