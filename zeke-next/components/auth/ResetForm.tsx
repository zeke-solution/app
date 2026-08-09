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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await requestPasswordReset({ email });
    setPending(false);
    if (!res.ok) setError(res.error);
    else setSent(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7"
    >
      <p className="text-[13px] leading-relaxed text-muted">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>
      <TextField
        id="reset-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && (
        <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
          {error}
        </div>
      )}
      {sent && (
        <div className="rounded-[10px] border border-zgreen/25 bg-zgreen/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-zgreen">
          &#10003; If an account exists for this email, a reset link will arrive shortly. Check your inbox and spam folder.
        </div>
      )}
      <Button type="submit" disabled={pending} fullWidth>
        {pending ? "Please wait..." : "Send Reset Link"}
      </Button>
      <div className="border-t border-border pt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-accent">
          &#8592; Back to Sign In
        </Link>
      </div>
    </form>
  );
}
