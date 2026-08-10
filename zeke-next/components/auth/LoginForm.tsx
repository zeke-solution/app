"use client";

import { useState } from "react";
import Link from "next/link";
import { signInUser } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await signInUser({ email, password });
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_4px_24px_rgba(99,102,241,0.08)] sm:p-7"
    >
      <TextField
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="relative">
        <TextField
          id="login-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="absolute bottom-2.5 right-3 text-xs font-medium text-muted"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <div className="-mt-2 text-right">
        <Link href="/reset" className="text-xs text-muted hover:text-light">
          Forgot password?
        </Link>
      </div>
      {error && (
        <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
          {error}
        </div>
      )}
      <Button type="submit" disabled={pending} fullWidth>
        {pending ? "Please wait..." : "Sign In"}
      </Button>
      <div className="border-t border-border pt-5 text-center text-xs leading-5 text-muted sm:text-sm">
        No account?{" "}
        <Link href="/register" className="font-semibold text-accent">
          Create one free
        </Link>
      </div>
    </form>
  );
}
