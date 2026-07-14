"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEAL_STATUS_META, dealStatusLabel, type DealStatus } from "@/lib/domain/deal-status";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { BackIcon, ChatIcon, AgreementIcon, DisputeIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/Button";
import { SubmissionUploader } from "@/components/submissions/SubmissionUploader";
import { submitFinalLink } from "@/actions/links";
import { confirmPayment } from "@/actions/payments";
import { acceptCancel, declineCancel, requestCancel } from "@/actions/deals";
import { raiseDispute } from "@/actions/disputes";

type TabKey = "overview" | "submissions" | "finallink" | "payment" | "cancel";

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

export function CreatorDealDetailView({
  dealId,
  brandName,
  title,
  amount,
  status,
  deliverables,
  cancelRequestedBy,
  cancelReason,
  viewerId,
  events,
  submissions,
  finalLink,
  payment,
}: {
  dealId: string;
  brandName: string;
  title: string;
  amount: number | null;
  status: DealStatus;
  deliverables: string | null;
  cancelRequestedBy: string | null;
  cancelReason: string | null;
  viewerId: string;
  events: EventRow[];
  submissions: SubmissionRow[];
  finalLink: { url: string; submitted_at: string | null } | null;
  payment: { id: string; amount: number | null; status: string | null } | null;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const meta = DEAL_STATUS_META[status];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "submissions", label: "Submissions" },
    { key: "finallink", label: "Final Link" },
    { key: "payment", label: "Payment" },
    { key: "cancel", label: "Cancel" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/creator/deals"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-white/5 text-light"
        >
          <BackIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold text-white">{brandName}</div>
          <div className="text-xs text-muted">
            {title} · ₹{fmtNum(amount)}
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: `${meta.color}26`, color: meta.color }}>
          {dealStatusLabel(status, "creator")}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full transition-all" style={{ width: `${meta.progress}%`, background: meta.color }} />
        </div>
        <span className="whitespace-nowrap text-xs font-bold" style={{ color: meta.color }}>
          {dealStatusLabel(status, "creator")}
        </span>
      </div>

      <div className="mb-5 flex gap-0 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === t.key ? "border-b-2 border-accent text-accent" : "text-muted"
            } ${t.key === "cancel" ? "!text-accent/50" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          dealId={dealId}
          deliverables={deliverables}
          events={events}
          cancelRequestedBy={cancelRequestedBy}
          cancelReason={cancelReason}
          viewerId={viewerId}
        />
      )}
      {tab === "submissions" && <SubmissionsTab dealId={dealId} submissions={submissions} />}
      {tab === "finallink" && <FinalLinkTab dealId={dealId} status={status} finalLink={finalLink} />}
      {tab === "payment" && <PaymentTab dealId={dealId} payment={payment} />}
      {tab === "cancel" && (
        <CancelTab dealId={dealId} status={status} cancelRequestedBy={cancelRequestedBy} viewerId={viewerId} />
      )}
    </div>
  );
}

function OverviewTab({
  dealId,
  deliverables,
  events,
  cancelRequestedBy,
  cancelReason,
  viewerId,
}: {
  dealId: string;
  deliverables: string | null;
  events: EventRow[];
  cancelRequestedBy: string | null;
  cancelReason: string | null;
  viewerId: string;
}) {
  const [disputeOpen, setDisputeOpen] = useState(false);

  return (
    <div>
      {cancelRequestedBy && cancelRequestedBy !== viewerId && (
        <div className="mb-3.5 rounded-2xl border border-accent/25 bg-accent/[0.06] p-4">
          <div className="mb-1.5 text-[13px] font-bold text-accent">⊘ Cancellation requested by the brand</div>
          <div className="text-xs leading-relaxed text-light">{cancelReason}</div>
          <div className="mt-2 text-xs text-muted">Respond from the Cancel tab.</div>
        </div>
      )}

      <div className="mb-3.5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3.5 text-xs font-bold text-white">Deal Timeline</div>
        {events.length === 0 ? (
          <div className="text-xs text-muted">No events yet.</div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1.5">
              <div
                className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: ev.msg_type === "event_gold" ? "#D97706" : "#059669" }}
              />
              <div className="flex-1 text-xs leading-snug text-light">{ev.content}</div>
              <div className="flex-shrink-0 text-[11px] text-muted">{fmtDate(ev.created_at)}</div>
            </div>
          ))
        )}
      </div>

      <div className="mb-3.5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 text-xs font-bold text-white">Deliverables</div>
        <div className="text-xs leading-relaxed text-muted">{deliverables || "No deliverables specified."}</div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        <Link href={`/creator/chats/${dealId}`}>
          <Button variant="outline" size="sm">
            <ChatIcon width={13} height={13} /> Chat
          </Button>
        </Link>
        <Link href="/creator/agreements">
          <Button variant="ghost" size="sm">
            <AgreementIcon width={13} height={13} /> Agreement
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="!text-accent" onClick={() => setDisputeOpen((o) => !o)}>
          <DisputeIcon width={13} height={13} /> Raise Dispute
        </Button>
      </div>

      {disputeOpen && <DisputeForm dealId={dealId} onDone={() => setDisputeOpen(false)} />}
    </div>
  );
}

function DisputeForm({ dealId, onDone }: { dealId: string; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setPending(true);
    const res = await raiseDispute(dealId, reason);
    setPending(false);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-xl border border-accent/20 bg-accent/[0.04] p-3.5">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the issue (the brand and Zeke admin will see this)..."
        className="mb-2.5 min-h-20 w-full resize-y rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none"
      />
      <Button size="sm" disabled={pending || !reason.trim()} onClick={handleSubmit}>
        {pending ? "Submitting..." : "Submit Dispute"}
      </Button>
    </div>
  );
}

function SubmissionsTab({ dealId, submissions }: { dealId: string; submissions: SubmissionRow[] }) {
  const canUpload = submissions.length === 0 || submissions[0]?.status === "rejected";

  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        Upload your content file for brand review. Do not post until approved.
      </p>
      {submissions.map((s) => {
        const color = s.status === "approved" ? "#059669" : s.status === "rejected" ? "#E94560" : "#D97706";
        return (
          <div key={s.id} className="mb-2.5 rounded-2xl border border-border bg-card p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="text-[13px] font-bold text-white">Round {s.round}</div>
              <span className="text-[11px] font-bold" style={{ color }}>
                {(s.status ?? "pending").charAt(0).toUpperCase() + (s.status ?? "pending").slice(1)}
              </span>
            </div>
            <div className="rounded-xl bg-dark px-3 py-2.5 text-[13px] text-light">
              {s.file_name} · {s.file_size_mb}MB
            </div>
            {s.review_note && (
              <div className="mt-2 rounded-lg bg-black/10 px-2.5 py-2 text-xs" style={{ color }}>
                {s.review_note}
              </div>
            )}
          </div>
        );
      })}
      {canUpload && (
        <div className={submissions.length ? "mt-4" : ""}>
          <SubmissionUploader dealId={dealId} />
        </div>
      )}
    </div>
  );
}

function FinalLinkTab({
  dealId,
  status,
  finalLink,
}: {
  dealId: string;
  status: DealStatus;
  finalLink: { url: string; submitted_at: string | null } | null;
}) {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setPending(true);
    const res = await submitFinalLink(dealId, url);
    setPending(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div>
      <p className="mb-4 text-xs text-muted">Submit the live link after brand approves your content.</p>
      {finalLink ? (
        <div className="rounded-2xl border border-zgreen/25 bg-card p-4">
          <div className="mb-2 text-xs font-bold text-white">Submitted Link</div>
          <div className="break-all rounded-xl bg-dark px-3.5 py-2.5 text-[13px] text-zgreen">{finalLink.url}</div>
          <div className="mt-2 text-[11px] text-muted">Submitted {fmtDate(finalLink.submitted_at)}</div>
        </div>
      ) : status === "approved" ? (
        <div className="rounded-2xl border border-zgreen/20 bg-card p-4">
          <div className="mb-2.5 text-[13px] font-bold text-white">Submit Live Link</div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://instagram.com/p/..."
            className="mb-2.5 w-full rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none"
          />
          <Button size="sm" fullWidth disabled={pending || !url.trim()} onClick={handleSubmit}>
            {pending ? "Submitting..." : "Submit Link"}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 opacity-50">
          <div className="text-[13px] font-bold text-white">Final Link</div>
          <div className="mt-1.5 text-xs text-muted">Available after brand approves your content.</div>
        </div>
      )}
    </div>
  );
}

function PaymentTab({
  dealId,
  payment,
}: {
  dealId: string;
  payment: { id: string; amount: number | null; status: string | null } | null;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    if (!payment) return;
    setPending(true);
    const res = await confirmPayment(payment.id, dealId);
    setPending(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div>
      <p className="mb-4 text-xs text-muted">Confirm once you receive payment from the brand.</p>
      {!payment ? (
        <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] p-4 opacity-50">
          <div className="text-[13px] font-bold text-gold">Confirm Payment</div>
          <div className="mt-1.5 text-xs text-muted">Available after brand marks payment as sent.</div>
        </div>
      ) : payment.status === "confirmed" ? (
        <div className="rounded-2xl border border-zgreen/25 bg-card p-4">
          <div className="rounded-lg bg-zgreen/[0.06] px-3 py-2.5 text-[13px] font-semibold text-zgreen">
            ✓ ₹{fmtNum(payment.amount)} received and confirmed
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gold/25 bg-card p-4">
          <div className="mb-3 text-[13px] font-bold text-white">Confirm Payment Received</div>
          <div className="mb-4 text-sm font-bold text-gold">₹{fmtNum(payment.amount)} sent by brand</div>
          <Button fullWidth disabled={pending} onClick={handleConfirm}>
            {pending ? "Confirming..." : "I have received the payment"}
          </Button>
        </div>
      )}
    </div>
  );
}

function CancelTab({
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
  const unavailable = status === "completed" || status === "cancelled";

  return (
    <div>
      <div className="mb-3.5 rounded-2xl border border-accent/20 bg-accent/[0.04] p-4">
        <div className="mb-1.5 text-[13px] font-bold text-white">Cancel Agreement</div>
        {unavailable ? (
          <div className="rounded-lg bg-white/5 p-3 text-center text-xs text-muted">
            Cancellation not available for this deal.
          </div>
        ) : cancelRequestedBy && !alreadyRequestedByMe ? (
          <div>
            <div className="mb-3 rounded-lg border border-gold/20 bg-gold/[0.06] p-3 text-xs font-semibold text-gold">
              The brand requested cancellation. Accepting will close the deal.
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
            ⊘ Cancellation request sent. The brand must agree before the deal closes.
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs leading-relaxed text-muted">
              Send a cancellation request. The brand must agree before the deal is cancelled.
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
