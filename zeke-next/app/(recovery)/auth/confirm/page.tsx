import Link from "next/link";
import { confirmPasswordRecovery } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export default async function ConfirmRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash: tokenHash = "" } = await searchParams;
  const validRequest = tokenHash.length >= 20 && tokenHash.length <= 1024;

  if (!validRequest) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-card p-6 text-center">
        <h1 className="text-lg font-black text-light">Recovery link unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This link is incomplete, expired, or has already been used. Request one fresh email and use only its newest link.
        </p>
        <Link
          href="/reset"
          className="mt-5 inline-flex rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-[0_0_0_1px_rgba(99,102,241,0.12),0_4px_24px_rgba(99,102,241,0.08)]">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-lg text-accent">
        &#128274;
      </div>
      <h1 className="mt-4 text-lg font-black text-light">Continue password recovery</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Press continue to verify this one-time link and choose your new password. This works even when the email was requested on another device.
      </p>
      <form action={confirmPasswordRecovery} className="mt-5">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <Button type="submit" fullWidth>
          Continue securely
        </Button>
      </form>
      <p className="mt-3 text-[11px] leading-5 text-muted">
        The link is used only after you press the button, protecting it from automatic email previews.
      </p>
    </div>
  );
}
