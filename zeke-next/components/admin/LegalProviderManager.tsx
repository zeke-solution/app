"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveLegalProvider, setLegalProviderActive } from "@/actions/shield-cases";
import { LEGAL_PROVIDER_SCALE, type LegalProviderRow } from "@/lib/domain/shield-case";
import { Button } from "@/components/ui/Button";

type FormState = {
  id?: string;
  displayName: string;
  providerType: "advocate" | "law_firm";
  firmScale: "independent" | "boutique" | "mid_size" | "full_service";
  city: string;
  state: string;
  languages: string;
  matterTypes: string;
  profileSummary: string;
  feeNote: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  enrollmentReference: string;
  verified: boolean;
  active: boolean;
};

const EMPTY: FormState = {
  displayName: "",
  providerType: "law_firm",
  firmScale: "boutique",
  city: "",
  state: "Kerala",
  languages: "Malayalam, English",
  matterTypes: "Creator payment disputes, Contract review",
  profileSummary: "",
  feeNote: "Fees are discussed and paid directly between the creator and provider.",
  contactEmail: "",
  contactPhone: "",
  website: "",
  enrollmentReference: "",
  verified: false,
  active: false,
};

export function LegalProviderManager({ providers }: { providers: LegalProviderRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  function edit(provider: LegalProviderRow) {
    setForm({
      id: provider.id,
      displayName: provider.display_name,
      providerType: provider.provider_type,
      firmScale: provider.firm_scale,
      city: provider.city ?? "",
      state: provider.state ?? "",
      languages: provider.languages.join(", "),
      matterTypes: provider.matter_types.join(", "),
      profileSummary: provider.profile_summary ?? "",
      feeNote: provider.fee_note ?? "",
      contactEmail: provider.contact_email ?? "",
      contactPhone: provider.contact_phone ?? "",
      website: provider.website ?? "",
      enrollmentReference: provider.enrollment_reference ?? "",
      verified: !!provider.verified_at,
      active: provider.active,
    });
    setEditing(true);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancel() {
    setForm(EMPTY);
    setEditing(false);
    setMessage("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const result = await saveLegalProvider({
      ...form,
      languages: splitList(form.languages),
      matterTypes: splitList(form.matterTypes),
    });
    setPending(false);
    if (!result.ok) setMessage(result.error);
    else {
      setMessage("Provider record saved.");
      setForm(EMPTY);
      setEditing(false);
      router.refresh();
    }
  }

  async function toggle(provider: LegalProviderRow) {
    setPending(true);
    const result = await setLegalProviderActive(provider.id, !provider.active);
    setPending(false);
    if (!result.ok) setMessage(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-white">{editing ? "Edit provider record" : "Add legal provider"}</h2>
            <p className="mt-1 text-[10px] leading-4 text-muted">Use factual information only. Do not add rankings, outcome claims, paid placement or promotional language.</p>
          </div>
          {editing && <button type="button" onClick={cancel} className="text-xs text-muted">Cancel</button>}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Provider or firm name"><input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={inputClass} /></Field>
          <Field label="Record type"><select value={form.providerType} onChange={(e) => setForm({ ...form, providerType: e.target.value as FormState["providerType"] })} className={inputClass}><option value="advocate">Independent advocate</option><option value="law_firm">Law firm</option></select></Field>
          <Field label="Scale"><select value={form.firmScale} onChange={(e) => setForm({ ...form, firmScale: e.target.value as FormState["firmScale"] })} className={inputClass}><option value="independent">Independent</option><option value="boutique">Boutique</option><option value="mid_size">Mid-size</option><option value="full_service">Full-service</option></select></Field>
          <Field label="Enrolment / verification reference"><input value={form.enrollmentReference} onChange={(e) => setForm({ ...form, enrollmentReference: e.target.value })} className={inputClass} /></Field>
          <Field label="City"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /></Field>
          <Field label="State"><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} /></Field>
          <Field label="Languages (comma separated)"><input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} className={inputClass} /></Field>
          <Field label="Matter types handled (self-reported)"><input value={form.matterTypes} onChange={(e) => setForm({ ...form, matterTypes: e.target.value })} className={inputClass} /></Field>
          <Field label="Direct email"><input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} /></Field>
          <Field label="Direct phone"><input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputClass} /></Field>
          <Field label="Website"><input type="url" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} /></Field>
          <Field label="Fee note"><input value={form.feeNote} onChange={(e) => setForm({ ...form, feeNote: e.target.value })} className={inputClass} /></Field>
        </div>
        <Field label="Factual profile summary" className="mt-3"><textarea value={form.profileSummary} onChange={(e) => setForm({ ...form, profileSummary: e.target.value })} className={`${inputClass} min-h-24 resize-y`} /></Field>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs text-light"><input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="accent-green-600" /> Verification checked</label>
          <label className="flex items-center gap-2 text-xs text-light"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-green-600" /> Visible to Shield members</label>
        </div>
        {message && <div className={`mt-3 rounded-lg p-2.5 text-xs ${message.includes("saved") ? "bg-zgreen/10 text-zgreen" : "bg-accent/10 text-accent"}`}>{message}</div>}
        <Button className="mt-4" disabled={pending}>{pending ? "Saving..." : editing ? "Update provider" : "Add provider"}</Button>
      </form>

      <section>
        <h2 className="text-sm font-extrabold text-white">Provider records ({providers.length})</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.id} className={`rounded-2xl border bg-card p-4 ${provider.active ? "border-border" : "border-border opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white">{provider.display_name}</div>
                  <div className="mt-0.5 text-[10px] text-muted">{LEGAL_PROVIDER_SCALE[provider.firm_scale]} · {[provider.city, provider.state].filter(Boolean).join(", ") || "No location"}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${provider.verified_at ? "bg-zgreen/10 text-zgreen" : "bg-gold/10 text-gold"}`}>{provider.verified_at ? "Checked" : "Unverified"}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-[10px] leading-4 text-muted">{provider.profile_summary || "No profile summary."}</p>
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <button onClick={() => edit(provider)} className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-bold text-light">Edit</button>
                <button disabled={pending} onClick={() => toggle(provider)} className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold ${provider.active ? "border-accent/25 text-accent" : "border-zgreen/25 text-zgreen"}`}>{provider.active ? "Hide" : "Activate"}</button>
              </div>
            </div>
          ))}
          {providers.length === 0 && <div className="rounded-2xl border border-border bg-card p-8 text-center text-xs text-muted sm:col-span-2">No legal-provider records yet.</div>}
        </div>
      </section>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-border bg-dark px-3 py-2 text-xs text-light outline-none focus:border-purple";

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1 block text-[10px] font-semibold text-muted">{label}</span>{children}</label>;
}

function splitList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}
