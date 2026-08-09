"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function ResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const res = await requestPasswordReset({ email });
    setPending(false);
    if (!res.ok) setError(res.error);
    else setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7">
      {sent ? (
        <>
          <div className="rounded-2xl border border-zgreen/25 bg-zgreen/[0.06] p-4">
            <div className="text-sm font-bold text-zgreen">Reset request received</div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              If this email belongs to a Zeke account, the reset link will arrive shortly. Check the inbox and spam folder.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-dark p-3 text-xs leading-relaxed text-muted">
            No email yet? Check the spelling, wait a minute, then try again. New to Zeke?{" "}
            <Link href="/register" className="font-semibold text-accent">Create an account</Link>.
          </div>
          <button type="button" onClick={() => { setSent(false); setError(""); }} className="text-xs font-semibold text-accent">
            Try another email
          </button>
        </>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-muted">Enter your email and we&apos;ll send you a secure link to set a new password.</p>
          <TextField id="reset-email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          {error && <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">{error}</div>}
          <Button type="submit" disabled={pending} fullWidth>{pending ? "Please wait..." : "Send Reset Link"}</Button>
        </>
      )}
      <div className="border-t border-border pt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-accent">&#8592; Back to Sign In</Link>
      </div>
    </form>
  );
}
