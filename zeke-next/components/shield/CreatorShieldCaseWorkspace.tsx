"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addShieldCaseUpdate,
  chooseShieldCasePath,
  confirmShieldLegalEngagement,
  selectShieldLegalProvider,
  uploadShieldCaseDocument,
} from "@/actions/shield-cases";
import { fmtDate } from "@/lib/domain/format";
import {
  LEGAL_PROVIDER_SCALE,
  SHIELD_CASE_STATUS,
  type LegalProviderRow,
  type ShieldCaseStatus,
} from "@/lib/domain/shield-case";
import { Button } from "@/components/ui/Button";

export interface CreatorCaseView {
  id: string;
  status: ShieldCaseStatus;
  creatorPath: "undecided" | "follow_up" | "legal";
  selectedProviderId: string | null;
  engagementConfirmedAt: string | null;
  outcome: string | null;
  openedAt: string;
  dealTitle: string;
  dealAmount: number | null;
  brandName: string;
  reason: string;
}

export interface CaseUpdateView {
  id: string;
  actorRole: "creator" | "admin" | "system";
  kind: string;
  body: string;
  createdAt: string;
}

export interface CaseDocumentView {
  id: string;
  fileName: string;
  category: string;
  sizeBytes: number;
  sharedWithProvider: boolean;
  createdAt: string;
  downloadUrl: string | null;
}

export function CreatorShieldCaseWorkspace({
  shieldCase,
  updates,
  documents,
  providers,
}: {
  shieldCase: CreatorCaseView;
  updates: CaseUpdateView[];
  documents: CaseDocumentView[];
  providers: LegalProviderRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [costAck, setCostAck] = useState(false);
  const [independentAck, setIndependentAck] = useState(false);
  const [shareConsent, setShareConsent] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(shieldCase.selectedProviderId ?? "");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const meta = SHIELD_CASE_STATUS[shieldCase.status];
  const provider = providers.find((item) => item.id === selectedProvider);
  const isClosed = shieldCase.status === "resolved" || shieldCase.status === "closed";

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    setError("");
    const result = await action();
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save the change.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function chooseFollowUp() {
    await run(() =>
      chooseShieldCasePath(shieldCase.id, "follow_up", {
        contactBrandConsent: contactConsent,
        legalCostAcknowledged: false,
        independentAdviceAcknowledged: false,
      })
    );
  }

  async function chooseLegal() {
    await run(() =>
      chooseShieldCasePath(shieldCase.id, "legal", {
        contactBrandConsent: contactConsent,
        legalCostAcknowledged: costAck,
        independentAdviceAcknowledged: independentAck,
      })
    );
  }

  async function saveProvider() {
    if (!selectedProvider) return;
    await run(() =>
      selectShieldLegalProvider(shieldCase.id, selectedProvider, {
        shareConsent,
        legalCostAcknowledged: costAck,
        independentAdviceAcknowledged: independentAck,
      })
    );
  }

  async function saveNote() {
    if (!note.trim()) return;
    const ok = await run(() => addShieldCaseUpdate(shieldCase.id, note));
    if (ok) setNote("");
  }

  async function uploadEvidence(formData: FormData) {
    setUploading(true);
    setError("");
    const result = await uploadShieldCaseDocument(formData);
    setUploading(false);
    if (!result.ok) setError(result.error);
    else {
      formRef.current?.reset();
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted">{shieldCase.brandName}</div>
            <h1 className="mt-1 text-lg font-black text-white">{shieldCase.dealTitle}</h1>
            <div className="mt-1 text-[11px] text-muted">Case opened {fmtDate(shieldCase.openedAt)}</div>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: meta.color, background: `${meta.color}1A` }}>
            {meta.label}
          </span>
        </div>
        <p className="mt-4 rounded-xl border border-border bg-dark p-3 text-xs leading-5 text-light">{shieldCase.reason}</p>
        <p className="mt-3 text-xs leading-5 text-muted">{meta.description}</p>
      </section>

      {!isClosed && shieldCase.creatorPath === "undecided" && (
        <section className="rounded-2xl border border-gold/30 bg-gold/[0.05] p-4 sm:p-5">
          <h2 className="text-sm font-extrabold text-white">Choose what happens next</h2>
          <p className="mt-1 text-xs leading-5 text-muted">You can begin with table talks and move to legal help later. Zeke will not start legal action for you.</p>
          <label className="mt-4 flex items-start gap-2.5 text-xs leading-5 text-light">
            <input type="checkbox" checked={contactConsent} onChange={(event) => setContactConsent(event.target.checked)} className="mt-1 accent-purple" />
            I authorise Zeke to contact the brand and discuss this dispute on my behalf.
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button onClick={chooseFollowUp} disabled={pending || !contactConsent} className="rounded-xl border border-purple/30 bg-purple/10 p-4 text-left disabled:opacity-50">
              <div className="text-sm font-bold text-white">Continue with table talks</div>
              <div className="mt-1 text-xs leading-5 text-muted">Zeke handles structured follow-ups. You decide how long to continue.</div>
            </button>
            <div className="rounded-xl border border-border bg-dark p-4">
              <div className="text-sm font-bold text-white">Explore independent legal help</div>
              <div className="mt-1 text-xs leading-5 text-muted">View the pool, contact a provider, and agree fees directly.</div>
              <Acknowledgements cost={costAck} independent={independentAck} onCost={setCostAck} onIndependent={setIndependentAck} />
              <Button size="sm" className="mt-3" disabled={pending || !costAck || !independentAck} onClick={chooseLegal}>View legal providers</Button>
            </div>
          </div>
        </section>
      )}

      {!isClosed && shieldCase.creatorPath === "follow_up" && (
        <section className="rounded-2xl border border-purple/25 bg-purple/[0.05] p-4 sm:p-5">
          <h2 className="text-sm font-extrabold text-white">Assisted follow-up is active</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Zeke can continue follow-ups and settlement discussions as long as you wish. You can decide to explore legal help at any time.</p>
          <details className="mt-3 rounded-xl border border-border bg-dark p-3">
            <summary className="cursor-pointer text-xs font-bold text-gold">I want to explore legal options</summary>
            <Acknowledgements cost={costAck} independent={independentAck} onCost={setCostAck} onIndependent={setIndependentAck} />
            <Button size="sm" className="mt-3" disabled={pending || !costAck || !independentAck} onClick={chooseLegal}>Show provider pool</Button>
          </details>
        </section>
      )}

      {!isClosed && shieldCase.creatorPath === "legal" && (
        <section className="rounded-2xl border border-gold/25 bg-gold/[0.04] p-4 sm:p-5">
          <h2 className="text-sm font-extrabold text-white">Choose and contact a legal provider</h2>
          <p className="mt-1 text-xs leading-5 text-muted">These are factual profiles, not rankings or recommendations. Check fit, conflicts and fees directly with the provider.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {providers.map((item) => (
              <label key={item.id} className={`cursor-pointer rounded-xl border p-3 ${selectedProvider === item.id ? "border-gold/50 bg-gold/[0.08]" : "border-border bg-dark"}`}>
                <div className="flex items-start gap-2">
                  <input type="radio" name="provider" value={item.id} checked={selectedProvider === item.id} onChange={() => setSelectedProvider(item.id)} className="mt-1 accent-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-white">{item.display_name}</div>
                    <div className="mt-0.5 text-[10px] text-muted">{LEGAL_PROVIDER_SCALE[item.firm_scale]} · {[item.city, item.state].filter(Boolean).join(", ") || "Location on request"}</div>
                    {item.profile_summary && <p className="mt-2 text-[10px] leading-4 text-muted">{item.profile_summary}</p>}
                    {item.matter_types.length > 0 && <p className="mt-2 text-[9px] text-light">Matter types: {item.matter_types.join(", ")}</p>}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {providers.length === 0 && <div className="mt-3 rounded-xl border border-border bg-dark p-4 text-xs text-muted">No verified provider records are active yet. Zeke can continue table talks while the pool is being prepared.</div>}
          <Acknowledgements cost={costAck} independent={independentAck} onCost={setCostAck} onIndependent={setIndependentAck} />
          <label className="mt-2 flex items-start gap-2 text-[11px] leading-4 text-light">
            <input type="checkbox" checked={shareConsent} onChange={(event) => setShareConsent(event.target.checked)} className="mt-0.5 accent-amber-500" />
            Optional: after I directly engage this provider, I authorise Zeke to share the case records I mark and coordinate communication.
          </label>
          <Button size="sm" variant="gold" className="mt-3" disabled={pending || !selectedProvider || !costAck || !independentAck} onClick={saveProvider}>{shareConsent ? "Save choice and sharing consent" : "Save provider choice"}</Button>

          {provider && shieldCase.selectedProviderId === provider.id && (
            <div className="mt-4 rounded-xl border border-zgreen/25 bg-zgreen/[0.05] p-4">
              <div className="text-xs font-bold text-white">Contact {provider.display_name} directly</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {provider.contact_email && <a className="rounded-lg border border-border px-3 py-1.5 text-accent" href={`mailto:${provider.contact_email}`}>Email</a>}
                {provider.contact_phone && <a className="rounded-lg border border-border px-3 py-1.5 text-accent" href={`tel:${provider.contact_phone}`}>Call</a>}
                {provider.website && <a className="rounded-lg border border-border px-3 py-1.5 text-accent" href={provider.website} target="_blank" rel="noreferrer">Website</a>}
              </div>
              {provider.fee_note && <div className="mt-2 text-[10px] leading-4 text-muted">Fee note: {provider.fee_note}</div>}
              {!shieldCase.engagementConfirmedAt && (
                <Button size="sm" className="mt-3" disabled={pending} onClick={() => run(() => confirmShieldLegalEngagement(shieldCase.id))}>
                  I hired this provider directly
                </Button>
              )}
              {shieldCase.engagementConfirmedAt && <div className="mt-3 text-xs font-semibold text-zgreen">Direct engagement confirmed {fmtDate(shieldCase.engagementConfirmedAt)}</div>}
            </div>
          )}
        </section>
      )}

      {error && <div role="alert" className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs text-accent">{error}</div>}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-extrabold text-white">Case timeline</h2>
          <div className="mt-3 space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="border-l-2 border-purple/30 pl-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-purple">{update.actorRole === "admin" ? "Zeke" : update.actorRole}</span>
                  <span className="text-[9px] text-muted">{fmtDate(update.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-light">{update.body}</p>
              </div>
            ))}
          </div>
          {!isClosed && (
            <div className="mt-4 border-t border-border pt-3">
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note or instruction for the Zeke team..." className="min-h-20 w-full rounded-xl border border-border bg-dark p-3 text-xs text-light outline-none focus:border-purple" />
              <Button size="sm" className="mt-2" disabled={pending || !note.trim()} onClick={saveNote}>Add case note</Button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-extrabold text-white">Evidence and records</h2>
          <p className="mt-1 text-[10px] leading-4 text-muted">Private to you and Zeke unless you explicitly mark a file for your selected provider.</p>
          <div className="mt-3 space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="rounded-xl border border-border bg-dark p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-white">{document.fileName}</div>
                    <div className="mt-0.5 text-[9px] text-muted">{document.category.replaceAll("_", " ")} · {(document.sizeBytes / 1024).toFixed(0)} KB</div>
                  </div>
                  {document.downloadUrl && <a href={document.downloadUrl} className="text-[10px] font-semibold text-accent">Open</a>}
                </div>
                {document.sharedWithProvider && <div className="mt-1 text-[9px] text-gold">Marked for authorised provider sharing</div>}
              </div>
            ))}
            {documents.length === 0 && <div className="text-xs text-muted">No evidence uploaded yet.</div>}
          </div>
          {!isClosed && (
            <form ref={formRef} action={uploadEvidence} className="mt-4 space-y-2 border-t border-border pt-3">
              <input type="hidden" name="caseId" value={shieldCase.id} />
              <select name="category" defaultValue="communication" className="w-full rounded-xl border border-border bg-dark px-3 py-2 text-xs text-light">
                <option value="agreement">Agreement</option>
                <option value="invoice">Invoice</option>
                <option value="communication">Communication</option>
                <option value="payment_record">Payment record</option>
                <option value="deliverable">Deliverable</option>
                <option value="legal">Legal document</option>
                <option value="other">Other</option>
              </select>
              <input type="file" name="file" required accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" className="block w-full text-[10px] text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-purple/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-purple" />
              {shieldCase.selectedProviderId && (
                <label className="flex items-start gap-2 text-[10px] leading-4 text-muted">
                  <input type="checkbox" name="shareWithProvider" value="true" className="mt-0.5 accent-amber-500" />
                  Mark this file for sharing with my selected provider under my recorded consent.
                </label>
              )}
              <Button size="sm" disabled={uploading}>{uploading ? "Uploading..." : "Upload evidence"}</Button>
            </form>
          )}
        </div>
      </section>

      {shieldCase.outcome && <div className="rounded-2xl border border-zgreen/25 bg-zgreen/[0.05] p-4 text-xs leading-5 text-light"><strong className="text-zgreen">Recorded outcome:</strong> {shieldCase.outcome}</div>}
    </div>
  );
}

function Acknowledgements({
  cost,
  independent,
  onCost,
  onIndependent,
}: {
  cost: boolean;
  independent: boolean;
  onCost: (value: boolean) => void;
  onIndependent: (value: boolean) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      <label className="flex items-start gap-2 text-[10px] leading-4 text-muted">
        <input type="checkbox" checked={cost} onChange={(event) => onCost(event.target.checked)} className="mt-0.5 accent-amber-500" />
        I understand that I hire and pay the provider directly. Shield does not include lawyer, court or filing costs.
      </label>
      <label className="flex items-start gap-2 text-[10px] leading-4 text-muted">
        <input type="checkbox" checked={independent} onChange={(event) => onIndependent(event.target.checked)} className="mt-0.5 accent-amber-500" />
        I understand the provider is independent, Zeke receives no referral commission, and outcomes are not guaranteed.
      </label>
    </div>
  );
}
