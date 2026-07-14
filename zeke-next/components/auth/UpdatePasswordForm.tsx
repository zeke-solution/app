"use client";

import { useState } from "react";
import { updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await updatePassword({ password, confirmPassword });
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-[0_0_0_1px_rgba(233,69,96,0.15),0_4px_24px_rgba(233,69,96,0.08)]"
    >
      <TextField
        id="newpw-password"
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="Minimum 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        id="newpw-confirm"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        placeholder="Re-type new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      {error && (
        <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
          {error}
        </div>
      )}
      <Button type="submit" disabled={pending} fullWidth>
        {pending ? "Please wait..." : "Update Password"}
      </Button>
    </form>
  );
}
