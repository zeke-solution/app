"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addShieldCaseUpdate, adminUpdateShieldCase } from "@/actions/shield-cases";
import { fmtDate } from "@/lib/domain/format";
import { SHIELD_CASE_STATUS, type ShieldCaseStatus } from "@/lib/domain/shield-case";
import { Button } from "@/components/ui/Button";
import { AdminRemoveButton } from "@/components/admin/AdminRemoveButton";
import type { CaseDocumentView, CaseUpdateView } from "@/components/shield/CreatorShieldCaseWorkspace";

export interface AdminCaseView {
  id: string;
  status: ShieldCaseStatus;
  creatorPath: "undecided" | "follow_up" | "legal";
  creatorName: string;
  brandName: string;
  dealTitle: string;
  reason: string;
  openedAt: string;
  contactBrandConsent: boolean;
  shareConsent: boolean;
  legalCostAcknowledged: boolean;
  independentAdviceAcknowledged: boolean;
  engagementConfirmedAt: string | null;
  outcome: string | null;
  providerName: string | null;
}

export function AdminShieldCaseWorkspace({
  shieldCase,
  updates,
  documents,
}: {
  shieldCase: AdminCaseView;
  updates: CaseUpdateView[];
  documents: CaseDocumentView[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ShieldCaseStatus>(shieldCase.status);
  const [statusNote, setStatusNote] = useState("");
  const [outcome, setOutcome] = useState(shieldCase.outcome ?? "");
  const [updateKind, setUpdateKind] = useState<"follow_up" | "settlement_talk" | "legal_coordination" | "note">("follow_up");
  const [updateBody, setUpdateBody] = useState("");
  const [adminOnly, setAdminOnly] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const meta = SHIELD_CASE_STATUS[shieldCase.status];

  async function saveStatus() {
    setPending(true);
    setMessage("");
    const result = await adminUpdateShieldCase(shieldCase.id, status, statusNote, outcome);
    setPending(false);
    if (!result.ok) setMessage(result.error);
    else {
      setStatusNote("");
      router.refresh();
    }
  }

  async function addUpdate() {
    setPending(true);
    setMessage("");
    const result = await addShieldCaseUpdate(
      shieldCase.id,
      updateBody,
      updateKind,
      adminOnly ? "admin_only" : "creator_and_admin"
    );
    setPending(false);
    if (!result.ok) setMessage(result.error);
    else {
      setUpdateBody("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted">{shieldCase.creatorName} × {shieldCase.brandName}</div>
            <h1 className="mt-1 text-lg font-black text-light">{shieldCase.dealTitle}</h1>
            <div className="mt-1 text-[10px] text-muted">Opened {fmtDate(shieldCase.openedAt)}</div>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: meta.color, background: `${meta.color}1A` }}>{meta.label}</span>
        </div>
        <p className="mt-4 rounded-xl border border-border bg-dark p-3 text-xs leading-5 text-light">{shieldCase.reason}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-danger/20 pt-4">
          <div>
            <div className="text-xs font-black text-danger">Master case control</div>
            <div className="mt-0.5 text-[10px] text-muted">Removes the case timeline and evidence; the underlying dispute remains.</div>
          </div>
          <AdminRemoveButton
            kind="shield_case"
            entityId={shieldCase.id}
            entityLabel={`${shieldCase.creatorName} Shield case`}
            triggerLabel="Remove case"
            description="This permanently removes the Shield case, its timeline, evidence records, and stored evidence files."
            onRemoved={() => router.push("/admin/shield/cases")}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Creator path" value={shieldCase.creatorPath.replaceAll("_", " ")} ok={shieldCase.creatorPath !== "undecided"} />
        <Fact label="Brand contact consent" value={shieldCase.contactBrandConsent ? "Recorded" : "Not given"} ok={shieldCase.contactBrandConsent} />
        <Fact label="Provider sharing consent" value={shieldCase.shareConsent ? "Recorded" : "Not given"} ok={shieldCase.shareConsent} />
        <Fact label="Direct engagement" value={shieldCase.engagementConfirmedAt ? `Confirmed ${fmtDate(shieldCase.engagementConfirmedAt)}` : "Not confirmed"} ok={!!shieldCase.engagementConfirmedAt} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-extrabold text-light">Case stage</h2>
          <p className="mt-1 text-[10px] leading-4 text-muted">Do not move to legal coordination until the creator confirms a direct provider engagement.</p>
          <select value={status} onChange={(e) => setStatus(e.target.value as ShieldCaseStatus)} className="mt-3 w-full rounded-xl border border-border bg-dark px-3 py-2 text-xs text-light">
            {Object.entries(SHIELD_CASE_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
          </select>
          <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Required note explaining this stage change..." className="mt-2 min-h-20 w-full rounded-xl border border-border bg-dark p-3 text-xs text-light outline-none" />
          {(status === "resolved" || status === "closed") && <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Recorded outcome..." className="mt-2 min-h-20 w-full rounded-xl border border-border bg-dark p-3 text-xs text-light outline-none" />}
          <Button size="sm" className="mt-2" disabled={pending || !statusNote.trim() || ((status === "resolved" || status === "closed") && !outcome.trim())} onClick={saveStatus}>Save stage</Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-extrabold text-light">Log communication</h2>
          <p className="mt-1 text-[10px] leading-4 text-muted">Record each brand follow-up, table talk and authorised lawyer coordination step.</p>
          <select value={updateKind} onChange={(e) => setUpdateKind(e.target.value as typeof updateKind)} className="mt-3 w-full rounded-xl border border-border bg-dark px-3 py-2 text-xs text-light">
            <option value="follow_up">Brand follow-up</option>
            <option value="settlement_talk">Settlement / table talk</option>
            <option value="legal_coordination">Legal-provider coordination</option>
            <option value="note">General case note</option>
          </select>
          <textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} placeholder="What happened, who was contacted, and the next agreed step..." className="mt-2 min-h-24 w-full rounded-xl border border-border bg-dark p-3 text-xs text-light outline-none" />
          <label className="mt-2 flex items-center gap-2 text-[10px] text-muted"><input type="checkbox" checked={adminOnly} onChange={(e) => setAdminOnly(e.target.checked)} className="accent-purple" /> Internal admin note (hidden from creator)</label>
          <Button size="sm" className="mt-2" disabled={pending || !updateBody.trim()} onClick={addUpdate}>Add timeline update</Button>
        </div>
      </section>

      {message && <div className="rounded-xl border border-accent/25 bg-accent/10 p-3 text-xs text-accent">{message}</div>}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-extrabold text-light">Complete timeline</h2>
          <div className="mt-3 space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="border-l-2 border-purple/30 pl-3">
                <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase text-purple">{update.actorRole} · {update.kind.replaceAll("_", " ")}</span><span className="text-[9px] text-muted">{fmtDate(update.createdAt)}</span></div>
                <p className="mt-1 text-xs leading-5 text-light">{update.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-extrabold text-light">Case evidence</h2>
          <div className="mt-3 space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="rounded-xl border border-border bg-dark p-3">
                <div className="flex items-start justify-between gap-2"><div><div className="text-xs font-semibold text-light">{document.fileName}</div><div className="mt-0.5 text-[9px] text-muted">{document.category.replaceAll("_", " ")} · {document.sharedWithProvider ? "authorised for provider sharing" : "creator and Zeke only"}</div></div>{document.downloadUrl && <a href={document.downloadUrl} className="text-[10px] font-semibold text-accent">Open</a>}</div>
              </div>
            ))}
            {documents.length === 0 && <div className="text-xs text-muted">No evidence uploaded.</div>}
          </div>
          {shieldCase.providerName && <div className="mt-3 rounded-xl border border-gold/20 bg-gold/[0.05] p-3 text-xs text-light"><span className="font-bold text-gold">Selected provider:</span> {shieldCase.providerName}</div>}
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className="rounded-xl border border-border bg-card p-3"><div className="text-[9px] uppercase tracking-wide text-muted">{label}</div><div className={`mt-1 text-xs font-bold capitalize ${ok ? "text-zgreen" : "text-gold"}`}>{value}</div></div>;
}
