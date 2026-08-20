"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

export function ResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  function resetTurnstile() {
    setTurnstileToken("");
    setTurnstileResetKey((key) => key + 1);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!turnstileToken) {
      setError("Complete the security check before requesting a reset link.");
      return;
    }
    setPending(true);
    const res = await requestPasswordReset({ email, turnstileToken });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      resetTurnstile();
    }
    else setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7">
      {sent ? (
        <>
          <div role="status" className="rounded-2xl border border-zgreen/25 bg-zgreen/[0.06] p-4">
            <div className="text-sm font-bold text-zgreen">Reset request received</div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              If a Zeke account matches this exact address, the reset link will arrive shortly.
            </p>
            <div className="mt-3 rounded-xl bg-dark/60 px-3 py-2.5 text-left">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Submitted email</div>
              <div className="mt-1 break-words text-sm font-semibold text-light">{email}</div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-dark p-3 text-xs leading-relaxed text-muted">
            Check the spelling above, then check the inbox and spam folder. New to Zeke?{" "}
            <Link href="/register" className="font-semibold text-accent">Create an account</Link>.
          </div>
          <button type="button" onClick={() => { setSent(false); setError(""); }} className="text-xs font-semibold text-accent">
            Wrong email? Change it
          </button>
        </>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-muted">Enter your email and we&apos;ll send you a secure link to set a new password.</p>
          <TextField id="reset-email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <TurnstileWidget
            action="password_reset"
            resetKey={turnstileResetKey}
            onVerify={setTurnstileToken}
            onExpire={() => {
              setTurnstileToken("");
              setError("The security check expired. Please complete it again.");
            }}
            onError={() => {
              setTurnstileToken("");
              setError("The security check could not load. Refresh the page and try again.");
            }}
          />
          {error && <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">{error}</div>}
          <Button type="submit" disabled={pending || !turnstileToken} fullWidth>{pending ? "Please wait..." : "Send Reset Link"}</Button>
        </>
      )}
      <div className="border-t border-border pt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-accent">&#8592; Back to Sign In</Link>
      </div>
    </form>
  );
}
