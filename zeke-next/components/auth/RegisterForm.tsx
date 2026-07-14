"use client";

import { useState } from "react";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { NICHE_OPTIONS, GUARDIAN_RELATIONS } from "@/lib/domain/constants";

type Role = "influencer" | "brand";

const OTHER_NICHE = "__other__";

export function RegisterForm({ initialRole = "influencer" }: { initialRole?: Role }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(initialRole);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [brandType, setBrandType] = useState<"business" | "ngo" | "agency">("business");
  const [brandLocation, setBrandLocation] = useState("");

  const [niche, setNiche] = useState("");
  const [nicheOther, setNicheOther] = useState("");
  const [infLocation, setInfLocation] = useState("");
  const [igHandle, setIgHandle] = useState("");
  const [igFollowers, setIgFollowers] = useState("");
  const [ytEnabled, setYtEnabled] = useState(false);
  const [ytHandle, setYtHandle] = useState("");
  const [ytFollowers, setYtFollowers] = useState("");
  const [xEnabled, setXEnabled] = useState(false);
  const [xHandle, setXHandle] = useState("");
  const [xFollowers, setXFollowers] = useState("");
  const [isAdult, setIsAdult] = useState<boolean | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");

  const [step1Error, setStep1Error] = useState("");
  const [step2Error, setStep2Error] = useState("");
  const [pending, setPending] = useState(false);

  function goStep2() {
    if (!name.trim()) return setStep1Error("Enter your name.");
    if (!email.trim() || !email.includes("@")) return setStep1Error("Enter a valid email.");
    if (!password || password.length < 8)
      return setStep1Error("Password must be at least 8 characters.");
    setStep1Error("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep2Error("");
    setPending(true);

    const res =
      role === "brand"
        ? await registerUser({
            role: "brand",
            name,
            email,
            password,
            brandType,
            location: brandLocation,
          })
        : await registerUser({
            role: "influencer",
            name,
            email,
            password,
            niche: niche === OTHER_NICHE ? nicheOther : niche,
            location: infLocation,
            igHandle,
            igFollowers: Number(igFollowers),
            ytEnabled,
            ytHandle: ytEnabled ? ytHandle : undefined,
            ytFollowers: ytEnabled ? Number(ytFollowers || 0) : undefined,
            xEnabled,
            xHandle: xEnabled ? xHandle : undefined,
            xFollowers: xEnabled ? Number(xFollowers || 0) : undefined,
            isAdult: isAdult !== false,
            guardianName: isAdult === false ? guardianName : undefined,
            guardianEmail: isAdult === false ? guardianEmail : undefined,
            guardianRelation: isAdult === false
              ? (guardianRelation as (typeof GUARDIAN_RELATIONS)[number])
              : undefined,
          });

    setPending(false);
    if (!res.ok) setStep2Error(res.error);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 flex overflow-hidden rounded-xl border border-border">
        <button
          type="button"
          onClick={() => {
            setRole("influencer");
            setStep(1);
          }}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
            role === "influencer" ? "bg-accent text-white" : "bg-transparent text-muted"
          }`}
        >
          &#127909; Creator
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("brand");
            setStep(1);
          }}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
            role === "brand" ? "bg-accent text-white" : "bg-transparent text-muted"
          }`}
        >
          &#127970; Brand
        </button>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <TextField
            label={role === "influencer" ? "Full Name" : "Brand / Company Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "influencer" ? "Your full name" : "Your brand name"}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <div className="relative">
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute bottom-2.5 right-3 text-xs font-medium text-muted"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {step1Error && (
            <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
              {step1Error}
            </div>
          )}
          <Button type="button" onClick={goStep2} fullWidth>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-left text-xs text-muted"
          >
            &#8592; Back
          </button>

          {role === "brand" ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-light">
                  Brand Type
                </label>
                {(
                  [
                    ["business", "Business", "Company or startup"],
                    ["ngo", "NGO / Cause", "Non-profit or social cause"],
                    ["agency", "Agency", "Marketing or PR agency"],
                  ] as const
                ).map(([value, title, desc]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                      brandType === value
                        ? "border-accent/50 bg-accent/5"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="btype"
                      checked={brandType === value}
                      onChange={() => setBrandType(value)}
                      className="mt-0.5 accent-accent"
                    />
                    <div>
                      <div className="text-sm font-bold text-white">{title}</div>
                      <div className="text-xs text-muted">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <TextField
                label="Location / Region"
                value={brandLocation}
                onChange={(e) => setBrandLocation(e.target.value)}
                placeholder="e.g. Dubai, UAE"
              />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-light">
                  Primary Niche
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full rounded-xl border border-border bg-dark px-4 py-2.5 text-sm text-light outline-none"
                >
                  <option value="">Select your niche</option>
                  {NICHE_OPTIONS.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                  <option value={OTHER_NICHE}>Other (type your own)</option>
                </select>
                {niche === OTHER_NICHE && (
                  <input
                    value={nicheOther}
                    onChange={(e) => setNicheOther(e.target.value)}
                    placeholder="Type your niche..."
                    maxLength={60}
                    className="mt-2 w-full rounded-xl border border-border bg-dark px-4 py-2.5 text-sm text-light outline-none"
                  />
                )}
              </div>

              <TextField
                label="Based in"
                value={infLocation}
                onChange={(e) => setInfLocation(e.target.value)}
                placeholder="e.g. Kochi, Kerala"
              />

              <div className="rounded-2xl border border-border bg-dark p-4">
                <div className="mb-3.5 text-sm font-bold text-white">Your Platforms</div>

                <div className="mb-3.5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-extrabold text-accent">
                      IG
                    </span>
                    <span className="text-[13px] font-bold text-white">Instagram</span>
                    <span className="ml-auto text-[10px] font-semibold text-accent">Required</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={igHandle}
                      onChange={(e) => setIgHandle(e.target.value)}
                      placeholder="@yourhandle"
                      className="rounded-xl border border-border bg-card px-3 py-2 text-[13px] text-light outline-none"
                    />
                    <input
                      type="number"
                      min={1}
                      value={igFollowers}
                      onChange={(e) => setIgFollowers(e.target.value)}
                      placeholder="Followers"
                      className="rounded-xl border border-border bg-card px-3 py-2 text-[13px] text-light outline-none"
                    />
                  </div>
                </div>

                <PlatformToggle
                  label="YouTube"
                  chip="YT"
                  chipClass="bg-[#f87171]/10 text-[#f87171]"
                  enabled={ytEnabled}
                  onToggle={setYtEnabled}
                  handle={ytHandle}
                  onHandle={setYtHandle}
                  handlePlaceholder="Channel name"
                  followers={ytFollowers}
                  onFollowers={setYtFollowers}
                  followersPlaceholder="Subscribers"
                />
                <PlatformToggle
                  label="Twitter / X"
                  chip="X"
                  chipClass="bg-[#38bdf8]/10 text-[#38bdf8]"
                  enabled={xEnabled}
                  onToggle={setXEnabled}
                  handle={xHandle}
                  onHandle={setXHandle}
                  handlePlaceholder="@xhandle"
                  followers={xFollowers}
                  onFollowers={setXFollowers}
                  followersPlaceholder="Followers"
                  noMargin
                />
              </div>

              <div className="rounded-xl border border-accent/15 bg-accent/[0.04] p-3.5">
                <div className="mb-3 text-[13px] font-bold text-white">Are you 18 or older?</div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAdult(true)}
                    className={`flex-1 rounded-[10px] border p-2.5 text-[13px] font-bold transition-colors ${
                      isAdult === true
                        ? "border-zgreen/40 bg-zgreen/[0.08] text-zgreen"
                        : "border-border text-muted"
                    }`}
                  >
                    Yes, 18+
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdult(false)}
                    className={`flex-1 rounded-[10px] border p-2.5 text-[13px] font-bold transition-colors ${
                      isAdult === false
                        ? "border-gold/40 bg-gold/[0.08] text-gold"
                        : "border-border text-muted"
                    }`}
                  >
                    Under 18
                  </button>
                </div>
              </div>

              {isAdult === false && (
                <div className="rounded-xl border border-gold/20 bg-gold/[0.04] p-3.5">
                  <div className="mb-1 text-xs font-bold text-gold">&#128737; Guardian required</div>
                  <div className="mb-3.5 text-[11px] text-muted">
                    A parent or legal guardian must manage this account since you are under 18.
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <TextField
                      label="Guardian Full Name"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="Parent or legal guardian name"
                    />
                    <TextField
                      label="Guardian Email"
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      placeholder="Guardian email address"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-light">
                        Relationship
                      </label>
                      <select
                        value={guardianRelation}
                        onChange={(e) => setGuardianRelation(e.target.value)}
                        className="w-full rounded-xl border border-border bg-dark px-4 py-2.5 text-sm text-light outline-none"
                      >
                        <option value="">Select relationship</option>
                        {GUARDIAN_RELATIONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/5 p-3">
                <span className="text-base text-gold">&#128737;</span>
                <div>
                  <div className="text-xs font-bold text-gold">Upgrade to Zeke Shield later</div>
                  <div className="mt-0.5 text-xs text-muted">
                    &#8377;1,999/yr — legal protection, verified badge &amp; priority discovery
                  </div>
                </div>
              </div>
            </>
          )}

          {step2Error && (
            <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
              {step2Error}
            </div>
          )}
          <Button type="submit" disabled={pending} fullWidth>
            {pending ? "Please wait..." : "Create Account"}
          </Button>
          <p className="text-center text-xs text-muted">
            By signing up you agree to our{" "}
            <Link href="/" className="underline">
              Terms
            </Link>{" "}
            &amp;{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
          </p>
        </form>
      )}

      <div className="mt-5 border-t border-border pt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Sign in
        </Link>
      </div>
    </div>
  );
}

function PlatformToggle({
  label,
  chip,
  chipClass,
  enabled,
  onToggle,
  handle,
  onHandle,
  handlePlaceholder,
  followers,
  onFollowers,
  followersPlaceholder,
  noMargin,
}: {
  label: string;
  chip: string;
  chipClass: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  handle: string;
  onHandle: (v: string) => void;
  handlePlaceholder: string;
  followers: string;
  onFollowers: (v: string) => void;
  followersPlaceholder: string;
  noMargin?: boolean;
}) {
  return (
    <div className={noMargin ? "" : "mb-3"}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${chipClass}`}>
          {chip}
        </span>
        <span className="text-[13px] font-bold text-white">{label}</span>
        <label className="ml-auto flex cursor-pointer items-center gap-1.5">
          <span className="text-[11px] text-muted">Add</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>
      </div>
      {enabled && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={handle}
            onChange={(e) => onHandle(e.target.value)}
            placeholder={handlePlaceholder}
            className="rounded-xl border border-border bg-card px-3 py-2 text-[13px] text-light outline-none"
          />
          <input
            type="number"
            min={0}
            value={followers}
            onChange={(e) => onFollowers(e.target.value)}
            placeholder={followersPlaceholder}
            className="rounded-xl border border-border bg-card px-3 py-2 text-[13px] text-light outline-none"
          />
        </div>
      )}
    </div>
  );
}
